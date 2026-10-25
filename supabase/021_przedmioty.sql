-- =============================================================================
-- 021_przedmioty.sql — trzy przedmioty zawodowe jako kolejne „kwalifikacje"
--
-- Uruchom po 020_gaps_questions.sql.
--
--   tsai — Tworzenie stron i aplikacji internetowych
--   adm  — Aplikacje desktopowe i mobilne
--   psio — Programowanie strukturalne i obiektowe
--
-- Wszystkie trzy obracają się wokół programowania aplikacji, więc nie piszemy
-- treści od nowa: kategorie, podtematy i materiały są KOPIAMI działów INF.03
-- i INF.04 (nowe identyfikatory z prefiksem przedmiotu). Kopia żyje własnym
-- życiem — nauczyciel poprawia ją w panelu, nie ruszając oryginału.
--
-- Zmiany:
--  1. CHECK-i na kolumnie qualification (categories, tests, classes)
--  2. create_test przyjmuje nowe wartości
--  3. kopie kategorii, podtematów i materiałów
--
-- Klasy zostają bez zmian: postęp jest zapisywany per klasa i podtemat, więc
-- dowolna klasa może przerabiać dowolny przedmiot (przełącznik na mapie nauki).
-- =============================================================================

do $$
begin
  if to_regclass('public.classes') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'categories' and column_name = 'qualification') then
    raise exception 'Brakuje migracji 010_inf04.sql — uruchom migracje po kolei przed 021.';
  end if;
  if to_regproc('public.gaps_count') is null then
    raise exception 'Brakuje migracji 020_gaps_questions.sql (create_test jest tam przepisywany) — uruchom ją przed 021.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Dozwolone wartości kwalifikacji
-- -----------------------------------------------------------------------------
do $$
declare c record;
begin
  for c in
    select conname, conrelid::regclass::text as tbl
    from pg_constraint
    where contype = 'c'
      and conrelid in ('categories'::regclass, 'tests'::regclass, 'classes'::regclass)
      and pg_get_constraintdef(oid) like '%qualification%'
      and pg_get_constraintdef(oid) like '%inf03%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

alter table categories add constraint categories_qualification_check
  check (qualification in ('inf03', 'inf04', 'tsai', 'adm', 'psio'));
alter table tests add constraint tests_qualification_check
  check (qualification in ('inf03', 'inf04', 'tsai', 'adm', 'psio'));
alter table classes add constraint classes_qualification_check
  check (qualification in ('inf03', 'inf04', 'tsai', 'adm', 'psio'));

-- -----------------------------------------------------------------------------
-- 2. create_test — ta sama funkcja co w 020, z szerszą listą kwalifikacji
-- -----------------------------------------------------------------------------
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
  v_id uuid; v_pin text; i int; j int; q jsonb; k jsonb; kg jsonb; v text; n_same int;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_qualification is null or p_qualification not in ('inf03', 'inf04', 'tsai', 'adm', 'psio') then
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

    elsif q->>'type' = 'gaps' then
      -- jedna pozycja klucza na lukę, w każdej 1–5 wariantów odpowiedzi
      if jsonb_array_length(k) <> public.gaps_count(q->>'code') then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      for j in 0 .. jsonb_array_length(k) - 1 loop
        kg := k -> j;
        if jsonb_typeof(kg) <> 'array' then raise exception 'invalid_keys' using errcode = '22023'; end if;
        if jsonb_array_length(kg) not between 1 and 5 then raise exception 'invalid_keys' using errcode = '22023'; end if;
        for v in select * from jsonb_array_elements_text(kg) loop
          if v is null or char_length(btrim(v)) not between 1 and 100 then
            raise exception 'invalid_keys' using errcode = '22023';
          end if;
        end loop;
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
-- 3. Kopie treści
--
-- Plan kopiowania: z której kategorii, do jakiego przedmiotu, na której pozycji.
--  tsai — całość INF.03 (HTML, JS, PHP, SQL, serwer, CMS, bezpieczeństwo,
--         dokumentacja) oraz React i praca z Gitem z INF.04
--  adm  — C#, WinForms/WPF, .NET MAUI, Java okienkowa, testowanie, Git
--  psio — algorytmy, C#, C++ (teoria i praktyka), Java, testowanie
--
-- Powtarzalne: on conflict / not exists, więc drugie uruchomienie nic nie dubluje.
-- -----------------------------------------------------------------------------
-- Całość w jednym bloku DO: SQL Editor w Supabase wykonuje polecenia przez
-- pulę połączeń, więc tabela tymczasowa z jednego polecenia znikała przed
-- następnym ("relation _kopie does not exist"). Zmienna w plpgsql tego nie ma.
do $$
declare
  v_plan jsonb := '[
    ["tsai", "tsai-", "html-css",             1],
    ["tsai", "tsai-", "javascript",           2],
    ["tsai", "tsai-", "php",                  3],
    ["tsai", "tsai-", "sql",                  4],
    ["tsai", "tsai-", "serwer",               5],
    ["tsai", "tsai-", "cms",                  6],
    ["tsai", "tsai-", "bezpieczenstwo",       7],
    ["tsai", "tsai-", "dokumentacja",         8],
    ["tsai", "tsai-", "inf04-web",            9],
    ["tsai", "tsai-", "inf04-zespol",        10],

    ["adm",  "adm-",  "inf04-oop",            1],
    ["adm",  "adm-",  "inf04-desktop",        2],
    ["adm",  "adm-",  "inf04-mobile",         3],
    ["adm",  "adm-",  "inf04-java",           4],
    ["adm",  "adm-",  "inf04-testowanie",     5],
    ["adm",  "adm-",  "inf04-zespol",         6],

    ["psio", "psio-", "inf04-projektowanie",  1],
    ["psio", "psio-", "inf04-oop",            2],
    ["psio", "psio-", "cpp",                  3],
    ["psio", "psio-", "inf04-cpp",            4],
    ["psio", "psio-", "inf04-java",           5],
    ["psio", "psio-", "inf04-testowanie",     6]
  ]'::jsonb;
  v_row jsonb;
  v_kwal text; v_prefix text; v_src text; v_pos int;
  v_brak text;
begin
  -- Brakujące źródło = błąd z nazwą, a nie po cichu pusty przedmiot.
  select string_agg(distinct e.value ->> 2, ', ') into v_brak
  from jsonb_array_elements(v_plan) e
  where not exists (select 1 from categories c where c.id = e.value ->> 2);
  if v_brak is not null then
    raise exception 'Migracja 021: brakuje kategorii do skopiowania: %. Uruchom migracje 011 i 016 przed 021.', v_brak;
  end if;

  for v_row in select value from jsonb_array_elements(v_plan) loop
    v_kwal := v_row ->> 0;
    v_prefix := v_row ->> 1;
    v_src := v_row ->> 2;
    v_pos := (v_row ->> 3)::int;

    insert into categories (id, position, title, description, qualification)
    select v_prefix || c.id,
           v_pos,
           c.title,
           -- numer jednostki INF.04.x na końcu opisu nie ma sensu w przedmiocie
           regexp_replace(c.description, '\s*\(INF\.04\.[^)]*\)\s*$', ''),
           v_kwal
    from categories c
    where c.id = v_src
    on conflict (id) do nothing;

    insert into subtopics (id, category_id, position, title, theory_url, tasks_url)
    select v_prefix || s.id, v_prefix || s.category_id, s.position, s.title, s.theory_url, s.tasks_url
    from subtopics s
    where s.category_id = v_src
    on conflict (id) do nothing;

    insert into subtopic_links (subtopic_id, label, url, sort_order)
    select v_prefix || l.subtopic_id, l.label, l.url, l.sort_order
    from subtopics s
    join subtopic_links l on l.subtopic_id = s.id
    where s.category_id = v_src
      and not exists (
        select 1 from subtopic_links x
        where x.subtopic_id = v_prefix || l.subtopic_id and x.url = l.url);
  end loop;
end $$;
