-- =============================================================================
-- TEST 2/4 — CSS: selektory i model pudełkowy · Flexbox, Grid, pozycjonowanie · RWD
--
-- Zakres z materiałów podpiętych do podtematów 4–6 kategorii „HTML i CSS”.
-- Pytania oparte na kodzie, obliczeniach i konfliktach reguł.
-- Kolejność odpowiedzi losowana — poprawne rozłożone równo między pozycje.
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'CSS: selektory, układ strony i RWD',
    2400,
    $json$[
      {"type":"closed","text":"Dwie reguły dotyczą tego samego akapitu: #opis { color: red } oraz .tekst { color: blue }. Jaki kolor zobaczy użytkownik?","options":["zależy od kolejności w pliku HTML","niebieski, bo reguła z klasą jest zapisana niżej","czerwony, bo selektor identyfikatora ma wyższą specyficzność","czarny, bo reguły się wykluczają"]},
      {"type":"closed","text":"Element ma width: 200px, padding: 20px i border: 5px. Ile miejsca zajmie w poziomie przy domyślnym box-sizing?","options":["250 px","230 px","245 px","200 px"]},
      {"type":"closed","text":"W arkuszu są dwie identyczne reguły: .box { color: green } na początku pliku i .box { color: orange } na końcu. Który kolor wygra?","options":["pomarańczowy — przy równej specyficzności decyduje kolejność","przeglądarka wybierze losowo jeden z nich","zielony — liczy się pierwsza dopasowana reguła","żaden, przeglądarka zgłosi konflikt"]},
      {"type":"matching","text":"Dopasuj selektor do tego, co wybiera","left":["p",".oferta","#menu","nav a"],"right":["element o identyfikatorze menu","odnośniki znajdujące się wewnątrz nawigacji","wszystkie akapity na stronie","elementy z klasą oferta"]},
      {"type":"closed","text":"Na body ustawiono color: navy, a akapit nie ma własnego koloru. Na akapicie ustawiono za to margin na body. Co odziedziczy akapit?","options":["oba, wszystkie właściwości się dziedziczą","żadnej z tych właściwości","kolor tekstu — dziedziczy się, margines nie","margines — dziedziczy się, kolor nie"]},
      {"type":"input","text":"Która właściwość CSS ustawia odstęp WEWNĄTRZ elementu, między jego treścią a obramowaniem?"},
      {"type":"input","text":"Jakim zapisem wyśrodkujesz blok o ustalonej szerokości w poziomie względem rodzica? Podaj samą wartość właściwości margin."},
      {"type":"closed","text":"Element html ma font-size: 16px, a .karta ma font-size: 1.5rem. Ile pikseli będzie miał tekst w .karta?","options":["24 px","16 px","1.5 px","zależy od rozmiaru czcionki rodzica"]},
      {"type":"closed","text":"Czym różni się rem od em?","options":["rem liczy się od rodzica, em od elementu html","niczym, to dwie nazwy tej samej jednostki","rem liczy się od czcionki elementu html, em od czcionki rodzica","rem to jednostka bezwzględna, em względna"]},
      {"type":"matching","text":"Dopasuj jednostkę do tego, względem czego jest liczona","left":["px","rem","vh","%"],"right":["rozmiar czcionki elementu html","jednostka bezwzględna, 1/96 cala","1% wysokości okna przeglądarki","odpowiednia wartość elementu nadrzędnego"]},
      {"type":"select","text":"Który zapis zamieni kwadratowy element o boku 100 px w koło?","options":["border-radius: 50%","border-radius: 50px solid","border-style: circle","shape: circle"]},
      {"type":"input","text":"Która właściwość CSS ustawia kolor tła elementu?"},
      {"type":"closed","text":"Menu ma punktory, których nie chcesz. Co ustawisz?","options":["list-style-position: none","text-decoration: none","list-style-type: none","display: none"]},
      {"type":"closed","text":"Czym różni się display: none od visibility: hidden?","options":["display: none tylko wygasza element do przezroczystości","to dwa zapisy tego samego efektu","visibility: hidden usuwa element z kodu strony","display: none usuwa element z układu, visibility: hidden zostawia po nim puste miejsce"]},
      {"type":"closed","text":"Długi tekst nie mieści się w ramce o stałej wysokości i wychodzi poza nią. Którą właściwością dodasz pasek przewijania w samej ramce?","options":["position","overflow","resize","clip-path"]},
      {"type":"matching","text":"Dopasuj funkcję właściwości transform do efektu","left":["translate()","scale()","rotate()","skew()"],"right":["przesuwa element względem jego miejsca","pochyla element","zmienia rozmiar elementu","obraca element"]},
      {"type":"closed","text":"Kontener ma display: flex i flex-direction: column. Która właściwość rozłoży teraz elementy w pionie?","options":["text-align, bo elementy są blokowe","justify-content, bo działa wzdłuż osi głównej","align-items, bo pion to zawsze oś poprzeczna","vertical-align, bo chodzi o pion"]},
      {"type":"input","text":"Jaką wartość musi mieć display, żeby element stał się kontenerem flex?"},
      {"type":"closed","text":"Pięć kafelków w kontenerze flex nie mieści się w jednym rzędzie i wychodzi poza ekran. Co dodasz?","options":["flex-wrap: wrap","flex-direction: column","overflow: hidden","justify-content: center"]},
      {"type":"matching","text":"Dopasuj właściwość Flexboksa do jej działania","left":["flex-direction","justify-content","align-items","gap"],"right":["kierunek osi głównej: wiersz albo kolumna","wyrównanie w poprzek osi głównej","odstęp między elementami","rozmieszczenie wzdłuż osi głównej"]},
      {"type":"closed","text":"Które elementy stają się elementami flex po nadaniu kontenerowi display: flex?","options":["wszystkie elementy potomne, na każdym poziomie","wyłącznie elementy blokowe wewnątrz","elementy z ustawionym position: relative","tylko jego bezpośrednie dzieci"]},
      {"type":"closed","text":"Zapis grid-template-columns: repeat(4, 1fr) daje siatkę o czterech kolumnach. Jak szerokie będą?","options":["po 25 pikseli każda","po 1 pikselu każda","dopasowane do zawartości, każda inna","równe, każda po jednej czwartej dostępnej szerokości"]},
      {"type":"input","text":"Jaką wartość nadajesz właściwości display, aby utworzyć siatkę?"},
      {"type":"select","text":"Kolumna ma nigdy nie zwęzić się poniżej 150 px, ale może rosnąć. Której funkcji użyjesz?","options":["clamp(150px)","minmax(150px, 1fr)","repeat(150px, 1fr)","fit-content(150px, 1fr)"]},
      {"type":"closed","text":"Czym różni się Grid od Flexboksa?","options":["Grid działa tylko w pionie, Flexbox tylko w poziomie","Flexbox nie działa w układach responsywnych","Grid nie pozwala na odstępy między elementami","Grid układa w dwóch wymiarach naraz — wiersze i kolumny, Flexbox w jednym"]},
      {"type":"matching","text":"Dopasuj właściwość siatki do jej zadania","left":["grid-template-columns","row-gap","grid-auto-flow","place-items"],"right":["liczba i rozmiar kolumn","sposób układania elementów dodanych automatycznie","odstęp między wierszami","wyrównanie zawartości w obu kierunkach"]},
      {"type":"closed","text":"Element ma position: absolute. Względem czego zostanie ustawiony?","options":["względem najbliższego przodka z pozycjonowaniem innym niż static","względem swojego bezpośredniego rodzica, bez względu na jego pozycjonowanie","zawsze względem okna przeglądarki","względem elementu body"]},
      {"type":"closed","text":"Czym różni się position: relative od absolute w kwestii miejsca w układzie strony?","options":["żadna z nich nie wpływa na układ sąsiadów","obie wartości zwalniają miejsce po elemencie","absolute zostawia miejsce, relative je zwalnia","relative zostawia po elemencie jego pierwotne miejsce, absolute je zwalnia"]},
      {"type":"select","text":"Pasek menu ma zostać przyklejony do góry ekranu przy przewijaniu strony. Co ustawisz?","options":["position: static","position: absolute","position: sticky","float: top"]},
      {"type":"closed","text":"Do czego służy właściwość clear przy elementach z float?","options":["decyduje, czy element ma zejść poniżej opływanej treści","czyści style odziedziczone po rodzicu","wyłącza float w całym dokumencie","usuwa element ze strony"]},
      {"type":"input","text":"Jaka reguła CSS (zaczynająca się od małpy) pozwala zastosować style zależnie od szerokości ekranu?"},
      {"type":"closed","text":"Arkusz zawiera regułę @media (min-width: 768px). Kiedy zadziałają zapisane w niej style?","options":["tylko na ekranie o szerokości dokładnie 768 px","wyłącznie na ekranach węższych niż 768 px","przy wydruku strony","na ekranach o szerokości 768 px i szerszych"]},
      {"type":"closed","text":"Na czym polega podejście mobile-first?","options":["najpierw projektuje się widok na duży monitor, potem go zawęża","podstawowe style pisze się dla małych ekranów, a szersze obsługuje zapytaniami min-width","tworzy się osobną stronę wyłącznie dla telefonów","używa się wyłącznie jednostek px, żeby uniknąć skalowania"]},
      {"type":"select","text":"Która cecha zapytania medialnego rozróżnia ustawienie poziome i pionowe urządzenia?","options":["resolution","orientation","aspect-ratio","screen"]},
      {"type":"closed","text":"Obrazek w kontenerze wystaje poza niego na wąskim ekranie. Który zapis najprościej to naprawi?","options":["overflow: visible","width: 100px","max-width: 100%","position: absolute"]},
      {"type":"matching","text":"Dopasuj pseudoklasę do sytuacji, w której obowiązuje","left":[":hover",":focus",":checked",":disabled"],"right":["pole zostało kliknięte albo wybrane Tabem","kursor stoi nad elementem","opcja jest zaznaczona","pole jest wyłączone i nie da się w nie pisać"]},
      {"type":"closed","text":"Czym pseudoelement ::before różni się od pseudoklasy :hover?","options":["oba robią to samo, różnią się tylko zapisem","::before tworzy i stylizuje dodatkowy fragment treści, :hover opisuje stan elementu","::before działa wyłącznie na odnośnikach","::before opisuje stan, a :hover tworzy treść"]},
      {"type":"select","text":"Której właściwości musi użyć reguła ::before, żeby cokolwiek się pojawiło?","options":["value","display","content","text"]},
      {"type":"closed","text":"Uczeń chce zwiększyć odstęp między wierszami tekstu w akapicie. Co ustawi?","options":["letter-spacing","line-height","margin-top","padding"]},
      {"type":"input","text":"Który selektor wybiera element o identyfikatorze kontakt? Wpisz sam selektor."}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["czerwony, bo selektor identyfikatora ma wyższą specyficzność"],
  ["250 px"],
  ["pomarańczowy — przy równej specyficzności decyduje kolejność"],
  ["wszystkie akapity na stronie", "elementy z klasą oferta", "element o identyfikatorze menu", "odnośniki znajdujące się wewnątrz nawigacji"],
  ["kolor tekstu — dziedziczy się, margines nie"],
  ["padding"],
  ["0 auto", "auto", "margin: 0 auto", "0px auto"],
  ["24 px"],
  ["rem liczy się od czcionki elementu html, em od czcionki rodzica"],
  ["jednostka bezwzględna, 1/96 cala", "rozmiar czcionki elementu html", "1% wysokości okna przeglądarki", "odpowiednia wartość elementu nadrzędnego"],
  ["border-radius: 50%"],
  ["background-color", "background"],
  ["list-style-type: none"],
  ["display: none usuwa element z układu, visibility: hidden zostawia po nim puste miejsce"],
  ["overflow"],
  ["przesuwa element względem jego miejsca", "zmienia rozmiar elementu", "obraca element", "pochyla element"],
  ["justify-content, bo działa wzdłuż osi głównej"],
  ["flex", "display: flex"],
  ["flex-wrap: wrap"],
  ["kierunek osi głównej: wiersz albo kolumna", "rozmieszczenie wzdłuż osi głównej", "wyrównanie w poprzek osi głównej", "odstęp między elementami"],
  ["tylko jego bezpośrednie dzieci"],
  ["równe, każda po jednej czwartej dostępnej szerokości"],
  ["grid", "display: grid"],
  ["minmax(150px, 1fr)"],
  ["Grid układa w dwóch wymiarach naraz — wiersze i kolumny, Flexbox w jednym"],
  ["liczba i rozmiar kolumn", "odstęp między wierszami", "sposób układania elementów dodanych automatycznie", "wyrównanie zawartości w obu kierunkach"],
  ["względem najbliższego przodka z pozycjonowaniem innym niż static"],
  ["relative zostawia po elemencie jego pierwotne miejsce, absolute je zwalnia"],
  ["position: sticky"],
  ["decyduje, czy element ma zejść poniżej opływanej treści"],
  ["@media", "media", "@media screen"],
  ["na ekranach o szerokości 768 px i szerszych"],
  ["podstawowe style pisze się dla małych ekranów, a szersze obsługuje zapytaniami min-width"],
  ["orientation"],
  ["max-width: 100%"],
  ["kursor stoi nad elementem", "pole zostało kliknięte albo wybrane Tabem", "opcja jest zaznaczona", "pole jest wyłączone i nie da się w nie pisać"],
  ["::before tworzy i stylizuje dodatkowy fragment treści, :hover opisuje stan elementu"],
  ["content"],
  ["line-height"],
  ["#kontakt", "#kontakt {", "id kontakt"]
]$json$::jsonb
from nowy;
