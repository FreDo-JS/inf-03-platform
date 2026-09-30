import { zbuduj } from "./generator.mjs";

zbuduj({
  plik: "04-js-tablice-obiekty-dom-walidacja.sql",
  ziarno: 905117,
  tytul: "JavaScript: tablice, obiekty, DOM i walidacja",
  czas: 2400,
  kwalifikacja: "inf03",
  naglowek: `-- =============================================================================
-- TEST 4/4 — JavaScript: tablice i obiekty · DOM i zdarzenia · walidacja formularzy
--
-- Zakres z materiałów podpiętych do podtematów 3–5 kategorii „JavaScript”.
-- Pytania oparte na kodzie i typowych błędach przy pracy ze stroną.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================`,
  pytania: [
    {
      typ: "zamkniete",
      text: 'const owoce = ["jabłko", "gruszka", "śliwka"]; console.log(owoce[1]); — co się wypisze?',
      opcje: ['"gruszka"', '"jabłko"', '"śliwka"', "1"],
      poprawna: '"gruszka"',
    },
    {
      typ: "zamkniete",
      text: "Tablica ma 3 elementy. Co zwróci odwołanie do indeksu 5?",
      opcje: ["undefined", "null", "0", "błąd: indeks poza zakresem"],
      poprawna: "undefined",
    },
    {
      typ: "zamkniete",
      text: 'const a = ["x", "y"]; a.push("z"); console.log(a.length); — co się wypisze?',
      opcje: ["3", "2", '"z"', "4"],
      poprawna: "3",
    },
    {
      typ: "pary",
      text: "Dopasuj metodę tablicy do jej działania",
      pary: [
        ["push()", "dodaje element na koniec"],
        ["pop()", "usuwa ostatni element"],
        ["shift()", "usuwa pierwszy element"],
        ["unshift()", "dodaje element na początek"],
      ],
    },
    {
      typ: "zamkniete",
      text: 'const oceny = [3, 5, 4]; console.log(oceny.join(" | ")); — co się wypisze?',
      opcje: ['"3 | 5 | 4"', "[3, 5, 4]", "12", '"354"'],
      poprawna: '"3 | 5 | 4"',
    },
    {
      typ: "lista",
      text: "Która metoda sprawdzi, czy w tablicy znajduje się dana wartość, i zwróci true albo false?",
      opcje: ["includes()", "indexOf()", "find()", "join()"],
      poprawna: "includes()",
    },
    {
      typ: "zamkniete",
      text: "Chcesz wypisać w konsoli każdy element tablicy po kolei, bez tworzenia nowej tablicy. Co wybierzesz?",
      opcje: ["forEach()", "map()", "filter()", "reduce()"],
      poprawna: "forEach()",
    },
    {
      typ: "otwarte",
      text: "Która właściwość tablicy zwraca liczbę jej elementów?",
      akceptowane: ["length", ".length", "właściwość length"],
    },
    {
      typ: "zamkniete",
      text: "Na czym polega destrukturyzacja tablicy, czyli zapis const [a, b] = punkty; ?",
      opcje: [
        "przypisuje pierwsze dwa elementy tablicy do osobnych zmiennych",
        "usuwa pierwsze dwa elementy tablicy",
        "tworzy nową tablicę z dwóch zmiennych",
        "zamienia tablicę w obiekt",
      ],
      poprawna: "przypisuje pierwsze dwa elementy tablicy do osobnych zmiennych",
    },
    {
      typ: "zamkniete",
      text: "Szachownica zapisana jako tablica tablic. Jak odczytasz pole z drugiego wiersza i trzeciej kolumny?",
      opcje: ["plansza[1][2]", "plansza[2][3]", "plansza[2, 3]", "plansza(1)(2)"],
      poprawna: "plansza[1][2]",
    },
    {
      typ: "zamkniete",
      text: 'const uczen = { imie: "Ala", wiek: 17 }; Jak dopiszesz do niego właściwość klasa?',
      opcje: [
        'uczen.klasa = "2a";',
        'uczen("klasa") = "2a";',
        'uczen + { klasa: "2a" };',
        'new uczen.klasa = "2a";',
      ],
      poprawna: 'uczen.klasa = "2a";',
    },
    {
      typ: "pary",
      text: "Dopasuj zapis do jego efektu na obiekcie uczen",
      pary: [
        ["uczen.wiek", "odczyt zapisem kropkowym"],
        ['uczen["wiek"]', "odczyt zapisem nawiasowym"],
        ["delete uczen.wiek", "usunięcie właściwości"],
        ["Object.keys(uczen)", "lista nazw właściwości"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Kiedy zapis nawiasowy obiektu jest konieczny, a kropkowy nie wystarczy?",
      opcje: [
        "gdy nazwa właściwości siedzi w zmiennej albo zawiera spację",
        "gdy wartością właściwości jest liczba",
        "gdy obiekt ma więcej niż pięć właściwości",
        "nigdy, oba zapisy są zawsze wymienne",
      ],
      poprawna: "gdy nazwa właściwości siedzi w zmiennej albo zawiera spację",
    },
    {
      typ: "otwarte",
      text: "Którym operatorem usuniesz właściwość z obiektu?",
      akceptowane: ["delete", "operator delete"],
    },
    {
      typ: "zamkniete",
      text: "Obiekt ustawienia ma właściwość ciemnyMotyw o wartości false. Dlaczego sprawdzenie if (ustawienia.ciemnyMotyw) jest tu mylące?",
      opcje: [
        "warunek będzie fałszywy, choć właściwość istnieje — lepiej użyć Object.hasOwn()",
        "warunek zgłosi błąd, bo właściwość jest logiczna",
        "warunek zawsze będzie prawdziwy",
        "nie ma w tym nic mylącego",
      ],
      poprawna: "warunek będzie fałszywy, choć właściwość istnieje — lepiej użyć Object.hasOwn()",
    },
    {
      typ: "otwarte",
      text: "Która metoda obiektu Object zwraca tablicę nazw jego właściwości?",
      akceptowane: ["Object.keys()", "Object.keys", "keys"],
    },
    {
      typ: "zamkniete",
      text: "Co oznacza skrót DOM?",
      opcje: [
        "obiektowy model dokumentu — interfejs pozwalający skryptom zmieniać stronę",
        "domenę, pod którą działa strona",
        "sposób zapisu danych w pliku",
        "bibliotekę do obsługi formularzy",
      ],
      poprawna: "obiektowy model dokumentu — interfejs pozwalający skryptom zmieniać stronę",
    },
    {
      typ: "lista",
      text: "Element ma id=\"wynik\". Który zapis go pobierze?",
      opcje: [
        'document.getElementById("wynik")',
        'document.getElementById("#wynik")',
        'document.querySelector("wynik")',
        'document.getElementsByName("wynik")',
      ],
      poprawna: 'document.getElementById("wynik")',
    },
    {
      typ: "zamkniete",
      text: 'Na stronie jest pięć elementów z klasą karta. Co zwróci document.querySelector(".karta") ?',
      opcje: [
        "tylko pierwszy pasujący element",
        "listę wszystkich pięciu elementów",
        "ostatni pasujący element",
        "null, bo klasa występuje wielokrotnie",
      ],
      poprawna: "tylko pierwszy pasujący element",
    },
    {
      typ: "zamkniete",
      text: "Skrypt w sekcji head wywołuje document.getElementById i dostaje null, choć element istnieje w kodzie. Dlaczego?",
      opcje: [
        "skrypt wykonał się, zanim przeglądarka zbudowała ten fragment strony",
        "getElementById działa wyłącznie na elementach z klasą",
        "identyfikatory nie działają w sekcji head",
        "brakuje atrybutu name w elemencie",
      ],
      poprawna: "skrypt wykonał się, zanim przeglądarka zbudowała ten fragment strony",
    },
    {
      typ: "pary",
      text: "Dopasuj zapis do tego, co robi ze stroną",
      pary: [
        ["document.getElementById()", "pobranie elementu po identyfikatorze"],
        ["document.querySelectorAll()", "pobranie wszystkich elementów pasujących do selektora"],
        ["element.addEventListener()", "podpięcie obsługi zdarzenia"],
        ["document.createElement()", "utworzenie nowego elementu"],
      ],
    },
    {
      typ: "otwarte",
      text: "Którą metodą podepniesz do przycisku reakcję na kliknięcie?",
      akceptowane: ["addEventListener", "addEventListener()", ".addEventListener()"],
    },
    {
      typ: "zamkniete",
      text: 'Który zapis poprawnie podpina obsługę kliknięcia do przycisku zapisanego w zmiennej btn?',
      opcje: [
        'btn.addEventListener("click", pokazWynik);',
        'btn.addEventListener("onclick", pokazWynik());',
        'btn.addEvent("click", pokazWynik);',
        'btn.onClick = pokazWynik();',
      ],
      poprawna: 'btn.addEventListener("click", pokazWynik);',
    },
    {
      typ: "zamkniete",
      text: "Czym różni się textContent od innerHTML?",
      opcje: [
        "textContent wstawia czysty tekst, innerHTML interpretuje znaczniki HTML",
        "innerHTML wstawia czysty tekst, textContent interpretuje znaczniki",
        "textContent działa tylko na akapitach",
        "niczym, to dwie nazwy tej samej właściwości",
      ],
      poprawna: "textContent wstawia czysty tekst, innerHTML interpretuje znaczniki HTML",
    },
    {
      typ: "zamkniete",
      text: "Dlaczego wstawianie tekstu od użytkownika przez innerHTML jest niebezpieczne?",
      opcje: [
        "można w ten sposób wstrzyknąć na stronę cudzy skrypt",
        "tekst straci polskie znaki",
        "przeglądarka zablokuje całą stronę",
        "innerHTML działa wolniej niż textContent",
      ],
      poprawna: "można w ten sposób wstrzyknąć na stronę cudzy skrypt",
    },
    {
      typ: "zamkniete",
      text: "Jak odczytać to, co użytkownik wpisał w polu tekstowym zapisanym w zmiennej pole?",
      opcje: ["pole.value", "pole.textContent", "pole.innerHTML", "pole.placeholder"],
      poprawna: "pole.value",
    },
    {
      typ: "lista",
      text: "Która właściwość pozwala dodać i usunąć klasę CSS elementu?",
      opcje: ["classList", "className.add", "style.class", "setAttribute.class"],
      poprawna: "classList",
    },
    {
      typ: "zamkniete",
      text: "Po kliknięciu przycisku wewnątrz formularza strona przeładowuje się i wynik znika. Co dodać w obsłudze zdarzenia?",
      opcje: [
        "event.preventDefault()",
        "event.stopPropagation()",
        "return true",
        "location.reload()",
      ],
      poprawna: "event.preventDefault()",
    },
    {
      typ: "zamkniete",
      text: "Które zdarzenie najlepiej nadaje się do sprawdzenia całego formularza tuż przed wysłaniem?",
      opcje: ["submit", "click", "change", "keyup"],
      poprawna: "submit",
    },
    {
      typ: "zamkniete",
      text: "Uczeń sprawdza poprawność danych tylko w JavaScripcie. Dlaczego to za mało?",
      opcje: [
        "skrypt w przeglądarce da się wyłączyć lub obejść, więc dane trzeba sprawdzić też na serwerze",
        "JavaScript nie umie porównywać napisów",
        "walidacja w JS działa tylko w trybie deweloperskim",
        "przeglądarki blokują walidację po stronie klienta",
      ],
      poprawna: "skrypt w przeglądarce da się wyłączyć lub obejść, więc dane trzeba sprawdzić też na serwerze",
    },
    {
      typ: "lista",
      text: "Która metoda zwróci true, gdy pole spełnia wszystkie reguły zapisane w atrybutach HTML?",
      opcje: ["checkValidity()", "reportValidity()", "setCustomValidity()", "validate()"],
      poprawna: "checkValidity()",
    },
    {
      typ: "otwarte",
      text: "Która metoda każe przeglądarce pokazać użytkownikowi dymek z komunikatem o niepoprawnym polu?",
      akceptowane: ["reportValidity()", "reportValidity", "element.reportValidity()"],
    },
    {
      typ: "zamkniete",
      text: "Do czego służy setCustomValidity(\"Podaj adres z końcówką .pl\") ?",
      opcje: [
        "ustawia własny komunikat błędu dla pola",
        "wyłącza sprawdzanie tego pola",
        "zmienia treść podpowiedzi placeholder",
        "blokuje wysłanie całego formularza na stałe",
      ],
      poprawna: "ustawia własny komunikat błędu dla pola",
    },
    {
      typ: "zamkniete",
      text: "Kiedy właściwość patternMismatch przyjmuje wartość true?",
      opcje: [
        "gdy wartość pola nie pasuje do wyrażenia z atrybutu pattern",
        "gdy pole jest puste, a ma atrybut required",
        "gdy wartość przekracza atrybut max",
        "gdy pole jest wyłączone atrybutem disabled",
      ],
      poprawna: "gdy wartość pola nie pasuje do wyrażenia z atrybutu pattern",
    },
    {
      typ: "pary",
      text: "Dopasuj atrybut pola do reguły, którą narzuca",
      pary: [
        ["required", "pole nie może zostać puste"],
        ["pattern", "wartość musi pasować do wyrażenia regularnego"],
        ["min", "najmniejsza dopuszczalna liczba"],
        ["maxlength", "najwyżej tyle znaków"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Co robi zapis: document.querySelectorAll(\"li\").forEach(el => el.classList.add(\"gotowe\")) ?",
      opcje: [
        "dodaje klasę gotowe wszystkim elementom listy",
        "dodaje klasę tylko pierwszemu elementowi listy",
        "usuwa klasę gotowe z elementów listy",
        "tworzy nowe elementy li z klasą gotowe",
      ],
      poprawna: "dodaje klasę gotowe wszystkim elementom listy",
    },
    {
      typ: "zamkniete",
      text: "Czym jest window w przeglądarce?",
      opcje: [
        "obiektem reprezentującym okno przeglądarki wraz z dokumentem",
        "znacznikiem HTML tworzącym nowe okno",
        "metodą otwierającą okno dialogowe",
        "tablicą wszystkich otwartych kart",
      ],
      poprawna: "obiektem reprezentującym okno przeglądarki wraz z dokumentem",
    },
    {
      typ: "zamkniete",
      text: "Który element jest korzeniem drzewa DOM?",
      opcje: ["html", "body", "head", "document"],
      poprawna: "html",
    },
    {
      typ: "lista",
      text: "Czym jest API przeglądarki?",
      opcje: [
        "zestawem gotowych obiektów i metod, którymi skrypt sięga po możliwości przeglądarki",
        "biblioteką, którą trzeba pobrać z internetu",
        "sposobem zapisu danych w bazie",
        "językiem programowania po stronie serwera",
      ],
      poprawna: "zestawem gotowych obiektów i metod, którymi skrypt sięga po możliwości przeglądarki",
    },
    {
      typ: "zamkniete",
      text: "Uczeń chce dodać nowy punkt do listy. W jakiej kolejności to zrobi?",
      opcje: [
        "utworzyć element, ustawić jego treść, dołączyć go do listy",
        "dołączyć element do listy, potem go utworzyć",
        "ustawić treść, dołączyć, na końcu utworzyć element",
        "wystarczy zmienić textContent samej listy",
      ],
      poprawna: "utworzyć element, ustawić jego treść, dołączyć go do listy",
    },
  ],
});
