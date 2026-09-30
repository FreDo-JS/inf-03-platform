-- =============================================================================
-- TEST 3/4 — JavaScript: zmienne i typy · napisy · warunki, pętle, funkcje
--
-- Zakres z materiałów podpiętych do podtematów 1–2 kategorii „JavaScript”.
-- Większość pytań polega na przeczytaniu kodu i podaniu wyniku.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'JavaScript: zmienne, warunki, pętle i funkcje',
    2400,
    $json$[
      {"type":"closed","text":"Co wypisze: console.log(5 + \"10\") ?","options":["NaN","\"510\"","błąd wykonania","15"]},
      {"type":"closed","text":"Co wypisze: console.log(\"10\" - 5) ?","options":["NaN","5","undefined","\"105\""]},
      {"type":"closed","text":"Co wypisze: console.log(typeof \"10\" * 2) ?","options":["20","\"1010\"","number","NaN"]},
      {"type":"closed","text":"Co wypisze: console.log(7 % 3) ?","options":["2,33","21","1","2"]},
      {"type":"closed","text":"Co wypisze: console.log(2 ** 3) ?","options":["23","5","8","6"]},
      {"type":"closed","text":"Co zwróci: console.log(10 / 0) ?","options":["Infinity","błąd dzielenia przez zero","NaN","0"]},
      {"type":"closed","text":"Co wypisze: console.log(\"5\" == 5, \"5\" === 5) ?","options":["true true","true false","false false","false true"]},
      {"type":"input","text":"Jakim operatorem porównasz dwie wartości tak, żeby liczył się również ich typ? Wpisz sam operator."},
      {"type":"closed","text":"Uczeń napisał: const wiek = 18; wiek = 19; Co się stanie?","options":["wiek zostanie 18, bez żadnego komunikatu","nic, wiek zmieni się na 19","błąd — zmiennej zadeklarowanej przez const nie da się przypisać ponownie","zmienna zniknie z pamięci"]},
      {"type":"select","text":"Którym słowem kluczowym zadeklarujesz zmienną, której wartość będzie się zmieniać w pętli?","options":["const","define","let","static"]},
      {"type":"closed","text":"let x; console.log(x); — co zobaczymy w konsoli?","options":["undefined","0","błąd: zmienna nie istnieje","null"]},
      {"type":"closed","text":"Czym różni się null od undefined?","options":["null oznacza zero, undefined pusty napis","to dwie nazwy tej samej wartości","undefined przypisujemy celowo, null pojawia się samo","null przypisujemy celowo jako pustą wartość, undefined pojawia się samo w niezainicjowanej zmiennej"]},
      {"type":"matching","text":"Dopasuj wartość do jej typu","left":["\"42\"","42","false","null"],"right":["string","celowo pusta wartość","number","boolean"]},
      {"type":"closed","text":"Która z tych wartości zachowa się w warunku if jak fałsz?","options":["[]","\"false\"","\"0\"","0"]},
      {"type":"closed","text":"Warunek: if (wiek >= 13 && wiek < 18). Dla jakiego wieku będzie prawdziwy?","options":["12","20","18","15"]},
      {"type":"select","text":"Który operator logiczny wystarczy, żeby cały warunek był prawdziwy, gdy spełniony jest choć jeden składnik?","options":["&&","!","==","||"]},
      {"type":"input","text":"Który operator odwraca wartość logiczną na przeciwną? Wpisz sam znak."},
      {"type":"closed","text":"W instrukcji switch uczeń zapomniał instrukcji break w pierwszym przypadku. Co się stanie po dopasowaniu tego przypadku?","options":["wykonają się także instrukcje z kolejnych przypadków","program zatrzyma się z błędem","switch przejdzie od razu do default","wykona się tylko ten przypadek, break nie jest potrzebny"]},
      {"type":"closed","text":"Kiedy wykona się blok default w instrukcji switch?","options":["gdy w którymś case zabraknie break","zawsze, jako pierwszy","zawsze, na końcu każdego dopasowania","gdy żaden przypadek case nie pasuje do wartości"]},
      {"type":"closed","text":"Ile razy wykona się pętla: for (let i = 0; i < 5; i++) ?","options":["4","nieskończenie wiele","6","5"]},
      {"type":"closed","text":"Co wypisze pętla: for (let i = 1; i <= 3; i++) { console.log(i * 2); } ?","options":["2, 4, 6","1, 2, 3","0, 2, 4","2, 4, 6, 8"]},
      {"type":"closed","text":"Uczeń napisał: let i = 0; while (i < 5) { console.log(i); } Co się stanie?","options":["pętla nie wykona się ani razu","pętla nigdy się nie skończy, bo i się nie zmienia","pętla wykona się pięć razy","program zgłosi błąd składni"]},
      {"type":"closed","text":"Czym różni się do...while od while, gdy warunek jest fałszywy od samego początku?","options":["obie pętle nie wykonają się ani razu","obie wykonają się raz","do...while wykona blok raz, while ani razu","do...while nie wykona się, while wykona raz"]},
      {"type":"matching","text":"Dopasuj pętlę do zadania, do którego pasuje najlepiej","left":["for","for...of","for...in","while"],"right":["przejście po właściwościach obiektu","powtórzenie znanej z góry liczby razy","powtarzanie, dopóki warunek jest prawdziwy","przejście po kolejnych wartościach tablicy"]},
      {"type":"select","text":"Która instrukcja przerywa pętlę i wychodzi z niej całkowicie?","options":["break","return","exit","continue"]},
      {"type":"input","text":"Która instrukcja pomija bieżące przejście pętli i przechodzi do następnego?"},
      {"type":"closed","text":"function dodaj(a, b) { return a + b; } — czym w tym zapisie są a i b?","options":["zmiennymi globalnymi","parametrami funkcji","argumentami wywołania","wartościami zwracanymi"]},
      {"type":"closed","text":"Uczeń zadeklarował funkcję powitaj(), ale w konsoli nic się nie pojawia. Czego zabrakło?","options":["wywołania funkcji zapisem powitaj()","przypisania funkcji do zmiennej","słowa kluczowego return we wnętrzu","umieszczenia funkcji na końcu pliku"]},
      {"type":"closed","text":"function podwoj(x) { x * 2; } — co zwróci wywołanie podwoj(4)?","options":["4","undefined","8","NaN"]},
      {"type":"input","text":"Jakie słowo kluczowe zwraca wartość z wnętrza funkcji?"},
      {"type":"closed","text":"Jak wstawić wartość zmiennej imie do napisu powitania w szablonie (template literal)?","options":["`Cześć, #{imie}!` w odwrotnych apostrofach","\"Cześć, $imie!\" w cudzysłowie","`Cześć, ${imie}!` w odwrotnych apostrofach","'Cześć, {imie}!' w apostrofach"]},
      {"type":"closed","text":"const imie = \"Ania\"; console.log(imie[0]); — co się wypisze?","options":["\"A\"","\"Ania\"","undefined","0"]},
      {"type":"closed","text":"Co wypisze: console.log(\"  javascript  \".trim().toUpperCase()) ?","options":["\"javascript\"","\"JAVASCRIPT\"","błąd, nie można łączyć metod","\"  JAVASCRIPT  \""]},
      {"type":"matching","text":"Dopasuj metodę napisu do jej działania","left":["toUpperCase()","trim()","includes()","slice()"],"right":["zwraca wycinek napisu","zamienia litery na wielkie","sprawdza, czy napis zawiera podany fragment","usuwa spacje z początku i końca"]},
      {"type":"closed","text":"let s = \"kot\"; s[0] = \"l\"; console.log(s); — co się wypisze?","options":["undefined","błąd wykonania","\"kot\" — napisy są niezmienne","\"lot\""]},
      {"type":"select","text":"Która funkcja zamieni napis \"42\" na liczbę całkowitą?","options":["toFixed()","charAt()","parseInt()","toString()"]},
      {"type":"closed","text":"Co zwróci Math.round(4.5), a co Math.floor(4.9) ?","options":["5 oraz 4","4 oraz 5","5 oraz 5","4 oraz 4"]},
      {"type":"input","text":"Która metoda obiektu Math zwraca liczbę losową z przedziału od 0 (włącznie) do 1 (wyłącznie)?"},
      {"type":"select","text":"Która metoda obiektu Math zwróci największą z podanych liczb?","options":["Math.min()","Math.pow()","Math.abs()","Math.max()"]},
      {"type":"closed","text":"Jak zgodnie z konwencją nazwiesz zmienną logiczną przechowującą informację, czy użytkownik jest zalogowany?","options":["IsLoggedIn","isLoggedIn","logged","is_logged_in"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["\"510\""],
  ["5"],
  ["NaN"],
  ["1"],
  ["8"],
  ["Infinity"],
  ["true false"],
  ["===", "operator ===", "=== (identyczność)"],
  ["błąd — zmiennej zadeklarowanej przez const nie da się przypisać ponownie"],
  ["let"],
  ["undefined"],
  ["null przypisujemy celowo jako pustą wartość, undefined pojawia się samo w niezainicjowanej zmiennej"],
  ["string", "number", "boolean", "celowo pusta wartość"],
  ["0"],
  ["15"],
  ["||"],
  ["!", "wykrzyknik", "negacja", "operator !"],
  ["wykonają się także instrukcje z kolejnych przypadków"],
  ["gdy żaden przypadek case nie pasuje do wartości"],
  ["5"],
  ["2, 4, 6"],
  ["pętla nigdy się nie skończy, bo i się nie zmienia"],
  ["do...while wykona blok raz, while ani razu"],
  ["powtórzenie znanej z góry liczby razy", "przejście po kolejnych wartościach tablicy", "przejście po właściwościach obiektu", "powtarzanie, dopóki warunek jest prawdziwy"],
  ["break"],
  ["continue", "instrukcja continue"],
  ["parametrami funkcji"],
  ["wywołania funkcji zapisem powitaj()"],
  ["undefined"],
  ["return", "słowo return"],
  ["`Cześć, ${imie}!` w odwrotnych apostrofach"],
  ["\"A\""],
  ["\"JAVASCRIPT\""],
  ["zamienia litery na wielkie", "usuwa spacje z początku i końca", "sprawdza, czy napis zawiera podany fragment", "zwraca wycinek napisu"],
  ["\"kot\" — napisy są niezmienne"],
  ["parseInt()"],
  ["5 oraz 4"],
  ["Math.random()", "Math.random", "random", "random()"],
  ["Math.max()"],
  ["isLoggedIn"]
]$json$::jsonb
from nowy;
