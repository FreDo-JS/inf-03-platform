-- =============================================================================
-- TEST 3/4 — JavaScript: zmienne i typy · ciągi znaków · warunki, pętle, funkcje
--
-- Zakres z materiałów podpiętych do podtematów 1–2 kategorii „JavaScript”
-- (freeCodeCamp: Variables and Data Types, Strings, Comparisons and
-- Conditionals, Math, Loops, lekcje o funkcjach, booleanach i obiekcie Math;
-- w3schools: js_functions).
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'JavaScript: zmienne, warunki, pętle i funkcje',
    2400,
    $json$[
      {"type":"closed","text":"Za co odpowiada JavaScript w stronie internetowej?","options":["za interaktywność i logikę działania","za strukturę treści","za wygląd i kolory","za adres strony w internecie"]},
      {"type":"matching","text":"Dopasuj wartość do jej typu danych","left":["\"Ania\"","42","true","null"],"right":["boolean","celowo pusta wartość","number","string"]},
      {"type":"closed","text":"Czym jest wartość undefined?","options":["zmienna zadeklarowana, ale bez przypisanej wartości","wartość celowo ustawiona jako pusta","błąd składni","zawsze zero"]},
      {"type":"input","text":"Którym słowem kluczowym deklarujemy zmienną, której wartości później NIE da się przypisać ponownie?"},
      {"type":"select","text":"Który typ danych reprezentuje tylko dwie wartości: true albo false?","options":["boolean","number","string","symbol"]},
      {"type":"closed","text":"Co zwróci typeof 5 + '10' — jaki będzie wynik działania 5 + '10'?","options":["\"510\" — napis, bo liczba została zamieniona na tekst","15 — liczba","błąd wykonania","NaN"]},
      {"type":"closed","text":"Jaki będzie wynik działania '10' - 5?","options":["5 — liczba, bo napis został zamieniony na liczbę","\"105\" — napis","NaN","błąd wykonania"]},
      {"type":"input","text":"Jaki operator zwraca resztę z dzielenia?"},
      {"type":"select","text":"Który operator podnosi liczbę do potęgi?","options":["**","^","%","//"]},
      {"type":"closed","text":"Co zwróci JavaScript przy dzieleniu liczby przez zero?","options":["Infinity","0","NaN","błąd wykonania"]},
      {"type":"closed","text":"Co oznacza NaN?","options":["wartość liczbową, która jest nieprawidłowa (Not a Number)","liczbę zero","brak zmiennej","napis pusty"]},
      {"type":"closed","text":"Czym różni się operator === od ==?","options":["=== porównuje wartość i typ, bez konwersji","=== porównuje tylko typ","== jest dokładniejszy niż ===","nie różnią się niczym"]},
      {"type":"select","text":"Co zwróci porównanie null == undefined?","options":["true","false","NaN","błąd wykonania"]},
      {"type":"input","text":"Jak nazywa się instrukcja wyboru, która porównuje wartość wyrażenia z kolejnymi przypadkami case?"},
      {"type":"closed","text":"Po co w instrukcji switch stosuje się break na końcu każdego przypadku?","options":["żeby zakończyć wykonanie danego przypadku i nie wejść w kolejne","żeby wyjść z całego programu","żeby powtórzyć dany przypadek","break jest tam wymagany przez składnię"]},
      {"type":"closed","text":"Kiedy wykonuje się blok default w instrukcji switch?","options":["gdy żaden z przypadków case nie pasuje","zawsze jako pierwszy","zawsze na końcu, niezależnie od dopasowania","gdy zabraknie instrukcji break"]},
      {"type":"closed","text":"Z jakich trzech części składa się nagłówek pętli for?","options":["inicjalizacja, warunek, zmiana licznika","warunek, treść, koniec","start, stop, krok w tył","deklaracja, wywołanie, zwrot"]},
      {"type":"matching","text":"Dopasuj rodzaj pętli do jej typowego zastosowania","left":["for...of","for...in","while","do...while"],"right":["wykonuje blok co najmniej raz, potem sprawdza warunek","iteracja po wartościach tablicy lub napisu","działa, dopóki warunek jest prawdziwy","iteracja po właściwościach obiektu"]},
      {"type":"select","text":"Która instrukcja przerywa pętlę przed czasem?","options":["break","continue","return","stop"]},
      {"type":"input","text":"Która instrukcja pomija bieżące przejście pętli i przechodzi do następnego?"},
      {"type":"closed","text":"Czym jest funkcja w JavaScripcie?","options":["wielokrotnie używanym fragmentem kodu, który wykonuje zadanie lub zwraca wartość","rodzajem zmiennej przechowującej liczbę","pętlą wykonywaną raz","znacznikiem HTML"]},
      {"type":"closed","text":"Czym różni się parametr od argumentu?","options":["parametr to nazwa w definicji funkcji, argument to wartość podana przy wywołaniu","to dwa słowa na to samo","argument występuje w definicji, parametr przy wywołaniu","parametr zawsze jest liczbą"]},
      {"type":"input","text":"Jakie słowo kluczowe zwraca wartość z wnętrza funkcji?"},
      {"type":"closed","text":"Co trzeba zrobić, aby kod z wnętrza funkcji się wykonał?","options":["wywołać funkcję, podając jej nazwę z nawiasami","wystarczy ją zadeklarować","przypisać ją do zmiennej","umieścić ją na końcu pliku"]},
      {"type":"input","text":"Jakiego znaku używa się do tworzenia szablonów napisów (template literals), pozwalających wstawiać zmienne przez ${...}?"},
      {"type":"closed","text":"Jaki indeks ma pierwszy znak napisu?","options":["0","1","-1","zależy od długości napisu"]},
      {"type":"closed","text":"Co oznacza, że napisy w JavaScripcie są niezmienne (immutable)?","options":["raz utworzonego napisu nie da się zmienić — operacje tworzą nowy","napisu nie można wypisać w konsoli","napis nie może zawierać cyfr","napisu nie da się porównać"]},
      {"type":"select","text":"Która metoda zwraca kod znaku znajdującego się na podanej pozycji napisu?","options":["charCodeAt()","fromCharCode()","charAt()","codePoint()"]},
      {"type":"matching","text":"Dopasuj wywołanie do wyniku","left":["Math.round(4.6)","Math.floor(4.6)","Math.ceil(4.2)","Math.abs(-4)"],"right":["5 (w górę)","4 (w dół)","4","5"]},
      {"type":"input","text":"Która metoda obiektu Math zwraca liczbę losową z przedziału od 0 (włącznie) do 1 (wyłącznie)?"},
      {"type":"matching","text":"Dopasuj metodę napisu do jej działania","left":["toUpperCase()","trim()","includes()","slice()"],"right":["sprawdza, czy napis zawiera podany fragment","usuwa białe znaki z początku i końca","zwraca wycinek napisu","zamienia litery na wielkie"]},
      {"type":"select","text":"Który operator logiczny daje true tylko wtedy, gdy OBA warunki są prawdziwe?","options":["&&","||","!","=="]},
      {"type":"input","text":"Który operator logiczny odwraca wartość logiczną na przeciwną?"},
      {"type":"closed","text":"Jak zapisuje się warunek „różne od” z porównaniem także typu?","options":["!==","!=","<>","=/="]},
      {"type":"closed","text":"Która z tych wartości jest fałszywa (falsy) w warunku?","options":["0","\"0\"","[]","\"false\""]},
      {"type":"select","text":"Która funkcja zamienia napis na liczbę całkowitą?","options":["parseInt()","toString()","charAt()","toFixed()"]},
      {"type":"input","text":"Jakiej konwencji nazewniczej używa się w JavaScripcie dla zmiennych i funkcji (np. isLoading, getUserData)?"},
      {"type":"closed","text":"Czym różni się pętla do...while od while?","options":["do...while wykonuje blok co najmniej raz, przed sprawdzeniem warunku","do...while działa tylko na tablicach","while nie sprawdza warunku","nie różnią się niczym"]},
      {"type":"closed","text":"Jak wstawić wartość zmiennej do szablonu napisu (template literal)?","options":["${zmienna} wewnątrz napisu w backtickach","{zmienna} wewnątrz apostrofów","<zmienna> wewnątrz cudzysłowów","#zmienna# wewnątrz backticków"]},
      {"type":"select","text":"Która metoda obiektu Math zwraca największą z podanych liczb?","options":["Math.max()","Math.min()","Math.pow()","Math.sqrt()"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["za interaktywność i logikę działania"],
  ["string", "number", "boolean", "celowo pusta wartość"],
  ["zmienna zadeklarowana, ale bez przypisanej wartości"],
  ["const"],
  ["boolean"],
  ["\"510\" — napis, bo liczba została zamieniona na tekst"],
  ["5 — liczba, bo napis został zamieniony na liczbę"],
  ["%", "modulo", "operator %"],
  ["**"],
  ["Infinity"],
  ["wartość liczbową, która jest nieprawidłowa (Not a Number)"],
  ["=== porównuje wartość i typ, bez konwersji"],
  ["true"],
  ["switch", "instrukcja switch"],
  ["żeby zakończyć wykonanie danego przypadku i nie wejść w kolejne"],
  ["gdy żaden z przypadków case nie pasuje"],
  ["inicjalizacja, warunek, zmiana licznika"],
  ["iteracja po wartościach tablicy lub napisu", "iteracja po właściwościach obiektu", "działa, dopóki warunek jest prawdziwy", "wykonuje blok co najmniej raz, potem sprawdza warunek"],
  ["break"],
  ["continue"],
  ["wielokrotnie używanym fragmentem kodu, który wykonuje zadanie lub zwraca wartość"],
  ["parametr to nazwa w definicji funkcji, argument to wartość podana przy wywołaniu"],
  ["return"],
  ["wywołać funkcję, podając jej nazwę z nawiasami"],
  ["backtick", "backticki", "`", "odwrotny apostrof", "grawis"],
  ["0"],
  ["raz utworzonego napisu nie da się zmienić — operacje tworzą nowy"],
  ["charCodeAt()"],
  ["5 (w górę)", "4 (w dół)", "5", "4"],
  ["Math.random()", "random", "Math.random", "random()"],
  ["zamienia litery na wielkie", "usuwa białe znaki z początku i końca", "sprawdza, czy napis zawiera podany fragment", "zwraca wycinek napisu"],
  ["&&"],
  ["!", "wykrzyknik", "negacja"],
  ["!=="],
  ["0"],
  ["parseInt()"],
  ["camelCase", "camel case", "camelCasing", "notacja wielbłądzia"],
  ["do...while wykonuje blok co najmniej raz, przed sprawdzeniem warunku"],
  ["${zmienna} wewnątrz napisu w backtickach"],
  ["Math.max()"]
]$json$::jsonb
from nowy;
