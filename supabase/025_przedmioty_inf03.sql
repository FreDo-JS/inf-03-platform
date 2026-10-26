-- =============================================================================
-- 025_przedmioty_inf03.sql — trzy kolejne przedmioty INF.03, jak „Programowanie
-- aplikacji internetowych"
--
-- Uruchom po 024_inf04_ai.sql.
--
-- >>> TEN PLIK ZASTĘPUJE MIGRACJA 030_dzial_w_wielu_przedmiotach.sql <<<
-- Kopiowanie działów opisane niżej zdublowało mapę INF.03 (15 → 33 działy,
-- sześć tytułów po cztery razy, wszystkie widoczne dla ucznia). 030 zastępuje
-- kopie tabelą łączącą `category_subjects` i je kasuje. Jeśli uruchomisz 025,
-- puść po nim 030 — posprząta.
--
-- Do tabeli Nauczyciele (`subjects`) dochodzą trzy przedmioty:
--
--   Tworzenie stron i aplikacji internetowych
--   Aplikacje desktopowe i mobilne
--   Programowanie strukturalne i obiektowe
--
-- Wszystkie obracają się wokół programowania aplikacji internetowych, więc
-- dostają TE SAME działy co przedmiot „Programowanie aplikacji internetowych"
-- (p-aplikacje): algorytmy, JavaScript, PHP, serwer, bezpieczeństwo, C++.
-- Dział w mapie należy do jednego przedmiotu (categories.subject_id), więc
-- każdy przedmiot dostaje własną KOPIĘ działów razem z podtematami i materiałami
-- (identyfikatory z prefiksem i3-tsai-, i3-adm-, i3-psio-). Kopie są w mapie
-- INF.03, za istniejącymi działami, i żyją własnym życiem: zmiana w panelu nie
-- rusza oryginału.
--
-- Źródłem jest przypisanie z migracji 022 (subject_id = 'p-aplikacje'), nie
-- sztywna lista — gdy nauczyciel przestawi dział w panelu, kopiujemy to, co
-- faktycznie należy do tego przedmiotu.
--
-- Migracja zastępuje wcześniejsze podejścia i sprząta po nich, jeśli zostały
-- uruchomione:
--   * wersja 025, która przypisywała przedmiotom działy INF.04,
--   * kwalifikacje tsai / adm / psio z gałęzi przedmioty-tsai-adm-psio
--     (kopie działów z prefiksami tsai-, adm-, psio-). Takie działy nigdy nie
--     były widoczne w aplikacji, więc nie ma w nich postępu klas.
-- Na czystej bazie ten sprzątający krok niczego nie robi.
-- =============================================================================

do $$
begin
  if to_regclass('public.subjects') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'categories' and column_name = 'subject_id') then
    raise exception 'Brakuje migracji 022_przedmioty_nauczyciele.sql — uruchom migracje po kolei przed 025.';
  end if;
  if not exists (select 1 from subjects where id = 'p-aplikacje') then
    raise exception 'Brakuje przedmiotu p-aplikacje (migracja 022) — nie mam czego powielić.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Sprzątanie po wcześniejszych podejściach
-- -----------------------------------------------------------------------------
-- Działy z kwalifikacji tsai / adm / psio (podtematy, materiały i postęp znikają
-- razem z nimi kluczami obcymi). Kolumna qualification może jeszcze nie znać tych
-- wartości — wtedy warunek po prostu nic nie znajdzie.
delete from categories
where qualification in ('tsai', 'adm', 'psio')
   or id ~ '^(tsai|adm|psio)-';

-- Działy INF.04 przypisane do tych przedmiotów przez dawną wersję 025.
update categories set subject_id = null
where subject_id in ('p-tworzenie-stron', 'p-desktop-mobile', 'p-strukturalne-obiektowe')
  and qualification = 'inf04';

-- -----------------------------------------------------------------------------
-- 2. Przedmioty
--
-- Pozycje 7–9 w INF.03, za sześcioma istniejącymi. on conflict do update
-- poprawia przedmioty założone przez dawną wersję 025 jako INF.04.
-- -----------------------------------------------------------------------------
insert into subjects (id, title, position, qualification) values
  ('p-tworzenie-stron',       'Tworzenie stron i aplikacji internetowych', 7, 'inf03'),
  ('p-desktop-mobile',        'Aplikacje desktopowe i mobilne',            8, 'inf03'),
  ('p-strukturalne-obiektowe','Programowanie strukturalne i obiektowe',    9, 'inf03')
on conflict (id) do update
  set title = excluded.title, position = excluded.position, qualification = excluded.qualification;

-- -----------------------------------------------------------------------------
-- 3. Kopie działów
--
-- Jeden blok DO (SQL Editor w Supabase gubi tabele tymczasowe między
-- poleceniami). Działy przedmiotu dostają kolejne pozycje za najwyższą
-- w INF.03, w kolejności źródła.
-- -----------------------------------------------------------------------------
do $$
declare
  v_przedmiot record;
  v_dzial record;
  v_pos int;
  v_prefix text;
begin
  select coalesce(max(position), 0) into v_pos from categories where qualification = 'inf03';

  for v_przedmiot in
    select * from (values
      ('p-tworzenie-stron',        'i3-tsai-'),
      ('p-desktop-mobile',         'i3-adm-'),
      ('p-strukturalne-obiektowe', 'i3-psio-')
    ) as v(id, prefix)
  loop
    v_prefix := v_przedmiot.prefix;

    for v_dzial in
      select c.id, c.title, c.description
      from categories c
      where c.subject_id = 'p-aplikacje' and c.qualification = 'inf03'
      order by c.position
    loop
      -- istniejąca kopia zostaje (on conflict), ale pozycji nie zużywamy
      if exists (select 1 from categories where id = v_prefix || v_dzial.id) then
        continue;
      end if;
      v_pos := v_pos + 1;
      if v_pos > 999 then
        raise exception 'Migracja 025: pozycje działów przekroczyły 999.';
      end if;

      insert into categories (id, position, title, description, qualification, subject_id)
      values (v_prefix || v_dzial.id, v_pos, v_dzial.title, v_dzial.description, 'inf03', v_przedmiot.id);

      insert into subtopics (id, category_id, position, title, theory_url, tasks_url)
      select v_prefix || s.id, v_prefix || s.category_id, s.position, s.title, s.theory_url, s.tasks_url
      from subtopics s where s.category_id = v_dzial.id;

      insert into subtopic_links (subtopic_id, label, url, sort_order)
      select v_prefix || l.subtopic_id, l.label, l.url, l.sort_order
      from subtopics s join subtopic_links l on l.subtopic_id = s.id
      where s.category_id = v_dzial.id;
    end loop;
  end loop;
end $$;
