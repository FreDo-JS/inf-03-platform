-- =============================================================================
-- INF.03 — migracja 002: PIN dostępu do testu + sesje testu
-- Kolejność: schema.sql → 002_test_pin.sql → seed.sql
-- (Jeśli seed.sql był już uruchomiony wcześniej — też OK: istniejące testy
--  dostaną losowe PIN-y, widoczne w panelu admina.)
--
-- Przepływ ucznia:
--   1. open_test(test_id, pin)          → sprawdza PIN (z limitem prób), zwraca
--                                          pytania + jednorazowy session_id
--   2. begin_session(session_id, imię)  → start zegara (czas liczy serwer)
--   3. submit_attempt(session_id, odp.) → ocena po stronie serwera, jeden zapis
--
-- Bez poprawnego PIN-u nie da się ani zobaczyć pytań, ani zapisać wyniku.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Pytania niedostępne publicznie — tylko metadane testu
-- -----------------------------------------------------------------------------

alter table tests
  add column if not exists question_count int
  generated always as (jsonb_array_length(questions)) stored;

-- Uprawnienia kolumnowe: anon widzi listę testów, ale NIE kolumnę questions.
-- Polityka RLS "public read tests" nadal obowiązuje dla wierszy.
revoke select on tests from anon;
grant select (id, title, time_limit, question_count, created_at) on tests to anon;

-- Bez tej polityki nie da się obejść PIN-u. Wyniki zapisuje wyłącznie
-- submit_attempt() (security definer), która wymaga ważnej sesji z PIN-em.
drop policy if exists "anyone can submit attempt" on attempts;

-- -----------------------------------------------------------------------------
-- 2. PIN (6 cyfr) — w tabeli test_keys, czytelnej tylko dla adminów
-- -----------------------------------------------------------------------------
-- PIN to wspólny kod dla klasy (jak w Kahoot), nie hasło użytkownika —
-- nauczyciel musi go widzieć w panelu, dlatego nie jest haszowany.

-- losowy PIN z gen_random_uuid() (kryptograficzne źródło, bez pgcrypto)
create or replace function public.random_pin()
returns text
language sql
volatile
set search_path = public
as $$
  select lpad(
    ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text,
    6, '0');
$$;

alter table test_keys
  add column if not exists pin text not null default public.random_pin()
  check (pin ~ '^[0-9]{6}$');

-- -----------------------------------------------------------------------------
-- 3. Tabele techniczne: sesje testu i nieudane próby PIN-u
--    RLS włączone, brak polityk → niedostępne przez API; obsługują je
--    wyłącznie funkcje security definer poniżej.
-- -----------------------------------------------------------------------------

create table if not exists test_sessions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests(id) on delete cascade,
  student_name text check (student_name is null or char_length(student_name) between 1 and 40),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz
);
create index if not exists test_sessions_created_idx on test_sessions (created_at);

create table if not exists pin_failures (
  id bigint generated always as identity primary key,
  test_id uuid not null references tests(id) on delete cascade,
  ip text not null check (char_length(ip) <= 64),
  created_at timestamptz not null default now()
);
create index if not exists pin_failures_lookup_idx on pin_failures (test_id, ip, created_at desc);
create index if not exists pin_failures_test_idx on pin_failures (test_id, created_at desc);

alter table test_sessions enable row level security;
alter table pin_failures enable row level security;
revoke all on test_sessions from anon, authenticated;
revoke all on pin_failures from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Pomocnicze
-- -----------------------------------------------------------------------------

-- IP klienta z nagłówków przekazanych przez PostgREST (Supabase stoi za Cloudflare).
create or replace function public.client_ip()
returns text
language sql
stable
set search_path = public
as $$
  select left(coalesce(
    nullif(btrim(h->>'cf-connecting-ip'), ''),
    nullif(btrim(h->>'x-real-ip'), ''),
    nullif(btrim(split_part(h->>'x-forwarded-for', ',', 1)), ''),
    'unknown'
  ), 64)
  from (select coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json as h) s;
$$;

-- imię ucznia: bez znaków kontrolnych, zwinięte spacje, 1–40 znaków
create or replace function public.clean_student_name(p text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v text;
begin
  v := regexp_replace(coalesce(p, ''), '[[:cntrl:]]', ' ', 'g');
  v := btrim(regexp_replace(v, '\s+', ' ', 'g'));
  if char_length(v) not between 1 and 40 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  return v;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. open_test — weryfikacja PIN-u (limit prób) i wydanie sesji
-- -----------------------------------------------------------------------------
-- Limity: 20 błędnych prób / 5 min z jednego IP dla danego testu
-- oraz 300 / 5 min łącznie dla testu (zabezpieczenie, gdyby ktoś podrabiał IP).
-- Zmiana PIN-u przez admina zeruje licznik błędów.
-- Błędny PIN zwraca {ok:false} zamiast wyjątku — wyjątek wycofałby zapis próby.

create or replace function public.open_test(p_test_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.client_ip();
  v_test tests%rowtype;
  v_pin text;
  v_session uuid;
begin
  select * into v_test from tests where id = p_test_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if (select count(*) from pin_failures
      where test_id = p_test_id and ip = v_ip and created_at > now() - interval '5 minutes') >= 20
     or (select count(*) from pin_failures
      where test_id = p_test_id and created_at > now() - interval '5 minutes') >= 300 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  select pin into v_pin from test_keys where test_id = p_test_id;
  if v_pin is null or p_pin is null or p_pin !~ '^[0-9]{6}$' or p_pin <> v_pin then
    insert into pin_failures (test_id, ip) values (p_test_id, v_ip);
    return jsonb_build_object('ok', false, 'reason', 'bad_pin');
  end if;

  -- sprzątanie starych wpisów
  delete from test_sessions where created_at < now() - interval '2 days';
  delete from pin_failures where created_at < now() - interval '1 day';

  insert into test_sessions (test_id) values (p_test_id) returning id into v_session;

  return jsonb_build_object(
    'ok', true,
    'session_id', v_session,
    'title', v_test.title,
    'time_limit', v_test.time_limit,
    'questions', v_test.questions
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. begin_session — imię + start zegara (czas mierzy serwer)
-- -----------------------------------------------------------------------------

create or replace function public.begin_session(p_session_id uuid, p_student_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := public.clean_student_name(p_student_name);
  v_s test_sessions%rowtype;
begin
  select * into v_s from test_sessions where id = p_session_id for update;
  if not found or v_s.created_at < now() - interval '3 hours' then
    raise exception 'session_invalid' using errcode = '22023';
  end if;
  if v_s.started_at is not null then
    raise exception 'session_used' using errcode = '22023';
  end if;

  update test_sessions set student_name = v_name, started_at = now() where id = p_session_id;
  return jsonb_build_object('ok', true, 'student_name', v_name);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. submit_attempt — nowa wersja oparta na sesji (stara z imieniem usunięta)
-- -----------------------------------------------------------------------------

drop function if exists public.submit_attempt(uuid, text, jsonb, int);

create or replace function public.submit_attempt(p_session_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s test_sessions%rowtype;
  v_test tests%rowtype;
  v_keys jsonb;
  v_total int;
  v_score int := 0;
  v_results jsonb := '[]'::jsonb;
  v_answer text;
  v_ok boolean;
  v_duration int;
  i int;
begin
  -- blokada wiersza: równoczesne podwójne wysłanie czeka i dostaje duplicate_attempt
  select * into v_s from test_sessions where id = p_session_id for update;
  if not found or v_s.started_at is null then
    raise exception 'session_invalid' using errcode = '22023';
  end if;
  if v_s.submitted_at is not null then
    raise exception 'duplicate_attempt' using errcode = '23505';
  end if;

  select * into v_test from tests where id = v_s.test_id;
  select answers into v_keys from test_keys where test_id = v_s.test_id;
  if v_test.id is null or v_keys is null then
    raise exception 'test_not_found' using errcode = 'P0002';
  end if;

  -- 5 min tolerancji na problemy z siecią; później sesja wygasa
  if now() > v_s.started_at + make_interval(secs => v_test.time_limit + 300) then
    raise exception 'session_expired' using errcode = '22023';
  end if;

  v_total := jsonb_array_length(v_test.questions);
  if p_answers is null or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) > v_total then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  for i in 0 .. v_total - 1 loop
    v_answer := case
      when jsonb_typeof(p_answers -> i) = 'string' then left(p_answers ->> i, 500)
      else null
    end;
    v_ok := v_answer is not null
      and public.normalize_answer(v_answer) <> ''
      and exists (
        select 1 from jsonb_array_elements_text(v_keys -> i) as k
        where public.normalize_answer(k) = public.normalize_answer(v_answer)
      );
    if v_ok then v_score := v_score + 1; end if;
    v_results := v_results || to_jsonb(v_ok);
  end loop;

  -- czas liczony przez serwer, przycięty do limitu testu
  v_duration := least(greatest(extract(epoch from now() - v_s.started_at)::int, 0), v_test.time_limit);

  insert into attempts (test_id, test_title, student_name, score, total, duration_sec)
  values (v_test.id, v_test.title, v_s.student_name, v_score, v_total, v_duration);

  update test_sessions set submitted_at = now() where id = p_session_id;

  return jsonb_build_object('score', v_score, 'total', v_total, 'results', v_results, 'duration_sec', v_duration);
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. create_test z PIN-em (zwraca {id, pin})
-- -----------------------------------------------------------------------------

drop function if exists public.create_test(text, int, jsonb, jsonb);

create or replace function public.create_test(
  p_title text,
  p_time_limit int,
  p_questions jsonb,
  p_keys jsonb,
  p_pin text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_pin text;
  i int;
  q jsonb;
  k jsonb;
  v text;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_pin := coalesce(nullif(btrim(p_pin), ''), public.random_pin());
  if v_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_pin' using errcode = '22023';
  end if;

  p_title := btrim(coalesce(p_title, ''));
  if char_length(p_title) not between 1 and 120 then
    raise exception 'invalid_title' using errcode = '22023';
  end if;
  if p_time_limit is null or p_time_limit not between 60 and 7200 then
    raise exception 'invalid_time_limit' using errcode = '22023';
  end if;
  if not public.questions_valid(p_questions) then
    raise exception 'invalid_questions' using errcode = '22023';
  end if;
  if p_keys is null or jsonb_typeof(p_keys) <> 'array'
     or jsonb_array_length(p_keys) <> jsonb_array_length(p_questions) then
    raise exception 'invalid_keys' using errcode = '22023';
  end if;

  for i in 0 .. jsonb_array_length(p_questions) - 1 loop
    q := p_questions -> i;
    k := p_keys -> i;
    if jsonb_typeof(k) <> 'array' or jsonb_array_length(k) not between 1 and 10 then
      raise exception 'invalid_keys' using errcode = '22023';
    end if;
    for v in select * from jsonb_array_elements_text(k) loop
      if char_length(btrim(v)) not between 1 and 200 then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
    end loop;
    if q->>'type' in ('closed','select') then
      if jsonb_array_length(k) <> 1 or not ((q->'options') @> jsonb_build_array(k->>0)) then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
    end if;
  end loop;

  insert into tests (title, time_limit, questions, created_by)
  values (p_title, p_time_limit, p_questions, auth.uid())
  returning id into v_id;

  insert into test_keys (test_id, answers, pin) values (v_id, p_keys, v_pin);

  return jsonb_build_object('id', v_id, 'pin', v_pin);
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. set_test_pin — zmiana PIN-u przez admina (np. na każdą lekcję)
-- -----------------------------------------------------------------------------

create or replace function public.set_test_pin(p_test_id uuid, p_pin text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin text;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  v_pin := coalesce(nullif(btrim(p_pin), ''), public.random_pin());
  if v_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_pin' using errcode = '22023';
  end if;

  update test_keys set pin = v_pin where test_id = p_test_id;
  if not found then
    raise exception 'test_not_found' using errcode = 'P0002';
  end if;
  delete from pin_failures where test_id = p_test_id;
  return v_pin;
end;
$$;

-- -----------------------------------------------------------------------------
-- 10. Uprawnienia do funkcji
-- -----------------------------------------------------------------------------

revoke all on function public.open_test(uuid, text) from public;
revoke all on function public.begin_session(uuid, text) from public;
revoke all on function public.submit_attempt(uuid, jsonb) from public;
revoke all on function public.create_test(text, int, jsonb, jsonb, text) from public, anon;
revoke all on function public.set_test_pin(uuid, text) from public, anon;
revoke all on function public.random_pin() from public, anon;
revoke all on function public.client_ip() from public, anon;
revoke all on function public.clean_student_name(text) from public, anon;

grant execute on function public.open_test(uuid, text) to anon, authenticated;
grant execute on function public.begin_session(uuid, text) to anon, authenticated;
grant execute on function public.submit_attempt(uuid, jsonb) to anon, authenticated;
grant execute on function public.create_test(text, int, jsonb, jsonb, text) to authenticated;
grant execute on function public.set_test_pin(uuid, text) to authenticated;
grant execute on function public.random_pin() to authenticated;
