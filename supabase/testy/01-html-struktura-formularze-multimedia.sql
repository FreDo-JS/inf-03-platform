-- =============================================================================
-- TEST 1/4 — HTML: struktura i semantyka · tabele, listy, formularze · multimedia
--
-- Zakres z materiałów podpiętych do podtematów 1–3 kategorii „HTML i CSS”.
-- Pytania oparte na kodzie i typowych błędach, nie na definicjach.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'HTML: struktura, formularze i multimedia',
    2400,
    $json$[
      {"type":"closed","text":"Uczeń wstawił zdjęcie zapisem <img src=\"wykres.png\"> i walidator zgłasza błąd. Czego brakuje?","options":["atrybutu alt","atrybutu type","atrybutu title","znacznika zamykającego </img>"]},
      {"type":"closed","text":"Strona ma nagłówki w kolejności: h1, a zaraz po nim h3. Co jest z tym nie tak?","options":["h1 musi być jeden na sekcję, a nie na stronę","pominięty poziom h2 psuje hierarchię dla czytników ekranu","h3 nie może wystąpić po h1 — przeglądarka go zignoruje","nic, kolejność nagłówków jest dowolna"]},
      {"type":"select","text":"Który zapis poprawnie wiąże etykietę z polem tekstowym?","options":["<label for=\"mail\">E-mail</label> <input id=\"mail\">","<label id=\"mail\">E-mail</label> <input for=\"mail\">","<label>E-mail</label> <input class=\"mail\">","<label name=\"mail\">E-mail</label> <input name=\"mail\">"]},
      {"type":"closed","text":"Pole zapisano jako <input type=\"number\" min=\"2\" max=\"10\" required>. Której wartości przeglądarka NIE przyjmie przy wysyłaniu?","options":["2","12","10","7"]},
      {"type":"closed","text":"Dwa pola typu radio mają różne wartości atrybutu name. Jak zachowa się formularz?","options":["przeglądarka sama nada im wspólną nazwę","formularz w ogóle się nie wyśle","zaznaczenie drugiego odznaczy pierwsze, tak jak zwykle","da się zaznaczyć oba naraz, bo nie tworzą jednej grupy"]},
      {"type":"input","text":"Uczeń grupuje trzy pola radio wewnątrz fieldset i chce opisać całą grupę pytaniem. Jakiego znacznika użyje do tego opisu?"},
      {"type":"closed","text":"Na stronie jest <audio src=\"dzwonek.mp3\"></audio>, ale nie widać żadnego odtwarzacza. Dlaczego?","options":["format mp3 nie jest obsługiwany przez element audio","potrzebny jest atrybut autoplay","element audio musi stać w sekcji head","brakuje atrybutu controls"]},
      {"type":"select","text":"Logo szkoły ma wyglądać ostro i na wizytówce, i na banerze przez pół ekranu. Który format wybierzesz?","options":["JPEG","SVG","GIF","PNG"]},
      {"type":"input","text":"Od jakiej deklaracji musi zaczynać się plik HTML5? Wpisz ją dokładnie."},
      {"type":"closed","text":"Strona wyświetla „PrzykÅ‚ad” zamiast „Przykład”. Czego najpewniej brakuje w sekcji head?","options":["znacznika <title>","<meta name=\"viewport\" content=\"width=device-width\">","<meta charset=\"UTF-8\">","atrybutu lang w znaczniku html"]},
      {"type":"closed","text":"Strona na telefonie wygląda jak pomniejszony widok z komputera i trzeba ją przybliżać palcami. Czego brakuje?","options":["znacznika <main> wokół treści","atrybutu charset w znaczniku meta","<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">","arkusza stylów podpiętego przez <link>"]},
      {"type":"select","text":"Który zapis podpina zewnętrzny arkusz stylów?","options":["<link rel=\"stylesheet\" href=\"styl.css\">","<link src=\"styl.css\" type=\"css\">","<style src=\"styl.css\"></style>","<script rel=\"stylesheet\" href=\"styl.css\">"]},
      {"type":"closed","text":"Uczeń zbudował całą stronę z samych znaczników div. Wygląda dobrze. Co na tym traci?","options":["strona będzie ładować się wolniej","czytniki ekranu i wyszukiwarki nie rozpoznają struktury strony","arkusz CSS przestanie działać na takich elementach","nic — div jest równoważny znacznikom semantycznym"]},
      {"type":"matching","text":"Dopasuj znacznik do treści, którą powinien obejmować","left":["<nav>","<article>","<figure>","<footer>"],"right":["zdjęcie wraz z podpisem","wpis bloga, zrozumiały także w oderwaniu od strony","stopka z danymi kontaktowymi","menu z odnośnikami do podstron"]},
      {"type":"closed","text":"Kiedy poprawne jest użycie pustego atrybutu alt, czyli alt=\"\"?","options":["gdy obrazek jest bardzo duży","gdy obrazek jest tylko ozdobą i nie niesie treści","gdy obrazek służy jako tło sekcji","nigdy — alt zawsze musi zawierać opis"]},
      {"type":"closed","text":"Co zobaczy użytkownik, jeśli plik z obrazkiem zniknie z serwera?","options":["tekst z atrybutu alt","pusty prostokąt bez opisu","komunikat przeglądarki o błędzie 404","poprzedni obrazek z pamięci podręcznej"]},
      {"type":"select","text":"Przepis kulinarny: lista składników i lista kolejnych kroków. Jak oznaczysz każdą z nich?","options":["obie jako <ul>","obie jako <dl>","składniki <ul>, kroki <ol>","składniki <ol>, kroki <ul>"]},
      {"type":"input","text":"W tabeli komórki pierwszego wiersza mają być nagłówkami kolumn. Jakiego znacznika użyjesz zamiast td?"},
      {"type":"matching","text":"Dopasuj znacznik tabeli do jego roli","left":["<tr>","<td>","<th>","<caption>"],"right":["wiersz tabeli","tytuł całej tabeli","komórka nagłówkowa","zwykła komórka z danymi"]},
      {"type":"closed","text":"Formularz logowania ma wysłać hasło. Który zapis jest właściwy?","options":["<form action=\"post\" method=\"login.php\">","<form method=\"get\" action=\"login.php\">","<form method=\"post\" action=\"login.php\">","<form send=\"post\" url=\"login.php\">"]},
      {"type":"input","text":"Który atrybut znacznika form wskazuje adres, pod który trafią dane po wysłaniu?"},
      {"type":"closed","text":"Uczeń zamiast etykiet wpisał same podpowiedzi w placeholderach („Imię”, „E-mail”). Co jest w tym złego?","options":["placeholder blokuje wysłanie formularza","nic, to zalecany sposób opisywania pól","podpowiedź znika po kliknięciu, a czytnik ekranu nie traktuje jej jak etykiety","placeholder działa tylko w polach typu text"]},
      {"type":"matching","text":"Dopasuj atrybut pola do tego, co narzuca","left":["required","maxlength","min","readonly"],"right":["wartość widać, ale nie da się jej zmienić","najwyżej tyle znaków","pole nie może zostać puste","najmniejsza dopuszczalna liczba"]},
      {"type":"closed","text":"W formularzu jest <button>Wyślij</button> bez atrybutu type. Co się stanie po kliknięciu?","options":["formularz zostanie wyczyszczony","formularz zostanie wysłany, bo domyślny typ to submit","przeglądarka zgłosi błąd składni","nic, bo brakuje type=\"submit\""]},
      {"type":"select","text":"Który typ pola sprawi, że przeglądarka sama sprawdzi obecność znaku @ w adresie?","options":["email","mail","text","address"]},
      {"type":"matching","text":"Dopasuj typ pola do sytuacji, w której go użyjesz","left":["checkbox","radio","number","textarea"],"right":["zgoda na regulamin, zaznaczana niezależnie","kilkuzdaniowa wiadomość do nauczyciela","wybór jednej z trzech dat wycieczki","liczba zamawianych biletów"]},
      {"type":"closed","text":"Odnośnik zapisano jako <a href=\"cennik.html\" target=\"_blank\">. Co zrobi przeglądarka po kliknięciu?","options":["otworzy stronę w tym samym oknie","otworzy stronę w ramce nadrzędnej","pobierze plik cennik.html na dysk","otworzy stronę w nowej karcie"]},
      {"type":"select","text":"Twoja strona jest osadzona w ramce iframe na cudzym portalu. Która wartość target otworzy odnośnik w pełnym oknie przeglądarki?","options":["_self","_parent","_top","_blank"]},
      {"type":"matching","text":"Dopasuj stan odnośnika do sytuacji","left":[":link",":visited",":hover",":active"],"right":["użytkownik jeszcze tam nie zaglądał","odnośnik jest w tej chwili wciskany","strona docelowa była już otwierana","kursor stoi nad odnośnikiem"]},
      {"type":"closed","text":"Nauczyciel chce osadzić na stronie film z YouTube. Którego elementu użyje?","options":["<object>","<embed>","<video>","<iframe>"]},
      {"type":"closed","text":"Który zestaw formatów obsługuje element audio według materiału?","options":["avi, mkv, mov","mp4, webm, ogg","jpg, png, svg","mp3, wav, ogg"]},
      {"type":"input","text":"Który atrybut elementu video sprawi, że film zacznie się od nowa zaraz po zakończeniu?"},
      {"type":"closed","text":"Co oznacza, że obrazek i ramka iframe to elementy zastępowane?","options":["można je zastąpić dowolnym innym znacznikiem","przeglądarka podmienia je na element div","ich treść pochodzi z zasobu zewnętrznego, więc CSS nie zmieni jej zawartości","są przestarzałe i zastąpione nowszymi znacznikami"]},
      {"type":"select","text":"Tekst ma być pochylony, bo to łacińska nazwa gatunku — nie dlatego, że jest ważny. Co wybierzesz?","options":["<b>","<i lang=\"la\">","<strong>","<em>"]},
      {"type":"closed","text":"Czym różni się <strong> od <b> dla osoby korzystającej z czytnika ekranu?","options":["<strong> zostanie odczytany z naciskiem jako ważny, <b> tylko pogrubia wizualnie","nie ma między nimi żadnej różnicy","<b> zostanie pominięty w odczycie","oba zostaną przeczytane z naciskiem"]},
      {"type":"input","text":"Jaki znacznik obejmuje definiowany termin na liście definicji (wewnątrz dl)?"},
      {"type":"closed","text":"Do czego służy <meta name=\"description\" content=\"...\">?","options":["opisuje stronę czytnikom ekranu zamiast nagłówka","ustawia tytuł widoczny na karcie przeglądarki","wyświetla opis nad treścią strony","podaje opis, który wyszukiwarka pokazuje pod tytułem strony w wynikach"]},
      {"type":"select","text":"Który element wstawi wielowierszowe pole na dłuższą wypowiedź?","options":["<textarea>","<select multiple>","<input type=\"long\">","<input type=\"text\">"]},
      {"type":"input","text":"Który atrybut nadany kilku polom radio sprawia, że tworzą jedną grupę i da się wybrać tylko jedno?"},
      {"type":"closed","text":"Uczeń napisał <img src=\"kot.jpg\" /> zamiast <img src=\"kot.jpg\">. Co się stanie?","options":["przeglądarka doda pusty znacznik zamykający","obrazek się nie wyświetli","walidator zgłosi błąd składni","nic — oba zapisy są poprawne dla elementu pustego"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["atrybutu alt"],
  ["pominięty poziom h2 psuje hierarchię dla czytników ekranu"],
  ["<label for=\"mail\">E-mail</label> <input id=\"mail\">"],
  ["12"],
  ["da się zaznaczyć oba naraz, bo nie tworzą jednej grupy"],
  ["legend", "<legend>"],
  ["brakuje atrybutu controls"],
  ["SVG"],
  ["<!DOCTYPE html>", "!DOCTYPE html", "doctype html", "<!doctype html>"],
  ["<meta charset=\"UTF-8\">"],
  ["<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"],
  ["<link rel=\"stylesheet\" href=\"styl.css\">"],
  ["czytniki ekranu i wyszukiwarki nie rozpoznają struktury strony"],
  ["menu z odnośnikami do podstron", "wpis bloga, zrozumiały także w oderwaniu od strony", "zdjęcie wraz z podpisem", "stopka z danymi kontaktowymi"],
  ["gdy obrazek jest tylko ozdobą i nie niesie treści"],
  ["tekst z atrybutu alt"],
  ["składniki <ul>, kroki <ol>"],
  ["th", "<th>"],
  ["wiersz tabeli", "zwykła komórka z danymi", "komórka nagłówkowa", "tytuł całej tabeli"],
  ["<form method=\"post\" action=\"login.php\">"],
  ["action", "atrybut action"],
  ["podpowiedź znika po kliknięciu, a czytnik ekranu nie traktuje jej jak etykiety"],
  ["pole nie może zostać puste", "najwyżej tyle znaków", "najmniejsza dopuszczalna liczba", "wartość widać, ale nie da się jej zmienić"],
  ["formularz zostanie wysłany, bo domyślny typ to submit"],
  ["email"],
  ["zgoda na regulamin, zaznaczana niezależnie", "wybór jednej z trzech dat wycieczki", "liczba zamawianych biletów", "kilkuzdaniowa wiadomość do nauczyciela"],
  ["otworzy stronę w nowej karcie"],
  ["_top"],
  ["użytkownik jeszcze tam nie zaglądał", "strona docelowa była już otwierana", "kursor stoi nad odnośnikiem", "odnośnik jest w tej chwili wciskany"],
  ["<iframe>"],
  ["mp3, wav, ogg"],
  ["loop", "atrybut loop"],
  ["ich treść pochodzi z zasobu zewnętrznego, więc CSS nie zmieni jej zawartości"],
  ["<i lang=\"la\">"],
  ["<strong> zostanie odczytany z naciskiem jako ważny, <b> tylko pogrubia wizualnie"],
  ["dt", "<dt>"],
  ["podaje opis, który wyszukiwarka pokazuje pod tytułem strony w wynikach"],
  ["<textarea>"],
  ["name", "atrybut name"],
  ["nic — oba zapisy są poprawne dla elementu pustego"]
]$json$::jsonb
from nowy;
