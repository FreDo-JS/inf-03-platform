-- =============================================================================
-- TEST 4/4 — JavaScript: tablice i obiekty · DOM i zdarzenia · walidacja formularzy
--
-- Zakres z materiałów podpiętych do podtematów 3–5 kategorii „JavaScript”.
-- Pytania oparte na kodzie i typowych błędach przy pracy ze stroną.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'JavaScript: tablice, obiekty, DOM i walidacja',
    2400,
    $json$[
      {"type":"closed","text":"const owoce = [\"jabłko\", \"gruszka\", \"śliwka\"]; console.log(owoce[1]); — co się wypisze?","options":["\"gruszka\"","\"jabłko\"","1","\"śliwka\""]},
      {"type":"closed","text":"Tablica ma 3 elementy. Co zwróci odwołanie do indeksu 5?","options":["null","błąd: indeks poza zakresem","undefined","0"]},
      {"type":"closed","text":"const a = [\"x\", \"y\"]; a.push(\"z\"); console.log(a.length); — co się wypisze?","options":["4","3","\"z\"","2"]},
      {"type":"matching","text":"Dopasuj metodę tablicy do jej działania","left":["push()","pop()","shift()","unshift()"],"right":["usuwa pierwszy element","usuwa ostatni element","dodaje element na początek","dodaje element na koniec"]},
      {"type":"closed","text":"const oceny = [3, 5, 4]; console.log(oceny.join(\" | \")); — co się wypisze?","options":["\"354\"","[3, 5, 4]","\"3 | 5 | 4\"","12"]},
      {"type":"select","text":"Która metoda sprawdzi, czy w tablicy znajduje się dana wartość, i zwróci true albo false?","options":["includes()","indexOf()","find()","join()"]},
      {"type":"closed","text":"Chcesz wypisać w konsoli każdy element tablicy po kolei, bez tworzenia nowej tablicy. Co wybierzesz?","options":["filter()","forEach()","map()","reduce()"]},
      {"type":"input","text":"Która właściwość tablicy zwraca liczbę jej elementów?"},
      {"type":"closed","text":"Na czym polega destrukturyzacja tablicy, czyli zapis const [a, b] = punkty; ?","options":["usuwa pierwsze dwa elementy tablicy","tworzy nową tablicę z dwóch zmiennych","zamienia tablicę w obiekt","przypisuje pierwsze dwa elementy tablicy do osobnych zmiennych"]},
      {"type":"closed","text":"Szachownica zapisana jako tablica tablic. Jak odczytasz pole z drugiego wiersza i trzeciej kolumny?","options":["plansza[2][3]","plansza(1)(2)","plansza[1][2]","plansza[2, 3]"]},
      {"type":"closed","text":"const uczen = { imie: \"Ala\", wiek: 17 }; Jak dopiszesz do niego właściwość klasa?","options":["uczen.klasa = \"2a\";","new uczen.klasa = \"2a\";","uczen(\"klasa\") = \"2a\";","uczen + { klasa: \"2a\" };"]},
      {"type":"matching","text":"Dopasuj zapis do jego efektu na obiekcie uczen","left":["uczen.wiek","uczen[\"wiek\"]","delete uczen.wiek","Object.keys(uczen)"],"right":["odczyt zapisem kropkowym","usunięcie właściwości","lista nazw właściwości","odczyt zapisem nawiasowym"]},
      {"type":"closed","text":"Kiedy zapis nawiasowy obiektu jest konieczny, a kropkowy nie wystarczy?","options":["gdy nazwa właściwości siedzi w zmiennej albo zawiera spację","gdy wartością właściwości jest liczba","nigdy, oba zapisy są zawsze wymienne","gdy obiekt ma więcej niż pięć właściwości"]},
      {"type":"input","text":"Którym operatorem usuniesz właściwość z obiektu?"},
      {"type":"closed","text":"Obiekt ustawienia ma właściwość ciemnyMotyw o wartości false. Dlaczego sprawdzenie if (ustawienia.ciemnyMotyw) jest tu mylące?","options":["warunek zawsze będzie prawdziwy","nie ma w tym nic mylącego","warunek będzie fałszywy, choć właściwość istnieje — lepiej użyć Object.hasOwn()","warunek zgłosi błąd, bo właściwość jest logiczna"]},
      {"type":"input","text":"Która metoda obiektu Object zwraca tablicę nazw jego właściwości?"},
      {"type":"closed","text":"Co oznacza skrót DOM?","options":["domenę, pod którą działa strona","sposób zapisu danych w pliku","bibliotekę do obsługi formularzy","obiektowy model dokumentu — interfejs pozwalający skryptom zmieniać stronę"]},
      {"type":"select","text":"Element ma id=\"wynik\". Który zapis go pobierze?","options":["document.querySelector(\"wynik\")","document.getElementById(\"#wynik\")","document.getElementsByName(\"wynik\")","document.getElementById(\"wynik\")"]},
      {"type":"closed","text":"Na stronie jest pięć elementów z klasą karta. Co zwróci document.querySelector(\".karta\") ?","options":["ostatni pasujący element","null, bo klasa występuje wielokrotnie","listę wszystkich pięciu elementów","tylko pierwszy pasujący element"]},
      {"type":"closed","text":"Skrypt w sekcji head wywołuje document.getElementById i dostaje null, choć element istnieje w kodzie. Dlaczego?","options":["identyfikatory nie działają w sekcji head","getElementById działa wyłącznie na elementach z klasą","skrypt wykonał się, zanim przeglądarka zbudowała ten fragment strony","brakuje atrybutu name w elemencie"]},
      {"type":"matching","text":"Dopasuj zapis do tego, co robi ze stroną","left":["document.getElementById()","document.querySelectorAll()","element.addEventListener()","document.createElement()"],"right":["pobranie wszystkich elementów pasujących do selektora","utworzenie nowego elementu","pobranie elementu po identyfikatorze","podpięcie obsługi zdarzenia"]},
      {"type":"input","text":"Którą metodą podepniesz do przycisku reakcję na kliknięcie?"},
      {"type":"closed","text":"Który zapis poprawnie podpina obsługę kliknięcia do przycisku zapisanego w zmiennej btn?","options":["btn.addEventListener(\"onclick\", pokazWynik());","btn.addEventListener(\"click\", pokazWynik);","btn.addEvent(\"click\", pokazWynik);","btn.onClick = pokazWynik();"]},
      {"type":"closed","text":"Czym różni się textContent od innerHTML?","options":["textContent wstawia czysty tekst, innerHTML interpretuje znaczniki HTML","niczym, to dwie nazwy tej samej właściwości","textContent działa tylko na akapitach","innerHTML wstawia czysty tekst, textContent interpretuje znaczniki"]},
      {"type":"closed","text":"Dlaczego wstawianie tekstu od użytkownika przez innerHTML jest niebezpieczne?","options":["innerHTML działa wolniej niż textContent","można w ten sposób wstrzyknąć na stronę cudzy skrypt","przeglądarka zablokuje całą stronę","tekst straci polskie znaki"]},
      {"type":"closed","text":"Jak odczytać to, co użytkownik wpisał w polu tekstowym zapisanym w zmiennej pole?","options":["pole.value","pole.textContent","pole.innerHTML","pole.placeholder"]},
      {"type":"select","text":"Która właściwość pozwala dodać i usunąć klasę CSS elementu?","options":["style.class","setAttribute.class","classList","className.add"]},
      {"type":"closed","text":"Po kliknięciu przycisku wewnątrz formularza strona przeładowuje się i wynik znika. Co dodać w obsłudze zdarzenia?","options":["location.reload()","return true","event.stopPropagation()","event.preventDefault()"]},
      {"type":"closed","text":"Które zdarzenie najlepiej nadaje się do sprawdzenia całego formularza tuż przed wysłaniem?","options":["keyup","submit","click","change"]},
      {"type":"closed","text":"Uczeń sprawdza poprawność danych tylko w JavaScripcie. Dlaczego to za mało?","options":["walidacja w JS działa tylko w trybie deweloperskim","skrypt w przeglądarce da się wyłączyć lub obejść, więc dane trzeba sprawdzić też na serwerze","JavaScript nie umie porównywać napisów","przeglądarki blokują walidację po stronie klienta"]},
      {"type":"select","text":"Która metoda zwróci true, gdy pole spełnia wszystkie reguły zapisane w atrybutach HTML?","options":["setCustomValidity()","reportValidity()","checkValidity()","validate()"]},
      {"type":"input","text":"Która metoda każe przeglądarce pokazać użytkownikowi dymek z komunikatem o niepoprawnym polu?"},
      {"type":"closed","text":"Do czego służy setCustomValidity(\"Podaj adres z końcówką .pl\") ?","options":["zmienia treść podpowiedzi placeholder","ustawia własny komunikat błędu dla pola","blokuje wysłanie całego formularza na stałe","wyłącza sprawdzanie tego pola"]},
      {"type":"closed","text":"Kiedy właściwość patternMismatch przyjmuje wartość true?","options":["gdy wartość przekracza atrybut max","gdy wartość pola nie pasuje do wyrażenia z atrybutu pattern","gdy pole jest puste, a ma atrybut required","gdy pole jest wyłączone atrybutem disabled"]},
      {"type":"matching","text":"Dopasuj atrybut pola do reguły, którą narzuca","left":["required","pattern","min","maxlength"],"right":["najwyżej tyle znaków","wartość musi pasować do wyrażenia regularnego","pole nie może zostać puste","najmniejsza dopuszczalna liczba"]},
      {"type":"closed","text":"Co robi zapis: document.querySelectorAll(\"li\").forEach(el => el.classList.add(\"gotowe\")) ?","options":["usuwa klasę gotowe z elementów listy","dodaje klasę tylko pierwszemu elementowi listy","tworzy nowe elementy li z klasą gotowe","dodaje klasę gotowe wszystkim elementom listy"]},
      {"type":"closed","text":"Czym jest window w przeglądarce?","options":["tablicą wszystkich otwartych kart","znacznikiem HTML tworzącym nowe okno","obiektem reprezentującym okno przeglądarki wraz z dokumentem","metodą otwierającą okno dialogowe"]},
      {"type":"closed","text":"Który element jest korzeniem drzewa DOM?","options":["body","document","head","html"]},
      {"type":"select","text":"Czym jest API przeglądarki?","options":["zestawem gotowych obiektów i metod, którymi skrypt sięga po możliwości przeglądarki","sposobem zapisu danych w bazie","biblioteką, którą trzeba pobrać z internetu","językiem programowania po stronie serwera"]},
      {"type":"closed","text":"Uczeń chce dodać nowy punkt do listy. W jakiej kolejności to zrobi?","options":["utworzyć element, ustawić jego treść, dołączyć go do listy","ustawić treść, dołączyć, na końcu utworzyć element","wystarczy zmienić textContent samej listy","dołączyć element do listy, potem go utworzyć"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["\"gruszka\""],
  ["undefined"],
  ["3"],
  ["dodaje element na koniec", "usuwa ostatni element", "usuwa pierwszy element", "dodaje element na początek"],
  ["\"3 | 5 | 4\""],
  ["includes()"],
  ["forEach()"],
  ["length", ".length", "właściwość length"],
  ["przypisuje pierwsze dwa elementy tablicy do osobnych zmiennych"],
  ["plansza[1][2]"],
  ["uczen.klasa = \"2a\";"],
  ["odczyt zapisem kropkowym", "odczyt zapisem nawiasowym", "usunięcie właściwości", "lista nazw właściwości"],
  ["gdy nazwa właściwości siedzi w zmiennej albo zawiera spację"],
  ["delete", "operator delete"],
  ["warunek będzie fałszywy, choć właściwość istnieje — lepiej użyć Object.hasOwn()"],
  ["Object.keys()", "Object.keys", "keys"],
  ["obiektowy model dokumentu — interfejs pozwalający skryptom zmieniać stronę"],
  ["document.getElementById(\"wynik\")"],
  ["tylko pierwszy pasujący element"],
  ["skrypt wykonał się, zanim przeglądarka zbudowała ten fragment strony"],
  ["pobranie elementu po identyfikatorze", "pobranie wszystkich elementów pasujących do selektora", "podpięcie obsługi zdarzenia", "utworzenie nowego elementu"],
  ["addEventListener", "addEventListener()", ".addEventListener()"],
  ["btn.addEventListener(\"click\", pokazWynik);"],
  ["textContent wstawia czysty tekst, innerHTML interpretuje znaczniki HTML"],
  ["można w ten sposób wstrzyknąć na stronę cudzy skrypt"],
  ["pole.value"],
  ["classList"],
  ["event.preventDefault()"],
  ["submit"],
  ["skrypt w przeglądarce da się wyłączyć lub obejść, więc dane trzeba sprawdzić też na serwerze"],
  ["checkValidity()"],
  ["reportValidity()", "reportValidity", "element.reportValidity()"],
  ["ustawia własny komunikat błędu dla pola"],
  ["gdy wartość pola nie pasuje do wyrażenia z atrybutu pattern"],
  ["pole nie może zostać puste", "wartość musi pasować do wyrażenia regularnego", "najmniejsza dopuszczalna liczba", "najwyżej tyle znaków"],
  ["dodaje klasę gotowe wszystkim elementom listy"],
  ["obiektem reprezentującym okno przeglądarki wraz z dokumentem"],
  ["html"],
  ["zestawem gotowych obiektów i metod, którymi skrypt sięga po możliwości przeglądarki"],
  ["utworzyć element, ustawić jego treść, dołączyć go do listy"]
]$json$::jsonb
from nowy;
