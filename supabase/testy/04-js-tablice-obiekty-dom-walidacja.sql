-- =============================================================================
-- TEST 4/4 — JavaScript: tablice i obiekty · DOM i zdarzenia · walidacja formularzy
--
-- Zakres z materiałów podpiętych do podtematów 3–5 kategorii „JavaScript”
-- (freeCodeCamp: Arrays, Objects, JavaScript Fundamentals, DOM Manipulation and
-- Click Events, Form Validation with JavaScript; w3schools: js_validation).
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'JavaScript: tablice, obiekty, DOM i walidacja',
    1800,
    $json$[
      {"type":"closed","text":"Czym jest tablica w JavaScripcie?","options":["uporządkowanym zbiorem wartości, z których każda ma indeks liczbowy","zbiorem par klucz–wartość","funkcją zwracającą liczby","typem prostym, jak number"]},
      {"type":"input","text":"Jaki indeks ma pierwszy element tablicy?"},
      {"type":"closed","text":"Co zwróci odwołanie do indeksu, którego w tablicy nie ma, np. lista[10] przy trzech elementach?","options":["undefined","null","0","błąd wykonania"]},
      {"type":"input","text":"Która właściwość tablicy zwraca liczbę jej elementów?"},
      {"type":"closed","text":"Czym jest tablica dwuwymiarowa?","options":["tablicą, której elementami są kolejne tablice","tablicą zawierającą wyłącznie liczby","obiektem z dwoma kluczami","tablicą o stałej długości równej 2"]},
      {"type":"select","text":"Która metoda dodaje element na KONIEC tablicy?","options":["push()","pop()","shift()","unshift()"]},
      {"type":"matching","text":"Dopasuj metodę tablicy do jej działania","left":["push()","pop()","shift()","unshift()"],"right":["usuwa pierwszy element","dodaje element na początek","dodaje element na koniec","usuwa ostatni element"]},
      {"type":"closed","text":"Czym jest obiekt w JavaScripcie?","options":["strukturą danych złożoną z właściwości, czyli par klucz–wartość","uporządkowaną listą wartości z indeksami","rodzajem pętli","nazwą pliku ze skryptem"]},
      {"type":"closed","text":"Na dwa sposoby można sięgnąć po właściwość obiektu. Jakie to zapisy?","options":["kropkowy: osoba.imie oraz nawiasowy: osoba[\"imie\"]","nawiasowy: osoba(imie) oraz kropkowy: osoba.imie","wyłącznie osoba->imie","wyłącznie osoba::imie"]},
      {"type":"input","text":"Którym operatorem usuwa się właściwość z obiektu?"},
      {"type":"select","text":"Która metoda sprawdza, czy obiekt ma własną właściwość o podanej nazwie (zalecana, nowsza)?","options":["Object.hasOwn()","Object.keys()","Object.assign()","Object.freeze()"]},
      {"type":"closed","text":"Co zwraca sprawdzenie obecności właściwości w obiekcie?","options":["wartość logiczną true albo false","wartość tej właściwości","liczbę właściwości obiektu","nazwę właściwości"]},
      {"type":"input","text":"Jak nazywa się skrót od Document Object Model, czyli interfejs pozwalający skryptom zmieniać stronę?"},
      {"type":"closed","text":"Który element jest korzeniem drzewa DOM?","options":["html","body","head","document"]},
      {"type":"select","text":"Która metoda zwraca element o podanym identyfikatorze?","options":["getElementById()","querySelectorAll()","getElementsByTagName()","createElement()"]},
      {"type":"closed","text":"Czym różni się querySelector() od querySelectorAll()?","options":["querySelector() zwraca pierwszy pasujący element, querySelectorAll() listę wszystkich","querySelector() działa tylko na identyfikatorach","querySelectorAll() zwraca zawsze jeden element","nie różnią się niczym"]},
      {"type":"matching","text":"Dopasuj metodę lub właściwość do jej zastosowania","left":["getElementById()","querySelectorAll()","addEventListener()","textContent"],"right":["podpięcie obsługi zdarzenia","odczyt lub zmiana tekstu elementu","pobranie wszystkich elementów pasujących do selektora","pobranie elementu po identyfikatorze"]},
      {"type":"input","text":"Którą metodą podpina się obsługę zdarzenia, np. kliknięcia, do elementu strony?"},
      {"type":"select","text":"Jaka nazwa zdarzenia odpowiada kliknięciu myszą?","options":["click","press","tap","mouseclick"]},
      {"type":"closed","text":"Czym jest window?","options":["interfejsem reprezentującym okno przeglądarki z dokumentem","elementem HTML dodawanym do strony","funkcją tworzącą nowe okno dialogowe","tablicą otwartych kart"]},
      {"type":"closed","text":"Czym jest navigator?","options":["interfejsem z informacjami o przeglądarce i systemie użytkownika","paskiem nawigacji na stronie","metodą przewijania strony","zdarzeniem zmiany adresu"]},
      {"type":"closed","text":"Do czego służy metoda preventDefault() wywołana na zdarzeniu?","options":["blokuje domyślne zachowanie przeglądarki, np. wysłanie formularza","zatrzymuje cały skrypt","usuwa element ze strony","cofa ostatnią zmianę w formularzu"]},
      {"type":"closed","text":"Dlaczego walidację po stronie klienta trzeba powtórzyć na serwerze?","options":["bo skrypt w przeglądarce da się wyłączyć lub obejść — nie jest zabezpieczeniem","bo przeglądarki nie obsługują atrybutu required","bo walidacja w JS działa tylko w trybie deweloperskim","bo serwer nie widzi danych z formularza"]},
      {"type":"select","text":"Która metoda zwraca true, gdy pole spełnia wszystkie reguły walidacji zapisane w HTML?","options":["checkValidity()","reportValidity()","setCustomValidity()","validate()"]},
      {"type":"input","text":"Która metoda każe przeglądarce pokazać użytkownikowi komunikat o niepoprawnym polu?"},
      {"type":"closed","text":"Do czego służy setCustomValidity()?","options":["ustawia własny komunikat błędu dla pola formularza","wyłącza walidację pola","zmienia typ pola","czyści zawartość pola"]},
      {"type":"matching","text":"Dopasuj atrybut HTML do reguły, którą narzuca polu","left":["required","pattern","min","maxlength"],"right":["wartość musi pasować do wyrażenia regularnego","najmniejsza dopuszczalna wartość liczbowa","pole nie może zostać puste","największa dopuszczalna liczba znaków"]},
      {"type":"closed","text":"Kiedy właściwość patternMismatch przyjmuje wartość true?","options":["gdy wartość pola nie pasuje do wzorca z atrybutu pattern","gdy pole jest puste","gdy pole jest wyłączone","gdy wartość przekracza atrybut max"]},
      {"type":"select","text":"Który typ pola formularza sprawia, że przeglądarka sama sprawdza poprawność adresu poczty?","options":["email","text","search","url"]},
      {"type":"closed","text":"Które zdarzenie formularza jest najwygodniejsze do sprawdzenia danych tuż przed wysłaniem?","options":["submit","click","input","change"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["uporządkowanym zbiorem wartości, z których każda ma indeks liczbowy"],
  ["0", "zero"],
  ["undefined"],
  ["length", ".length"],
  ["tablicą, której elementami są kolejne tablice"],
  ["push()"],
  ["dodaje element na koniec", "usuwa ostatni element", "usuwa pierwszy element", "dodaje element na początek"],
  ["strukturą danych złożoną z właściwości, czyli par klucz–wartość"],
  ["kropkowy: osoba.imie oraz nawiasowy: osoba[\"imie\"]"],
  ["delete", "operator delete"],
  ["Object.hasOwn()"],
  ["wartość logiczną true albo false"],
  ["DOM", "Document Object Model"],
  ["html"],
  ["getElementById()"],
  ["querySelector() zwraca pierwszy pasujący element, querySelectorAll() listę wszystkich"],
  ["pobranie elementu po identyfikatorze", "pobranie wszystkich elementów pasujących do selektora", "podpięcie obsługi zdarzenia", "odczyt lub zmiana tekstu elementu"],
  ["addEventListener", "addEventListener()"],
  ["click"],
  ["interfejsem reprezentującym okno przeglądarki z dokumentem"],
  ["interfejsem z informacjami o przeglądarce i systemie użytkownika"],
  ["blokuje domyślne zachowanie przeglądarki, np. wysłanie formularza"],
  ["bo skrypt w przeglądarce da się wyłączyć lub obejść — nie jest zabezpieczeniem"],
  ["checkValidity()"],
  ["reportValidity", "reportValidity()"],
  ["ustawia własny komunikat błędu dla pola formularza"],
  ["pole nie może zostać puste", "wartość musi pasować do wyrażenia regularnego", "najmniejsza dopuszczalna wartość liczbowa", "największa dopuszczalna liczba znaków"],
  ["gdy wartość pola nie pasuje do wzorca z atrybutu pattern"],
  ["email"],
  ["submit"]
]$json$::jsonb
from nowy;
