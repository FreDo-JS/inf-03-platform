-- =============================================================================
-- 022_przedmioty_nauczycieli.sql — nauczyciel odpowiada za swoje przedmioty
--
-- Uruchom po 021_przedmioty.sql.
--
-- Do tej pory każdy wiersz w `admins` mógł zmieniać wszystko. Teraz konto może
-- mieć listę przedmiotów (admins.subjects), a polityki RLS pilnują, żeby
-- nauczyciel ruszał tylko mapę nauki, materiały, testy i postęp swoich
-- przedmiotów.
--
--   subjects IS NULL   → wszystkie przedmioty (tak zachowują się obecne konta,
--                        więc po migracji nikt nie traci dostępu)
--   subjects = '{}'    → żadnego (konto tylko do podglądu)
--   subjects = '{tsai,psio}' → tylko wymienione kwalifikacje
--
-- Listę ustawia wyłącznie właściciel bazy z SQL Editora — authenticated nie ma
-- prawa UPDATE na admins (008), więc nikt nie przyzna sobie przedmiotu przez API:
--
--   update admins set subjects = '{tsai,adm}'
--   where user_id = (select id from auth.users where email = 'nauczyciel@szkola.pl');
--
-- Poza zakresem tej migracji (zostają dla każdego admina): sesje i zadania
-- modułu Praktyka, dziennik zmian, lista zaproszeń.
-- =============================================================================

do $$
begin
  if to_regproc('public.is_admin') is null or to_regclass('public.admins') is null then
    raise exception 'Brakuje migracji 008_security_hardening.sql — uruchom migracje po kolei przed 022.';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'categories_qualification_check'
                 and pg_get_constraintdef(oid) like '%tsai%') then
    raise exception 'Brakuje migracji 021_przedmioty.sql — uruchom ją przed 022.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Kolumna
-- -----------------------------------------------------------------------------
alter table admins add column if not exists subjects text[];

do $$
begin
  alter table admins add constraint admins_subjects_check
    check (subjects is null or subjects <@ array['inf03','inf04','tsai','adm','psio']::text[]);
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Funkcje pomocnicze
--
-- SECURITY DEFINER, bo czytają `admins` (niedostępne dla anon) i muszą działać
-- w politykach, także tych sprawdzanych dla ucznia. Przy braku zalogowania
-- zwracają false.
-- -----------------------------------------------------------------------------

-- Czy zalogowany nauczyciel może zmieniać treści danej kwalifikacji?
-- NULL jako kwalifikacja (np. porzucone podejście po skasowanym teście)
-- dotyczy wyłącznie kont bez ograniczeń.
create or replace function public.can_manage(p_qualification text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from admins a
    where a.user_id = auth.uid()
      and (a.subjects is null or (p_qualification is not null and p_qualification = any (a.subjects)))
  );
$$;

create or replace function public.can_manage_category(p_category_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage((select c.qualification from categories c where c.id = p_category_id));
$$;

create or replace function public.can_manage_subtopic(p_subtopic_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage((
    select c.qualification from subtopics s join categories c on c.id = s.category_id
    where s.id = p_subtopic_id));
$$;

create or replace function public.can_manage_test(p_test_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage((select t.qualification from tests t where t.id = p_test_id));
$$;

-- Konto bez ograniczeń (subjects IS NULL) — do zasobów bez przypisanego przedmiotu.
create or replace function public.is_full_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1 from admins a where a.user_id = auth.uid() and a.subjects is null);
$$;

-- Lista kwalifikacji, którymi zarządza zalogowany nauczyciel — dla interfejsu.
create or replace function public.my_subjects()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then '{}'::text[]
    else coalesce(
      (select coalesce(a.subjects, array['inf03','inf04','tsai','adm','psio']::text[])
       from admins a where a.user_id = auth.uid()),
      '{}'::text[])
  end;
$$;

revoke all on function public.can_manage(text) from public;
revoke all on function public.can_manage_category(text) from public;
revoke all on function public.can_manage_subtopic(text) from public;
revoke all on function public.can_manage_test(uuid) from public;
revoke all on function public.is_full_admin() from public;
-- w Supabase domyślne uprawnienia dają funkcjom także rolę anon, więc odbieramy ją wprost
revoke all on function public.my_subjects() from public, anon;
-- anon też: polityki z publicznym odczytem są oceniane i dla ucznia
grant execute on function public.can_manage(text) to anon, authenticated;
grant execute on function public.can_manage_category(text) to anon, authenticated;
grant execute on function public.can_manage_subtopic(text) to anon, authenticated;
grant execute on function public.can_manage_test(uuid) to anon, authenticated;
grant execute on function public.is_full_admin() to anon, authenticated;
grant execute on function public.my_subjects() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Polityki zapisu
--
-- Odczyt publiczny (mapa, lista testów) zostaje jak był — tu zmieniają się
-- tylko polityki „admin …".
-- -----------------------------------------------------------------------------
drop policy if exists "admin write categories" on categories;
create policy "admin write categories" on categories for all
  using (public.can_manage(qualification)) with check (public.can_manage(qualification));

drop policy if exists "admin write subtopics" on subtopics;
create policy "admin write subtopics" on subtopics for all
  using (public.can_manage_category(category_id)) with check (public.can_manage_category(category_id));

drop policy if exists "admin write subtopic_links" on subtopic_links;
create policy "admin write subtopic_links" on subtopic_links for all
  using (public.can_manage_subtopic(subtopic_id)) with check (public.can_manage_subtopic(subtopic_id));

-- Postęp klasy: nauczyciel oznacza tylko podtematy swoich przedmiotów.
drop policy if exists "admin write progress" on progress;
create policy "admin write progress" on progress for all
  using (public.can_manage_subtopic(subtopic_id)) with check (public.can_manage_subtopic(subtopic_id));

drop policy if exists "admin write tests" on tests;
create policy "admin write tests" on tests for all
  using (public.can_manage(qualification)) with check (public.can_manage(qualification));

-- Klucze (odpowiedzi i PIN-y) i wyniki — tylko do testów własnych przedmiotów.
drop policy if exists "admin all test_keys" on test_keys;
create policy "admin all test_keys" on test_keys for all
  using (public.can_manage_test(test_id)) with check (public.can_manage_test(test_id));

drop policy if exists "admin can read attempts" on attempts;
create policy "admin can read attempts" on attempts for select
  using (public.is_admin() and public.can_manage_test(test_id));

drop policy if exists "admin can delete attempts" on attempts;
create policy "admin can delete attempts" on attempts for delete
  using (public.is_admin() and public.can_manage_test(test_id));

-- Klasy nie mają przedmiotu — dopisywać je może tylko konto bez ograniczeń.
drop policy if exists "admin write classes" on classes;
create policy "admin write classes" on classes for all
  using (public.is_full_admin()) with check (public.is_full_admin());

-- -----------------------------------------------------------------------------
-- 4. set_test_pin — jedyna funkcja nauczyciela, która omija RLS na test_keys
--
-- Działa jako SECURITY DEFINER, więc polityka z punktu 3 jej nie dotyczy;
-- bez tej kontroli nauczyciel jednego przedmiotu mógłby zmienić PIN cudzego testu.
-- Reszta bez zmian względem 008.
-- -----------------------------------------------------------------------------
create or replace function public.set_test_pin(p_test_id uuid, p_pin text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin text;
begin
  if not public.is_admin() or not public.can_manage_test(p_test_id) then
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
