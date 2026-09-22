-- =============================================================================
-- INF.03 — Mapa nauki i testy: schemat bazy (Supabase / Postgres)
-- Kolejność w Supabase → SQL Editor: schema.sql → 002_test_pin.sql → seed.sql
--
-- Zasady:
--  * RLS włączone na WSZYSTKICH tabelach, bez wyjątków.
--  * CHECK constraints = druga linia obrony, niezależna od walidacji w aplikacji.
--  * "Admin" = dowolny zalogowany użytkownik Supabase Auth
--    → KONIECZNIE wyłącz publiczną rejestrację (Authentication → Sign In / Providers
--      → "Allow new users to sign up" = OFF) i zakładaj konta ręcznie.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Model uprawnień ze specyfikacji (sekcja 7.4) — bez zmian
-- -----------------------------------------------------------------------------

create table progress (
  class_name text not null check (class_name in ('2a','4e','4d')),
  subtopic_id text not null check (char_length(subtopic_id) between 1 and 64),
  updated_at timestamptz not null default now(),
  primary key (class_name, subtopic_id)
);

create table tests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  time_limit int not null check (time_limit between 60 and 7200),
  questions jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references tests(id) on delete set null,
  test_title text not null check (char_length(test_title) between 1 and 120),
  student_name text not null check (char_length(student_name) between 1 and 40),
  score int not null check (score >= 0),
  total int not null check (total > 0 and score <= total),
  duration_sec int not null check (duration_sec >= 0),
  created_at timestamptz not null default now()
);

alter table progress enable row level security;
alter table tests enable row level security;
alter table attempts enable row level security;

create policy "public read progress" on progress for select using (true);
create policy "public read tests" on tests for select using (true);
create policy "admin write progress" on progress for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write tests" on tests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "anyone can submit attempt" on attempts for insert with check (
  char_length(student_name) between 1 and 40
  and score >= 0 and total > 0 and score <= total
  and duration_sec >= 0
);
create policy "admin can read attempts" on attempts for select using (auth.role() = 'authenticated');

-- UWAGA: migracja 002_test_pin.sql usuwa tę politykę — wyniki zapisuje wyłącznie
-- submit_attempt() po weryfikacji PIN-u. Inaczej PIN dałoby się obejść przez API.

-- Admin może usuwać wyniki (np. testowe wpisy) — tylko zalogowany.
create policy "admin can delete attempts" on attempts for delete using (auth.role() = 'authenticated');

create index attempts_created_at_idx on attempts (created_at desc);
create index attempts_dedupe_idx on attempts (test_id, student_name, created_at desc);

-- -----------------------------------------------------------------------------
-- 2. Struktura mapy nauki: kategorie i podtematy
-- -----------------------------------------------------------------------------

create table categories (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  position int not null unique check (position between 1 and 999),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500)
);

create table subtopics (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  category_id text not null references categories(id) on delete cascade,
  position int not null check (position between 1 and 999),
  title text not null check (char_length(title) between 1 and 200),
  -- tylko https:// — blokuje javascript:/data: URL-e (XSS przez href)
  theory_url text check (theory_url is null or (theory_url ~ '^https://' and char_length(theory_url) <= 500)),
  tasks_url  text check (tasks_url  is null or (tasks_url  ~ '^https://' and char_length(tasks_url)  <= 500)),
  unique (category_id, position)
);

alter table categories enable row level security;
alter table subtopics enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read subtopics" on subtopics for select using (true);
create policy "admin write categories" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write subtopics" on subtopics for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- postęp może dotyczyć tylko istniejącego podtematu
alter table progress
  add constraint progress_subtopic_fk
  foreign key (subtopic_id) references subtopics(id) on delete cascade;

-- -----------------------------------------------------------------------------
-- 3. Klucze odpowiedzi — oddzielnie od publicznej tabeli tests
-- -----------------------------------------------------------------------------
-- tests.questions jest publicznie czytelne (polityka "public read tests"),
-- więc NIE może zawierać poprawnych odpowiedzi — inaczej każdy podejrzy je
-- w zakładce Network. Odpowiedzi trzymamy tu, czytelne tylko dla adminów;
-- ocenianie robi funkcja submit_attempt() (security definer).
--
-- Format tests.questions (publiczny):
--   [{"type":"closed"|"select"|"input","text":"...","options":["a","b",...]}]
--   (dla "input" brak pola options)
-- Format test_keys.answers (tajny), indeks = indeks pytania:
--   [["poprawna"], ["wariant 1","wariant 2"], ...]

create table test_keys (
  test_id uuid primary key references tests(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'array')
);

alter table test_keys enable row level security;

create policy "admin all test_keys" on test_keys for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

revoke all on test_keys from anon;

-- -----------------------------------------------------------------------------
-- 4. Walidacja struktury pytań (CHECK na tests.questions)
-- -----------------------------------------------------------------------------

create or replace function public.questions_valid(q jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  opt jsonb;
  n_opts int;
  n_distinct int;
begin
  if q is null or jsonb_typeof(q) <> 'array' then return false; end if;
  if jsonb_array_length(q) not between 1 and 100 then return false; end if;

  for item in select * from jsonb_array_elements(q) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if coalesce(item->>'type', '') not in ('closed','select','input') then return false; end if;
    if jsonb_typeof(item->'text') is distinct from 'string' then return false; end if;
    if char_length(btrim(item->>'text')) not between 1 and 500 then return false; end if;

    if item->>'type' in ('closed','select') then
      if jsonb_typeof(item->'options') is distinct from 'array' then return false; end if;
      n_opts := jsonb_array_length(item->'options');
      if n_opts not between 2 and 10 then return false; end if;
      for opt in select * from jsonb_array_elements(item->'options') loop
        if jsonb_typeof(opt) <> 'string' then return false; end if;
        if char_length(btrim(opt #>> '{}')) not between 1 and 200 then return false; end if;
      end loop;
      select count(distinct btrim(v)) into n_distinct
        from jsonb_array_elements_text(item->'options') as v;
      if n_distinct <> n_opts then return false; end if;
    else
      if item ? 'options' and jsonb_typeof(item->'options') <> 'null' then return false; end if;
    end if;
  end loop;

  return true;
end;
$$;

alter table tests add constraint tests_questions_valid check (public.questions_valid(questions));

-- normalizacja odpowiedzi: trim, zwinięte białe znaki, małe litery
-- (identyczna logika w lib/validation.ts → normalizeAnswer)
create or replace function public.normalize_answer(t text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(btrim(regexp_replace(coalesce(t, ''), '\s+', ' ', 'g')));
$$;

-- -----------------------------------------------------------------------------
-- 5. create_test — atomowe utworzenie testu + klucza (tylko admin)
-- -----------------------------------------------------------------------------
-- security invoker: działa z uprawnieniami wywołującego, więc RLS nadal obowiązuje.

create or replace function public.create_test(
  p_title text,
  p_time_limit int,
  p_questions jsonb,
  p_keys jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  i int;
  q jsonb;
  k jsonb;
  v text;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
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
      -- dokładnie jedna poprawna odpowiedź, należąca do zbioru opcji
      if jsonb_array_length(k) <> 1 or not ((q->'options') @> jsonb_build_array(k->>0)) then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
    end if;
  end loop;

  insert into tests (title, time_limit, questions, created_by)
  values (p_title, p_time_limit, p_questions, auth.uid())
  returning id into v_id;

  insert into test_keys (test_id, answers) values (v_id, p_keys);

  return v_id;
end;
$$;

revoke all on function public.create_test(text, int, jsonb, jsonb) from public, anon;
grant execute on function public.create_test(text, int, jsonb, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. submit_attempt — ocena po stronie serwera + zapis wyniku (uczeń, anon)
-- -----------------------------------------------------------------------------
-- security definer: czyta test_keys (niedostępne dla anon) i wstawia do attempts.
-- Zwraca tylko {score,total,results:[bool]} — bez poprawnych odpowiedzi.
--
-- Możliwy kolejny krok: Supabase Edge Function jako pośrednik z rate limitingiem
-- per IP (np. Upstash/KV). Tu mamy prostszą ochronę: blokadę duplikatów
-- (to samo imię + test w ciągu 15 s) oraz limity rozmiaru danych.

create or replace function public.submit_attempt(
  p_test_id uuid,
  p_student_name text,
  p_answers jsonb,
  p_duration_sec int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_test tests%rowtype;
  v_keys jsonb;
  v_name text;
  v_total int;
  v_score int := 0;
  v_results jsonb := '[]'::jsonb;
  v_answer text;
  v_ok boolean;
  v_duration int;
  i int;
begin
  -- imię: usuń znaki kontrolne, przytnij, 1–40 znaków
  v_name := btrim(regexp_replace(coalesce(p_student_name, ''), '[[:cntrl:]]', '', 'g'));
  v_name := regexp_replace(v_name, '\s+', ' ', 'g');
  if char_length(v_name) not between 1 and 40 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  select * into v_test from tests where id = p_test_id;
  if not found then
    raise exception 'test_not_found' using errcode = 'P0002';
  end if;
  select answers into v_keys from test_keys where test_id = p_test_id;
  if v_keys is null then
    raise exception 'test_not_found' using errcode = 'P0002';
  end if;

  v_total := jsonb_array_length(v_test.questions);
  if p_answers is null or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) > v_total then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  -- blokada duplikatów (podwójny submit / spam)
  if exists (
    select 1 from attempts
    where test_id = p_test_id and student_name = v_name
      and created_at > now() - interval '15 seconds'
  ) then
    raise exception 'duplicate_attempt' using errcode = '23505';
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

  -- czas: przycięty do [0, limit testu]
  v_duration := least(greatest(coalesce(p_duration_sec, 0), 0), v_test.time_limit);

  insert into attempts (test_id, test_title, student_name, score, total, duration_sec)
  values (v_test.id, v_test.title, v_name, v_score, v_total, v_duration);

  return jsonb_build_object('score', v_score, 'total', v_total, 'results', v_results);
end;
$$;

revoke all on function public.submit_attempt(uuid, text, jsonb, int) from public;
grant execute on function public.submit_attempt(uuid, text, jsonb, int) to anon, authenticated;

revoke all on function public.questions_valid(jsonb) from public, anon;
revoke all on function public.normalize_answer(text) from public, anon;
grant execute on function public.questions_valid(jsonb) to authenticated;
grant execute on function public.normalize_answer(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Realtime — zmiany postępu i listy testów na żywo
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table progress;
alter publication supabase_realtime add table tests;
