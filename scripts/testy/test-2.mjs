import { zbuduj } from "./generator.mjs";

zbuduj({
  plik: "02-css-selektory-uklad-rwd.sql",
  ziarno: 771203,
  tytul: "CSS: selektory, układ strony i RWD",
  czas: 2400,
  kwalifikacja: "inf03",
  naglowek: `-- =============================================================================
-- TEST 2/4 — CSS: selektory i model pudełkowy · Flexbox, Grid, pozycjonowanie · RWD
--
-- Zakres z materiałów podpiętych do podtematów 4–6 kategorii „HTML i CSS”.
-- Pytania oparte na kodzie, obliczeniach i konfliktach reguł.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================`,
  pytania: [
    {
      typ: "zamkniete",
      text: "Dwie reguły dotyczą tego samego akapitu: #opis { color: red } oraz .tekst { color: blue }. Jaki kolor zobaczy użytkownik?",
      opcje: [
        "czerwony, bo selektor identyfikatora ma wyższą specyficzność",
        "niebieski, bo reguła z klasą jest zapisana niżej",
        "czarny, bo reguły się wykluczają",
        "zależy od kolejności w pliku HTML",
      ],
      poprawna: "czerwony, bo selektor identyfikatora ma wyższą specyficzność",
    },
    {
      typ: "zamkniete",
      text: "Element ma width: 200px, padding: 20px i border: 5px. Ile miejsca zajmie w poziomie przy domyślnym box-sizing?",
      opcje: ["250 px", "200 px", "230 px", "245 px"],
      poprawna: "250 px",
    },
    {
      typ: "zamkniete",
      text: "W arkuszu są dwie identyczne reguły: .box { color: green } na początku pliku i .box { color: orange } na końcu. Który kolor wygra?",
      opcje: [
        "pomarańczowy — przy równej specyficzności decyduje kolejność",
        "zielony — liczy się pierwsza dopasowana reguła",
        "żaden, przeglądarka zgłosi konflikt",
        "przeglądarka wybierze losowo jeden z nich",
      ],
      poprawna: "pomarańczowy — przy równej specyficzności decyduje kolejność",
    },
    {
      typ: "pary",
      text: "Dopasuj selektor do tego, co wybiera",
      pary: [
        ["p", "wszystkie akapity na stronie"],
        [".oferta", "elementy z klasą oferta"],
        ["#menu", "element o identyfikatorze menu"],
        ["nav a", "odnośniki znajdujące się wewnątrz nawigacji"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Na body ustawiono color: navy, a akapit nie ma własnego koloru. Na akapicie ustawiono za to margin na body. Co odziedziczy akapit?",
      opcje: [
        "kolor tekstu — dziedziczy się, margines nie",
        "margines — dziedziczy się, kolor nie",
        "oba, wszystkie właściwości się dziedziczą",
        "żadnej z tych właściwości",
      ],
      poprawna: "kolor tekstu — dziedziczy się, margines nie",
    },
    {
      typ: "otwarte",
      text: "Która właściwość CSS ustawia odstęp WEWNĄTRZ elementu, między jego treścią a obramowaniem?",
      akceptowane: ["padding"],
    },
    {
      typ: "otwarte",
      text: "Jakim zapisem wyśrodkujesz blok o ustalonej szerokości w poziomie względem rodzica? Podaj samą wartość właściwości margin.",
      akceptowane: ["0 auto", "auto", "margin: 0 auto", "0px auto"],
    },
    {
      typ: "zamkniete",
      text: "Element html ma font-size: 16px, a .karta ma font-size: 1.5rem. Ile pikseli będzie miał tekst w .karta?",
      opcje: ["24 px", "16 px", "1.5 px", "zależy od rozmiaru czcionki rodzica"],
      poprawna: "24 px",
    },
    {
      typ: "zamkniete",
      text: "Czym różni się rem od em?",
      opcje: [
        "rem liczy się od czcionki elementu html, em od czcionki rodzica",
        "rem liczy się od rodzica, em od elementu html",
        "rem to jednostka bezwzględna, em względna",
        "niczym, to dwie nazwy tej samej jednostki",
      ],
      poprawna: "rem liczy się od czcionki elementu html, em od czcionki rodzica",
    },
    {
      typ: "pary",
      text: "Dopasuj jednostkę do tego, względem czego jest liczona",
      pary: [
        ["px", "jednostka bezwzględna, 1/96 cala"],
        ["rem", "rozmiar czcionki elementu html"],
        ["vh", "1% wysokości okna przeglądarki"],
        ["%", "odpowiednia wartość elementu nadrzędnego"],
      ],
    },
    {
      typ: "lista",
      text: "Który zapis zamieni kwadratowy element o boku 100 px w koło?",
      opcje: ["border-radius: 50%", "border-radius: 50px solid", "border-style: circle", "shape: circle"],
      poprawna: "border-radius: 50%",
    },
    {
      typ: "otwarte",
      text: "Która właściwość CSS ustawia kolor tła elementu?",
      akceptowane: ["background-color", "background"],
    },
    {
      typ: "zamkniete",
      text: "Menu ma punktory, których nie chcesz. Co ustawisz?",
      opcje: ["list-style-type: none", "list-style-position: none", "text-decoration: none", "display: none"],
      poprawna: "list-style-type: none",
    },
    {
      typ: "zamkniete",
      text: "Czym różni się display: none od visibility: hidden?",
      opcje: [
        "display: none usuwa element z układu, visibility: hidden zostawia po nim puste miejsce",
        "to dwa zapisy tego samego efektu",
        "visibility: hidden usuwa element z kodu strony",
        "display: none tylko wygasza element do przezroczystości",
      ],
      poprawna: "display: none usuwa element z układu, visibility: hidden zostawia po nim puste miejsce",
    },
    {
      typ: "zamkniete",
      text: "Długi tekst nie mieści się w ramce o stałej wysokości i wychodzi poza nią. Którą właściwością dodasz pasek przewijania w samej ramce?",
      opcje: ["overflow", "position", "clip-path", "resize"],
      poprawna: "overflow",
    },
    {
      typ: "pary",
      text: "Dopasuj funkcję właściwości transform do efektu",
      pary: [
        ["translate()", "przesuwa element względem jego miejsca"],
        ["scale()", "zmienia rozmiar elementu"],
        ["rotate()", "obraca element"],
        ["skew()", "pochyla element"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Kontener ma display: flex i flex-direction: column. Która właściwość rozłoży teraz elementy w pionie?",
      opcje: [
        "justify-content, bo działa wzdłuż osi głównej",
        "align-items, bo pion to zawsze oś poprzeczna",
        "text-align, bo elementy są blokowe",
        "vertical-align, bo chodzi o pion",
      ],
      poprawna: "justify-content, bo działa wzdłuż osi głównej",
    },
    {
      typ: "otwarte",
      text: "Jaką wartość musi mieć display, żeby element stał się kontenerem flex?",
      akceptowane: ["flex", "display: flex"],
    },
    {
      typ: "zamkniete",
      text: "Pięć kafelków w kontenerze flex nie mieści się w jednym rzędzie i wychodzi poza ekran. Co dodasz?",
      opcje: ["flex-wrap: wrap", "flex-direction: column", "justify-content: center", "overflow: hidden"],
      poprawna: "flex-wrap: wrap",
    },
    {
      typ: "pary",
      text: "Dopasuj właściwość Flexboksa do jej działania",
      pary: [
        ["flex-direction", "kierunek osi głównej: wiersz albo kolumna"],
        ["justify-content", "rozmieszczenie wzdłuż osi głównej"],
        ["align-items", "wyrównanie w poprzek osi głównej"],
        ["gap", "odstęp między elementami"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Które elementy stają się elementami flex po nadaniu kontenerowi display: flex?",
      opcje: [
        "tylko jego bezpośrednie dzieci",
        "wszystkie elementy potomne, na każdym poziomie",
        "wyłącznie elementy blokowe wewnątrz",
        "elementy z ustawionym position: relative",
      ],
      poprawna: "tylko jego bezpośrednie dzieci",
    },
    {
      typ: "zamkniete",
      text: "Zapis grid-template-columns: repeat(4, 1fr) daje siatkę o czterech kolumnach. Jak szerokie będą?",
      opcje: [
        "równe, każda po jednej czwartej dostępnej szerokości",
        "po 1 pikselu każda",
        "dopasowane do zawartości, każda inna",
        "po 25 pikseli każda",
      ],
      poprawna: "równe, każda po jednej czwartej dostępnej szerokości",
    },
    {
      typ: "otwarte",
      text: "Jaką wartość nadajesz właściwości display, aby utworzyć siatkę?",
      akceptowane: ["grid", "display: grid"],
    },
    {
      typ: "lista",
      text: "Kolumna ma nigdy nie zwęzić się poniżej 150 px, ale może rosnąć. Której funkcji użyjesz?",
      opcje: ["minmax(150px, 1fr)", "repeat(150px, 1fr)", "clamp(150px)", "fit-content(150px, 1fr)"],
      poprawna: "minmax(150px, 1fr)",
    },
    {
      typ: "zamkniete",
      text: "Czym różni się Grid od Flexboksa?",
      opcje: [
        "Grid układa w dwóch wymiarach naraz — wiersze i kolumny, Flexbox w jednym",
        "Grid działa tylko w pionie, Flexbox tylko w poziomie",
        "Grid nie pozwala na odstępy między elementami",
        "Flexbox nie działa w układach responsywnych",
      ],
      poprawna: "Grid układa w dwóch wymiarach naraz — wiersze i kolumny, Flexbox w jednym",
    },
    {
      typ: "pary",
      text: "Dopasuj właściwość siatki do jej zadania",
      pary: [
        ["grid-template-columns", "liczba i rozmiar kolumn"],
        ["row-gap", "odstęp między wierszami"],
        ["grid-auto-flow", "sposób układania elementów dodanych automatycznie"],
        ["place-items", "wyrównanie zawartości w obu kierunkach"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Element ma position: absolute. Względem czego zostanie ustawiony?",
      opcje: [
        "względem najbliższego przodka z pozycjonowaniem innym niż static",
        "zawsze względem okna przeglądarki",
        "względem swojego bezpośredniego rodzica, bez względu na jego pozycjonowanie",
        "względem elementu body",
      ],
      poprawna: "względem najbliższego przodka z pozycjonowaniem innym niż static",
    },
    {
      typ: "zamkniete",
      text: "Czym różni się position: relative od absolute w kwestii miejsca w układzie strony?",
      opcje: [
        "relative zostawia po elemencie jego pierwotne miejsce, absolute je zwalnia",
        "obie wartości zwalniają miejsce po elemencie",
        "absolute zostawia miejsce, relative je zwalnia",
        "żadna z nich nie wpływa na układ sąsiadów",
      ],
      poprawna: "relative zostawia po elemencie jego pierwotne miejsce, absolute je zwalnia",
    },
    {
      typ: "lista",
      text: "Pasek menu ma zostać przyklejony do góry ekranu przy przewijaniu strony. Co ustawisz?",
      opcje: ["position: sticky", "position: absolute", "position: static", "float: top"],
      poprawna: "position: sticky",
    },
    {
      typ: "zamkniete",
      text: "Do czego służy właściwość clear przy elementach z float?",
      opcje: [
        "decyduje, czy element ma zejść poniżej opływanej treści",
        "usuwa element ze strony",
        "wyłącza float w całym dokumencie",
        "czyści style odziedziczone po rodzicu",
      ],
      poprawna: "decyduje, czy element ma zejść poniżej opływanej treści",
    },
    {
      typ: "otwarte",
      text: "Jaka reguła CSS (zaczynająca się od małpy) pozwala zastosować style zależnie od szerokości ekranu?",
      akceptowane: ["@media", "media", "@media screen"],
    },
    {
      typ: "zamkniete",
      text: "Arkusz zawiera regułę @media (min-width: 768px). Kiedy zadziałają zapisane w niej style?",
      opcje: [
        "na ekranach o szerokości 768 px i szerszych",
        "wyłącznie na ekranach węższych niż 768 px",
        "tylko na ekranie o szerokości dokładnie 768 px",
        "przy wydruku strony",
      ],
      poprawna: "na ekranach o szerokości 768 px i szerszych",
    },
    {
      typ: "zamkniete",
      text: "Na czym polega podejście mobile-first?",
      opcje: [
        "podstawowe style pisze się dla małych ekranów, a szersze obsługuje zapytaniami min-width",
        "najpierw projektuje się widok na duży monitor, potem go zawęża",
        "tworzy się osobną stronę wyłącznie dla telefonów",
        "używa się wyłącznie jednostek px, żeby uniknąć skalowania",
      ],
      poprawna: "podstawowe style pisze się dla małych ekranów, a szersze obsługuje zapytaniami min-width",
    },
    {
      typ: "lista",
      text: "Która cecha zapytania medialnego rozróżnia ustawienie poziome i pionowe urządzenia?",
      opcje: ["orientation", "aspect-ratio", "resolution", "screen"],
      poprawna: "orientation",
    },
    {
      typ: "zamkniete",
      text: "Obrazek w kontenerze wystaje poza niego na wąskim ekranie. Który zapis najprościej to naprawi?",
      opcje: ["max-width: 100%", "width: 100px", "position: absolute", "overflow: visible"],
      poprawna: "max-width: 100%",
    },
    {
      typ: "pary",
      text: "Dopasuj pseudoklasę do sytuacji, w której obowiązuje",
      pary: [
        [":hover", "kursor stoi nad elementem"],
        [":focus", "pole zostało kliknięte albo wybrane Tabem"],
        [":checked", "opcja jest zaznaczona"],
        [":disabled", "pole jest wyłączone i nie da się w nie pisać"],
      ],
    },
    {
      typ: "zamkniete",
      text: "Czym pseudoelement ::before różni się od pseudoklasy :hover?",
      opcje: [
        "::before tworzy i stylizuje dodatkowy fragment treści, :hover opisuje stan elementu",
        "::before opisuje stan, a :hover tworzy treść",
        "oba robią to samo, różnią się tylko zapisem",
        "::before działa wyłącznie na odnośnikach",
      ],
      poprawna: "::before tworzy i stylizuje dodatkowy fragment treści, :hover opisuje stan elementu",
    },
    {
      typ: "lista",
      text: "Której właściwości musi użyć reguła ::before, żeby cokolwiek się pojawiło?",
      opcje: ["content", "display", "text", "value"],
      poprawna: "content",
    },
    {
      typ: "zamkniete",
      text: "Uczeń chce zwiększyć odstęp między wierszami tekstu w akapicie. Co ustawi?",
      opcje: ["line-height", "letter-spacing", "margin-top", "padding"],
      poprawna: "line-height",
    },
    {
      typ: "otwarte",
      text: "Który selektor wybiera element o identyfikatorze kontakt? Wpisz sam selektor.",
      akceptowane: ["#kontakt", "#kontakt {", "id kontakt"],
    },
  ],
});
