-- =============================================================================
-- 026_praktyka_typy_testow.sql — nowe typy testów automatycznych w Praktyce
--
-- Uruchom po 025_przedmioty_inf03.sql.
--
-- Do dotychczasowych siedmiu typów dochodzi siedem:
--
--   images_alt         każdy obrazek ma niepusty alt
--   form_labels        każde pole formularza ma etykietę
--   heading_structure  jeden h1 i brak przeskoków poziomów nagłówków
--   css_media          reguły @media z warunkiem szerokości (RWD)
--   links_valid        linki do plików projektu prowadzą do istniejących plików
--   no_js_errors       strona wczytuje się bez błędów JavaScript
--   file_content       zawartość (lub brak) tekstu w źródle pliku
--
-- Baza sprawdza tylko kształt wspólny (id, nazwa, punkty, znany typ) — parametry
-- poszczególnych testów waliduje formularz w panelu, a wykonuje je przeglądarka
-- nauczyciela. Funkcja jest powtarzalna; CHECK na practical_tasks.auto_tests
-- wskazuje ją po nazwie, więc nie trzeba go zakładać od nowa.
-- =============================================================================

do $$
begin
  if to_regclass('public.practical_tasks') is null then
    raise exception 'Brakuje migracji 006_practical.sql — uruchom migracje po kolei przed 026.';
  end if;
end $$;

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
      'links_valid','no_js_errors','file_content'
    ) then return false; end if;
    if jsonb_typeof(item->'points') is distinct from 'number' then return false; end if;
    if (item->>'points')::numeric not between 0 and 100 then return false; end if;
  end loop;

  select count(distinct item2->>'id') into n_ids from jsonb_array_elements(p_tests) item2;
  return n_ids = n;
end;
$$;
