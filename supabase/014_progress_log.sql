-- =============================================================================
-- 014_progress_log.sql — dziennik oznaczeń tematów
--
-- Uruchom po 013_progress_author_fix.sql.
--
-- Tabela progress trzyma tylko stan bieżący: odznaczenie tematu kasuje wiersz
-- i ślad po nim znika. Dziennik zapisuje każde zaznaczenie i odznaczenie —
-- kto, kiedy, jaki temat i w której klasie.
--
-- Wpisy tworzy wyłącznie trigger, z tożsamością z tokenu. Przez API nikt nic
-- tu nie dopisze ani nie poprawi: nauczyciel może czytać i kasować stare wpisy,
-- uczeń nie ma dostępu w ogóle (dziennik pokazuje, kto pracował, a to nie jest
-- informacja dla klasy).
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'progress' and column_name = 'marked_by') then
    raise exception 'Brakuje migracji 012_progress_author.sql — uruchom 012 i 013 przed 014.';
  end if;
end $$;

create table if not exists progress_log (
  id bigint generated always as identity primary key,
  class_name text not null check (char_length(class_name) between 1 and 8),
  subtopic_id text not null check (char_length(subtopic_id) between 1 and 64),
  action text not null check (action in ('zaznaczono', 'odznaczono')),
  actor uuid references auth.users(id) on delete set null,
  at timestamptz not null default now()
);

create index if not exists progress_log_at_idx on progress_log (at desc);
create index if not exists progress_log_class_idx on progress_log (class_name, at desc);

alter table progress_log enable row level security;

do $$
begin
  create policy "admin read log" on progress_log for select using (public.is_admin());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin delete log" on progress_log for delete using (public.is_admin());
exception when duplicate_object then null;
end $$;

revoke all on progress_log from anon;
revoke insert, update on progress_log from authenticated;
grant select, delete on progress_log to authenticated;

-- -----------------------------------------------------------------------------
-- Zapis dziennika
--
-- SECURITY DEFINER, bo tabela nie ma polityki INSERT — to jedyna droga zapisu.
-- Autora bierzemy z marked_by (stempluje go trigger z 012/013), a przy
-- odznaczeniu z auth.uid(): wiersz właśnie znika, więc liczy się ten, kto kasuje.
-- -----------------------------------------------------------------------------
create or replace function public.progress_log_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into progress_log (class_name, subtopic_id, action, actor)
    values (new.class_name, new.subtopic_id, 'zaznaczono', coalesce(new.marked_by, auth.uid()));
    return new;
  end if;

  insert into progress_log (class_name, subtopic_id, action, actor)
  values (old.class_name, old.subtopic_id, 'odznaczono', auth.uid());
  return old;
end;
$$;

drop trigger if exists progress_log_write on progress;
create trigger progress_log_write
  after insert or delete on progress
  for each row execute function public.progress_log_write();

-- -----------------------------------------------------------------------------
-- Stan sprzed migracji trafia do dziennika jako pojedyncze „zaznaczono”,
-- z datą i autorem z tabeli progress. Powtórne uruchomienie nic nie zduplikuje.
-- -----------------------------------------------------------------------------
insert into progress_log (class_name, subtopic_id, action, actor, at)
select p.class_name, p.subtopic_id, 'zaznaczono', p.marked_by, p.updated_at
from progress p
where not exists (
  select 1 from progress_log l
  where l.class_name = p.class_name and l.subtopic_id = p.subtopic_id
);
