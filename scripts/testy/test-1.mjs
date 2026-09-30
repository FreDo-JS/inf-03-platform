import { zbuduj } from "./generator.mjs";

zbuduj({
  plik: "01-html-struktura-formularze-multimedia.sql",
  ziarno: 20260930,
  tytul: "HTML: struktura, formularze i multimedia",
  czas: 2400,
  kwalifikacja: "inf03",
  naglowek: `-- =============================================================================
-- TEST 1/4 — HTML: struktura i semantyka · tabele, listy, formularze · multimedia
--
-- Zakres z materiałów podpiętych do podtematów 1–3 kategorii „HTML i CSS”.
-- Pytania oparte na kodzie i typowych błędach, nie na definicjach.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================`,
  pytania: [
    {
      typ: "zamkniete",
      text: 'Uczeń wstawił zdjęcie zapisem <img src="wykres.png"> i walidator zgłasza błąd. Czego brakuje?',
      opcje: ["atrybutu alt", "atrybutu title", "znacznika zamykającego </img>", "atrybutu type"],
      poprawna: "atrybutu alt",
    },
    {
      typ: "zamkniete",
      text: "Strona ma nagłówki w kolejności: h1, a zaraz po nim h3. Co jest z tym nie tak?",
      opcje: [
        "pominięty poziom h2 psuje hierarchię dla czytników ekranu",
        "nic, kolejność nagłówków jest dowolna",
        "h3 nie może wystąpić po h1 — przeglądarka go zignoruje",
        "h1 musi być jeden na sekcję, a nie na stronę",
      ],
      poprawna: "pominięty poziom h2 psuje hierarchię dla czytników ekranu",
    },
    {
      typ: "lista",
      text: "Który zapis poprawnie wiąże etykietę z polem tekstowym?",
      opcje: [
        '<label for="mail">E-mail</label> <input id="mail">',
        '<label id="mail">E-mail</label> <input for="mail">',
        '<label name="mail">E-mail</label> <input name="mail">',
        '<label>E-mail</label> <input class="mail">',
      ],
      poprawna: '<label for="mail">E-mail</label> <input id="mail">',
    },
    {
      typ: "zamkniete",
      text: 'Pole zapisano jako <input type="number" min="2" max="10" required>. Której wartości przeglądarka NIE przyjmie przy wysyłaniu?',
      opcje: ["12", "2", "7", "10"],
      poprawna: "12",
    },
    {
      typ: "zamkniete",
      text: "Dwa pola typu radio mają różne wartości atrybutu name. Jak zachowa się formularz?",
      opcje: [
        "da się zaznaczyć oba naraz, bo nie tworzą jednej grupy",
        "zaznaczenie drugiego odznaczy pierwsze, tak jak zwykle",
        "formularz w ogóle się nie wyśle",
        "przeglądarka sama nada im wspólną nazwę",
      ],
      poprawna: "da się zaznaczyć oba naraz, bo nie tworzą jednej grupy",
    },
    {
      typ: "otwarte",
      text: "Uczeń grupuje trzy pola radio wewnątrz fieldset i chce opisać całą grupę pytaniem. Jakiego znacznika użyje do tego opisu?",
      akceptowane: ["legend", "<legend>"],
    },
    {
      typ: "zamkniete",
      text: 'Na stronie jest <audio src="dzwonek.mp3"></audio>, ale nie widać żadnego odtwarzacza. Dlaczego?',
      opcje: [
        "brakuje atrybutu controls",
        "format mp3 nie jest obsługiwany przez element audio",
        "element audio musi stać w sekcji head",
        "potrzebny jest atrybut autoplay",
      ],
      poprawna: "brakuje atrybutu controls",
    },
    {
      typ: "lista",
      text: "Logo szkoły ma wyglądać ostro i na wizytówce, i na banerze przez pół ekranu. Który format wybierzesz?",
      opcje: ["SVG", "JPEG", "PNG", "GIF"],
      poprawna: "SVG",
    },
    {
      typ: "otwarte",
      text: "Od jakiej deklaracji musi zaczynać się plik HTML5? Wpisz ją dokładnie.",
      akceptowane: ["<!DOCTYPE html>", "!DOCTYPE html", "doctype html", "<!doctype html>"],
    },
    {
      typ: "zamkniete",
      text: "Strona wyświetla „PrzykÅ‚ad” zamiast „Przykład”. Czego najpewniej brakuje w sekcji head?",
      opcje: [
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width">',
        "atrybutu lang w znaczniku html",
        "znacznika <title>",
      ],
      poprawna: '<meta charset="UTF-8">',
    },
    {
      typ: "zamkniete",
      text: "Strona na telefonie wygląda jak pomniejszony widok z komputera i trzeba ją przybliżać palcami. Czego brakuje?",
      opcje: [
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        "arkusza stylów podpiętego przez <link>",
        "atrybutu charset w znaczniku meta",
        "znacznika <main> wokół treści",
      ],
      poprawna: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    },
    {
      typ: "lista",
      text: "Który zapis podpina zewnętrzny arkusz stylów?",
      opcje: [
        '<link rel="stylesheet" href="styl.css">',
        '<link src="styl.css" type="css">',
        '<style src="styl.css"></style>',
        '<script rel="stylesheet" href="styl.css">',
      ],
      poprawna: '<link rel="stylesheet" href="styl.css">',
    },
    {
      typ: "zamkniete",
      text: "Uczeń zbudował całą stronę z samych znaczników div. Wygląda dobrze. Co na tym traci?",
      opcje: [
        "czytniki ekranu i wyszukiwarki nie rozpoznają struktury strony",
        "nic — div jest równoważny znacznikom semantycznym",
        "strona będzie ładować się wolniej",
        "arkusz CSS przestanie działać na takich elementach",
      ],
      poprawna: "czytniki ekranu i wyszukiwarki nie rozpoznają struktury strony",
    },
    {
      typ: "pary",
      text: "Dopasuj znacznik do treści, którą powinien obejmować",
      pary: [
        ["<nav>", "menu z odnośnikami do podstron"],
        ["<article>", "wpis bloga, zrozumiały także w oderwaniu od strony"],
        ["<figure>", "zdjęcie wraz z podpisem"],
        ["<footer>", "stopka z danymi kontaktowymi"],
      ],
    },
    {
      typ: "zamkniete",
      text: 'Kiedy poprawne jest użycie pustego atrybutu alt, czyli alt=""?',
      opcje: [
        "gdy obrazek jest tylko ozdobą i nie niesie treści",
        "nigdy — alt zawsze musi zawierać opis",
        "gdy obrazek jest bardzo duży",
        "gdy obrazek służy jako tło sekcji",
      ],
      poprawna: "gdy obrazek jest tylko ozdobą i nie niesie treści",
    },
    {
      typ: "zamkniete",
      text: "Co zobaczy użytkownik, jeśli plik z obrazkiem zniknie z serwera?",
      opcje: [
        "tekst z atrybutu alt",
        "pusty prostokąt bez opisu",
        "komunikat przeglądarki o błędzie 404",
        "poprzedni obrazek z pamięci podręcznej",
      ],
      poprawna: "tekst z atrybutu alt",
    },
    {
      typ: "lista",
      text: "Przepis kulinarny: lista składników i lista kolejnych kroków. Jak oznaczysz każdą z nich?",
      opcje: ["składniki <ul>, kroki <ol>", "składniki <ol>, kroki <ul>", "obie jako <ul>", "obie jako <dl>"],
      poprawna: "składniki <ul>, kroki <ol>",
    },
    {
      typ: "otwarte",
      text: "W tabeli komórki pierwszego wiersza mają być nagłówkami kolumn. Jakiego znacznika użyjesz zamiast td?",
      akceptowane: ["th", "<th>"],
    },
    {
      typ: "pary",
      text: "Dopasuj znacznik tabeli do jego roli",
      pary: [
        ["<tr>", "wiersz tabeli"],
        ["<td>", "zwykła komórka z danymi"],
        ["<th>", "komórka nagłówkowa"],
        ["<caption>", "tytuł całej tabeli"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Formularz logowania ma wysłać hasło. Który zapis jest właściwy?",
      opcje: [
        '<form method="post" action="login.php">',
        '<form method="get" action="login.php">',
        '<form send="post" url="login.php">',
        '<form action="post" method="login.php">',
      ],
      poprawna: '<form method="post" action="login.php">',
    },
    {
      typ: "otwarte",
      text: "Który atrybut znacznika form wskazuje adres, pod który trafią dane po wysłaniu?",
      akceptowane: ["action", "atrybut action"],
    },
    {
      typ: "zamkniete",
      text: "Uczeń zamiast etykiet wpisał same podpowiedzi w placeholderach („Imię”, „E-mail”). Co jest w tym złego?",
      opcje: [
        "podpowiedź znika po kliknięciu, a czytnik ekranu nie traktuje jej jak etykiety",
        "placeholder działa tylko w polach typu text",
        "placeholder blokuje wysłanie formularza",
        "nic, to zalecany sposób opisywania pól",
      ],
      poprawna: "podpowiedź znika po kliknięciu, a czytnik ekranu nie traktuje jej jak etykiety",
    },
    {
      typ: "pary",
      text: "Dopasuj atrybut pola do tego, co narzuca",
      pary: [
        ["required", "pole nie może zostać puste"],
        ["maxlength", "najwyżej tyle znaków"],
        ["min", "najmniejsza dopuszczalna liczba"],
        ["readonly", "wartość widać, ale nie da się jej zmienić"],
      ],
    },
    {
      typ: "zamkniete",
      text: "W formularzu jest <button>Wyślij</button> bez atrybutu type. Co się stanie po kliknięciu?",
      opcje: [
        "formularz zostanie wysłany, bo domyślny typ to submit",
        'nic, bo brakuje type="submit"',
        "formularz zostanie wyczyszczony",
        "przeglądarka zgłosi błąd składni",
      ],
      poprawna: "formularz zostanie wysłany, bo domyślny typ to submit",
    },
    {
      typ: "lista",
      text: "Który typ pola sprawi, że przeglądarka sama sprawdzi obecność znaku @ w adresie?",
      opcje: ["email", "text", "mail", "address"],
      poprawna: "email",
    },
    {
      typ: "pary",
      text: "Dopasuj typ pola do sytuacji, w której go użyjesz",
      pary: [
        ["checkbox", "zgoda na regulamin, zaznaczana niezależnie"],
        ["radio", "wybór jednej z trzech dat wycieczki"],
        ["number", "liczba zamawianych biletów"],
        ["textarea", "kilkuzdaniowa wiadomość do nauczyciela"],
      ],
    },
    {
      typ: "zamkniete",
      text: 'Odnośnik zapisano jako <a href="cennik.html" target="_blank">. Co zrobi przeglądarka po kliknięciu?',
      opcje: [
        "otworzy stronę w nowej karcie",
        "otworzy stronę w tym samym oknie",
        "pobierze plik cennik.html na dysk",
        "otworzy stronę w ramce nadrzędnej",
      ],
      poprawna: "otworzy stronę w nowej karcie",
    },
    {
      typ: "lista",
      text: "Twoja strona jest osadzona w ramce iframe na cudzym portalu. Która wartość target otworzy odnośnik w pełnym oknie przeglądarki?",
      opcje: ["_top", "_self", "_blank", "_parent"],
      poprawna: "_top",
    },
    {
      typ: "pary",
      text: "Dopasuj stan odnośnika do sytuacji",
      pary: [
        [":link", "użytkownik jeszcze tam nie zaglądał"],
        [":visited", "strona docelowa była już otwierana"],
        [":hover", "kursor stoi nad odnośnikiem"],
        [":active", "odnośnik jest w tej chwili wciskany"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Nauczyciel chce osadzić na stronie film z YouTube. Którego elementu użyje?",
      opcje: ["<iframe>", "<video>", "<embed>", "<object>"],
      poprawna: "<iframe>",
    },
    {
      typ: "zamkniete",
      text: "Który zestaw formatów obsługuje element audio według materiału?",
      opcje: ["mp3, wav, ogg", "mp4, webm, ogg", "jpg, png, svg", "avi, mkv, mov"],
      poprawna: "mp3, wav, ogg",
    },
    {
      typ: "otwarte",
      text: "Który atrybut elementu video sprawi, że film zacznie się od nowa zaraz po zakończeniu?",
      akceptowane: ["loop", "atrybut loop"],
    },
    {
      typ: "zamkniete",
      text: "Co oznacza, że obrazek i ramka iframe to elementy zastępowane?",
      opcje: [
        "ich treść pochodzi z zasobu zewnętrznego, więc CSS nie zmieni jej zawartości",
        "można je zastąpić dowolnym innym znacznikiem",
        "przeglądarka podmienia je na element div",
        "są przestarzałe i zastąpione nowszymi znacznikami",
      ],
      poprawna: "ich treść pochodzi z zasobu zewnętrznego, więc CSS nie zmieni jej zawartości",
    },
    {
      typ: "lista",
      text: "Tekst ma być pochylony, bo to łacińska nazwa gatunku — nie dlatego, że jest ważny. Co wybierzesz?",
      opcje: ['<i lang="la">', "<em>", "<strong>", "<b>"],
      poprawna: '<i lang="la">',
    },
    {
      typ: "zamkniete",
      text: "Czym różni się <strong> od <b> dla osoby korzystającej z czytnika ekranu?",
      opcje: [
        "<strong> zostanie odczytany z naciskiem jako ważny, <b> tylko pogrubia wizualnie",
        "oba zostaną przeczytane z naciskiem",
        "<b> zostanie pominięty w odczycie",
        "nie ma między nimi żadnej różnicy",
      ],
      poprawna: "<strong> zostanie odczytany z naciskiem jako ważny, <b> tylko pogrubia wizualnie",
    },
    {
      typ: "otwarte",
      text: "Jaki znacznik obejmuje definiowany termin na liście definicji (wewnątrz dl)?",
      akceptowane: ["dt", "<dt>"],
    },
    {
      typ: "zamkniete",
      text: 'Do czego służy <meta name="description" content="...">?',
      opcje: [
        "podaje opis, który wyszukiwarka pokazuje pod tytułem strony w wynikach",
        "wyświetla opis nad treścią strony",
        "ustawia tytuł widoczny na karcie przeglądarki",
        "opisuje stronę czytnikom ekranu zamiast nagłówka",
      ],
      poprawna: "podaje opis, który wyszukiwarka pokazuje pod tytułem strony w wynikach",
    },
    {
      typ: "lista",
      text: "Który element wstawi wielowierszowe pole na dłuższą wypowiedź?",
      opcje: ["<textarea>", '<input type="text">', '<input type="long">', "<select multiple>"],
      poprawna: "<textarea>",
    },
    {
      typ: "otwarte",
      text: "Który atrybut nadany kilku polom radio sprawia, że tworzą jedną grupę i da się wybrać tylko jedno?",
      akceptowane: ["name", "atrybut name"],
    },
    {
      typ: "zamkniete",
      text: 'Uczeń napisał <img src="kot.jpg" /> zamiast <img src="kot.jpg">. Co się stanie?',
      opcje: [
        "nic — oba zapisy są poprawne dla elementu pustego",
        "obrazek się nie wyświetli",
        "walidator zgłosi błąd składni",
        "przeglądarka doda pusty znacznik zamykający",
      ],
      poprawna: "nic — oba zapisy są poprawne dla elementu pustego",
    },
  ],
});
