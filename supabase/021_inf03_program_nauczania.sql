-- =============================================================================
-- 021_inf03_program_nauczania.sql — mapa INF.03 uzupełniona o braki
--
-- Uruchom po 020_gaps_questions.sql.
--
-- Porównanie mapy nauki z programem nauczania zawodu technik programista
-- (katalog ProgramNaucznia/, oba warianty mają identyczną część INF.03).
-- Mapa pokrywała przedmioty „Projektowanie stron internetowych", „Bazy danych"
-- i „Programowanie aplikacji internetowych" — ale tylko w części webowej.
-- Brakowało całych jednostek efektów kształcenia:
--
--   INF.03.1  BHP                      → kategoria `bhp`
--   INF.03.2  przygotowanie do zawodu  → kategoria `podstawy`
--   INF.03.3  multimedia i projekt     → kategoria `multimedia`
--   INF.03.5  algorytmy                → kategoria `algorytmy`
--   INF.03.6  język obcy zawodowy      → kategoria `angielski`
--   INF.03.7/8 kompetencje i praca zespołu → w kategorii `bhp`
--
-- plus pojedyncze podtematy dopisane do działów, które już istniały
-- (diagramy E/R, podzapytania, SEO, frameworki JS, Joomla!, pliki w PHP…).
--
-- To wyłącznie dane — kategorie, podtematy i odnośniki. Wszystko da się potem
-- zmienić w panelu nauczyciela, bez ruszania kodu.
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'categories' and column_name = 'qualification') then
    raise exception 'Brakuje migracji 010_inf04.sql — uruchom migracje po kolei przed 021.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Miejsce na nowe działy
-- -----------------------------------------------------------------------------
-- Mapa ma prowadzić od podstaw zawodu do wdrożenia, więc nowe działy wchodzą
-- między istniejące, a nie na koniec listy. Para (qualification, position) jest
-- unikalna, dlatego najpierw odsuwamy wszystko, co jest, do strefy roboczej
-- 100+, a docelowe numery ustawiamy dopiero w kroku 3.

update categories set position = position + 100
where qualification = 'inf03' and position < 100;

-- -----------------------------------------------------------------------------
-- 2. Nowe kategorie
-- -----------------------------------------------------------------------------

insert into categories (id, position, title, description, qualification) values
  ('bhp', 1, 'BHP i organizacja pracy',
   'Przepisy, ergonomia stanowiska, pierwsza pomoc, etyka zawodowa i praca w zespole. (INF.03.1, INF.03.7–8)', 'inf03'),
  ('podstawy', 2, 'Przygotowanie do zawodu programisty',
   'Sprzęt i architektura komputera, sieci, systemy liczbowe, cyberbezpieczeństwo, normy i prawo autorskie. (INF.03.2)', 'inf03'),
  ('multimedia', 4, 'Multimedia i projekt strony',
   'Dźwięk, wideo i animacje na stronie oraz projektowanie układu, palety barw i typografii. (INF.03.3)', 'inf03'),
  ('algorytmy', 7, 'Algorytmy i programowanie strukturalne',
   'Analiza problemu, schematy blokowe, klasyczne algorytmy i zasady czytelnego kodu. (INF.03.5)', 'inf03'),
  ('angielski', 15, 'Język angielski zawodowy',
   'Słownictwo branżowe, dokumentacja techniczna, komunikaty błędów i komunikacja w zespole. (INF.03.6)', 'inf03')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Podtematy
-- -----------------------------------------------------------------------------
-- Pozycje liczymy od tego, co już jest w danej kategorii, zamiast wpisywać je
-- na sztywno — nauczyciel mógł dodać własne podtematy w panelu, a para
-- (category_id, position) jest unikalna.

with nowe (id, cat, ord, title) as (
  values
  -- INF.03.1 + INF.03.7 + INF.03.8 — BHP, etyka, praca zespołowa
  ('bhp-przepisy',     'bhp', 1, 'Przepisy BHP, prawo pracy i ochrona przeciwpożarowa w pracowni'),
  ('bhp-ergonomia',    'bhp', 2, 'Ergonomia stanowiska komputerowego i czynniki szkodliwe'),
  ('bhp-pomoc',        'bhp', 3, 'Pierwsza pomoc w stanach zagrożenia zdrowia i życia'),
  ('bhp-etyka',        'bhp', 4, 'Etyka zawodowa, tajemnica zawodowa i odpowiedzialność za powierzone dane'),
  ('bhp-zespol',       'bhp', 5, 'Praca w zespole: podział ról, harmonogram, komunikacja'),
  ('bhp-stres',        'bhp', 6, 'Radzenie sobie ze stresem, asertywność i rozwiązywanie konfliktów'),
  ('bhp-rozwoj',       'bhp', 7, 'Rozwój zawodowy: samoocena, planowanie, źródła informacji o zawodzie'),

  -- INF.03.2 — przygotowanie do zawodu programisty
  ('pod-sprzet',       'podstawy', 1, 'Parametry sprzętu komputerowego i dobór stanowiska pracy'),
  ('pod-architektura', 'podstawy', 2, 'Architektura systemu komputerowego: procesor, pamięć, magistrale'),
  ('pod-systemy',      'podstawy', 3, 'Systemy informatyczne i miejsca przechowywania danych (serwer, chmura, nośniki)'),
  ('pod-sieci',        'podstawy', 4, 'Sieci komputerowe: topologie, model TCP/IP i protokoły'),
  ('pod-adresacja',    'podstawy', 5, 'Adresacja IP, DNS i przepustowość łącza'),
  ('pod-liczby',       'podstawy', 6, 'Pozycyjne systemy liczbowe: dwójkowy, ósemkowy, szesnastkowy i kod U2'),
  ('pod-binarne',      'podstawy', 7, 'Działania arytmetyczne i logiczne na liczbach binarnych'),
  ('pod-cyber',        'podstawy', 8, 'Cyberbezpieczeństwo: złośliwe oprogramowanie i rodzaje ataków'),
  ('pod-dane-osobowe', 'podstawy', 9, 'Ochrona danych osobowych (RODO), prawo autorskie i licencje oprogramowania'),
  ('pod-normy',        'podstawy', 10, 'Normy, procedury oceny zgodności i źródła informacji technicznej'),

  -- INF.03.3 — multimedia i projekt strony
  ('mm-formaty',       'multimedia', 1, 'Formaty i kompresja dźwięku oraz wideo na potrzeby strony'),
  ('mm-osadzanie',     'multimedia', 2, 'Osadzanie multimediów: znaczniki video i audio, serwisy zewnętrzne'),
  ('mm-animacje',      'multimedia', 3, 'Animacje na stronie: GIF, animacje CSS i SVG'),
  ('mm-edycja',        'multimedia', 4, 'Edycja materiałów wideo i dźwiękowych na potrzeby strony'),
  ('mm-projekt',       'multimedia', 5, 'Projekt strony: makieta, układ sekcji i analiza projektu'),
  ('mm-barwy',         'multimedia', 6, 'Dobór palety barw i kontrastu'),
  ('mm-typografia',    'multimedia', 7, 'Typografia na stronie: kroje pisma, wielkości, czytelność'),
  ('mm-cms-media',     'multimedia', 8, 'Import i osadzanie materiałów multimedialnych w systemie CMS'),

  -- INF.03.5 — algorytmy i programowanie strukturalne
  ('alg-analiza',      'algorytmy', 1, 'Analiza problemu i specyfikacja zadania'),
  ('alg-schematy',     'algorytmy', 2, 'Schematy blokowe i pseudokod'),
  ('alg-liczbowe',     'algorytmy', 3, 'Algorytmy na liczbach: NWD, liczby pierwsze, konwersje systemów'),
  ('alg-wyszukiwanie', 'algorytmy', 4, 'Wyszukiwanie liniowe i binarne'),
  ('alg-sortowanie',   'algorytmy', 5, 'Sortowanie: bąbelkowe, przez wybór, przez wstawianie'),
  ('alg-strukturalne', 'algorytmy', 6, 'Zasady programowania strukturalnego i czytelność kodu'),
  ('alg-zlozonosc',    'algorytmy', 7, 'Złożoność obliczeniowa — porównywanie algorytmów'),

  -- INF.03.6 — język angielski zawodowy
  ('ang-slownictwo',   'angielski', 1, 'Słownictwo branżowe: sprzęt, sieci, programowanie, bazy danych'),
  ('ang-dokumentacja', 'angielski', 2, 'Czytanie dokumentacji technicznej i komunikatów błędów'),
  ('ang-instrukcje',   'angielski', 3, 'Instrukcje obsługi i opisy produktów'),
  ('ang-komunikacja',  'angielski', 4, 'Komunikacja w zespole i korespondencja zawodowa'),
  ('ang-rozmowa',      'angielski', 5, 'Rozmowa o kwalifikacjach i doświadczeniu zawodowym'),

  -- dopisane do działów, które już istniały
  ('js-biblioteki',    'javascript', 1, 'Biblioteki i frameworki JavaScript: jQuery, React, Angular — przegląd'),
  ('js-devtools',      'javascript', 2, 'Narzędzia deweloperskie przeglądarki i debugowanie skryptów'),
  ('php-pliki',        'php', 1, 'Obsługa plików: odczyt, zapis i przesyłanie na serwer'),
  ('sql-erd',          'sql', 1, 'Diagramy E/R: notacje, encje, związki i ich liczebność'),
  ('sql-podzapytania', 'sql', 2, 'Podzapytania i zapytania zagnieżdżone'),
  ('sql-raporty',      'sql', 3, 'Kwerendy, formularze i raporty w systemie bazodanowym'),
  ('sql-import',       'sql', 4, 'Import i eksport danych oraz struktury bazy'),
  ('sql-spojnosc',     'sql', 5, 'Spójność bazy, diagnostyka i naprawa'),
  ('cms-joomla',       'cms', 1, 'Joomla! — instalacja, konfiguracja i administracja'),
  ('dok-seo',          'dokumentacja', 1, 'Pozycjonowanie i SEO strony internetowej'),
  ('dok-optymalizacja','dokumentacja', 2, 'Optymalizacja strony: wydajność i rozmiar zasobów'),
  ('dok-instrukcja',   'dokumentacja', 3, 'Instrukcja użytkownika i dokumentacja techniczna aplikacji')
),
-- pozycje liczymy od tego, co już jest w dziale: nauczyciel mógł dodać własne
-- podtematy w panelu, a para (category_id, position) jest unikalna
poczatek as (
  select n.cat, coalesce(max(s.position), 0) as od
  from nowe n
  left join subtopics s on s.category_id = n.cat
  group by n.cat
)
insert into subtopics (id, category_id, position, title)
select n.id, n.cat, p.od + row_number() over (partition by n.cat order by n.ord), n.title
from nowe n
join poczatek p on p.cat = n.cat
where not exists (select 1 from subtopics s2 where s2.id = n.id);

-- -----------------------------------------------------------------------------
-- 4. Kolejność działów
-- -----------------------------------------------------------------------------
-- Stare działy wracają ze strefy roboczej na swoje miejsca, przeplecione nowymi.

update categories set position = v.pos
from (values
  ('bhp', 1), ('podstawy', 2), ('html-css', 3), ('multimedia', 4), ('grafika', 5),
  ('cms', 6), ('algorytmy', 7), ('javascript', 8), ('cpp', 9), ('sql', 10),
  ('php', 11), ('serwer', 12), ('bezpieczenstwo', 13), ('dokumentacja', 14), ('angielski', 15)
) as v(id, pos)
where categories.id = v.id;

-- Kategorie dodane ręcznie w panelu zostają — dopinamy je na koniec listy,
-- zamiast zostawiać z numerem 100+ albo wywracać migrację konfliktem pozycji.
do $$
declare
  r record;
  n int;
begin
  select coalesce(max(position), 0) into n from categories where qualification = 'inf03' and position < 100;
  for r in select id from categories where qualification = 'inf03' and position >= 100 order by position loop
    n := n + 1;
    update categories set position = n where id = r.id;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Materiały
-- -----------------------------------------------------------------------------
-- Tylko tam, gdzie istnieje sensowne, trwałe źródło. Przy BHP, języku obcym
-- i kompetencjach miękkich nauczyciel dokłada własne materiały w panelu.

insert into subtopic_links (subtopic_id, label, url, sort_order)
select v.subtopic_id, v.label, v.url, v.sort_order
from (values
  ('pod-sieci',        'Khan Academy — Internet 101',                'https://www.khanacademy.org/computing/computers-and-internet', 0),
  ('pod-adresacja',    'MDN — czym jest DNS',                        'https://developer.mozilla.org/en-US/docs/Glossary/DNS', 0),
  ('pod-liczby',       'Khan Academy — systemy liczbowe',            'https://www.khanacademy.org/math/algebra-home/alg-intro-to-algebra/algebra-alternate-number-bases', 0),
  ('pod-binarne',      'w3schools — operatory bitowe',               'https://www.w3schools.com/js/js_bitwise.asp', 0),
  ('pod-cyber',        'CERT Polska — poradniki',                    'https://cert.pl/poradniki/', 0),
  ('pod-dane-osobowe', 'UODO — RODO dla najmłodszych i szkół',       'https://uodo.gov.pl/pl/138', 0),

  ('mm-formaty',       'MDN — formaty mediów w sieci',               'https://developer.mozilla.org/en-US/docs/Web/Media/Formats', 0),
  ('mm-osadzanie',     'MDN — wideo i audio w HTML',                 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content', 0),
  ('mm-animacje',      'MDN — animacje CSS',                         'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations', 0),
  ('mm-barwy',         'WebAIM — kontrast kolorów',                  'https://webaim.org/resources/contrastchecker/', 0),
  ('mm-typografia',    'MDN — podstawy typografii w CSS',            'https://developer.mozilla.org/en-US/docs/Learn/CSS/Styling_text/Fundamentals', 0),

  ('alg-schematy',     'Wikipedia — schemat blokowy',                'https://pl.wikipedia.org/wiki/Schemat_blokowy', 0),
  ('alg-wyszukiwanie', 'Khan Academy — wyszukiwanie binarne',        'https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search', 0),
  ('alg-sortowanie',   'Khan Academy — algorytmy sortowania',        'https://www.khanacademy.org/computing/computer-science/algorithms', 0),
  ('alg-zlozonosc',    'Khan Academy — notacja asymptotyczna',       'https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation', 0),

  ('js-biblioteki',    'React — oficjalny samouczek',                'https://react.dev/learn', 0),
  ('js-biblioteki',    'jQuery — dokumentacja',                      'https://api.jquery.com/', 1),
  ('js-devtools',      'Chrome DevTools — debugowanie JavaScriptu',  'https://developer.chrome.com/docs/devtools/javascript/', 0),

  ('php-pliki',        'PHP — obsługa plików',                       'https://www.php.net/manual/en/book.filesystem.php', 0),
  ('php-pliki',        'PHP — przesyłanie plików na serwer',         'https://www.php.net/manual/en/features.file-upload.php', 1),

  ('sql-erd',          'Lucidchart — diagramy E/R',                  'https://www.lucidchart.com/pages/er-diagrams', 0),
  ('sql-podzapytania', 'w3schools — podzapytania SQL',               'https://www.w3schools.com/sql/sql_ref_in.asp', 0),
  ('sql-import',       'phpMyAdmin — import i eksport',              'https://docs.phpmyadmin.net/en/latest/import_export.html', 0),

  ('cms-joomla',       'Joomla! — dokumentacja dla początkujących',  'https://docs.joomla.org/Portal:Beginners', 0),

  ('dok-seo',          'Google — podstawy SEO',                      'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 0),
  ('dok-optymalizacja','web.dev — szybkość ładowania strony',        'https://web.dev/explore/fast', 0)
) as v(subtopic_id, label, url, sort_order)
where exists (select 1 from subtopics s where s.id = v.subtopic_id)
  and not exists (
    select 1 from subtopic_links l where l.subtopic_id = v.subtopic_id and l.url = v.url
  );
