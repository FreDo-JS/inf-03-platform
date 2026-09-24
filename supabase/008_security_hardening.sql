-- =============================================================================
-- INF.03 — migracja 008: utwardzenie po audycie bezpieczeństwa
-- Uruchom po 007_practical_seed.sql. Można uruchomić ponownie.
--
-- Zmiany:
--  1. Lista adminów zamiast „każdy zalogowany = admin”.
--  2. Limit rozmiaru pola details w zdarzeniach nadzoru (był nielimitowany).
--  3. Ograniczenie częstotliwości autozapisu pracy praktycznej.
--  4. Realtime na tabeli tests tylko dla kolumn publicznych (bez treści pytań).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Lista adminów
-- -----------------------------------------------------------------------------
-- Dotąd adminem był KAŻDY użytkownik Supabase Auth. Jeśli ktoś włączyłby
-- publiczną rejestrację, dowolna osoba zostałaby nauczycielem. Teraz liczy się
-- obecność na liście — konta zakłada się w Auth, a uprawnienia nadaje tutaj.

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 200),
  added_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Konta, które istnieją w chwili migracji, zachowują dostęp (to obecni nauczyciele).
insert into admins (user_id, note)
select id, 'konto istniejące w chwili migracji 008' from auth.users
on conflict (user_id) do nothing;

-- Admin widzi listę adminów; dopisywanie i usuwanie tylko z SQL Editora,
-- żeby nie dało się nadać sobie uprawnień przez API.
drop policy if exists "admin read admins" on admins;
create policy "admin read admins" on admins for select using (
  exists (select 1 from admins a where a.user_id = auth.uid())
);
revoke all on admins from anon;
revoke insert, update, delete on admins from authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (select 1 from admins where user_id = auth.uid());
$$;

-- Uprawnienie do wykonania także dla anon: polityki RLS tabel z publicznym
-- odczytem (mapa, lista testów) są sprawdzane również dla niezalogowanych.
-- Bez tego uczeń dostawałby błąd zamiast danych. Funkcja i tak zwraca false,
-- bo auth.uid() jest wtedy puste.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- --- polityki: „zalogowany” → „na liście adminów” ----------------------------

drop policy if exists "admin write progress" on progress;
create policy "admin write progress" on progress for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write tests" on tests;
create policy "admin write tests" on tests for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin can read attempts" on attempts;
create policy "admin can read attempts" on attempts for select using (public.is_admin());

drop policy if exists "admin can delete attempts" on attempts;
create policy "admin can delete attempts" on attempts for delete using (public.is_admin());

drop policy if exists "admin write categories" on categories;
create policy "admin write categories" on categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write subtopics" on subtopics;
create policy "admin write subtopics" on subtopics for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write subtopic_links" on subtopic_links;
create policy "admin write subtopic_links" on subtopic_links for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all test_keys" on test_keys;
create policy "admin all test_keys" on test_keys for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all practical_tasks" on practical_tasks;
create policy "admin all practical_tasks" on practical_tasks for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all practical_sessions" on practical_sessions;
create policy "admin all practical_sessions" on practical_sessions for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin all practical_attempts" on practical_attempts;
create policy "admin all practical_attempts" on practical_attempts for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read practical_events" on practical_events;
create policy "admin read practical_events" on practical_events for select using (public.is_admin());

-- --- funkcje administratora --------------------------------------------------

create or replace function public.set_test_pin(p_test_id uuid, p_pin text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin text;
begin
  if not public.is_admin() then
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
revoke all on function public.set_test_pin(uuid, text) from public, anon;
grant execute on function public.set_test_pin(uuid, text) to authenticated;

-- create_test: sprawdzenie listy adminów zamiast samej roli
create or replace function public.create_test(
  p_title text, p_time_limit int, p_questions jsonb, p_keys jsonb, p_pin text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid; v_pin text; i int; q jsonb; k jsonb; v text; n_same int;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_pin := coalesce(nullif(btrim(p_pin), ''), public.random_pin());
  if v_pin !~ '^[0-9]{6}$' then raise exception 'invalid_pin' using errcode = '22023'; end if;

  p_title := btrim(coalesce(p_title, ''));
  if char_length(p_title) not between 1 and 120 then raise exception 'invalid_title' using errcode = '22023'; end if;
  if p_time_limit is null or p_time_limit not between 60 and 7200 then raise exception 'invalid_time_limit' using errcode = '22023'; end if;
  if not public.questions_valid(p_questions) then raise exception 'invalid_questions' using errcode = '22023'; end if;
  if p_keys is null or jsonb_typeof(p_keys) <> 'array'
     or jsonb_array_length(p_keys) <> jsonb_array_length(p_questions) then
    raise exception 'invalid_keys' using errcode = '22023';
  end if;

  for i in 0 .. jsonb_array_length(p_questions) - 1 loop
    q := p_questions -> i;
    k := p_keys -> i;
    if jsonb_typeof(k) <> 'array' then raise exception 'invalid_keys' using errcode = '22023'; end if;

    if q->>'type' = 'matching' then
      if jsonb_array_length(k) <> jsonb_array_length(q->'left') then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      select count(*) into n_same
      from (select btrim(kv.value) from jsonb_array_elements_text(k) as kv(value)
            except all
            select btrim(rv.value) from jsonb_array_elements_text(q->'right') as rv(value)) d;
      if n_same <> 0 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      for v in select * from jsonb_array_elements_text(k) loop
        if char_length(btrim(v)) not between 1 and 150 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      end loop;
    else
      if jsonb_array_length(k) not between 1 and 10 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      for v in select * from jsonb_array_elements_text(k) loop
        if char_length(btrim(v)) not between 1 and 200 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      end loop;
      if q->>'type' in ('closed','select') then
        if jsonb_array_length(k) <> 1 or not ((q->'options') @> jsonb_build_array(k->>0)) then
          raise exception 'invalid_keys' using errcode = '22023';
        end if;
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
revoke all on function public.create_test(text, int, jsonb, jsonb, text) from public, anon;
grant execute on function public.create_test(text, int, jsonb, jsonb, text) to authenticated;

-- funkcje modułu Praktyka: ta sama zmiana warunku
create or replace function public.practical_create_session(
  p_task_id uuid, p_class text, p_minutes int, p_allow_paste boolean default true, p_pass_threshold int default 75
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pin text; v_id uuid; v_task practical_tasks%rowtype; i int;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  select * into v_task from practical_tasks where id = p_task_id;
  if not found then raise exception 'task_not_found' using errcode = 'P0002'; end if;
  if not v_task.is_ready then raise exception 'task_not_ready' using errcode = '22023'; end if;
  if p_class not in ('2a','4e','4d') then raise exception 'invalid_class' using errcode = '22023'; end if;
  if p_minutes is null or p_minutes not between 5 and 300 then raise exception 'invalid_minutes' using errcode = '22023'; end if;
  if p_pass_threshold is null or p_pass_threshold not between 1 and 100 then raise exception 'invalid_threshold' using errcode = '22023'; end if;

  for i in 1 .. 20 loop
    v_pin := public.random_pin();
    begin
      insert into practical_sessions (task_id, class_name, pin, minutes, allow_paste, pass_threshold, created_by)
      values (p_task_id, p_class, v_pin, p_minutes, coalesce(p_allow_paste, true), p_pass_threshold, auth.uid())
      returning id into v_id;
      return jsonb_build_object('id', v_id, 'pin', v_pin);
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'pin_generation_failed' using errcode = '55000';
end;
$$;

create or replace function public.practical_start_session(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session practical_sessions%rowtype;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  update practical_sessions
  set status = 'active', started_at = now(), ends_at = now() + make_interval(mins => minutes)
  where id = p_session_id and status = 'lobby'
  returning * into v_session;
  if not found then raise exception 'session_not_in_lobby' using errcode = '22023'; end if;
  return jsonb_build_object('started_at', v_session.started_at, 'ends_at', v_session.ends_at);
end;
$$;

create or replace function public.practical_finish_session(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_forced int;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  with updated as (
    update practical_attempts
    set status = 'submitted', submitted_at = now(), ended_reason = 'teacher_ended'
    where session_id = p_session_id and status = 'in_progress'
    returning id
  )
  select count(*) into v_forced from updated;
  update practical_sessions set status = 'finished' where id = p_session_id;
  return jsonb_build_object('ok', true, 'forced', v_forced);
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Zdarzenia nadzoru: limit rozmiaru details
-- -----------------------------------------------------------------------------
-- Audyt wykazał, że uczeń mógł wysłać 300 KB JSON-a w polu details i zapchać bazę.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'practical_events_details_size') then
    -- porządkujemy ewentualne wcześniejsze przerosty
    update practical_events set details = '{"trimmed": true}'::jsonb where length(details::text) > 2000;
    alter table practical_events
      add constraint practical_events_details_size check (length(details::text) <= 2000);
  end if;
end $$;

create or replace function public.practical_event(p_token text, p_type text, p_details jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_events int;
  v_details jsonb;
begin
  if p_type not in ('start','tab_hidden','fullscreen_exit','large_paste','autosave_error') then
    raise exception 'invalid_event' using errcode = '22023';
  end if;

  -- do dziennika trafiają tylko znane, krótkie pola (bez treści wklejenia)
  v_details := coalesce(p_details, '{}'::jsonb);
  v_details := jsonb_strip_nulls(jsonb_build_object(
    'length', case when jsonb_typeof(v_details->'length') = 'number'
                   then least((v_details->>'length')::numeric, 1000000) else null end,
    'file',   left(nullif(v_details->>'file', ''), 40)
  ));

  select * into v_attempt from practical_attempts
  where attempt_token_hash = public.practical_token_hash(p_token) for update;
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;

  select count(*) into v_events from practical_events where attempt_id = v_attempt.id;
  if v_events >= 500 then
    return jsonb_build_object('ok', true, 'capped', true,
      'tab_switch_count', v_attempt.tab_switch_count, 'large_paste_count', v_attempt.large_paste_count);
  end if;

  insert into practical_events (attempt_id, type, details) values (v_attempt.id, p_type, v_details);

  if p_type in ('tab_hidden', 'fullscreen_exit') then
    update practical_attempts set tab_switch_count = tab_switch_count + 1
    where id = v_attempt.id returning * into v_attempt;
  elsif p_type = 'large_paste' then
    update practical_attempts set large_paste_count = large_paste_count + 1
    where id = v_attempt.id returning * into v_attempt;
  end if;

  return jsonb_build_object('ok', true,
    'tab_switch_count', v_attempt.tab_switch_count,
    'large_paste_count', v_attempt.large_paste_count,
    'should_end', v_attempt.tab_switch_count >= 2);
end;
$$;
revoke all on function public.practical_event(text, text, jsonb) from public;
grant execute on function public.practical_event(text, text, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Autozapis: ograniczenie częstotliwości (zapora przed zalewaniem bazy)
-- -----------------------------------------------------------------------------
-- Aplikacja zapisuje co ~3 s, więc 1 s odstępu niczego nie psuje, a blokuje
-- wysyłanie setek 1-megabajtowych zapisów na sekundę.

create or replace function public.practical_save(p_token text, p_files jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_session practical_sessions%rowtype;
  v_task practical_tasks%rowtype;
  v_name text;
begin
  select * into v_attempt from practical_attempts
  where attempt_token_hash = public.practical_token_hash(p_token) for update;
  if not found then raise exception 'attempt_invalid' using errcode = '22023'; end if;
  if v_attempt.status <> 'in_progress' then raise exception 'already_submitted' using errcode = '22023'; end if;

  select * into v_session from practical_sessions where id = v_attempt.session_id;
  if v_session.status <> 'active' then raise exception 'session_not_active' using errcode = '22023'; end if;
  if v_session.ends_at is not null and now() > v_session.ends_at + interval '30 seconds' then
    raise exception 'time_up' using errcode = '22023';
  end if;

  -- walidacja ZAWSZE przed ograniczeniem częstotliwości, żeby błędne dane
  -- nie przechodziły niezauważone tylko dlatego, że zapis był zbyt szybki
  if not public.practical_files_valid(p_files) then raise exception 'invalid_files' using errcode = '22023'; end if;

  select * into v_task from practical_tasks where id = v_session.task_id;
  if not v_task.allow_new_files then
    for v_name in select f->>'name' from jsonb_array_elements(p_files) f loop
      if not exists (select 1 from jsonb_array_elements(v_task.files) tf where tf->>'name' = v_name) then
        raise exception 'unexpected_file' using errcode = '22023';
      end if;
    end loop;
  end if;

  -- zbyt częsty zapis: nie błąd, po prostu pomijamy zapis
  if v_attempt.last_saved_at is not null and v_attempt.last_saved_at > now() - interval '1 second' then
    return jsonb_build_object('ok', true, 'throttled', true, 'saved_at', v_attempt.last_saved_at,
      'server_now', now(), 'ends_at', v_session.ends_at);
  end if;

  update practical_attempts set files = p_files, last_saved_at = now() where id = v_attempt.id;
  return jsonb_build_object('ok', true, 'saved_at', now(), 'server_now', now(), 'ends_at', v_session.ends_at);
end;
$$;
revoke all on function public.practical_save(text, jsonb) from public;
grant execute on function public.practical_save(text, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Realtime na tests tylko dla kolumn publicznych
-- -----------------------------------------------------------------------------
-- Uczeń nasłuchuje zmian w tabeli tests, żeby widzieć nowe testy od razu.
-- Bez listy kolumn ładunek zdarzenia zawierałby też pytania (kolumna questions),
-- czyli treść chronioną PIN-em. Publikujemy wyłącznie dane z listy testów.
--
-- question_count jest kolumną GENEROWANĄ, a Postgres nie przyjmuje takich na
-- liście kolumn publikacji ("cannot use generated column ... in publication
-- column list"). Nie szkodzi: klient i tak ignoruje ładunek zdarzenia i po
-- każdym powiadomieniu dociąga listę testów zapytaniem.

do $$
begin
  alter publication supabase_realtime drop table tests;
exception when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table tests (id, title, time_limit, created_at);
exception when duplicate_object then null;
end $$;
