-- =============================================================================
-- 013_progress_author_fix.sql — poprawka stemplowania autora
--
-- Uruchom po 012_progress_author.sql.
--
-- Dwie rzeczy:
--  1. Trigger z 012 nadpisywał marked_by ZAWSZE, także gdy zapis szedł z SQL
--     Editora (tam auth.uid() jest puste) — przez co nie dało się uzupełnić
--     autorów przy wpisach sprzed migracji. Teraz stempluje tylko wtedy, gdy
--     ktoś jest zalogowany; bez tokenu zostawia wartość podaną w zapytaniu.
--     Bezpieczeństwa to nie rusza: przez API bez tokenu i tak nic nie zapiszesz,
--     bo polityka RLS na progress wymaga is_admin().
--  2. Gotowy sposób na uzupełnienie starych wpisów (na końcu pliku).
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'progress' and column_name = 'marked_by') then
    raise exception 'Brakuje migracji 012_progress_author.sql — uruchom ją przed 013.';
  end if;
end $$;

create or replace function public.progress_stamp_author()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Zalogowany nauczyciel: liczy się tożsamość z tokenu, cokolwiek przyśle
  -- klient w marked_by. Bez tokenu (SQL Editor, migracja) zostawiamy to,
  -- co podano — tylko właściciel bazy może tędy pisać.
  if auth.uid() is not null then
    new.marked_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Uzupełnienie wpisów sprzed migracji 012
--
-- Wpisy zrobione wcześniej nie mają autora — baza nie wie, kto je oznaczył,
-- i nic tu nie zgadujemy. Jeśli WIESZ, że wszystkie stare wpisy są Twoje,
-- odkomentuj poniższe i wpisz swój adres e-mail. W przeciwnym razie zostaw
-- to w spokoju: aplikacja pokaże przy nich neutralne „✓ oznaczone”.
-- -----------------------------------------------------------------------------

-- update progress
--    set marked_by = (select id from auth.users where email = 'twoj.email@szkola.pl')
--  where marked_by is null;
