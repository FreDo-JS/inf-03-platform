-- =============================================================================
-- 030_dzial_w_wielu_przedmiotach.sql — koniec z kopiami działów w mapie
--
-- Uruchom po 029_praktyka_cwiczenia.sql.
--
-- PROBLEM
-- Migracja 022 dała kategorii jedno `subject_id`, więc dział mapy mógł należeć
-- do dokładnie jednego przedmiotu. Gdy w 025 doszły trzy przedmioty mające
-- obejmować te same treści co „Programowanie aplikacji internetowych", jedynym
-- wyjściem w tym modelu było SKOPIOWANIE działów. Skutek w mapie INF.03:
--
--     15 działów / 111 podtematów  →  33 działy / 231 podtematów
--
-- Sześć działów (algorytmy, javascript, php, serwer, bezpieczenstwo, cpp)
-- występuje po cztery razy pod tym samym tytułem, a uczeń widzi je wszystkie
-- na /roadmap, bo kopie też mają qualification = 'inf03'.
--
-- ROZWIĄZANIE
-- Relacja wiele-do-wielu: tabela `category_subjects`. Jeden dział należy do
-- tylu przedmiotów, do ilu trzeba, a mapa zostaje jedna.
--
-- Migracja działa niezależnie od tego, czy 025 zostało wykonane:
--   * jeśli tak — przenosi przypisania na oryginały, przenosi ewentualny
--     postęp klas i kasuje 18 kopii,
--   * jeśli nie — zakłada tylko trzy przedmioty i powiązania.
--
-- Można ją uruchamiać wielokrotnie. Gdyby ktoś wykonał 025 jeszcze raz
-- (kopie wrócą), wystarczy ponownie puścić 030.
-- =============================================================================

do $$
begin
  if to_regclass('public.subjects') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'categories' and column_name = 'subject_id') then
    raise exception 'Brakuje migracji 022_przedmioty_nauczyciele.sql — uruchom migracje po kolei przed 030.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Tabela łącząca
-- -----------------------------------------------------------------------------
-- Prawa jak przy `plan_teachers` i `teacher_subjects`: wyłącznie dla
-- zalogowanego nauczyciela. Tabelę czyta tylko sekcja Nauczyciele w panelu,
-- a audyt nr 2 pilnuje, żeby lista tabel z odczytem publicznym nie rosła
-- bez powodu (tests/sql/audyt-2.mjs).

create table if not exists category_subjects (
  category_id text not null references categories(id) on delete cascade,
  subject_id  text not null references subjects(id)   on delete cascade,
  primary key (category_id, subject_id)
);

alter table category_subjects enable row level security;

do $$
begin
  create policy "admin all category_subjects" on category_subjects for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

-- Gdyby wcześniejsza wersja 030 zdążyła założyć politykę z odczytem publicznym.
drop policy if exists "public read category_subjects" on category_subjects;
drop policy if exists "admin write category_subjects" on category_subjects;

-- -----------------------------------------------------------------------------
-- 2. Trzy przedmioty z 025
-- -----------------------------------------------------------------------------
-- Te same nazwy i pozycje co w 025, żeby migracja była samowystarczalna także
-- na bazie, na której 025 nigdy nie poszło.

insert into subjects (id, title, position, qualification) values
  ('p-tworzenie-stron',       'Tworzenie stron i aplikacji internetowych', 7, 'inf03'),
  ('p-desktop-mobile',        'Aplikacje desktopowe i mobilne',            8, 'inf03'),
  ('p-strukturalne-obiektowe','Programowanie strukturalne i obiektowe',    9, 'inf03')
on conflict (id) do update
  set title = excluded.title, position = excluded.position, qualification = excluded.qualification;

-- -----------------------------------------------------------------------------
-- 3. Przepisanie dotychczasowych przypisań
-- -----------------------------------------------------------------------------
-- Najpierw to, co już jest w `categories.subject_id` — pomijając kopie.

insert into category_subjects (category_id, subject_id)
select c.id, c.subject_id
from categories c
where c.subject_id is not null
  and c.id !~ '^i3-(tsai|adm|psio)-'
on conflict do nothing;

-- Teraz intencja z 025: przedmiot, do którego przypisano kopię, ma obejmować
-- ORYGINALNY dział. Identyfikator oryginału powstaje przez zdjęcie prefiksu.
insert into category_subjects (category_id, subject_id)
select regexp_replace(c.id, '^i3-(tsai|adm|psio)-', '') as oryginal, c.subject_id
from categories c
where c.id ~ '^i3-(tsai|adm|psio)-'
  and c.subject_id is not null
  and exists (select 1 from categories o where o.id = regexp_replace(c.id, '^i3-(tsai|adm|psio)-', ''))
on conflict do nothing;

-- Gdyby 025 nigdy nie poszło, kopii nie ma i powyższe nic nie wstawiło —
-- powiązania dla trzech przedmiotów budujemy wprost z przypisania p-aplikacje.
insert into category_subjects (category_id, subject_id)
select c.id, p.subject_id
from categories c
cross join (values ('p-tworzenie-stron'), ('p-desktop-mobile'), ('p-strukturalne-obiektowe')) as p(subject_id)
where c.subject_id = 'p-aplikacje'
  and c.id !~ '^i3-(tsai|adm|psio)-'
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 4. Ratowanie postępu z kopii
-- -----------------------------------------------------------------------------
-- Kopie są świeże, więc najpewniej nikt nic w nich nie odhaczył. Ale gdyby tak
-- było, oznaczenie przenosimy na odpowiedni podtemat oryginału zamiast kasować
-- je razem z kopią. `on conflict do nothing` — jeśli oryginał jest już
-- odhaczony dla tej klasy, zostaje tak, jak jest.

do $$
declare
  v_przeniesione int;
begin
  with przeniesienie as (
    insert into progress (class_name, subtopic_id)
    select p.class_name, regexp_replace(p.subtopic_id, '^i3-(tsai|adm|psio)-', '')
    from progress p
    where p.subtopic_id ~ '^i3-(tsai|adm|psio)-'
      and exists (
        select 1 from subtopics s
        where s.id = regexp_replace(p.subtopic_id, '^i3-(tsai|adm|psio)-', '')
      )
    on conflict (class_name, subtopic_id) do nothing
    returning 1
  )
  select count(*) into v_przeniesione from przeniesienie;

  if v_przeniesione > 0 then
    raise notice 'Migracja 030: przeniesiono % oznaczen z kopii na oryginalne podtematy.', v_przeniesione;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Usunięcie kopii
-- -----------------------------------------------------------------------------
-- Klucze obce z kaskadą zabierają podtematy, materiały i resztki postępu.

do $$
declare
  v_kopie int;
begin
  select count(*) into v_kopie from categories where id ~ '^i3-(tsai|adm|psio)-';

  delete from categories where id ~ '^i3-(tsai|adm|psio)-';

  if v_kopie > 0 then
    raise notice 'Migracja 030: usunieto % skopiowanych dzialow z mapy INF.03.', v_kopie;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Kontrola
-- -----------------------------------------------------------------------------
-- Mapa nie może mieć dwóch działów o tym samym tytule w obrębie kwalifikacji,
-- a każdy z trzech przedmiotów musi obejmować sześć działów.

do $$
declare
  v_duble text;
  v_brak text;
begin
  select string_agg(title, ', ') into v_duble
  from (select title from categories where qualification = 'inf03'
        group by title having count(*) > 1) d;
  if v_duble is not null then
    raise exception 'Migracja 030: w mapie INF.03 nadal powtarzaja sie tytuly dzialow: %', v_duble;
  end if;

  select string_agg(p.id || ' (' || p.n || ')', ', ') into v_brak
  from (select s.id, count(cs.category_id) as n
        from subjects s
        left join category_subjects cs on cs.subject_id = s.id
        where s.id in ('p-tworzenie-stron', 'p-desktop-mobile', 'p-strukturalne-obiektowe')
        group by s.id having count(cs.category_id) <> 6) p;
  if v_brak is not null then
    raise exception 'Migracja 030: przedmioty maja niewlasciwa liczbe dzialow: %', v_brak;
  end if;
end $$;
