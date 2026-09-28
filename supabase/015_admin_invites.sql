-- =============================================================================
-- 015_admin_invites.sql — zaproszenia dla nauczycieli
--
-- Uruchom po 014_progress_log.sql.
--
-- Problem: konto założone w Supabase Auth nie daje jeszcze żadnych uprawnień,
-- bo nauczyciel = wiersz w tabeli admins. Trzeba było dopisywać go ręcznie.
--
-- Rozwiązanie: lista zaproszonych adresów. Gdy ktoś z tej listy zakłada konto
-- (np. przez „Invite user” w panelu Supabase), trigger nadaje mu uprawnienia
-- i zużywa zaproszenie.
--
-- Bezpieczeństwo: to lista jest bramką, nie sam fakt rejestracji. Kto nie
-- został zaproszony, dostaje zwykłe konto bez dostępu do panelu. Wpisy na listę
-- dodaje się wyłącznie z SQL Editora — przez API nikt nie zaprosi ani siebie,
-- ani kolegi.
-- =============================================================================

do $$
begin
  if to_regclass('public.admins') is null then
    raise exception 'Brakuje migracji 008_security_hardening.sql — uruchom ją przed 015.';
  end if;
end $$;

create table if not exists admin_invites (
  email text primary key check (position('@' in email) > 1 and char_length(email) between 3 and 200),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

alter table admin_invites enable row level security;

do $$
begin
  create policy "admin read invites" on admin_invites for select using (public.is_admin());
exception when duplicate_object then null;
end $$;

revoke all on admin_invites from anon;
revoke insert, update, delete on admin_invites from authenticated;
grant select on admin_invites to authenticated;

-- -----------------------------------------------------------------------------
-- Nadanie uprawnień przy zakładaniu konta
--
-- SECURITY DEFINER, bo trigger działa w kontekście rejestrującego się konta,
-- które nie ma prawa zapisu do admins. Porównanie adresów bez względu
-- na wielkość liter — „Anna@Szkola.pl” i „anna@szkola.pl” to ta sama osoba.
-- -----------------------------------------------------------------------------
create or replace function public.grant_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  if exists (select 1 from admin_invites i where lower(btrim(i.email)) = lower(btrim(new.email))) then
    insert into admins (user_id, note)
    values (new.id, 'konto z zaproszenia')
    on conflict (user_id) do nothing;

    delete from admin_invites where lower(btrim(email)) = lower(btrim(new.email));
  end if;

  return new;
end;
$$;

drop trigger if exists grant_admin_on_signup on auth.users;
create trigger grant_admin_on_signup
  after insert on auth.users
  for each row execute function public.grant_admin_on_signup();

-- -----------------------------------------------------------------------------
-- Nadrobienie zaległości: jeśli zaproszenie dopisano już PO założeniu konta,
-- trigger się nie odpali. Ten fragment domyka takie przypadki przy każdym
-- uruchomieniu migracji.
-- -----------------------------------------------------------------------------
insert into admins (user_id, note)
select u.id, 'konto z zaproszenia (dopisane przy migracji)'
from auth.users u
join admin_invites i on lower(btrim(i.email)) = lower(btrim(u.email))
on conflict (user_id) do nothing;

delete from admin_invites i
where exists (select 1 from admins a join auth.users u on u.id = a.user_id
              where lower(btrim(u.email)) = lower(btrim(i.email)));

-- =============================================================================
-- JAK ZAPROSIĆ NAUCZYCIELA
--
-- 1. Dopisz adres do listy (tutaj, w SQL Editorze):
--
--    insert into admin_invites (email, note)
--    values ('nowy.nauczyciel@szkola.pl', 'matematyka, od września')
--    on conflict (email) do nothing;
--
-- 2. Supabase → Authentication → Users → „Invite user” → ten sam adres.
--    Osoba dostaje mejla z linkiem, ustawia hasło i ma od razu dostęp
--    do panelu; zaproszenie znika z listy.
--
-- 3. Podgląd niezrealizowanych zaproszeń:
--
--    select email, note, created_at from admin_invites order by created_at;
-- =============================================================================
