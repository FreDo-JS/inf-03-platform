-- =============================================================================
-- INF.03 — migracja 006: moduł „Praktyka” (symulator części praktycznej)
-- Kolejność: schema.sql → 002 → seed.sql → 003 → 004 → 005 → 006_practical.sql
--
-- Wersja HTML/CSS/JS. Kolumny na PHP + bazę danych (db_sql, db_sql_sqlite,
-- schema_info, assets) są już tutaj, żeby dołożenie tamtego etapu nie wymagało
-- migrowania istniejących wierszy.
--
-- Zasada dostępu: uczeń NIE MA żadnego bezpośredniego dostępu do tabel modułu
-- (RLS bez polityk dla anon). Działa wyłącznie przez funkcje SECURITY DEFINER
-- poniżej, identyfikując się tokenem podejścia. Czas i punktacja liczone są po
-- stronie serwera — przeglądarce nie ufamy.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Funkcje pomocnicze (walidacja struktur JSON)
-- -----------------------------------------------------------------------------

-- Nazwa pliku projektu: bezpieczna, bez ścieżek, tylko dozwolone rozszerzenia.
create or replace function public.practical_filename_valid(p_name text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_name ~ '^[A-Za-z0-9_-]{1,40}\.(html|css|js|txt)$';
$$;

-- files: [{"name":"index.html","content":"..."}] — max 15 plików, 200 KB na plik, 1 MB łącznie
create or replace function public.practical_files_valid(p_files jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  total int := 0;
  n_names int;
  n_items int;
begin
  if p_files is null or jsonb_typeof(p_files) <> 'array' then return false; end if;
  n_items := jsonb_array_length(p_files);
  if n_items > 15 then return false; end if;

  for item in select * from jsonb_array_elements(p_files) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if jsonb_typeof(item->'name') is distinct from 'string' then return false; end if;
    if jsonb_typeof(item->'content') is distinct from 'string' then return false; end if;
    if not public.practical_filename_valid(item->>'name') then return false; end if;
    if octet_length(item->>'content') > 200000 then return false; end if;
    total := total + octet_length(item->>'content');
  end loop;

  if total > 1000000 then return false; end if;

  select count(distinct item2->>'name') into n_names from jsonb_array_elements(p_files) item2;
  return n_names = n_items;  -- bez duplikatów nazw
end;
$$;

-- auto_tests: [{"id","name","points","type", ...parametry}]
create or replace function public.practical_tests_valid(p_tests jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  n int;
  n_ids int;
begin
  if p_tests is null or jsonb_typeof(p_tests) <> 'array' then return false; end if;
  n := jsonb_array_length(p_tests);
  if n > 60 then return false; end if;

  for item in select * from jsonb_array_elements(p_tests) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if char_length(coalesce(item->>'id', '')) not between 1 and 40 then return false; end if;
    if char_length(coalesce(item->>'name', '')) not between 1 and 200 then return false; end if;
    if char_length(coalesce(item->>'description', '')) > 500 then return false; end if;
    -- typy sql_* i php_output dojdą wraz z etapem PHP + bazy danych
    if coalesce(item->>'type', '') not in (
      'file_not_empty','selector_count','selector_text','selector_attribute',
      'css_computed','html_lang_doctype','interaction'
    ) then return false; end if;
    if jsonb_typeof(item->'points') is distinct from 'number' then return false; end if;
    if (item->>'points')::numeric not between 0 and 100 then return false; end if;
  end loop;

  select count(distinct item2->>'id') into n_ids from jsonb_array_elements(p_tests) item2;
  return n_ids = n;
end;
$$;

-- manual_criteria: [{"id","name","description","points"}]
create or replace function public.practical_criteria_valid(p_criteria jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  n int;
  n_ids int;
begin
  if p_criteria is null or jsonb_typeof(p_criteria) <> 'array' then return false; end if;
  n := jsonb_array_length(p_criteria);
  if n > 30 then return false; end if;

  for item in select * from jsonb_array_elements(p_criteria) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if char_length(coalesce(item->>'id', '')) not between 1 and 40 then return false; end if;
    if char_length(coalesce(item->>'name', '')) not between 1 and 200 then return false; end if;
    if char_length(coalesce(item->>'description', '')) > 500 then return false; end if;
    if jsonb_typeof(item->'points') is distinct from 'number' then return false; end if;
    if (item->>'points')::numeric not between 0 and 100 then return false; end if;
  end loop;

  select count(distinct item2->>'id') into n_ids from jsonb_array_elements(p_criteria) item2;
  return n_ids = n;
end;
$$;

-- imię ucznia: 2–40 znaków, litery (z polskimi), spacja, myślnik, apostrof
create or replace function public.practical_clean_name(p_name text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v text;
begin
  v := btrim(regexp_replace(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', ' ', 'g'), '\s+', ' ', 'g'));
  if char_length(v) not between 2 and 40 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v !~ '^[[:alpha:]ąćęłńóśźżĄĆĘŁŃÓŚŹŻ][[:alpha:]ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ''-]*$' then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  return v;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Tabele
-- -----------------------------------------------------------------------------

create table if not exists practical_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 300),
  content_md text not null default '' check (char_length(content_md) <= 20000),
  files jsonb not null default '[]'::jsonb check (public.practical_files_valid(files)),
  reference_files jsonb not null default '[]'::jsonb check (public.practical_files_valid(reference_files)),
  auto_tests jsonb not null default '[]'::jsonb check (public.practical_tests_valid(auto_tests)),
  manual_criteria jsonb not null default '[]'::jsonb check (public.practical_criteria_valid(manual_criteria)),
  default_minutes int not null default 150 check (default_minutes between 5 and 300),
  allow_new_files boolean not null default false,
  student_can_run_tests boolean not null default false,
  is_ready boolean not null default false,
  -- miejsce na etap PHP + baza danych (na razie nieużywane przez aplikację)
  schema_info text not null default '' check (char_length(schema_info) <= 5000),
  db_sql text not null default '' check (char_length(db_sql) <= 50000),
  db_sql_sqlite text not null default '' check (char_length(db_sql_sqlite) <= 50000),
  assets jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists practical_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references practical_tasks(id) on delete restrict,
  class_name text not null check (class_name in ('2a','4e','4d')),
  pin text not null check (pin ~ '^[0-9]{6}$'),
  status text not null default 'lobby' check (status in ('lobby','active','finished')),
  minutes int not null check (minutes between 5 and 300),
  allow_paste boolean not null default true,
  pass_threshold int not null default 75 check (pass_threshold between 1 and 100),
  started_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- PIN jednoznaczny wśród sesji, które jeszcze trwają
create unique index if not exists practical_sessions_pin_active_idx
  on practical_sessions (pin) where status <> 'finished';

create table if not exists practical_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practical_sessions(id) on delete cascade,
  student_name text not null check (char_length(student_name) between 2 and 40),
  attempt_token_hash text not null unique,
  result_token text not null unique,
  files jsonb not null default '[]'::jsonb check (public.practical_files_valid(files)),
  last_saved_at timestamptz,
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','auto_checked','reviewed','published')),
  submitted_at timestamptz,
  ended_reason text check (ended_reason in ('completed','time_up','tab_switch','teacher_ended')),
  tab_switch_count int not null default 0 check (tab_switch_count >= 0),
  large_paste_count int not null default 0 check (large_paste_count >= 0),
  auto_results jsonb not null default '[]'::jsonb,
  auto_checked_at timestamptz,
  overrides jsonb not null default '[]'::jsonb,
  manual_scores jsonb not null default '[]'::jsonb,
  teacher_comment text not null default '' check (char_length(teacher_comment) <= 2000),
  final_percent numeric(5,1) check (final_percent between 0 and 100),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists practical_attempts_name_idx
  on practical_attempts (session_id, lower(student_name));
create index if not exists practical_attempts_session_idx on practical_attempts (session_id, created_at);

create table if not exists practical_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references practical_attempts(id) on delete cascade,
  type text not null check (type in ('join','start','tab_hidden','fullscreen_exit','large_paste','submit','autosave_error')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists practical_events_attempt_idx on practical_events (attempt_id, created_at desc);

-- licznik prób PIN-u per IP (okna minutowe)
create table if not exists join_rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (ip_hash, window_start)
);

-- -----------------------------------------------------------------------------
-- 3. RLS — anon nie dotyka niczego; admin (zalogowany) zarządza wszystkim
-- -----------------------------------------------------------------------------

alter table practical_tasks enable row level security;
alter table practical_sessions enable row level security;
alter table practical_attempts enable row level security;
alter table practical_events enable row level security;
alter table join_rate_limits enable row level security;

drop policy if exists "admin all practical_tasks" on practical_tasks;
create policy "admin all practical_tasks" on practical_tasks for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin all practical_sessions" on practical_sessions;
create policy "admin all practical_sessions" on practical_sessions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin all practical_attempts" on practical_attempts;
create policy "admin all practical_attempts" on practical_attempts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin read practical_events" on practical_events;
create policy "admin read practical_events" on practical_events for select
  using (auth.role() = 'authenticated');

revoke all on practical_tasks from anon;
revoke all on practical_sessions from anon;
revoke all on practical_attempts from anon;
revoke all on practical_events from anon;
revoke all on join_rate_limits from anon, authenticated;

-- monitoring sesji na żywo u nauczyciela
do $$
begin
  alter publication supabase_realtime add table practical_attempts;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table practical_sessions;
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Funkcje ucznia (SECURITY DEFINER, wywoływane bez logowania)
-- -----------------------------------------------------------------------------

-- token: 256 bitów losowości; w bazie trzymamy tylko skrót SHA-256
create or replace function public.practical_new_token()
returns text
language sql
volatile
set search_path = public
as $$
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

create or replace function public.practical_token_hash(p_token text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
$$;

-- publiczny obraz zadania dla ucznia: bez rozwiązania wzorcowego i bez testów
create or replace function public.practical_task_public(p_task practical_tasks)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_build_object(
    'id', p_task.id,
    'title', p_task.title,
    'summary', p_task.summary,
    'content_md', p_task.content_md,
    'files', p_task.files,
    'allow_new_files', p_task.allow_new_files,
    'student_can_run_tests', p_task.student_can_run_tests,
    -- nazwy testów bez parametrów — tylko gdy zadanie na to pozwala
    'test_names', case when p_task.student_can_run_tests then (
        select coalesce(jsonb_agg(jsonb_build_object('id', t->>'id', 'name', t->>'name')), '[]'::jsonb)
        from jsonb_array_elements(p_task.auto_tests) t)
      else '[]'::jsonb end
  );
$$;

-- stan podejścia zwracany uczniowi (czas zawsze z serwera)
create or replace function public.practical_attempt_state(p_attempt practical_attempts)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'attempt_id', p_attempt.id,
    'student_name', p_attempt.student_name,
    'status', p_attempt.status,
    'files', p_attempt.files,
    'result_token', p_attempt.result_token,
    'tab_switch_count', p_attempt.tab_switch_count,
    'last_saved_at', p_attempt.last_saved_at,
    'ended_reason', p_attempt.ended_reason,
    'session', jsonb_build_object(
      'id', s.id,
      'status', s.status,
      'allow_paste', s.allow_paste,
      'minutes', s.minutes,
      'started_at', s.started_at,
      'ends_at', s.ends_at,
      'server_now', now()
    ),
    'task', public.practical_task_public(t)
  )
  from practical_sessions s
  join practical_tasks t on t.id = s.task_id
  where s.id = p_attempt.session_id;
$$;

-- dołączenie do sesji: limit prób PIN-u, walidacja imienia, wydanie tokenów
create or replace function public.practical_join(p_pin text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.client_ip();
  v_ip_hash text;
  v_window timestamptz := date_trunc('minute', now());
  v_count int;
  v_session practical_sessions%rowtype;
  v_name text;
  v_token text;
  v_attempt practical_attempts%rowtype;
  v_task practical_tasks%rowtype;
begin
  v_ip_hash := public.practical_token_hash(v_ip);

  -- rate limiting: 10 prób na minutę z jednego IP
  insert into join_rate_limits (ip_hash, window_start, count) values (v_ip_hash, v_window, 1)
  on conflict (ip_hash, window_start) do update set count = join_rate_limits.count + 1
  returning count into v_count;
  delete from join_rate_limits where window_start < now() - interval '1 hour';

  if v_count > 10 then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{6}$' then
    return jsonb_build_object('ok', false, 'reason', 'bad_pin');
  end if;

  select * into v_session from practical_sessions
  where pin = p_pin and status <> 'finished'
  order by created_at desc limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'bad_pin');
  end if;

  -- imię (wyjątek invalid_name przechodzi do klienta jako błąd)
  v_name := public.practical_clean_name(p_name);

  select * into v_attempt from practical_attempts
  where session_id = v_session.id and lower(student_name) = lower(v_name);
  if found then
    return jsonb_build_object('ok', false, 'reason', 'name_taken');
  end if;

  select * into v_task from practical_tasks where id = v_session.task_id;

  v_token := public.practical_new_token();
  insert into practical_attempts (session_id, student_name, attempt_token_hash, result_token, files)
  values (v_session.id, v_name, public.practical_token_hash(v_token), public.practical_new_token(), v_task.files)
  returning * into v_attempt;

  insert into practical_events (attempt_id, type) values (v_attempt.id, 'join');

  return jsonb_build_object('ok', true, 'attempt_token', v_token, 'state', public.practical_attempt_state(v_attempt));
end;
$$;

-- odczyt stanu (poczekalnia, wznowienie po odświeżeniu, synchronizacja czasu)
create or replace function public.practical_state(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
begin
  select * into v_attempt from practical_attempts where attempt_token_hash = public.practical_token_hash(p_token);
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;
  return public.practical_attempt_state(v_attempt);
end;
$$;

-- autozapis plików ucznia
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
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'already_submitted' using errcode = '22023';
  end if;

  select * into v_session from practical_sessions where id = v_attempt.session_id;
  if v_session.status <> 'active' then
    raise exception 'session_not_active' using errcode = '22023';
  end if;
  -- 30 s marginesu na opóźnienia sieci
  if v_session.ends_at is not null and now() > v_session.ends_at + interval '30 seconds' then
    raise exception 'time_up' using errcode = '22023';
  end if;

  if not public.practical_files_valid(p_files) then
    raise exception 'invalid_files' using errcode = '22023';
  end if;

  -- przy allow_new_files = false nazwy plików muszą pochodzić z zadania
  select * into v_task from practical_tasks where id = v_session.task_id;
  if not v_task.allow_new_files then
    for v_name in select f->>'name' from jsonb_array_elements(p_files) f loop
      if not exists (select 1 from jsonb_array_elements(v_task.files) tf where tf->>'name' = v_name) then
        raise exception 'unexpected_file' using errcode = '22023';
      end if;
    end loop;
  end if;

  update practical_attempts set files = p_files, last_saved_at = now() where id = v_attempt.id;
  return jsonb_build_object('ok', true, 'saved_at', now(), 'server_now', now(), 'ends_at', v_session.ends_at);
end;
$$;

-- zdarzenia nadzoru: zmiana karty, wyjście z pełnego ekranu, duże wklejenie
create or replace function public.practical_event(p_token text, p_type text, p_details jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_events int;
begin
  if p_type not in ('start','tab_hidden','fullscreen_exit','large_paste','autosave_error') then
    raise exception 'invalid_event' using errcode = '22023';
  end if;

  select * into v_attempt from practical_attempts
  where attempt_token_hash = public.practical_token_hash(p_token) for update;
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;

  -- limit zdarzeń na podejście (ochrona przed zalewaniem bazy)
  select count(*) into v_events from practical_events where attempt_id = v_attempt.id;
  if v_events >= 500 then
    return jsonb_build_object('ok', true, 'capped', true,
      'tab_switch_count', v_attempt.tab_switch_count, 'large_paste_count', v_attempt.large_paste_count);
  end if;

  insert into practical_events (attempt_id, type, details)
  values (v_attempt.id, p_type, coalesce(p_details, '{}'::jsonb));

  -- liczniki prowadzi serwer, nie przeglądarka
  if p_type in ('tab_hidden', 'fullscreen_exit') then
    update practical_attempts set tab_switch_count = tab_switch_count + 1
    where id = v_attempt.id returning * into v_attempt;
  elsif p_type = 'large_paste' then
    update practical_attempts set large_paste_count = large_paste_count + 1
    where id = v_attempt.id returning * into v_attempt;
  end if;

  return jsonb_build_object(
    'ok', true,
    'tab_switch_count', v_attempt.tab_switch_count,
    'large_paste_count', v_attempt.large_paste_count,
    -- druga zmiana karty = koniec pracy
    'should_end', v_attempt.tab_switch_count >= 2
  );
end;
$$;

-- oddanie pracy
create or replace function public.practical_submit(p_token text, p_files jsonb, p_reason text default 'completed')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_session practical_sessions%rowtype;
  v_reason text;
begin
  select * into v_attempt from practical_attempts
  where attempt_token_hash = public.practical_token_hash(p_token) for update;
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;
  if v_attempt.status <> 'in_progress' then
    -- już oddane: zwracamy token wyniku, bez nadpisywania pracy
    return jsonb_build_object('ok', true, 'already', true, 'result_token', v_attempt.result_token);
  end if;

  select * into v_session from practical_sessions where id = v_attempt.session_id;
  v_reason := case when p_reason in ('completed','time_up','tab_switch','teacher_ended') then p_reason else 'completed' end;

  -- po czasie zapisujemy ostatni poprawny autozapis i oznaczamy jako time_up
  if v_session.ends_at is not null and now() > v_session.ends_at + interval '30 seconds' then
    v_reason := case when v_reason = 'teacher_ended' then v_reason else 'time_up' end;
  elsif p_files is not null and public.practical_files_valid(p_files) then
    update practical_attempts set files = p_files where id = v_attempt.id;
  end if;

  update practical_attempts
  set status = 'submitted', submitted_at = now(), ended_reason = v_reason, last_saved_at = now()
  where id = v_attempt.id
  returning * into v_attempt;

  insert into practical_events (attempt_id, type, details)
  values (v_attempt.id, 'submit', jsonb_build_object('reason', v_reason));

  return jsonb_build_object('ok', true, 'result_token', v_attempt.result_token, 'ended_reason', v_reason);
end;
$$;

-- strona wyniku ucznia (dostęp tylko z tokenem wyniku)
create or replace function public.practical_result(p_result_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_task practical_tasks%rowtype;
  v_session practical_sessions%rowtype;
begin
  select * into v_attempt from practical_attempts where result_token = p_result_token;
  if not found then
    raise exception 'result_not_found' using errcode = 'P0002';
  end if;

  select * into v_session from practical_sessions where id = v_attempt.session_id;
  select * into v_task from practical_tasks where id = v_session.task_id;

  if v_attempt.published_at is null then
    return jsonb_build_object(
      'published', false,
      'student_name', v_attempt.student_name,
      'task_title', v_task.title,
      'submitted_at', v_attempt.submitted_at
    );
  end if;

  return jsonb_build_object(
    'published', true,
    'student_name', v_attempt.student_name,
    'task_title', v_task.title,
    'submitted_at', v_attempt.submitted_at,
    'ended_reason', v_attempt.ended_reason,
    'final_percent', v_attempt.final_percent,
    'pass_threshold', v_session.pass_threshold,
    'passed', coalesce(v_attempt.final_percent, 0) >= v_session.pass_threshold,
    'teacher_comment', v_attempt.teacher_comment,
    'files', v_attempt.files,
    -- tylko nazwa, punkty i komunikat — bez parametrów testu
    'tests', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', r->>'id',
        'name', coalesce((select t->>'name' from jsonb_array_elements(v_task.auto_tests) t where t->>'id' = r->>'id'), r->>'id'),
        'passed', coalesce((select (o->>'passed')::boolean from jsonb_array_elements(v_attempt.overrides) o where o->>'id' = r->>'id'), (r->>'passed')::boolean),
        'points', coalesce((select (o->>'points')::numeric from jsonb_array_elements(v_attempt.overrides) o where o->>'id' = r->>'id'), (r->>'points')::numeric),
        'max_points', coalesce((select (t->>'points')::numeric from jsonb_array_elements(v_task.auto_tests) t where t->>'id' = r->>'id'), 0),
        'message', r->>'message'
      ) order by r->>'id'), '[]'::jsonb)
      from jsonb_array_elements(v_attempt.auto_results) r
    ),
    'criteria', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c->>'id',
        'name', c->>'name',
        'description', c->>'description',
        'max_points', (c->>'points')::numeric,
        'points', coalesce((select (m->>'points')::numeric from jsonb_array_elements(v_attempt.manual_scores) m where m->>'id' = c->>'id'), 0)
      )), '[]'::jsonb)
      from jsonb_array_elements(v_task.manual_criteria) c
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Funkcje nauczyciela
-- -----------------------------------------------------------------------------

-- utworzenie sesji z niepowtarzalnym PIN-em
create or replace function public.practical_create_session(
  p_task_id uuid,
  p_class text,
  p_minutes int,
  p_allow_paste boolean default true,
  p_pass_threshold int default 75
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pin text;
  v_id uuid;
  v_task practical_tasks%rowtype;
  i int;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  select * into v_task from practical_tasks where id = p_task_id;
  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;
  if not v_task.is_ready then
    raise exception 'task_not_ready' using errcode = '22023';
  end if;
  if p_class not in ('2a','4e','4d') then
    raise exception 'invalid_class' using errcode = '22023';
  end if;
  if p_minutes is null or p_minutes not between 5 and 300 then
    raise exception 'invalid_minutes' using errcode = '22023';
  end if;
  if p_pass_threshold is null or p_pass_threshold not between 1 and 100 then
    raise exception 'invalid_threshold' using errcode = '22023';
  end if;

  for i in 1 .. 20 loop
    v_pin := public.random_pin();
    begin
      insert into practical_sessions (task_id, class_name, pin, minutes, allow_paste, pass_threshold, created_by)
      values (p_task_id, p_class, v_pin, p_minutes, coalesce(p_allow_paste, true), p_pass_threshold, auth.uid())
      returning id into v_id;
      return jsonb_build_object('id', v_id, 'pin', v_pin);
    exception when unique_violation then
      -- PIN zajęty przez inną trwającą sesję — losujemy ponownie
      null;
    end;
  end loop;

  raise exception 'pin_generation_failed' using errcode = '55000';
end;
$$;

-- start sesji: czas serwera, wspólny dla wszystkich
create or replace function public.practical_start_session(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_session practical_sessions%rowtype;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  update practical_sessions
  set status = 'active', started_at = now(), ends_at = now() + make_interval(mins => minutes)
  where id = p_session_id and status = 'lobby'
  returning * into v_session;
  if not found then
    raise exception 'session_not_in_lobby' using errcode = '22023';
  end if;
  return jsonb_build_object('started_at', v_session.started_at, 'ends_at', v_session.ends_at);
end;
$$;

-- zakończenie sesji: wymusza oddanie prac, które są jeszcze w toku
create or replace function public.practical_finish_session(p_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_forced int;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

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

-- procent końcowy: punkty automatyczne (po korektach) + ręczne / maksimum
create or replace function public.practical_recalc(p_attempt_id uuid)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_task practical_tasks%rowtype;
  v_auto numeric := 0;
  v_manual numeric := 0;
  v_max_auto numeric := 0;
  v_max_manual numeric := 0;
  v_percent numeric;
begin
  select * into v_attempt from practical_attempts where id = p_attempt_id;
  if not found then
    raise exception 'attempt_not_found' using errcode = 'P0002';
  end if;
  select t.* into v_task from practical_tasks t
  join practical_sessions s on s.task_id = t.id
  where s.id = v_attempt.session_id;

  select coalesce(sum((t->>'points')::numeric), 0) into v_max_auto
  from jsonb_array_elements(v_task.auto_tests) t;
  select coalesce(sum((c->>'points')::numeric), 0) into v_max_manual
  from jsonb_array_elements(v_task.manual_criteria) c;

  -- korekta nauczyciela ma pierwszeństwo przed wynikiem automatu
  select coalesce(sum(
    least(
      greatest(coalesce(
        (select (o->>'points')::numeric from jsonb_array_elements(v_attempt.overrides) o where o->>'id' = t->>'id'),
        (select (r->>'points')::numeric from jsonb_array_elements(v_attempt.auto_results) r where r->>'id' = t->>'id'),
        0), 0),
      (t->>'points')::numeric)
  ), 0) into v_auto
  from jsonb_array_elements(v_task.auto_tests) t;

  select coalesce(sum(
    least(greatest(coalesce(
      (select (m->>'points')::numeric from jsonb_array_elements(v_attempt.manual_scores) m where m->>'id' = c->>'id'),
      0), 0), (c->>'points')::numeric)
  ), 0) into v_manual
  from jsonb_array_elements(v_task.manual_criteria) c;

  if v_max_auto + v_max_manual <= 0 then
    v_percent := 0;
  else
    v_percent := round((v_auto + v_manual) / (v_max_auto + v_max_manual) * 100, 1);
  end if;

  update practical_attempts set final_percent = v_percent where id = p_attempt_id;
  return v_percent;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Uprawnienia do funkcji
-- -----------------------------------------------------------------------------

revoke all on function public.practical_join(text, text) from public;
revoke all on function public.practical_state(text) from public;
revoke all on function public.practical_save(text, jsonb) from public;
revoke all on function public.practical_event(text, text, jsonb) from public;
revoke all on function public.practical_submit(text, jsonb, text) from public;
revoke all on function public.practical_result(text) from public;
revoke all on function public.practical_create_session(uuid, text, int, boolean, int) from public, anon;
revoke all on function public.practical_start_session(uuid) from public, anon;
revoke all on function public.practical_finish_session(uuid) from public, anon;
revoke all on function public.practical_recalc(uuid) from public, anon;
revoke all on function public.practical_new_token() from public, anon;
revoke all on function public.practical_token_hash(text) from public, anon;

grant execute on function public.practical_join(text, text) to anon, authenticated;
grant execute on function public.practical_state(text) to anon, authenticated;
grant execute on function public.practical_save(text, jsonb) to anon, authenticated;
grant execute on function public.practical_event(text, text, jsonb) to anon, authenticated;
grant execute on function public.practical_submit(text, jsonb, text) to anon, authenticated;
grant execute on function public.practical_result(text) to anon, authenticated;
grant execute on function public.practical_create_session(uuid, text, int, boolean, int) to authenticated;
grant execute on function public.practical_start_session(uuid) to authenticated;
grant execute on function public.practical_finish_session(uuid) to authenticated;
grant execute on function public.practical_recalc(uuid) to authenticated;
