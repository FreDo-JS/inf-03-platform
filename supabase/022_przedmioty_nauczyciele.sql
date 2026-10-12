-- =============================================================================
-- 022_przedmioty_nauczyciele.sql — przedmioty INF.03 i przydział nauczycieli
--
-- Uruchom po 021_inf03_program_nauczania.sql.
--
-- Mapa nauki mówi, CO jest do przerobienia. Ta migracja dokłada drugi wymiar:
-- KTO to prowadzi. Przedmioty są wzięte wprost z programu nauczania (katalog
-- ProgramNaucznia/), a każdy dział mapy dostaje swój przedmiot — dzięki temu
-- po kliknięciu w nagłówek kolumny widać, co się na tym przedmiocie realizuje.
--
--   subjects         — przedmioty z programu nauczania
--   categories.subject_id — który dział mapy należy do którego przedmiotu
--   plan_teachers    — lista nauczycieli wpisywana ręcznie w panelu
--   teacher_subjects — krzyżyki w tabeli: kto prowadzi który przedmiot
--
-- `plan_teachers` celowo NIE jest powiązane z kontami (`admins`): plan układa
-- się dla całego grona, a nie tylko dla osób, które logują się do aplikacji.
-- To zwykła lista nazwisk, bez żadnych uprawnień.
--
-- Tabele planu widzi i edytuje wyłącznie nauczyciel. Przydział przedmiotów to
-- informacja organizacyjna szkoły, nie treść dla klasy.
-- =============================================================================

do $$
begin
  if to_regclass('public.categories') is null then
    raise exception 'Brakuje schema.sql — uruchom migracje po kolei przed 022.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'categories' and column_name = 'qualification') then
    raise exception 'Brakuje migracji 010_inf04.sql — uruchom migracje po kolei przed 022.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Przedmioty
-- -----------------------------------------------------------------------------

create table if not exists subjects (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  position int not null check (position between 1 and 99),
  qualification text not null default 'inf03' check (qualification in ('inf03', 'inf04'))
);

create unique index if not exists subjects_qualification_position_idx
  on subjects (qualification, position);

-- Nazwy i kolejność jak w programie nauczania: najpierw przedmioty teoretyczne,
-- potem praktyczne. Praktyki zawodowej tu nie ma — odbywa się u pracodawcy
-- i nie realizuje działów z mapy.
insert into subjects (id, title, position, qualification) values
  ('p-bhp',           'Bezpieczeństwo i higiena pracy',        1, 'inf03'),
  ('p-angielski',     'Język angielski zawodowy',              2, 'inf03'),
  ('p-przygotowanie', 'Przygotowanie do zawodu programisty',   3, 'inf03'),
  ('p-bazy',          'Bazy danych',                           4, 'inf03'),
  ('p-strony',        'Projektowanie stron internetowych',     5, 'inf03'),
  ('p-aplikacje',     'Programowanie aplikacji internetowych', 6, 'inf03')
on conflict (id) do nothing;

alter table subjects enable row level security;

do $$
begin
  create policy "public read subjects" on subjects for select using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin write subjects" on subjects for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Dział mapy → przedmiot
-- -----------------------------------------------------------------------------
-- on delete set null, bo skasowanie przedmiotu nie może zabrać działów mapy
-- razem z postępem klas.

alter table categories add column if not exists subject_id text
  references subjects(id) on delete set null;

-- Przypisanie zgodne z jednostkami efektów kształcenia (patrz CLAUDE.md).
-- Aktualizujemy tylko działy, które jeszcze nie mają przedmiotu — jeśli
-- nauczyciel przestawi coś w panelu, ponowne uruchomienie tego nie cofnie.
update categories set subject_id = v.subject
from (values
  ('bhp',            'p-bhp'),
  ('angielski',      'p-angielski'),
  ('podstawy',       'p-przygotowanie'),
  ('sql',            'p-bazy'),
  ('html-css',       'p-strony'),
  ('multimedia',     'p-strony'),
  ('grafika',        'p-strony'),
  ('cms',            'p-strony'),
  ('dokumentacja',   'p-strony'),
  ('algorytmy',      'p-aplikacje'),
  ('javascript',     'p-aplikacje'),
  ('php',            'p-aplikacje'),
  ('serwer',         'p-aplikacje'),
  ('bezpieczenstwo', 'p-aplikacje'),
  -- C++ jest ponad podstawę programową (zob. CLAUDE.md), ale to programowanie
  ('cpp',            'p-aplikacje')
) as v(id, subject)
where categories.id = v.id and categories.subject_id is null;

-- -----------------------------------------------------------------------------
-- 3. Nauczyciele w planie
-- -----------------------------------------------------------------------------

create table if not exists plan_teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  position int not null default 1 check (position between 1 and 99),
  created_at timestamptz not null default now()
);

alter table plan_teachers enable row level security;

do $$
begin
  create policy "admin all plan_teachers" on plan_teachers for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

-- Cztery puste wiersze na start, żeby tabela od razu miała kształt z kartki.
-- Tylko gdy lista jest pusta — skasowanych nauczycieli nie wskrzeszamy.
insert into plan_teachers (name, position)
select v.name, v.position
from (values ('Nauczyciel 1', 1), ('Nauczyciel 2', 2), ('Nauczyciel 3', 3), ('Nauczyciel 4', 4))
  as v(name, position)
where not exists (select 1 from plan_teachers);

-- -----------------------------------------------------------------------------
-- 4. Krzyżyki: kto prowadzi który przedmiot
-- -----------------------------------------------------------------------------

create table if not exists teacher_subjects (
  teacher_id uuid not null references plan_teachers(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

alter table teacher_subjects enable row level security;

do $$
begin
  create policy "admin all teacher_subjects" on teacher_subjects for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;
