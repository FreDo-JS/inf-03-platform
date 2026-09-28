-- =============================================================================
-- TEST 1/4 — HTML: struktura i semantyka · tabele, listy, formularze · multimedia
--
-- Zakres wzięty z materiałów podpiętych do podtematów 1–3 kategorii „HTML i CSS”
-- (freeCodeCamp: Basic HTML Review, Semantic HTML Review, HTML Tables and Forms
-- Review, lekcje o linkach, audio/video, elementach zastępowanych, link/meta).
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu
-- (Panel → Testy i PIN-y). create_test tutaj nie zadziała: wymaga zalogowanego
-- admina, a w SQL Editorze nie ma tokenu, dlatego wstawiamy wprost do tabel.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'HTML: struktura, formularze i multimedia',
    2400,
    $json$[
      {"type":"closed","text":"Który element przechowuje główną treść strony (jeden na dokument)?","options":["<main>","<section>","<div>","<body>"]},
      {"type":"closed","text":"Ile poziomów nagłówków definiuje HTML?","options":["6","3","10","8"]},
      {"type":"select","text":"Który element jest elementem pustym (void) — nie ma znacznika zamykającego?","options":["<img>","<p>","<section>","<button>"]},
      {"type":"input","text":"Jak nazywa się atrybut obrazka z tekstem alternatywnym, czytanym przez czytniki ekranu?"},
      {"type":"closed","text":"Gdzie umieszcza się element <link> podpinający zewnętrzny arkusz stylów?","options":["w elemencie <head>","na końcu <body>","w elemencie <main>","w pliku CSS"]},
      {"type":"input","text":"Jaką wartość musi mieć atrybut rel elementu <link>, aby podpiąć arkusz stylów?"},
      {"type":"select","text":"Który zapis poprawnie ustawia opis strony dla wyszukiwarek?","options":["<meta name=\"description\" content=\"Opis strony\">","<meta description=\"Opis strony\">","<description>Opis strony</description>","<meta name=\"seo\" value=\"Opis strony\">"]},
      {"type":"closed","text":"Który element oznacza samodzielną treść, np. wpis bloga lub artykuł prasowy?","options":["<article>","<section>","<aside>","<figure>"]},
      {"type":"closed","text":"Który element oznacza sekcję z odnośnikami nawigacyjnymi?","options":["<nav>","<menu>","<header>","<ul>"]},
      {"type":"matching","text":"Dopasuj element semantyczny do jego zastosowania","left":["<header>","<nav>","<figure>","<blockquote>"],"right":["cytat z innego źródła","nagłówek dokumentu lub sekcji","ilustracja wraz z podpisem","zestaw odnośników nawigacyjnych"]},
      {"type":"closed","text":"Do czego służy element <figcaption>?","options":["do podpisu ilustracji wewnątrz <figure>","do opisu całej strony","do nadania tytułu tabeli","do oznaczenia cytatu"]},
      {"type":"select","text":"Który element jest elementem prezentacyjnym (przestarzałym), a nie semantycznym?","options":["<center>","<article>","<figure>","<nav>"]},
      {"type":"closed","text":"Czym różni się <strong> od <b>?","options":["<strong> oznacza treść ważną znaczeniowo, <b> tylko zwraca na nią uwagę","<strong> pogrubia, a <b> pochyla tekst","nie różnią się niczym poza nazwą","<b> jest semantyczny, a <strong> prezentacyjny"]},
      {"type":"input","text":"Jaki znacznik oznacza definiowany termin na liście definicji (wewnątrz <dl>)?"},
      {"type":"closed","text":"Który atrybut jest atrybutem logicznym (boolean) — liczy się sama jego obecność?","options":["required","placeholder","maxlength","size"]},
      {"type":"matching","text":"Dopasuj atrybut pola formularza do jego działania","left":["placeholder","maxlength","min","required"],"right":["najmniejsza dopuszczalna wartość liczbowa","pole musi zostać wypełnione","podpowiedź widoczna w pustym polu","największa dopuszczalna liczba znaków"]},
      {"type":"select","text":"Który atrybut formularza określa metodę HTTP użytą do wysłania danych?","options":["method","action","type","name"]},
      {"type":"input","text":"Który atrybut elementu <form> wskazuje adres, pod który trafią dane?"},
      {"type":"closed","text":"Jak jawnie powiązać etykietę <label> z polem formularza?","options":["atrybut for etykiety musi mieć wartość równą id pola","atrybut name etykiety musi mieć wartość równą name pola","etykieta musi stać bezpośrednio nad polem","wystarczy ten sam atrybut class"]},
      {"type":"closed","text":"Która para elementów grupuje powiązane pola i opisuje tę grupę?","options":["<fieldset> i <legend>","<section> i <h2>","<div> i <span>","<form> i <label>"]},
      {"type":"select","text":"Jaki typ przycisku przywraca formularzowi wartości początkowe?","options":["reset","submit","button","clear"]},
      {"type":"input","text":"Który atrybut nadany kilku polom typu radio sprawia, że tworzą jedną grupę i da się wybrać tylko jedną opcję?"},
      {"type":"closed","text":"Który znacznik oznacza komórkę nagłówkową tabeli?","options":["<th>","<td>","<tr>","<thead>"]},
      {"type":"matching","text":"Dopasuj znacznik tabeli do jego roli","left":["<tr>","<td>","<th>","<caption>"],"right":["komórka nagłówkowa","tytuł całej tabeli","wiersz tabeli","zwykła komórka z danymi"]},
      {"type":"closed","text":"Która wartość atrybutu target otwiera odnośnik w nowej karcie?","options":["_blank","_self","_parent","_top"]},
      {"type":"select","text":"Która wartość atrybutu target otwiera odnośnik w najwyższym kontekście przeglądania, nawet z zagnieżdżonej ramki?","options":["_top","_blank","_self","_parent"]},
      {"type":"matching","text":"Dopasuj stan odnośnika do sytuacji, w której obowiązuje","left":[":link",":visited",":hover",":active"],"right":["kursor znajduje się nad odnośnikiem","odnośnik jest właśnie klikany","strona docelowa była już odwiedzona","odnośnik jeszcze nieodwiedzony"]},
      {"type":"closed","text":"Które formaty obsługuje element <audio> według materiału?","options":["mp3, wav, ogg","mp4, webm, avi","jpg, png, webp","pdf, docx, txt"]},
      {"type":"input","text":"Który atrybut elementu <audio> lub <video> wyświetla wbudowany panel odtwarzania?"},
      {"type":"closed","text":"Który element jest elementem zastępowanym (replaced), czyli jego treść pochodzi z zasobu zewnętrznego?","options":["<iframe>","<p>","<section>","<label>"]},
      {"type":"input","text":"Od jakiej deklaracji zaczyna się poprawny dokument HTML5 (pierwsza linia pliku)?"},
      {"type":"closed","text":"Do czego służy znacznik <meta charset=\"UTF-8\">?","options":["określa sposób kodowania znaków dokumentu","ustawia język strony","ustawia tytuł karty przeglądarki","podpina arkusz stylów"]},
      {"type":"select","text":"Który znacznik trzeba dodać w <head>, aby strona poprawnie skalowała się na telefonach?","options":["<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">","<meta name=\"mobile\" content=\"true\">","<meta charset=\"UTF-8\">","<link rel=\"mobile\" href=\"styles.css\">"]},
      {"type":"matching","text":"Dopasuj znacznik listy do jego roli","left":["<ul>","<ol>","<li>","<dl>"],"right":["lista definicji","pojedynczy element listy","lista nieuporządkowana (punktory)","lista uporządkowana (numeracja)"]},
      {"type":"closed","text":"Którym znacznikiem tworzy się listę z automatyczną numeracją?","options":["<ol>","<ul>","<dl>","<list>"]},
      {"type":"closed","text":"Które dwa atrybuty są wymagane w znaczniku <img>?","options":["src i alt","src i title","href i alt","source i description"]},
      {"type":"input","text":"Który atrybut znacznika <img> ustawia szerokość obrazu w pikselach?"},
      {"type":"select","text":"Który format obrazu jest formatem wektorowym, skalowalnym bez utraty jakości?","options":["SVG","JPEG","PNG","GIF"]},
      {"type":"matching","text":"Dopasuj wartość atrybutu type pola formularza do jego przeznaczenia","left":["email","number","checkbox","radio"],"right":["wybór jednej opcji z grupy","pole na adres poczty, sprawdzane przez przeglądarkę","zaznaczenie niezależnej opcji","pole na wartość liczbową"]},
      {"type":"closed","text":"Którym elementem tworzy się wielowierszowe pole tekstowe?","options":["<textarea>","<input type=\"text\">","<select>","<output>"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["<main>"],
  ["6"],
  ["<img>"],
  ["alt", "atrybut alt", "alt=\"\""],
  ["w elemencie <head>"],
  ["stylesheet", "rel=\"stylesheet\""],
  ["<meta name=\"description\" content=\"Opis strony\">"],
  ["<article>"],
  ["<nav>"],
  ["nagłówek dokumentu lub sekcji", "zestaw odnośników nawigacyjnych", "ilustracja wraz z podpisem", "cytat z innego źródła"],
  ["do podpisu ilustracji wewnątrz <figure>"],
  ["<center>"],
  ["<strong> oznacza treść ważną znaczeniowo, <b> tylko zwraca na nią uwagę"],
  ["dt", "<dt>"],
  ["required"],
  ["podpowiedź widoczna w pustym polu", "największa dopuszczalna liczba znaków", "najmniejsza dopuszczalna wartość liczbowa", "pole musi zostać wypełnione"],
  ["method"],
  ["action", "atrybut action"],
  ["atrybut for etykiety musi mieć wartość równą id pola"],
  ["<fieldset> i <legend>"],
  ["reset"],
  ["name", "atrybut name"],
  ["<th>"],
  ["wiersz tabeli", "zwykła komórka z danymi", "komórka nagłówkowa", "tytuł całej tabeli"],
  ["_blank"],
  ["_top"],
  ["odnośnik jeszcze nieodwiedzony", "strona docelowa była już odwiedzona", "kursor znajduje się nad odnośnikiem", "odnośnik jest właśnie klikany"],
  ["mp3, wav, ogg"],
  ["controls", "atrybut controls"],
  ["<iframe>"],
  ["<!DOCTYPE html>", "!DOCTYPE html", "doctype html", "<!doctype html>"],
  ["określa sposób kodowania znaków dokumentu"],
  ["<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"],
  ["lista nieuporządkowana (punktory)", "lista uporządkowana (numeracja)", "pojedynczy element listy", "lista definicji"],
  ["<ol>"],
  ["src i alt"],
  ["width", "atrybut width"],
  ["SVG"],
  ["pole na adres poczty, sprawdzane przez przeglądarkę", "pole na wartość liczbową", "zaznaczenie niezależnej opcji", "wybór jednej opcji z grupy"],
  ["<textarea>"]
]$json$::jsonb
from nowy;
