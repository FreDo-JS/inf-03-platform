-- =============================================================================
-- 011_inf04_seed.sql — mapa nauki dla INF.04 (technik programista)
--
-- Uruchom po 010_inf04.sql.
--
-- Zakres: wszystkie 11 jednostek INF.04.1–INF.04.11 plus blok przygotowania do
-- części praktycznej. Technologie dobrane pod szkołę: C# (konsola, desktop,
-- mobile przez .NET MAUI) i React (część webowa). Angular i Java pojawiają się
-- tylko tam, gdzie pyta o nie arkusz — nie jako materiał do nauki.
--
-- Wszystko jest danymi: kategorie, podtematy i linki możesz potem zmieniać
-- w panelu nauczyciela bez ruszania kodu.
-- =============================================================================

do $$
begin
  if to_regclass('public.categories') is null
     or not exists (select 1 from information_schema.columns
                    where table_schema = 'public' and table_name = 'categories' and column_name = 'qualification') then
    raise exception 'Brakuje migracji 010_inf04.sql — uruchom ją przed 011_inf04_seed.sql.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Kategorie (position = kolejność w roku szkolnym, patrz plan 36 tygodni)
-- -----------------------------------------------------------------------------
insert into categories (id, position, title, description, qualification) values
  ('inf04-bhp',           1,  'BHP i ergonomia pracy',            'Stanowisko programisty, zagrożenia przy pracy siedzącej, przepisy i pierwsza pomoc. (INF.04.1)', 'inf04'),
  ('inf04-podstawy',      2,  'Podstawy informatyki',             'Systemy liczbowe, kolory HEX, kodowanie znaków, sieć i HTTP w pracy aplikacji. (INF.04.2)', 'inf04'),
  ('inf04-projektowanie', 3,  'Projektowanie oprogramowania',     'Typy i struktury danych, algorytmy, złożoność Big O, cykl życia projektu. (INF.04.3)', 'inf04'),
  ('inf04-oop',           4,  'Programowanie obiektowe w C#',     'Konsola w C#, klasy i obiekty, kwalifikatory dostępu, filary OOP. Rdzeń części praktycznej. (INF.04.4)', 'inf04'),
  ('inf04-desktop',       5,  'Aplikacje desktopowe (WinForms/WPF)', 'Visual Studio, kontrolki, okna modalne i niemodalne, obsługa zdarzeń. (INF.04.5)', 'inf04'),
  ('inf04-mobile',        6,  'Aplikacje mobilne (.NET MAUI)',    'XAML, kontrolki, layouty, Data Binding, różnice między platformami. (INF.04.6)', 'inf04'),
  ('inf04-web',           7,  'Zaawansowane aplikacje webowe (React)', 'Komponenty, stan, zdarzenia, routing, asynchroniczność i JSON, backend ASP.NET Core. (INF.04.7)', 'inf04'),
  ('inf04-testowanie',    8,  'Testowanie i dokumentowanie',      'Debugowanie, testy jednostkowe w Jest i xUnit, dokumentacja kodu i wdrożenia. (INF.04.8)', 'inf04'),
  ('inf04-jezyk',         9,  'Język obcy zawodowy',              'Dokumentacja techniczna po angielsku i nazewnictwo algorytmów. (INF.04.9)', 'inf04'),
  ('inf04-kompetencje',   10, 'Kompetencje personalne i społeczne', 'Rozmowa z klientem, aktywne słuchanie, parafraza, zbieranie wymagań. (INF.04.10)', 'inf04'),
  ('inf04-zespol',        11, 'Praca zespołowa, Git i Scrum',     'Podział zadań, repozytorium kodu, sprint, backlog, daily stand-up. (INF.04.11)', 'inf04'),
  ('inf04-egzamin',       12, 'Przygotowanie do egzaminu',        'Część pisemna (40 zadań / 60 min) i praktyczna (180 min): konsola, aplikacja, dokumentacja.', 'inf04')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Podtematy
--
-- theory_url / tasks_url zostawiamy puste — materiały trzymamy wyłącznie
-- w subtopic_links (od migracji 003 to jest jedyny mechanizm linków).
-- -----------------------------------------------------------------------------
insert into subtopics (id, category_id, position, title, theory_url, tasks_url) values
  -- INF.04.1 — BHP
  ('inf04-bhp-stanowisko',     'inf04-bhp', 1, 'Ergonomiczne stanowisko programisty: krzesło, monitor, podłokietniki', null, null),
  ('inf04-bhp-zagrozenia',     'inf04-bhp', 2, 'Zagrożenia przy długiej pracy siedzącej: wzrok, kręgosłup, przerwy', null, null),
  ('inf04-bhp-przepisy',       'inf04-bhp', 3, 'Przepisy BHP w pracowni i zasady pierwszej pomocy', null, null),

  -- INF.04.2 — Podstawy informatyki
  ('inf04-systemy-liczbowe',   'inf04-podstawy', 1, 'Systemy liczbowe: binarny, ósemkowy, szesnastkowy i konwersje', null, null),
  ('inf04-kolory-hex',         'inf04-podstawy', 2, 'Kolory HEX i RGB — zamiana #AA41FF na wartości składowych', null, null),
  ('inf04-kodowanie-znakow',   'inf04-podstawy', 3, 'Reprezentacja danych: ASCII i UTF-8', null, null),
  ('inf04-siec-http',          'inf04-podstawy', 4, 'TCP/IP i HTTP — jak uruchamiana aplikacja komunikuje się z siecią', null, null),

  -- INF.04.3 — Projektowanie oprogramowania
  ('inf04-typy-danych',        'inf04-projektowanie', 1, 'Typy danych proste i złożone, kolekcje, pojęcie iteratora', null, null),
  ('inf04-stos-kolejka',       'inf04-projektowanie', 2, 'Stos (push, pop, peek, isEmpty) i kolejka — LIFO kontra FIFO', null, null),
  ('inf04-listy-drzewa',       'inf04-projektowanie', 3, 'Listy i drzewa binarne', null, null),
  ('inf04-sortowanie',         'inf04-projektowanie', 4, 'Sortowanie: bąbelkowe, przez wstawianie, szybkie (quicksort)', null, null),
  ('inf04-wyszukiwanie',       'inf04-projektowanie', 5, 'Wyszukiwanie liniowe i binarne', null, null),
  ('inf04-zlozonosc',          'inf04-projektowanie', 6, 'Złożoność obliczeniowa i notacja Big O', null, null),
  ('inf04-cykl-zycia',         'inf04-projektowanie', 7, 'Cykl życia projektu: kaskadowy, spiralny, z prototypem, zwinny', null, null),
  ('inf04-analiza-wymagan',    'inf04-projektowanie', 8, 'Analiza wymagań klienta i projektowanie interfejsu', null, null),

  -- INF.04.4 — Programowanie obiektowe (C#)
  ('inf04-csharp-start',       'inf04-oop', 1, 'Środowisko C#: tworzenie, kompilacja i uruchomienie aplikacji konsolowej', null, null),
  ('inf04-csharp-skladnia',    'inf04-oop', 2, 'Zmienne, instrukcje warunkowe i pętle (for, while, do-while)', null, null),
  ('inf04-csharp-klasy',       'inf04-oop', 3, 'Klasa, obiekt, pole, metoda, konstruktor', null, null),
  ('inf04-csharp-dostep',      'inf04-oop', 4, 'Kwalifikatory dostępu: public, protected, private', null, null),
  ('inf04-oop-filary',         'inf04-oop', 5, 'Filary OOP: dziedziczenie, hermetyzacja, polimorfizm, przeciążanie', null, null),
  ('inf04-csharp-algorytmy',   'inf04-oop', 6, 'Algorytmy w praktyce: palindrom, odwracanie napisu, rekurencja', null, null),

  -- INF.04.5 — Aplikacje desktopowe
  ('inf04-desktop-ide',        'inf04-desktop', 1, 'Visual Studio i projekt WinForms — okno Properties, nazwa i kolor kontrolki', null, null),
  ('inf04-desktop-kontrolki',  'inf04-desktop', 2, 'Kontrolki: przyciski, pola tekstowe, listy, checkboxy, menu', null, null),
  ('inf04-desktop-okna',       'inf04-desktop', 3, 'Okna dialogowe modalne i niemodalne (ShowDialog kontra Show)', null, null),
  ('inf04-desktop-zdarzenia',  'inf04-desktop', 4, 'Zdarzenia myszy i klawiatury: click, focus, blur, keyup, keydown', null, null),
  ('inf04-desktop-wpf',        'inf04-desktop', 5, 'WPF i XAML — druga droga do aplikacji okienkowej w C#', null, null),

  -- INF.04.6 — Aplikacje mobilne
  ('inf04-maui-start',         'inf04-mobile', 1, '.NET MAUI: projekt aplikacji i uruchomienie w emulatorze', null, null),
  ('inf04-maui-xaml',          'inf04-mobile', 2, 'Kontrolki w XAML: Entry, Switch, Slider, Stepper, Picker', null, null),
  ('inf04-maui-layouty',       'inf04-mobile', 3, 'Layouty: liniowy (StackLayout) i względny (Grid, RelativeLayout)', null, null),
  ('inf04-maui-binding',       'inf04-mobile', 4, 'Data Binding — wiązanie kontrolki z właściwością obiektu', null, null),
  ('inf04-maui-zdarzenia',     'inf04-mobile', 5, 'Zdarzenia dotykowe: tapped, toggled, value changed', null, null),
  ('inf04-maui-platformy',     'inf04-mobile', 6, 'Dostosowanie do platformy — OnPlatform dla iOS i Androida', null, null),

  -- INF.04.7 — Aplikacje webowe (React)
  ('inf04-react-start',        'inf04-web', 1, 'React: uruchomienie projektu i serwer deweloperski na porcie 3000', null, null),
  ('inf04-react-komponenty',   'inf04-web', 2, 'Komponenty, props i stan (useState)', null, null),
  ('inf04-react-zdarzenia',    'inf04-web', 3, 'Obsługa zdarzeń i walidacja formularza w komponencie', null, null),
  ('inf04-react-routing',      'inf04-web', 4, 'Routing i aplikacje wielostronicowe', null, null),
  ('inf04-async-json',         'inf04-web', 5, 'Programowanie asynchroniczne: Promises, async/await, fetch i JSON', null, null),
  ('inf04-backend-aspnet',     'inf04-web', 6, 'Backend w ASP.NET Core Web API i komunikacja z frontendem', null, null),
  ('inf04-angular-na-egzamin', 'inf04-web', 7, 'Angular na egzaminie: port 4200, składnia komponentu, różnice wobec Reacta', null, null),

  -- INF.04.8 — Testowanie i dokumentowanie
  ('inf04-debugowanie',        'inf04-testowanie', 1, 'Debugowanie: wykonanie krokowe, pułapki, śledzenie zmiennych', null, null),
  ('inf04-testy-jest',         'inf04-testowanie', 2, 'Testy jednostkowe w JavaScripcie: Jest (describe, it, expect)', null, null),
  ('inf04-testy-xunit',        'inf04-testowanie', 3, 'Testy jednostkowe w C#: xUnit i dotnet test', null, null),
  ('inf04-dokumentacja-kodu',  'inf04-testowanie', 4, 'Dokumentacja kodu: nagłówek funkcji i komentarze XML w C#', null, null),
  ('inf04-dokumentacja-wdrozenia', 'inf04-testowanie', 5, 'Dokumentacja wdrożenia: opis środowiska, zrzuty ekranu, instrukcja', null, null),

  -- INF.04.9 — Język obcy zawodowy
  ('inf04-angielski-dokumentacja', 'inf04-jezyk', 1, 'Czytanie dokumentacji technicznej po angielsku', null, null),
  ('inf04-angielski-algorytmy',    'inf04-jezyk', 2, 'Angielskie nazwy algorytmów: binary, jump, ternary, exponential search', null, null),

  -- INF.04.10 — Kompetencje personalne i społeczne
  ('inf04-komunikacja-klient', 'inf04-kompetencje', 1, 'Rozmowa z klientem: aktywne słuchanie i parafraza wypowiedzi', null, null),
  ('inf04-pytania-wymagania',  'inf04-kompetencje', 2, 'Trafne pytania — jak wydobyć wymagania od zamawiającego', null, null),

  -- INF.04.11 — Organizacja pracy zespołu
  ('inf04-git',                'inf04-zespol', 1, 'Repozytorium kodu: commit, gałęzie, praca kilku osób naraz', null, null),
  ('inf04-scrum',              'inf04-zespol', 2, 'Scrum: sprint, backlog, daily stand-up', null, null),
  ('inf04-podzial-zadan',      'inf04-zespol', 3, 'Planowanie pracy zespołu i podział zadań', null, null),

  -- Przygotowanie do egzaminu
  ('inf04-egzamin-pisemny',    'inf04-egzamin', 1, 'Część pisemna: 40 zadań, 60 minut, próg 50% — i wagi jednostek', null, null),
  ('inf04-egzamin-konsola',    'inf04-egzamin', 2, 'Część praktyczna I: aplikacja konsolowa z algorytmem', null, null),
  ('inf04-egzamin-aplikacja',  'inf04-egzamin', 3, 'Część praktyczna II: aplikacja mobilna, desktopowa lub webowa', null, null),
  ('inf04-egzamin-dokumentacja', 'inf04-egzamin', 4, 'Część praktyczna III: dokumentacja obu aplikacji', null, null),
  ('inf04-egzamin-arkusze',    'inf04-egzamin', 5, 'Arkusze i testy do samodzielnego ćwiczenia', null, null)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Materiały
-- -----------------------------------------------------------------------------
-- Wstawiamy tylko to, czego jeszcze nie ma — migracje muszą dać się uruchomić
-- drugi raz bez dublowania materiałów (tabela ma własne id, więc on conflict nie pomoże).
insert into subtopic_links (subtopic_id, label, url, sort_order)
select v.subtopic_id, v.label, v.url, v.sort_order
from (values
  ('inf04-bhp-stanowisko',     'CIOP — ergonomia stanowiska komputerowego', 'https://www.ciop.pl/', 0),
  ('inf04-bhp-zagrozenia',     'CIOP — praca przy komputerze',              'https://www.ciop.pl/', 0),

  ('inf04-systemy-liczbowe',   'Konwerter systemów liczbowych',             'https://www.rapidtables.com/convert/number/', 0),
  ('inf04-systemy-liczbowe',   'Ćwiczenia z konwersji (w3schools)',         'https://www.w3schools.com/ai/ai_numbers.asp', 1),
  ('inf04-kolory-hex',         'Konwerter kolorów HEX ↔ RGB',               'https://www.w3schools.com/colors/colors_converter.asp', 0),
  ('inf04-kodowanie-znakow',   'MDN — UTF-8',                               'https://developer.mozilla.org/en-US/docs/Glossary/UTF-8', 0),
  ('inf04-siec-http',          'MDN — HTTP od podstaw',                     'https://developer.mozilla.org/en-US/docs/Web/HTTP', 0),

  ('inf04-typy-danych',        'C# — typy wbudowane',                       'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/', 0),
  ('inf04-typy-danych',        'C# — kolekcje',                             'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/tutorials/collections', 1),
  ('inf04-stos-kolejka',       'w3schools — struktury danych',              'https://www.w3schools.com/dsa/', 0),
  ('inf04-stos-kolejka',       'C# — klasa Stack',                          'https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.stack-1', 1),
  ('inf04-listy-drzewa',       'VisuAlgo — drzewa binarne',                 'https://visualgo.net/en/bst', 0),
  ('inf04-sortowanie',         'VisuAlgo — sortowanie krok po kroku',       'https://visualgo.net/en/sorting', 0),
  ('inf04-sortowanie',         'w3schools — algorytmy sortowania',          'https://www.w3schools.com/dsa/dsa_algo_bubblesort.php', 1),
  ('inf04-wyszukiwanie',       'w3schools — wyszukiwanie binarne',          'https://www.w3schools.com/dsa/dsa_algo_binarysearch.php', 0),
  ('inf04-zlozonosc',          'Big-O cheat sheet',                         'https://www.bigocheatsheet.com/', 0),
  ('inf04-cykl-zycia',         'Scrum.org — czym jest Scrum',               'https://www.scrum.org/resources/what-is-scrum', 0),

  ('inf04-csharp-start',       'C# — pierwsza aplikacja konsolowa',         'https://learn.microsoft.com/en-us/dotnet/core/tutorials/with-visual-studio-code', 0),
  ('inf04-csharp-start',       'Przewodnik po języku C#',                   'https://learn.microsoft.com/en-us/dotnet/csharp/', 1),
  ('inf04-csharp-skladnia',    'C# — instrukcje iteracyjne',                'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/iteration-statements', 0),
  ('inf04-csharp-klasy',       'C# — klasy i obiekty',                      'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/objects', 0),
  ('inf04-csharp-dostep',      'C# — kwalifikatory dostępu',                'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/access-modifiers', 0),
  ('inf04-oop-filary',         'C# — dziedziczenie',                        'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance', 0),
  ('inf04-oop-filary',         'C# — polimorfizm',                          'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism', 1),
  ('inf04-csharp-algorytmy',   'C# — praca z tekstem (string)',             'https://learn.microsoft.com/en-us/dotnet/csharp/how-to/search-strings', 0),

  ('inf04-desktop-ide',        'WinForms — dokumentacja',                   'https://learn.microsoft.com/en-us/dotnet/desktop/winforms/', 0),
  ('inf04-desktop-kontrolki',  'WinForms — kontrolki',                      'https://learn.microsoft.com/en-us/dotnet/desktop/winforms/controls/', 0),
  ('inf04-desktop-okna',       'WinForms — okna dialogowe',                 'https://learn.microsoft.com/en-us/dotnet/desktop/winforms/controls/dialog-boxes', 0),
  ('inf04-desktop-zdarzenia',  'WinForms — zdarzenia',                      'https://learn.microsoft.com/en-us/dotnet/desktop/winforms/forms/events', 0),
  ('inf04-desktop-wpf',        'WPF — dokumentacja',                        'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/', 0),

  ('inf04-maui-start',         '.NET MAUI — start',                         'https://learn.microsoft.com/en-us/dotnet/maui/', 0),
  ('inf04-maui-xaml',          'MAUI — kontrolki',                          'https://learn.microsoft.com/en-us/dotnet/maui/user-interface/controls/', 0),
  ('inf04-maui-layouty',       'MAUI — layouty',                            'https://learn.microsoft.com/en-us/dotnet/maui/user-interface/layouts/', 0),
  ('inf04-maui-binding',       'MAUI — Data Binding',                       'https://learn.microsoft.com/en-us/dotnet/maui/fundamentals/data-binding/', 0),
  ('inf04-maui-platformy',     'MAUI — kod zależny od platformy',           'https://learn.microsoft.com/en-us/dotnet/maui/platform-integration/invoke-platform-code', 0),

  ('inf04-react-start',        'React — szybki start',                      'https://react.dev/learn', 0),
  ('inf04-react-komponenty',   'React — stan komponentu',                   'https://react.dev/learn/state-a-components-memory', 0),
  ('inf04-react-komponenty',   'React — przekazywanie props',               'https://react.dev/learn/passing-props-to-a-component', 1),
  ('inf04-react-zdarzenia',    'React — obsługa zdarzeń',                   'https://react.dev/learn/responding-to-events', 0),
  ('inf04-react-zdarzenia',    'React — formularze',                        'https://react.dev/reference/react-dom/components/input', 1),
  ('inf04-react-routing',      'React Router — dokumentacja',               'https://reactrouter.com/', 0),
  ('inf04-async-json',         'MDN — Promises',                            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', 0),
  ('inf04-async-json',         'MDN — fetch i JSON',                        'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', 1),
  ('inf04-backend-aspnet',     'ASP.NET Core — Web API',                    'https://learn.microsoft.com/en-us/aspnet/core/web-api/', 0),
  ('inf04-angular-na-egzamin', 'Angular — dokumentacja (do porównania)',    'https://angular.dev/', 0),

  ('inf04-debugowanie',        'Visual Studio — debugger',                  'https://learn.microsoft.com/en-us/visualstudio/debugger/', 0),
  ('inf04-testy-jest',         'Jest — pierwsze testy',                     'https://jestjs.io/docs/getting-started', 0),
  ('inf04-testy-xunit',        'Testy jednostkowe w .NET',                  'https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-dotnet-test', 0),
  ('inf04-dokumentacja-kodu',  'C# — komentarze dokumentacyjne XML',        'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/xmldoc/', 0),

  ('inf04-angielski-algorytmy','w3schools — algorytmy po angielsku',        'https://www.w3schools.com/dsa/', 0),

  ('inf04-git',                'Git — dokumentacja',                        'https://git-scm.com/doc', 0),
  ('inf04-scrum',              'Scrum.org — czym jest Scrum',               'https://www.scrum.org/resources/what-is-scrum', 0),

  ('inf04-egzamin-pisemny',    'CKE — informatory',                         'https://cke.gov.pl/egzamin-zawodowy/egzamin-zawodowy-formula-2019/informatory-wyposazenie-osrodkow/informatory/', 0),
  ('inf04-egzamin-arkusze',    'Testy INF.04 online',                       'https://www.testy.egzaminzawodowy.info/kwalifikacja-inf4', 0),
  ('inf04-egzamin-arkusze',    'Praktyczny egzamin — arkusze',              'https://www.praktycznyegzamin.pl/', 1),
  ('inf04-egzamin-arkusze',    'CKE — egzamin zawodowy',                    'https://cke.gov.pl/egzamin-zawodowy/', 2)
) as v(subtopic_id, label, url, sort_order)
where not exists (
  select 1 from subtopic_links l where l.subtopic_id = v.subtopic_id and l.url = v.url
);
