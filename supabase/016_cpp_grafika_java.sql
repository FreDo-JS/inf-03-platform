-- =============================================================================
-- 016_cpp_grafika_java.sql — nowe działy w mapie nauki
--
-- Uruchom po 015_admin_invites.sql.
--
-- INF.03 dostaje dwa działy teoretyczne: podstawy C++ oraz grafikę komputerową
-- na przykładzie GIMP-a. INF.04 dostaje C++ i Javę jako drugie języki obok C#
-- (arkusz praktyczny dopuszcza C++, C#, Javę i Pythona w części konsolowej).
--
-- To wyłącznie dane: kategorie, podtematy i odnośniki. Wszystko można później
-- zmienić w panelu nauczyciela, bez ruszania kodu.
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'categories' and column_name = 'qualification') then
    raise exception 'Brakuje migracji 010_inf04.sql — uruchom migracje po kolei przed 016.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Kategorie
-- -----------------------------------------------------------------------------
insert into categories (id, position, title, description, qualification) values
  ('cpp',     9,  'Podstawy C++',              'Budowa programu, typy, instrukcje sterujące, funkcje i tablice — od strony teoretycznej.', 'inf03'),
  ('grafika', 10, 'Grafika komputerowa (GIMP)', 'Rastry i wektory, rozdzielczość, tryby barw, formaty i kompresja, warstwy, maski, przygotowanie grafiki na stronę.', 'inf03'),
  ('inf04-cpp',  13, 'Programowanie w C++',  'Drugi język części konsolowej: wskaźniki, referencje, klasy, biblioteka standardowa. (INF.04.4)', 'inf04'),
  ('inf04-java', 14, 'Programowanie w Javie', 'JVM, klasy i interfejsy, kolekcje, wyjątki oraz okienkowe Swing i JavaFX. (INF.04.4–INF.04.5)', 'inf04')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Podtematy
-- -----------------------------------------------------------------------------
insert into subtopics (id, category_id, position, title, theory_url, tasks_url) values
  -- INF.03 · C++ (teoria)
  ('cpp-budowa',      'cpp', 1, 'Budowa programu: funkcja main, dyrektywy include, kompilacja i uruchomienie', null, null),
  ('cpp-typy',        'cpp', 2, 'Typy danych, zmienne, stałe i konwersje typów', null, null),
  ('cpp-operatory',   'cpp', 3, 'Operatory arytmetyczne, porównania i logiczne', null, null),
  ('cpp-wejscie',     'cpp', 4, 'Wejście i wyjście: cin, cout i strumienie', null, null),
  ('cpp-warunki',     'cpp', 5, 'Instrukcje warunkowe: if, else if, switch', null, null),
  ('cpp-petle',       'cpp', 6, 'Pętle for, while i do…while oraz instrukcje break i continue', null, null),
  ('cpp-funkcje',     'cpp', 7, 'Funkcje: parametry, wartość zwracana, przeciążanie', null, null),
  ('cpp-tablice',     'cpp', 8, 'Tablice jedno- i dwuwymiarowe oraz napisy', null, null),
  ('cpp-wskazniki',   'cpp', 9, 'Wskaźniki i referencje — teoria i typowe zastosowania', null, null),
  ('cpp-obiekty',     'cpp', 10, 'Wstęp do programowania obiektowego: klasa, obiekt, konstruktor', null, null),

  -- INF.03 · Grafika komputerowa
  ('gfx-raster-wektor', 'grafika', 1, 'Grafika rastrowa a wektorowa — różnice i zastosowania', null, null),
  ('gfx-rozdzielczosc', 'grafika', 2, 'Rozdzielczość, wymiary w pikselach, DPI i rozmiar wydruku', null, null),
  ('gfx-barwy',         'grafika', 3, 'Tryby barw: RGB, CMYK, skala szarości, głębia kolorów', null, null),
  ('gfx-formaty',       'grafika', 4, 'Formaty plików i kompresja: JPG, PNG, GIF, WebP, SVG', null, null),
  ('gfx-przezroczystosc', 'grafika', 5, 'Kanał alfa i przezroczystość — kiedy PNG, a kiedy JPG', null, null),
  ('gfx-warstwy',       'grafika', 6, 'Warstwy, krycie i tryby mieszania w GIMP-ie', null, null),
  ('gfx-zaznaczenia',   'grafika', 7, 'Zaznaczenia i maski warstw', null, null),
  ('gfx-narzedzia',     'grafika', 8, 'Narzędzia GIMP-a: kadrowanie, skalowanie, retusz, tekst', null, null),
  ('gfx-web',           'grafika', 9, 'Przygotowanie grafiki na stronę WWW: eksport i optymalizacja rozmiaru', null, null),
  ('gfx-prawo',         'grafika', 10, 'Prawo autorskie, licencje zdjęć i banki grafik', null, null),

  -- INF.04 · C++
  ('inf04-cpp-start',     'inf04-cpp', 1, 'Pierwszy program, kompilacja i uruchomienie aplikacji konsolowej', null, null),
  ('inf04-cpp-typy',      'inf04-cpp', 2, 'Typy danych, zmienne, stałe i konwersje', null, null),
  ('inf04-cpp-sterowanie','inf04-cpp', 3, 'Instrukcje warunkowe i pętle', null, null),
  ('inf04-cpp-funkcje',   'inf04-cpp', 4, 'Funkcje: przekazywanie przez wartość, wskaźnik i referencję', null, null),
  ('inf04-cpp-tablice',   'inf04-cpp', 5, 'Tablice, napisy i kontener vector', null, null),
  ('inf04-cpp-klasy',     'inf04-cpp', 6, 'Klasy i obiekty: pola, metody, konstruktor, hermetyzacja', null, null),
  ('inf04-cpp-dziedziczenie', 'inf04-cpp', 7, 'Dziedziczenie, metody wirtualne i polimorfizm', null, null),
  ('inf04-cpp-stl',       'inf04-cpp', 8, 'Biblioteka standardowa: string, vector, sortowanie i wyszukiwanie', null, null),

  -- INF.04 · Java
  ('inf04-java-start',    'inf04-java', 1, 'JDK, kompilacja do kodu bajtowego i uruchomienie na JVM', null, null),
  ('inf04-java-typy',     'inf04-java', 2, 'Typy proste i obiektowe, zmienne, konwersje', null, null),
  ('inf04-java-sterowanie','inf04-java', 3, 'Instrukcje warunkowe, pętle i tablice', null, null),
  ('inf04-java-klasy',    'inf04-java', 4, 'Klasy, obiekty, konstruktory i kwalifikatory dostępu', null, null),
  ('inf04-java-oop',      'inf04-java', 5, 'Dziedziczenie, klasy abstrakcyjne i interfejsy', null, null),
  ('inf04-java-kolekcje', 'inf04-java', 6, 'Kolekcje: ArrayList i HashMap', null, null),
  ('inf04-java-wyjatki',  'inf04-java', 7, 'Obsługa wyjątków: try, catch, finally', null, null),
  ('inf04-java-okna',     'inf04-java', 8, 'Aplikacje okienkowe: Swing i JavaFX (FXML, Scene Builder)', null, null)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Materiały
--
-- Wstawiamy tylko to, czego jeszcze nie ma — migracja musi dać się uruchomić
-- drugi raz bez dublowania odnośników.
-- -----------------------------------------------------------------------------
insert into subtopic_links (subtopic_id, label, url, sort_order)
select v.subtopic_id, v.label, v.url, v.sort_order
from (values
  -- C++ (INF.03)
  ('cpp-budowa',    'learncpp — pierwszy program',            'https://www.learncpp.com/cpp-tutorial/introduction-to-programming-languages/', 0),
  ('cpp-budowa',    'w3schools — C++ od podstaw',             'https://www.w3schools.com/cpp/', 1),
  ('cpp-typy',      'learncpp — typy podstawowe',             'https://www.learncpp.com/cpp-tutorial/introduction-to-fundamental-data-types/', 0),
  ('cpp-operatory', 'cppreference — operatory',               'https://en.cppreference.com/w/cpp/language/operator_precedence', 0),
  ('cpp-wejscie',   'learncpp — cin i cout',                  'https://www.learncpp.com/cpp-tutorial/introduction-to-iostream-cout-cin-and-endl/', 0),
  ('cpp-warunki',   'w3schools — instrukcje warunkowe',       'https://www.w3schools.com/cpp/cpp_conditions.asp', 0),
  ('cpp-petle',     'w3schools — pętle',                      'https://www.w3schools.com/cpp/cpp_for_loop.asp', 0),
  ('cpp-funkcje',   'learncpp — funkcje',                     'https://www.learncpp.com/cpp-tutorial/introduction-to-functions/', 0),
  ('cpp-tablice',   'w3schools — tablice',                    'https://www.w3schools.com/cpp/cpp_arrays.asp', 0),
  ('cpp-wskazniki', 'learncpp — wskaźniki',                   'https://www.learncpp.com/cpp-tutorial/introduction-to-pointers/', 0),
  ('cpp-wskazniki', 'learncpp — referencje',                  'https://www.learncpp.com/cpp-tutorial/lvalue-references/', 1),
  ('cpp-obiekty',   'learncpp — klasy i obiekty',             'https://www.learncpp.com/cpp-tutorial/introduction-to-object-oriented-programming/', 0),

  -- Grafika (INF.03)
  ('gfx-raster-wektor', 'GIMP — podręcznik po polsku',        'https://docs.gimp.org/2.10/pl/', 0),
  ('gfx-rozdzielczosc', 'GIMP — zmiana rozmiaru obrazu',      'https://docs.gimp.org/2.10/pl/gimp-image-scale.html', 0),
  ('gfx-barwy',         'GIMP — tryby obrazu i kolory',       'https://docs.gimp.org/2.10/pl/gimp-image-mode.html', 0),
  ('gfx-formaty',       'GIMP — eksport do różnych formatów', 'https://docs.gimp.org/2.10/pl/gimp-images-out.html', 0),
  ('gfx-przezroczystosc', 'GIMP — przezroczystość warstw',    'https://docs.gimp.org/2.10/pl/gimp-layer-alpha-add.html', 0),
  ('gfx-warstwy',       'GIMP — praca z warstwami',           'https://docs.gimp.org/2.10/pl/gimp-concepts-layers.html', 0),
  ('gfx-zaznaczenia',   'GIMP — zaznaczenia',                 'https://docs.gimp.org/2.10/pl/gimp-concepts-selection.html', 0),
  ('gfx-narzedzia',     'GIMP — przybornik narzędzi',         'https://docs.gimp.org/2.10/pl/gimp-toolbox.html', 0),
  ('gfx-narzedzia',     'GIMP — samouczki',                   'https://www.gimp.org/tutorials/', 1),
  ('gfx-web',           'MDN — formaty obrazów w sieci',      'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types', 0),
  ('gfx-prawo',         'Creative Commons — rodzaje licencji', 'https://creativecommons.org/share-your-work/cclicenses/', 0),

  -- C++ (INF.04)
  ('inf04-cpp-start',       'learncpp — kurs od podstaw',     'https://www.learncpp.com/', 0),
  ('inf04-cpp-typy',        'cppreference — typy podstawowe', 'https://en.cppreference.com/w/cpp/language/types', 0),
  ('inf04-cpp-sterowanie',  'w3schools — C++ warunki i pętle','https://www.w3schools.com/cpp/cpp_conditions.asp', 0),
  ('inf04-cpp-funkcje',     'learncpp — przekazywanie przez referencję', 'https://www.learncpp.com/cpp-tutorial/pass-by-lvalue-reference/', 0),
  ('inf04-cpp-tablice',     'cppreference — std::vector',     'https://en.cppreference.com/w/cpp/container/vector', 0),
  ('inf04-cpp-klasy',       'learncpp — klasy',               'https://www.learncpp.com/cpp-tutorial/classes-and-class-members/', 0),
  ('inf04-cpp-dziedziczenie','learncpp — dziedziczenie i polimorfizm', 'https://www.learncpp.com/cpp-tutorial/introduction-to-inheritance/', 0),
  ('inf04-cpp-stl',         'cppreference — biblioteka standardowa', 'https://en.cppreference.com/w/cpp', 0),

  -- Java (INF.04)
  ('inf04-java-start',      'Oracle — samouczek Javy',        'https://docs.oracle.com/javase/tutorial/', 0),
  ('inf04-java-start',      'w3schools — Java od podstaw',    'https://www.w3schools.com/java/', 1),
  ('inf04-java-typy',       'Oracle — typy danych',           'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html', 0),
  ('inf04-java-sterowanie', 'Oracle — instrukcje sterujące',  'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/flow.html', 0),
  ('inf04-java-klasy',      'Oracle — klasy i obiekty',       'https://docs.oracle.com/javase/tutorial/java/javaOO/', 0),
  ('inf04-java-oop',        'Oracle — interfejsy i dziedziczenie', 'https://docs.oracle.com/javase/tutorial/java/IandI/', 0),
  ('inf04-java-kolekcje',   'Oracle — kolekcje',              'https://docs.oracle.com/javase/tutorial/collections/', 0),
  ('inf04-java-wyjatki',    'Oracle — obsługa wyjątków',      'https://docs.oracle.com/javase/tutorial/essential/exceptions/', 0),
  ('inf04-java-okna',       'Oracle — tworzenie GUI w Swingu','https://docs.oracle.com/javase/tutorial/uiswing/', 0),
  ('inf04-java-okna',       'OpenJFX — dokumentacja JavaFX',  'https://openjfx.io/', 1)
) as v(subtopic_id, label, url, sort_order)
where not exists (
  select 1 from subtopic_links l where l.subtopic_id = v.subtopic_id and l.url = v.url
);
