-- =============================================================================
-- TEST 2/4 — CSS: selektory i model pudełkowy · Flexbox, Grid, pozycjonowanie · RWD
--
-- Zakres z materiałów podpiętych do podtematów 4–6 kategorii „HTML i CSS”
-- (freeCodeCamp: CSS Layouts and Effects, Relative and Absolute Units,
-- Pseudo-classes, Colors, Positioning, Grid, Responsive Web Design, lekcje
-- o Flexboksie i floatach).
--
-- Uruchom w Supabase → SQL Editor. PIN wylosuje baza — zobaczysz go w panelu.
-- =============================================================================

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    'CSS: selektory, układ strony i RWD',
    1800,
    $json$[
      {"type":"closed","text":"Z jakich warstw składa się model pudełkowy, licząc od treści na zewnątrz?","options":["content, padding, border, margin","margin, border, padding, content","content, margin, border, padding","padding, content, margin, border"]},
      {"type":"input","text":"Która właściwość CSS ustawia odstęp WEWNĄTRZ elementu, między jego treścią a obramowaniem?"},
      {"type":"input","text":"Która właściwość CSS ustawia odstęp NA ZEWNĄTRZ elementu, oddzielający go od sąsiadów?"},
      {"type":"closed","text":"Która właściwość decyduje o zachowaniu treści wykraczającej poza rozmiar kontenera?","options":["overflow","display","position","clip"]},
      {"type":"select","text":"Która funkcja właściwości transform obraca element?","options":["rotate()","translate()","scale()","skew()"]},
      {"type":"matching","text":"Dopasuj funkcję transform do jej działania","left":["translate()","scale()","rotate()","skew()"],"right":["pochyla element","przesuwa element","obraca element","zmienia rozmiar elementu"]},
      {"type":"closed","text":"Do czego odnosi się jednostka rem?","options":["do rozmiaru czcionki elementu html (korzenia)","do rozmiaru czcionki rodzica","do szerokości okna przeglądarki","do rozmiaru ekranu urządzenia"]},
      {"type":"closed","text":"Do czego odnosi się jednostka em użyta we właściwości font-size?","options":["do rozmiaru czcionki elementu nadrzędnego","do rozmiaru czcionki elementu html","do 16 pikseli, zawsze","do wysokości okna przeglądarki"]},
      {"type":"input","text":"Która jednostka względna odpowiada 1% szerokości okna przeglądarki (viewportu)?"},
      {"type":"matching","text":"Dopasuj jednostkę do tego, względem czego jest liczona","left":["px","rem","vh","%"],"right":["1% wysokości viewportu","rozmiar czcionki elementu html","jednostka bezwzględna, 1/96 cala","proporcja rozmiaru rodzica"]},
      {"type":"closed","text":"Która pseudoklasa opisuje stan elementu w chwili kliknięcia?","options":[":active",":hover",":focus",":checked"]},
      {"type":"select","text":"Która pseudoklasa zadziała na pole formularza, gdy zostanie w nie wprowadzony fokus?","options":[":focus",":hover",":visited",":enabled"]},
      {"type":"matching","text":"Dopasuj pseudoklasę do sytuacji, w której obowiązuje","left":[":checked",":disabled",":invalid",":required"],"right":["pole ma atrybut required","pole zawiera wartość niespełniającą walidacji","opcja jest zaznaczona","element jest wyłączony"]},
      {"type":"closed","text":"Które kolory są barwami podstawowymi według materiału o kolorach?","options":["żółty, niebieski, czerwony","czerwony, zielony, niebieski","zielony, pomarańczowy, fioletowy","czarny, biały, szary"]},
      {"type":"select","text":"Jak nazywa się zestaw kolorów leżących po przeciwnych stronach koła barw, dający duży kontrast?","options":["komplementarny","analogiczny","monochromatyczny","triadyczny"]},
      {"type":"closed","text":"Czym jest Flexbox?","options":["jednowymiarowym modelem układu — porządkuje elementy wzdłuż jednej osi","dwuwymiarowym modelem układu z wierszami i kolumnami","sposobem pozycjonowania absolutnego","techniką animacji elementów"]},
      {"type":"input","text":"Jaką wartość trzeba nadać właściwości display, aby element stał się kontenerem flex?"},
      {"type":"closed","text":"Które elementy są elementami flex (flex items)?","options":["bezpośrednie dzieci kontenera flex","wszystkie elementy potomne, na każdym poziomie","tylko elementy blokowe w dokumencie","elementy z właściwością position: relative"]},
      {"type":"closed","text":"Czym różni się Grid od Flexboksa?","options":["Grid jest dwuwymiarowy — obsługuje wiersze i kolumny naraz","Grid działa tylko w pionie","Grid nie pozwala na odstępy między elementami","Grid nie działa w układach responsywnych"]},
      {"type":"input","text":"Jaką wartość nadaje się właściwości display, aby utworzyć siatkę (grid)?"},
      {"type":"select","text":"Co oznacza jednostka fr w siatce CSS?","options":["część dostępnej przestrzeni w kontenerze siatki","stałą szerokość w pikselach","procent szerokości ekranu","liczbę wierszy siatki"]},
      {"type":"closed","text":"Czym można zastąpić zapis grid-template-columns: 1fr 1fr 1fr?","options":["repeat(3, 1fr)","minmax(3, 1fr)","span 3","grid-auto-flow: 3"]},
      {"type":"input","text":"Która funkcja pozwala ustawić minimalny i maksymalny rozmiar ścieżki siatki?"},
      {"type":"matching","text":"Dopasuj właściwość siatki do jej zadania","left":["grid-template-columns","row-gap","grid-auto-flow","place-items"],"right":["odstęp między wierszami","sposób rozmieszczania elementów automatycznych","wyrównanie elementów w obu kierunkach","liczba i rozmiar kolumn"]},
      {"type":"closed","text":"Co robi position: absolute?","options":["wyjmuje element ze zwykłego przepływu dokumentu","przesuwa element, zostawiając jego miejsce w przepływie","przykleja element do okna na stałe","jest wartością domyślną każdego elementu"]},
      {"type":"select","text":"Które pozycjonowanie jest zachowaniem domyślnym, czyli zwykłym przepływem dokumentu?","options":["static","relative","absolute","fixed"]},
      {"type":"closed","text":"Co robi właściwość clear przy elementach z float?","options":["decyduje, czy element ma zejść poniżej opływanej treści","usuwa element ze strony","wyłącza float dla całego dokumentu","wyrównuje tekst do prawej"]},
      {"type":"closed","text":"Na czym polega responsywność strony?","options":["układ i treść dostosowują się do rozmiaru ekranu urządzenia","strona ma osobną wersję pod każdy telefon","strona ładuje się szybciej na telefonie","obrazy są zapisane w formacie wektorowym"]},
      {"type":"input","text":"Jaka reguła CSS (zaczynająca się od małpy) pozwala zastosować style zależnie od szerokości ekranu?"},
      {"type":"select","text":"Która cecha zapytania medialnego mówi, czy urządzenie jest w orientacji poziomej, czy pionowej?","options":["orientation","aspect-ratio","resolution","screen"]}
    ]$json$::jsonb,
    'inf03'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
  ["content, padding, border, margin"],
  ["padding"],
  ["margin"],
  ["overflow"],
  ["rotate()"],
  ["przesuwa element", "zmienia rozmiar elementu", "obraca element", "pochyla element"],
  ["do rozmiaru czcionki elementu html (korzenia)"],
  ["do rozmiaru czcionki elementu nadrzędnego"],
  ["vw", "1vw"],
  ["jednostka bezwzględna, 1/96 cala", "rozmiar czcionki elementu html", "1% wysokości viewportu", "proporcja rozmiaru rodzica"],
  [":active"],
  [":focus"],
  ["opcja jest zaznaczona", "element jest wyłączony", "pole zawiera wartość niespełniającą walidacji", "pole ma atrybut required"],
  ["żółty, niebieski, czerwony"],
  ["komplementarny"],
  ["jednowymiarowym modelem układu — porządkuje elementy wzdłuż jednej osi"],
  ["flex", "display: flex"],
  ["bezpośrednie dzieci kontenera flex"],
  ["Grid jest dwuwymiarowy — obsługuje wiersze i kolumny naraz"],
  ["grid", "display: grid"],
  ["część dostępnej przestrzeni w kontenerze siatki"],
  ["repeat(3, 1fr)"],
  ["minmax", "minmax()"],
  ["liczba i rozmiar kolumn", "odstęp między wierszami", "sposób rozmieszczania elementów automatycznych", "wyrównanie elementów w obu kierunkach"],
  ["wyjmuje element ze zwykłego przepływu dokumentu"],
  ["static"],
  ["decyduje, czy element ma zejść poniżej opływanej treści"],
  ["układ i treść dostosowują się do rozmiaru ekranu urządzenia"],
  ["@media", "media", "@media screen"],
  ["orientation"]
]$json$::jsonb
from nowy;
