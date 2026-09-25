-- =============================================================================
-- 012_progress_author.sql — kto oznaczył podtemat jako zrobiony
--
-- Uruchom po 011_inf04_seed.sql.
--
-- Zasady:
--  * autora wpisuje TRIGGER z auth.uid(), nie klient — nie da się podpisać
--    cudzym nazwiskiem ani przez API, ani przez konsolę przeglądarki;
--  * na stronie pokazujemy nazwę, którą nauczyciel sam sobie ustawi
--    (admins.display_name), NIGDY adresu e-mail ani identyfikatora konta;
--  * dopóki nauczyciel nie ustawi nazwy, przy podtemacie nie ma podpisu.
-- =============================================================================

do $$
begin
  if to_regproc('public.is_admin') is null then
    raise exception 'Brakuje migracji 008_security_hardening.sql. Uruchom migracje po kolei: 008, 009, 010, 011, dopiero potem 012.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'categories' and column_name = 'qualification') then
    raise exception 'Brakuje migracji 010_inf04.sql — uruchom 010 i 011 przed 012.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Autor wpisu w progress
-- -----------------------------------------------------------------------------
alter table progress add column if not exists marked_by uuid references auth.users(id) on delete set null;

-- Stare wpisy zostają bez autora (nie zmyślamy, kto je zrobił) — UI po prostu
-- nie pokaże przy nich podpisu.

create or replace function public.progress_stamp_author()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Zalogowany nauczyciel: liczy się tożsamość z tokenu, cokolwiek klient
  -- przyśle w marked_by. Bez tokenu (SQL Editor, migracja) zostawiamy wartość
  -- podaną w zapytaniu — tamtędy pisze tylko właściciel bazy, a przez API
  -- bez tokenu nic nie przejdzie, bo polityka RLS wymaga is_admin().
  -- Ta sama treść jest w 013_progress_author_fix.sql: ponowne uruchomienie
  -- 012 nie może cofnąć tamtej poprawki.
  if auth.uid() is not null then
    new.marked_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists progress_stamp_author on progress;
create trigger progress_stamp_author
  before insert or update on progress
  for each row execute function public.progress_stamp_author();

-- -----------------------------------------------------------------------------
-- 2. Nazwa nauczyciela widoczna przy podtemacie
-- -----------------------------------------------------------------------------
alter table admins add column if not exists display_name text not null default '';

do $$
begin
  alter table admins add constraint admins_display_name_check
    check (char_length(display_name) <= 40 and display_name !~ '[[:cntrl:]]');
exception when duplicate_object then null;
end $$;

-- Przy okazji: polityka odczytu admins z migracji 008 odpytywała samą tabelę
-- admins, więc każdy bezpośredni select kończył się błędem "infinite recursion
-- detected in policy for relation admins". is_admin() jest SECURITY DEFINER,
-- czyta tę tabelę z uprawnieniami właściciela i rekurencji nie wywołuje.
drop policy if exists "admin read admins" on admins;
create policy "admin read admins" on admins for select using (public.is_admin());

-- Widok wystawia wyłącznie identyfikator i nazwę własną — ani e-maila, ani
-- notatki, ani daty nadania uprawnień. Tabela admins pozostaje niedostępna
-- dla anon (widok działa z uprawnieniami właściciela).
create or replace view public.teachers as
  select user_id as id, display_name
  from admins
  where btrim(display_name) <> '';

grant select on public.teachers to anon, authenticated;

-- Zapis nazwy: 008 celowo odebrało authenticated prawo UPDATE na admins, żeby
-- nikt nie dopisał sobie uprawnień przez API. Dlatego nazwę zmienia wąska
-- funkcja, która rusza jedną kolumnę i wyłącznie we własnym wierszu.
create or replace function public.set_my_display_name(p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_name := btrim(coalesce(p_name, ''));
  if char_length(v_name) > 40 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_name ~ '[[:cntrl:]]' then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  update admins set display_name = v_name where user_id = auth.uid();
  return v_name;
end;
$$;

revoke all on function public.set_my_display_name(text) from public, anon;
grant execute on function public.set_my_display_name(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Realtime
--
-- progress jest publikowany w całości (bez listy kolumn), więc marked_by
-- dochodzi samo. Nazwy nauczycieli zmieniają się rzadko — widok dociągamy
-- przy ładowaniu strony, bez subskrypcji.
-- -----------------------------------------------------------------------------
