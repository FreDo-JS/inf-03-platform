import { zbuduj } from "./generator.mjs";

zbuduj({
  plik: "03-js-zmienne-warunki-petle-funkcje.sql",
  ziarno: 418203,
  tytul: "JavaScript: zmienne, warunki, pętle i funkcje",
  czas: 2400,
  kwalifikacja: "inf03",
  naglowek: `-- =============================================================================
-- TEST 3/4 — JavaScript: zmienne i typy · napisy · warunki, pętle, funkcje
--
-- Zakres z materiałów podpiętych do podtematów 1–2 kategorii „JavaScript”.
-- Większość pytań polega na przeczytaniu kodu i podaniu wyniku.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================`,
  pytania: [
    {
      typ: "zamkniete",
      text: "Co wypisze: console.log(5 + \"10\") ?",
      opcje: ['"510"', "15", "NaN", "błąd wykonania"],
      poprawna: '"510"',
    },
    {
      typ: "zamkniete",
      text: 'Co wypisze: console.log("10" - 5) ?',
      opcje: ["5", '"105"', "NaN", "undefined"],
      poprawna: "5",
    },
    {
      typ: "zamkniete",
      text: 'Co wypisze: console.log(typeof "10" * 2) ?',
      opcje: ["NaN", "20", '"1010"', "number"],
      poprawna: "NaN",
    },
    {
      typ: "zamkniete",
      text: "Co wypisze: console.log(7 % 3) ?",
      opcje: ["1", "2,33", "2", "21"],
      poprawna: "1",
    },
    {
      typ: "zamkniete",
      text: "Co wypisze: console.log(2 ** 3) ?",
      opcje: ["8", "6", "5", "23"],
      poprawna: "8",
    },
    {
      typ: "zamkniete",
      text: "Co zwróci: console.log(10 / 0) ?",
      opcje: ["Infinity", "0", "NaN", "błąd dzielenia przez zero"],
      poprawna: "Infinity",
    },
    {
      typ: "zamkniete",
      text: 'Co wypisze: console.log("5" == 5, "5" === 5) ?',
      opcje: ["true false", "true true", "false false", "false true"],
      poprawna: "true false",
    },
    {
      typ: "otwarte",
      text: "Jakim operatorem porównasz dwie wartości tak, żeby liczył się również ich typ? Wpisz sam operator.",
      akceptowane: ["===", "operator ===", "=== (identyczność)"],
    },
    {
      typ: "zamkniete",
      text: "Uczeń napisał: const wiek = 18; wiek = 19; Co się stanie?",
      opcje: [
        "błąd — zmiennej zadeklarowanej przez const nie da się przypisać ponownie",
        "nic, wiek zmieni się na 19",
        "wiek zostanie 18, bez żadnego komunikatu",
        "zmienna zniknie z pamięci",
      ],
      poprawna: "błąd — zmiennej zadeklarowanej przez const nie da się przypisać ponownie",
    },
    {
      typ: "lista",
      text: "Którym słowem kluczowym zadeklarujesz zmienną, której wartość będzie się zmieniać w pętli?",
      opcje: ["let", "const", "define", "static"],
      poprawna: "let",
    },
    {
      typ: "zamkniete",
      text: "let x; console.log(x); — co zobaczymy w konsoli?",
      opcje: ["undefined", "null", "0", "błąd: zmienna nie istnieje"],
      poprawna: "undefined",
    },
    {
      typ: "zamkniete",
      text: "Czym różni się null od undefined?",
      opcje: [
        "null przypisujemy celowo jako pustą wartość, undefined pojawia się samo w niezainicjowanej zmiennej",
        "undefined przypisujemy celowo, null pojawia się samo",
        "to dwie nazwy tej samej wartości",
        "null oznacza zero, undefined pusty napis",
      ],
      poprawna:
        "null przypisujemy celowo jako pustą wartość, undefined pojawia się samo w niezainicjowanej zmiennej",
    },
    {
      typ: "pary",
      text: "Dopasuj wartość do jej typu",
      pary: [
        ['"42"', "string"],
        ["42", "number"],
        ["false", "boolean"],
        ["null", "celowo pusta wartość"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Która z tych wartości zachowa się w warunku if jak fałsz?",
      opcje: ["0", '"0"', "[]", '"false"'],
      poprawna: "0",
    },
    {
      typ: "zamkniete",
      text: "Warunek: if (wiek >= 13 && wiek < 18). Dla jakiego wieku będzie prawdziwy?",
      opcje: ["15", "18", "12", "20"],
      poprawna: "15",
    },
    {
      typ: "lista",
      text: "Który operator logiczny wystarczy, żeby cały warunek był prawdziwy, gdy spełniony jest choć jeden składnik?",
      opcje: ["||", "&&", "!", "=="],
      poprawna: "||",
    },
    {
      typ: "otwarte",
      text: "Który operator odwraca wartość logiczną na przeciwną? Wpisz sam znak.",
      akceptowane: ["!", "wykrzyknik", "negacja", "operator !"],
    },
    {
      typ: "zamkniete",
      text: "W instrukcji switch uczeń zapomniał instrukcji break w pierwszym przypadku. Co się stanie po dopasowaniu tego przypadku?",
      opcje: [
        "wykonają się także instrukcje z kolejnych przypadków",
        "program zatrzyma się z błędem",
        "wykona się tylko ten przypadek, break nie jest potrzebny",
        "switch przejdzie od razu do default",
      ],
      poprawna: "wykonają się także instrukcje z kolejnych przypadków",
    },
    {
      typ: "zamkniete",
      text: "Kiedy wykona się blok default w instrukcji switch?",
      opcje: [
        "gdy żaden przypadek case nie pasuje do wartości",
        "zawsze, jako pierwszy",
        "zawsze, na końcu każdego dopasowania",
        "gdy w którymś case zabraknie break",
      ],
      poprawna: "gdy żaden przypadek case nie pasuje do wartości",
    },
    {
      typ: "zamkniete",
      text: "Ile razy wykona się pętla: for (let i = 0; i < 5; i++) ?",
      opcje: ["5", "4", "6", "nieskończenie wiele"],
      poprawna: "5",
    },
    {
      typ: "zamkniete",
      text: "Co wypisze pętla: for (let i = 1; i <= 3; i++) { console.log(i * 2); } ?",
      opcje: ["2, 4, 6", "1, 2, 3", "2, 4, 6, 8", "0, 2, 4"],
      poprawna: "2, 4, 6",
    },
    {
      typ: "zamkniete",
      text: "Uczeń napisał: let i = 0; while (i < 5) { console.log(i); } Co się stanie?",
      opcje: [
        "pętla nigdy się nie skończy, bo i się nie zmienia",
        "pętla wykona się pięć razy",
        "pętla nie wykona się ani razu",
        "program zgłosi błąd składni",
      ],
      poprawna: "pętla nigdy się nie skończy, bo i się nie zmienia",
    },
    {
      typ: "zamkniete",
      text: "Czym różni się do...while od while, gdy warunek jest fałszywy od samego początku?",
      opcje: [
        "do...while wykona blok raz, while ani razu",
        "obie pętle nie wykonają się ani razu",
        "do...while nie wykona się, while wykona raz",
        "obie wykonają się raz",
      ],
      poprawna: "do...while wykona blok raz, while ani razu",
    },
    {
      typ: "pary",
      text: "Dopasuj pętlę do zadania, do którego pasuje najlepiej",
      pary: [
        ["for", "powtórzenie znanej z góry liczby razy"],
        ["for...of", "przejście po kolejnych wartościach tablicy"],
        ["for...in", "przejście po właściwościach obiektu"],
        ["while", "powtarzanie, dopóki warunek jest prawdziwy"],
      ],
    },
    {
      typ: "lista",
      text: "Która instrukcja przerywa pętlę i wychodzi z niej całkowicie?",
      opcje: ["break", "continue", "return", "exit"],
      poprawna: "break",
    },
    {
      typ: "otwarte",
      text: "Która instrukcja pomija bieżące przejście pętli i przechodzi do następnego?",
      akceptowane: ["continue", "instrukcja continue"],
    },
    {
      typ: "zamkniete",
      text: "function dodaj(a, b) { return a + b; } — czym w tym zapisie są a i b?",
      opcje: [
        "parametrami funkcji",
        "argumentami wywołania",
        "zmiennymi globalnymi",
        "wartościami zwracanymi",
      ],
      poprawna: "parametrami funkcji",
    },
    {
      typ: "zamkniete",
      text: "Uczeń zadeklarował funkcję powitaj(), ale w konsoli nic się nie pojawia. Czego zabrakło?",
      opcje: [
        "wywołania funkcji zapisem powitaj()",
        "słowa kluczowego return we wnętrzu",
        "przypisania funkcji do zmiennej",
        "umieszczenia funkcji na końcu pliku",
      ],
      poprawna: "wywołania funkcji zapisem powitaj()",
    },
    {
      typ: "zamkniete",
      text: "function podwoj(x) { x * 2; } — co zwróci wywołanie podwoj(4)?",
      opcje: ["undefined", "8", "4", "NaN"],
      poprawna: "undefined",
    },
    {
      typ: "otwarte",
      text: "Jakie słowo kluczowe zwraca wartość z wnętrza funkcji?",
      akceptowane: ["return", "słowo return"],
    },
    {
      typ: "zamkniete",
      text: 'Jak wstawić wartość zmiennej imie do napisu powitania w szablonie (template literal)?',
      opcje: [
        "`Cześć, ${imie}!` w odwrotnych apostrofach",
        "'Cześć, {imie}!' w apostrofach",
        '"Cześć, $imie!" w cudzysłowie',
        "`Cześć, #{imie}!` w odwrotnych apostrofach",
      ],
      poprawna: "`Cześć, ${imie}!` w odwrotnych apostrofach",
    },
    {
      typ: "zamkniete",
      text: 'const imie = "Ania"; console.log(imie[0]); — co się wypisze?',
      opcje: ['"A"', '"Ania"', "0", "undefined"],
      poprawna: '"A"',
    },
    {
      typ: "zamkniete",
      text: 'Co wypisze: console.log("  javascript  ".trim().toUpperCase()) ?',
      opcje: ['"JAVASCRIPT"', '"  JAVASCRIPT  "', '"javascript"', "błąd, nie można łączyć metod"],
      poprawna: '"JAVASCRIPT"',
    },
    {
      typ: "pary",
      text: "Dopasuj metodę napisu do jej działania",
      pary: [
        ["toUpperCase()", "zamienia litery na wielkie"],
        ["trim()", "usuwa spacje z początku i końca"],
        ["includes()", "sprawdza, czy napis zawiera podany fragment"],
        ["slice()", "zwraca wycinek napisu"],
      ],
    },
    {
      typ: "zamkniete",
      text: 'let s = "kot"; s[0] = "l"; console.log(s); — co się wypisze?',
      opcje: ['"kot" — napisy są niezmienne', '"lot"', "undefined", "błąd wykonania"],
      poprawna: '"kot" — napisy są niezmienne',
    },
    {
      typ: "lista",
      text: 'Która funkcja zamieni napis "42" na liczbę całkowitą?',
      opcje: ["parseInt()", "toString()", "charAt()", "toFixed()"],
      poprawna: "parseInt()",
    },
    {
      typ: "zamkniete",
      text: "Co zwróci Math.round(4.5), a co Math.floor(4.9) ?",
      opcje: ["5 oraz 4", "4 oraz 5", "5 oraz 5", "4 oraz 4"],
      poprawna: "5 oraz 4",
    },
    {
      typ: "otwarte",
      text: "Która metoda obiektu Math zwraca liczbę losową z przedziału od 0 (włącznie) do 1 (wyłącznie)?",
      akceptowane: ["Math.random()", "Math.random", "random", "random()"],
    },
    {
      typ: "lista",
      text: "Która metoda obiektu Math zwróci największą z podanych liczb?",
      opcje: ["Math.max()", "Math.min()", "Math.pow()", "Math.abs()"],
      poprawna: "Math.max()",
    },
    {
      typ: "zamkniete",
      text: "Jak zgodnie z konwencją nazwiesz zmienną logiczną przechowującą informację, czy użytkownik jest zalogowany?",
      opcje: ["isLoggedIn", "is_logged_in", "IsLoggedIn", "logged"],
      poprawna: "isLoggedIn",
    },
  ],
});
