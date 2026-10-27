-- =============================================================================
-- 037_praktyka_react.sql — zadania praktyczne w Reakcie
--
-- Uruchom po 018_attempt_answers.sql.
--
-- Trzy zmiany, wszystkie w warstwie zadania:
--
--   1. pliki `.jsx` — uczeń pisze komponenty, nie same skrypty
--   2. `practical_tasks.runtime` — 'html' (jak dotąd) albo 'react'
--   3. typ testu `source_matches` — sprawdzenie kodu źródłowego pracy
--
-- Dlaczego `runtime` jest kolumną, a nie zgadywaniem po rozszerzeniach plików:
-- od niego zależy sposób uruchamiania testów. Przy zadaniach HTML/CSS/JS testy
-- strukturalne biegną z WYŁĄCZONYM skryptem ucznia (nie ma jak podmienić DOM
-- ani podszyć się pod wynik). Strona reactowa bez skryptu to pusty <div>, więc
-- tam ta sztuczka nie przejdzie i testy muszą działać po zamontowaniu aplikacji.
-- To świadome ustępstwo: dla zadań reactowych integralność spada do poziomu
-- testów `interaction` (jeden wynik na test, sprawdzanie w przeglądarce
-- nauczyciela, uczeń nie widzi rezultatu). Zadania HTML/CSS/JS zostają bez zmian,
-- dlatego nie chcemy tego trybu „przez przypadek” — musi być wpisany w zadaniu.
--
-- Po co `source_matches`: „czy uczeń stworzył komponent”, „czy użył useState”,
-- „czy nie grzebał w DOM ręcznie” NIE jest widoczne w wyrenderowanym HTML-u.
-- Ten test sprawdza treść pliku i tyle dowodzi — że tekst tam jest, nie że jest
-- użyty poprawnie. Technikę dalej ocenia nauczyciel kryterium ręcznym.
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'practical_tasks') then
    raise exception 'Brakuje migracji 006_practical.sql — uruchom migracje po kolei przed 037.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Pliki .jsx
-- -----------------------------------------------------------------------------
-- Rozszerzenia bez zmian poza dodaniem jsx: nadal bez ścieżek i bez plików
-- wykonywalnych. Nazwy komponentów zwykle pisze się z wielkiej litery
-- (Lista.jsx), co obecny wzorzec już dopuszcza.

create or replace function public.practical_filename_valid(p_name text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_name ~ '^[A-Za-z0-9_-]{1,40}\.(html|css|js|jsx|txt)$';
$$;

-- -----------------------------------------------------------------------------
-- 2. Tryb uruchamiania zadania
-- -----------------------------------------------------------------------------

alter table practical_tasks add column if not exists runtime text not null default 'html';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'practical_tasks_runtime_check') then
    alter table practical_tasks add constraint practical_tasks_runtime_check
      check (runtime in ('html', 'react'));
  end if;
end $$;

comment on column practical_tasks.runtime is
  'html = strona statyczna (testy strukturalne bez JS ucznia), react = aplikacja '
  'montowana skryptem (testy strukturalne po zamontowaniu). Patrz migracja 037.';

-- -----------------------------------------------------------------------------
-- 3. Typ testu source_matches
-- -----------------------------------------------------------------------------
-- Walidacja jak przy pozostałych typach — plus pola własne tego typu, bo
-- nieznany tryb dopasowania cicho przepuszczałby test, który nigdy nie zalicza.
--
-- Lista typów to lista z 026 powiększona o jeden wpis. `create or replace`
-- nadpisuje całą funkcję, więc pominięcie tam czegokolwiek skasowałoby typy
-- z 026 i unieważniło istniejące zadania — blok kontrolny na końcu pliku złapałby
-- to dopiero jako błąd migracji.

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
      'css_computed','html_lang_doctype','interaction',
      'images_alt','form_labels','heading_structure','css_media',
      'links_valid','no_js_errors','file_content','source_matches'
    ) then return false; end if;
    if jsonb_typeof(item->'points') is distinct from 'number' then return false; end if;
    if (item->>'points')::numeric not between 0 and 100 then return false; end if;

    if item->>'type' = 'source_matches' then
      if not public.practical_filename_valid(coalesce(item->>'file', '')) then return false; end if;
      if coalesce(item->>'mode', '') not in ('contains','not_contains','regex') then return false; end if;
      if char_length(coalesce(item->>'value', '')) not between 1 and 500 then return false; end if;
    end if;
  end loop;

  select count(distinct item2->>'id') into n_ids from jsonb_array_elements(p_tests) item2;
  return n_ids = n;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Tryb zadania w obrazie dla ucznia
-- -----------------------------------------------------------------------------
-- Uczeń ma w IDE podgląd na żywo, więc jego przeglądarka musi wiedzieć, czy
-- składać stronę statycznie, czy montować aplikację reactową. To jedyna nowa
-- informacja — rozwiązanie wzorcowe i parametry testów dalej zostają po stronie
-- nauczyciela.

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
    'runtime', p_task.runtime,
    -- nazwy testów bez parametrów — tylko gdy zadanie na to pozwala
    'test_names', case when p_task.student_can_run_tests then (
        select coalesce(jsonb_agg(jsonb_build_object('id', t->>'id', 'name', t->>'name')), '[]'::jsonb)
        from jsonb_array_elements(p_task.auto_tests) t)
      else '[]'::jsonb end
  );
$$;

-- -----------------------------------------------------------------------------
-- 5. Tryb zadania w obrazie dla ćwiczeń (gdy wgrana jest migracja 029)
-- -----------------------------------------------------------------------------
-- Tryb ćwiczeniowy składa stronę w przeglądarce ucznia tym samym kodem co egzamin,
-- więc bez `runtime` zadanie reactowe pokazałoby mu pusty <div id="root">.
-- Całość jest warunkowa, bo 029 i 032 wdrażają się niezależnie — bez kolumny
-- `practice` ta funkcja po prostu jeszcze nie istnieje.

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'practical_tasks' and column_name = 'practice') then
    execute $fn$
      create or replace function public.practical_practice_task(p_task_id uuid)
      returns jsonb
      language plpgsql
      stable
      security definer
      set search_path = public
      as $body$
      declare
        v practical_tasks%rowtype;
      begin
        select * into v from practical_tasks where id = p_task_id and practice and is_ready;
        if not found then
          raise exception 'task_not_found' using errcode = 'P0002';
        end if;

        return jsonb_build_object(
          'id', v.id,
          'title', v.title,
          'summary', v.summary,
          'content_md', v.content_md,
          'files', v.files,
          'allow_new_files', v.allow_new_files,
          'runtime', v.runtime,
          'auto_tests', v.auto_tests,
          'criteria', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'name', c->>'name',
              'description', c->>'description',
              'points', (c->>'points')::numeric
            )), '[]'::jsonb)
            from jsonb_array_elements(v.manual_criteria) c
          )
        );
      end;
      $body$;
    $fn$;

    revoke all on function public.practical_practice_task(uuid) from public;
    grant execute on function public.practical_practice_task(uuid) to anon, authenticated;
  end if;
end $$;

-- Istniejące zadania muszą przejść nową walidację — gdyby któreś miało wpis
-- niezgodny z regułami, CHECK odrzuciłby dopiero najbliższy zapis i nauczyciel
-- zobaczyłby błąd przy edycji zupełnie innego pola. Lepiej dowiedzieć się teraz.
do $$
declare
  v_zle int;
begin
  select count(*) into v_zle from practical_tasks
  where not public.practical_tests_valid(auto_tests)
     or not public.practical_files_valid(files)
     or not public.practical_files_valid(reference_files);
  if v_zle > 0 then
    raise exception 'Migracja 032: % zadan nie przechodzi nowej walidacji — sprawdz je przed dalszymi zmianami.', v_zle;
  end if;
end $$;
