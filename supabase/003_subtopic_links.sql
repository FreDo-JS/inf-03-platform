-- =============================================================================
-- INF.03 — migracja 003: materiały (linki) przypisane do podtematów
-- Kolejność: schema.sql → 002_test_pin.sql → seed.sql → 003_subtopic_links.sql
-- Można ją uruchomić na istniejącej bazie — nic nie nadpisuje, a ponowne
-- uruchomienie niczego nie duplikuje.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CZĘŚĆ 1 — tabela i RLS (zgodnie z dostarczoną migracją)
-- -----------------------------------------------------------------------------

create table if not exists subtopic_links (
  id uuid primary key default gen_random_uuid(),
  subtopic_id text not null check (char_length(subtopic_id) between 1 and 64),
  label text not null check (char_length(label) between 1 and 120),
  url text not null check (char_length(url) between 1 and 500 and url ~ '^https?://'),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_subtopic_links_subtopic on subtopic_links(subtopic_id);

alter table subtopic_links enable row level security;

-- Każdy (uczeń bez logowania) może czytać linki
drop policy if exists "public read subtopic_links" on subtopic_links;
create policy "public read subtopic_links" on subtopic_links for select using (true);

-- Tylko zalogowany admin może dodawać/edytować/usuwać linki
drop policy if exists "admin write subtopic_links" on subtopic_links;
create policy "admin write subtopic_links" on subtopic_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- CZĘŚĆ 2 — uzupełnienia spójne z resztą projektu
-- -----------------------------------------------------------------------------

do $$
begin
  -- link tylko do istniejącego podtematu; usunięcie podtematu kasuje jego linki
  if not exists (select 1 from pg_constraint where conname = 'subtopic_links_subtopic_fk') then
    delete from subtopic_links l where not exists (select 1 from subtopics s where s.id = l.subtopic_id);
    alter table subtopic_links
      add constraint subtopic_links_subtopic_fk
      foreign key (subtopic_id) references subtopics(id) on delete cascade;
  end if;

  -- etykieta nie może być samymi spacjami
  if not exists (select 1 from pg_constraint where conname = 'subtopic_links_label_not_blank') then
    alter table subtopic_links
      add constraint subtopic_links_label_not_blank check (char_length(btrim(label)) >= 1);
  end if;

  -- rozsądny zakres kolejności
  if not exists (select 1 from pg_constraint where conname = 'subtopic_links_sort_order_range') then
    alter table subtopic_links
      add constraint subtopic_links_sort_order_range check (sort_order between 0 and 999);
  end if;
end $$;

create index if not exists subtopic_links_order_idx
  on subtopic_links (subtopic_id, sort_order, created_at);

-- Realtime: zmiany admina widoczne u uczniów bez odświeżania (jak progress i tests)
do $$
begin
  alter publication supabase_realtime add table subtopic_links;
exception
  when duplicate_object then null;  -- tabela już jest w publikacji
end $$;

-- -----------------------------------------------------------------------------
-- CZĘŚĆ 3 — przeniesienie linków z kolumn theory_url / tasks_url
-- (warunki NOT EXISTS → ponowne uruchomienie nic nie duplikuje)
-- -----------------------------------------------------------------------------

insert into subtopic_links (subtopic_id, label, url, sort_order)
select s.id, 'Teoria', s.theory_url, 0
from subtopics s
where s.theory_url is not null
  and not exists (select 1 from subtopic_links l where l.subtopic_id = s.id and l.url = s.theory_url);

insert into subtopic_links (subtopic_id, label, url, sort_order)
select s.id, 'Zadania', s.tasks_url, 1
from subtopics s
where s.tasks_url is not null
  and not exists (select 1 from subtopic_links l where l.subtopic_id = s.id and l.url = s.tasks_url);

-- Kolumny theory_url / tasks_url zostają (nie kasujemy danych), ale aplikacja
-- ich już nie używa — źródłem prawdy jest subtopic_links.
comment on column subtopics.theory_url is 'DEPRECATED — zastąpione przez subtopic_links';
comment on column subtopics.tasks_url  is 'DEPRECATED — zastąpione przez subtopic_links';
