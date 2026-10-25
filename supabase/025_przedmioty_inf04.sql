-- =============================================================================
-- 025_przedmioty_inf04.sql — trzy przedmioty INF.04 w tabeli Nauczyciele
--
-- Uruchom po 024_inf04_ai.sql.
--
-- Dokłada do tabeli `subjects` (sekcja Nauczyciele w panelu) trzy kolumny:
--
--   Tworzenie stron i aplikacji internetowych
--   Aplikacje desktopowe i mobilne
--   Programowanie strukturalne i obiektowe
--
-- i przypisuje im działy mapy INF.04 przez categories.subject_id, żeby po
-- kliknięciu w nagłówek kolumny było widać, co się na przedmiocie realizuje.
-- Nic nie jest kopiowane: dział należy do jednego przedmiotu, a mapa ucznia
-- zostaje taka, jaka była.
--
-- Przypisujemy tylko działy bez przedmiotu — jeśli nauczyciel przestawił coś
-- w panelu, ponowne uruchomienie tego nie cofnie. Działy, które nie pasują do
-- żadnego z trzech przedmiotów (BHP, język obcy, kompetencje, zespół, testowanie,
-- egzamin, AI), zostają bez przedmiotu.
-- =============================================================================

do $$
begin
  if to_regclass('public.subjects') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'categories' and column_name = 'subject_id') then
    raise exception 'Brakuje migracji 022_przedmioty_nauczyciele.sql — uruchom migracje po kolei przed 025.';
  end if;
end $$;

-- Pozycje od 7 w górę: tabela w panelu sortuje po samej pozycji, więc przedmioty
-- INF.04 (numerowane osobno od migracji 022) lądują za sześcioma przedmiotami INF.03.
insert into subjects (id, title, position, qualification) values
  ('p-tworzenie-stron',      'Tworzenie stron i aplikacji internetowych', 7, 'inf04'),
  ('p-desktop-mobile',       'Aplikacje desktopowe i mobilne',            8, 'inf04'),
  ('p-strukturalne-obiektowe','Programowanie strukturalne i obiektowe',   9, 'inf04')
on conflict (id) do nothing;

update categories set subject_id = v.subject
from (values
  ('inf04-web',           'p-tworzenie-stron'),
  ('inf04-desktop',       'p-desktop-mobile'),
  ('inf04-mobile',        'p-desktop-mobile'),
  ('inf04-projektowanie', 'p-strukturalne-obiektowe'),
  ('inf04-oop',           'p-strukturalne-obiektowe'),
  ('inf04-cpp',           'p-strukturalne-obiektowe'),
  ('inf04-java',          'p-strukturalne-obiektowe')
) as v(id, subject)
where categories.id = v.id and categories.subject_id is null;
