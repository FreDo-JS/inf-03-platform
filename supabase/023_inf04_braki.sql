-- =============================================================================
-- 023_inf04_braki.sql — mapa INF.04 uzupełniona o braki z programu nauczania
--
-- Uruchom po 022_przedmioty_nauczyciele.sql.
--
-- Porównanie z programem nauczania technika programisty (wersja 2022, wariant
-- ze sztuczną inteligencją). Struktura mapy była dobra — czternaście działów
-- odpowiada jednostkom efektów INF.04.1–11 — ale w środku brakowało rzeczy,
-- które podstawa wymienia wprost:
--
--   INF.04.3  wzorce projektowe, narzędzia zarządzania projektem, architektura
--             klient-serwer, algorytmy tekstowe i heurystyczne, prawo autorskie
--   INF.04.4  wyjątki, metody wirtualne, klasy abstrakcyjne, szablony klas,
--             składniki statyczne — w mapie były TYLKO przy C++ i Javie,
--             a nie w ścieżce C#, którą szkoła uczy jako główną
--   INF.04.6  dane i preferencje, sieć, baza danych, publikacja w sklepie
--   INF.04.7  sesje i ciasteczka, logowanie i kontrola dostępu, jQuery
--   INF.04.8  testy niefunkcjonalne, scenariusze, automatyzacja, raportowanie
--             błędów, środowiska testowe, instrukcja użytkownika, optymalizacja
--
-- Sztuczna inteligencja (przedmiot specjalizacyjny) jest osobno, w 024.
--
-- To wyłącznie dane. Pozycje podtematów liczymy od tego, co już jest w dziale,
-- bo nauczyciel mógł dodać własne w panelu.
-- =============================================================================

do $$
begin
  if to_regclass('public.subtopics') is null then
    raise exception 'Brakuje schema.sql — uruchom migracje po kolei przed 023.';
  end if;
  if not exists (select 1 from categories where id = 'inf04-oop') then
    raise exception 'Brakuje migracji 011_inf04_seed.sql — uruchom migracje po kolei przed 023.';
  end if;
end $$;

with nowe (id, cat, ord, title) as (
  values
  -- INF.04.3 — projektowanie oprogramowania
  ('inf04-wzorce',      'inf04-projektowanie', 1, 'Wzorce projektowe: metoda szablonowa, fasada, kompozyt'),
  ('inf04-paradygmaty', 'inf04-projektowanie', 2, 'Paradygmaty programowania: strukturalny i obiektowy'),
  ('inf04-klient-serwer','inf04-projektowanie', 3, 'Architektura klient-serwer i podział odpowiedzialności'),
  ('inf04-alg-tekst',   'inf04-projektowanie', 4, 'Algorytmy tekstowe i szyfrowanie (Cezar, przestawienia)'),
  ('inf04-alg-heur',    'inf04-projektowanie', 5, 'Algorytmy heurystyczne i problem komiwojażera'),
  ('inf04-narzedzia',   'inf04-projektowanie', 6, 'Narzędzia zarządzania projektem: Jira, Trello, diagram Gantta'),
  ('inf04-zabezpieczenia','inf04-projektowanie', 7, 'Planowanie zabezpieczeń aplikacji'),
  ('inf04-prawo',       'inf04-projektowanie', 8, 'Prawo autorskie, licencje oprogramowania i własność intelektualna'),

  -- INF.04.4 — programowanie obiektowe (ścieżka C#)
  ('inf04-wyjatki',     'inf04-oop', 1, 'Obsługa wyjątków: try, catch, finally i throw'),
  ('inf04-wirtualne',   'inf04-oop', 2, 'Metody wirtualne, klasy abstrakcyjne i interfejsy'),
  ('inf04-szablony',    'inf04-oop', 3, 'Szablony klas i typy ogólne (generics)'),
  ('inf04-statyczne',   'inf04-oop', 4, 'Składniki statyczne klasy i metody dostępowe'),
  ('inf04-konstruktory','inf04-oop', 5, 'Konstruktor kopiujący i sprzątanie po obiekcie'),
  ('inf04-biblioteki',  'inf04-oop', 6, 'Biblioteka standardowa języka i korzystanie z pakietów'),
  ('inf04-kompilacja',  'inf04-oop', 7, 'Kompilator, interpreter i etapy budowania programu'),

  -- INF.04.6 — aplikacje mobilne
  ('inf04-mob-dane',    'inf04-mobile', 1, 'Przechowywanie danych i preferencji użytkownika'),
  ('inf04-mob-siec',    'inf04-mobile', 2, 'Pobieranie i wysyłanie danych przez internet (REST, JSON)'),
  ('inf04-mob-baza',    'inf04-mobile', 3, 'Aplikacja mobilna korzystająca z bazy danych'),
  ('inf04-mob-publikacja','inf04-mobile', 4, 'Uruchomienie na urządzeniu i przygotowanie do publikacji w sklepie'),

  -- INF.04.7 — zaawansowane aplikacje webowe
  ('inf04-sesje',       'inf04-web', 1, 'Sesje użytkownika i ciasteczka'),
  ('inf04-logowanie',   'inf04-web', 2, 'System logowania i kontrola dostępu do podstron'),
  ('inf04-jquery',      'inf04-web', 3, 'jQuery — biblioteka wymieniona w podstawie obok frameworków'),
  ('inf04-funkcje-serwisu','inf04-web', 4, 'Elementy e-sklepu, portalu i serwisu rezerwacyjnego'),

  -- INF.04.8 — testowanie i dokumentowanie
  ('inf04-test-scenariusze','inf04-testowanie', 1, 'Scenariusze testowe: planowanie i zapisywanie przypadków'),
  ('inf04-test-niefunkcjonalne','inf04-testowanie', 2, 'Testy niefunkcjonalne: wydajnościowe, obciążeniowe, użyteczności, bezpieczeństwa'),
  ('inf04-test-interfejs','inf04-testowanie', 3, 'Testy interfejsu i prototypu'),
  ('inf04-test-automat','inf04-testowanie', 4, 'Automatyzacja testowania'),
  ('inf04-test-srodowisko','inf04-testowanie', 5, 'Przygotowanie środowiska testowego'),
  ('inf04-test-raporty','inf04-testowanie', 6, 'Raportowanie błędów: Jira, Bugzilla'),
  ('inf04-test-instrukcja','inf04-testowanie', 7, 'Instrukcja użytkownika i pomoc programu'),
  ('inf04-test-optymalizacja','inf04-testowanie', 8, 'Optymalizacja kodu źródłowego')
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

-- Materiały tam, gdzie istnieje trwałe źródło.
insert into subtopic_links (subtopic_id, label, url, sort_order)
select v.subtopic_id, v.label, v.url, v.sort_order
from (values
  ('inf04-wzorce',      'Refactoring Guru — wzorce projektowe po polsku', 'https://refactoring.guru/pl/design-patterns', 0),
  ('inf04-klient-serwer','MDN — jak działa model klient-serwer',          'https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Client-Server_overview', 0),
  ('inf04-narzedzia',   'Atlassian — czym jest diagram Gantta',           'https://www.atlassian.com/pl/agile/project-management/gantt-chart', 0),
  ('inf04-prawo',       'Creative Commons — rodzaje licencji',            'https://creativecommons.org/share-your-work/cclicenses/', 0),

  ('inf04-wyjatki',     'Microsoft Learn — wyjątki w C#',                 'https://learn.microsoft.com/pl-pl/dotnet/csharp/fundamentals/exceptions/', 0),
  ('inf04-wirtualne',   'Microsoft Learn — polimorfizm w C#',             'https://learn.microsoft.com/pl-pl/dotnet/csharp/fundamentals/object-oriented/polymorphism', 0),
  ('inf04-szablony',    'Microsoft Learn — typy ogólne',                  'https://learn.microsoft.com/pl-pl/dotnet/csharp/fundamentals/types/generics', 0),
  ('inf04-statyczne',   'Microsoft Learn — składowe statyczne',           'https://learn.microsoft.com/pl-pl/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members', 0),

  ('inf04-mob-dane',    'Microsoft Learn — Preferences w .NET MAUI',      'https://learn.microsoft.com/pl-pl/dotnet/maui/platform-integration/storage/preferences', 0),
  ('inf04-mob-siec',    'Microsoft Learn — HttpClient i JSON',            'https://learn.microsoft.com/pl-pl/dotnet/maui/data-cloud/rest', 0),

  ('inf04-sesje',       'MDN — ciasteczka HTTP',                          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies', 0),
  ('inf04-jquery',      'jQuery — dokumentacja',                          'https://api.jquery.com/', 0),

  ('inf04-test-niefunkcjonalne', 'web.dev — pomiar wydajności',           'https://web.dev/explore/fast', 0),
  ('inf04-test-automat','Playwright — automatyzacja testów',              'https://playwright.dev/docs/intro', 0)
) as v(subtopic_id, label, url, sort_order)
where exists (select 1 from subtopics s where s.id = v.subtopic_id)
  and not exists (
    select 1 from subtopic_links l where l.subtopic_id = v.subtopic_id and l.url = v.url
  );
