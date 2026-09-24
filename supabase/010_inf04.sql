-- =============================================================================
-- 010_inf04.sql — druga kwalifikacja (INF.04) w tej samej aplikacji
--
-- Uruchom po 009_server_clock.sql, przed 011_inf04_seed.sql.
--
-- Założenie: jeden kod i jedna baza obsługują obie kwalifikacje. Klasa decyduje,
-- co uczeń widzi — 2a/4e/4d uczą się INF.03, 4a/4g INF.04. Dzięki temu poprawka
-- bezpieczeństwa robiona raz działa dla obu, zamiast żyć w dwóch kopiach repo.
--
-- Zmiany:
--  1. tabela classes — lista klas i ich kwalifikacja (koniec z listą w CHECK-ach)
--  2. kolumna qualification w categories i tests
--  3. pozycje kategorii unikalne w obrębie kwalifikacji, nie globalnie
--  4. create_test przyjmuje kwalifikację
--  5. practical_create_session waliduje klasę po tabeli classes
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Sprawdzenie kolejności
--
-- Ta migracja korzysta z tabel i funkcji z wcześniejszych plików. Zamiast
-- niejasnego „function public.is_admin() does not exist” mówimy wprost, czego
-- brakuje i co uruchomić.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.categories') is null then
    raise exception 'Brakuje podstawowego schematu. Uruchom najpierw supabase/schema.sql, potem 002_test_pin.sql i kolejne migracje po numerach.';
  end if;
  if to_regclass('public.subtopic_links') is null then
    raise exception 'Brakuje migracji 003_subtopic_links.sql. Uruchom migracje po kolei: 003, 004, 005, 006, 007, 008, 009, dopiero potem 010.';
  end if;
  if to_regclass('public.practical_sessions') is null then
    raise exception 'Brakuje migracji 006_practical.sql. Uruchom migracje po kolei: 006, 007, 008, 009, dopiero potem 010.';
  end if;
  if to_regproc('public.is_admin') is null then
    raise exception 'Brakuje migracji 008_security_hardening.sql (to ona tworzy tabele admins i funkcje is_admin). Uruchom 008, potem 009, dopiero potem 010.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Klasy
-- -----------------------------------------------------------------------------
create table if not exists classes (
  name text primary key check (name ~ '^[1-5][a-z]$'),
  qualification text not null check (qualification in ('inf03', 'inf04')),
  position int not null check (position between 1 and 99)
);

insert into classes (name, qualification, position) values
  ('2a', 'inf03', 1),
  ('4e', 'inf03', 2),
  ('4d', 'inf03', 3),
  ('4a', 'inf04', 4),
  ('4g', 'inf04', 5)
on conflict (name) do nothing;

alter table classes enable row level security;

do $$
begin
  create policy "public read classes" on classes for select using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin write classes" on classes for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

grant select on classes to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Klasa musi istnieć w tabeli classes (zamiast sztywnej listy w CHECK)
--
-- Dopisanie kolejnej klasy to od teraz jeden insert, a nie migracja zmieniająca
-- CHECK-i w kilku tabelach.
-- -----------------------------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select conname, conrelid::regclass::text as tbl
    from pg_constraint
    where contype = 'c'
      and conrelid in ('progress'::regclass, 'practical_sessions'::regclass)
      and pg_get_constraintdef(oid) like '%class_name%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

do $$
begin
  alter table progress add constraint progress_class_fk
    foreign key (class_name) references classes(name) on update cascade;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table practical_sessions add constraint practical_sessions_class_fk
    foreign key (class_name) references classes(name) on update cascade;
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Kwalifikacja przy treściach
--
-- default 'inf03' — wszystko, co już jest w bazie, należy do INF.03.
-- -----------------------------------------------------------------------------
alter table categories add column if not exists qualification text not null default 'inf03';
alter table tests add column if not exists qualification text not null default 'inf03';

do $$
begin
  alter table categories add constraint categories_qualification_check
    check (qualification in ('inf03', 'inf04'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table tests add constraint tests_qualification_check
    check (qualification in ('inf03', 'inf04'));
exception when duplicate_object then null;
end $$;

-- Pozycja porządkuje kategorie wewnątrz kwalifikacji — obie mogą mieć „1”.
alter table categories drop constraint if exists categories_position_key;
create unique index if not exists categories_qualification_position_idx
  on categories (qualification, position);

create index if not exists tests_qualification_idx on tests (qualification, created_at desc);

-- Uczeń czyta kwalifikację testu (filtr listy), ale nadal nie widzi pytań.
grant select (qualification) on tests to anon;

do $$
begin
  alter publication supabase_realtime drop table tests;
exception when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table tests
    (id, title, time_limit, qualification, created_at);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table classes;
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 4. create_test z kwalifikacją
--
-- Stara, 5-argumentowa wersja znika: przeciążenie z domyślnym argumentem
-- powodowałoby „function is not unique” przy wywołaniu z pięcioma parametrami.
-- -----------------------------------------------------------------------------
drop function if exists public.create_test(text, int, jsonb, jsonb, text);

create or replace function public.create_test(
  p_title text,
  p_time_limit int,
  p_questions jsonb,
  p_keys jsonb,
  p_pin text default null,
  p_qualification text default 'inf03'
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

  if p_qualification is null or p_qualification not in ('inf03', 'inf04') then
    raise exception 'invalid_qualification' using errcode = '22023';
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

  insert into tests (title, time_limit, questions, qualification, created_by)
  values (p_title, p_time_limit, p_questions, p_qualification, auth.uid())
  returning id into v_id;

  insert into test_keys (test_id, answers, pin) values (v_id, p_keys, v_pin);
  return jsonb_build_object('id', v_id, 'pin', v_pin);
end;
$$;

revoke all on function public.create_test(text, int, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.create_test(text, int, jsonb, jsonb, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Sesja praktyczna: klasa sprawdzana po tabeli, nie po liście w kodzie
-- -----------------------------------------------------------------------------
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
  if not exists (select 1 from classes where name = p_class) then
    raise exception 'invalid_class' using errcode = '22023';
  end if;
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
