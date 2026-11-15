-- generuj: multimedia,algorytmy,cpp,php 035
-- =============================================================================
-- 035_teoria_multimedia_algorytmy_cpp_php.sql — teoria do podtematów: multimedia, algorytmy, cpp, php
--
-- Uruchom po 033_subtopic_notes.sql.
--
-- PLIK GENEROWANY: źródła w scripts/teoria/<dział>/*.md, generator
-- scripts/teoria/generuj.mjs. Poprawiasz treść w pliku .md i generujesz od nowa.
-- Istniejących notatek nie nadpisuje (on conflict do nothing).
--
--   multimedia: mm-animacje, mm-barwy, mm-cms-media, mm-edycja, mm-formaty, mm-osadzanie, mm-projekt, mm-typografia
--   algorytmy: alg-analiza, alg-liczbowe, alg-schematy, alg-sortowanie, alg-strukturalne, alg-wyszukiwanie, alg-zlozonosc
--   cpp: cpp-budowa, cpp-funkcje, cpp-obiekty, cpp-operatory, cpp-petle, cpp-tablice, cpp-typy, cpp-warunki, cpp-wejscie, cpp-wskazniki
--   php: php-formularze, php-funkcje-tablice, php-mysqli, php-pliki, php-sesje, php-skladnia
-- =============================================================================

do $$
begin
  if to_regclass('public.subtopic_notes') is null then
    raise exception 'Brakuje migracji 033_subtopic_notes.sql — uruchom ją przed 035.';
  end if;
end $$;

insert into subtopic_notes (subtopic_id, content_md)
select n.id, n.tresc
from (values
  ($t0$mm-animacje$t0$, $t0$**W skrócie:** ruch na stronie można zrobić trzema drogami: **animowany GIF** (gotowy plik), **animacje CSS** (`transition` i `@keyframes`) albo **SVG** (grafika wektorowa animowana CSS-em lub JavaScriptem). Dziś najczęściej wybiera się CSS — jest lekki i płynny.

## Porównanie

| Sposób | Zalety | Wady |
|---|---|---|
| **GIF** | działa wszędzie, wystarczy `<img>` | tylko 256 kolorów, duże pliki, brak kontroli |
| **CSS** | lekkie, płynne, łatwo zmieniać | dla złożonych animacji kod robi się długi |
| **SVG** | ostre w każdej skali, mały rozmiar | wymaga przygotowania grafiki wektorowej |
| Krótkie wideo (MP4/WebM) | dużo lepsza jakość niż GIF przy mniejszym rozmiarze | potrzebuje `<video autoplay muted loop>` |

## Przejście — `transition`

Płynna zmiana właściwości po zdarzeniu, np. najechaniu myszą:

```css
.przycisk {
  background-color: #1565c0;
  transition: background-color 0.3s ease;
}
.przycisk:hover {
  background-color: #0d47a1;
}
```

Zapis: `transition: właściwość czas funkcja-czasu opóźnienie;`

## Animacja — `@keyframes`

Działa sama, bez zdarzenia, może się powtarzać:

```css
@keyframes pulsowanie {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.logo {
  animation: pulsowanie 2s ease-in-out infinite;
}
```

Zapis skrócony: `animation: nazwa czas funkcja-czasu liczba-powtórzeń;` (`infinite` = bez końca).

## Co animować, żeby było płynnie

Najlepiej **`transform`** (przesunięcie, obrót, skala) i **`opacity`** — przeglądarka liczy je wydajnie. Animowanie `width`, `top` czy `margin` potrafi „szarpać”.

## Dostępność

Część osób źle znosi ruch na ekranie. Szanuj ich ustawienie systemowe:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none; transition: none; }
}
```

## Na egzaminie

- `transition` potrzebuje zmiany (np. `:hover`), `@keyframes` + `animation` działa sam.
- `infinite` — animacja bez końca.
- GIF ma ograniczoną paletę (256 kolorów).

## Sprawdź się

1. Który zapis sprawi, że animacja `obrot` będzie trwała 3 s i powtarzała się bez końca?
2. Dlaczego zamiast długiego GIF-a lepiej dać krótkie wideo MP4?
3. Które właściwości najlepiej animować, żeby ruch był płynny?

**Odpowiedzi:** 1. `animation: obrot 3s linear infinite;` 2. Mniejszy plik i lepsza jakość (GIF ma tylko 256 kolorów). 3. `transform` i `opacity`.$t0$),
  ($t0$mm-barwy$t0$, $t0$**W skrócie:** dobra strona ma **mało kolorów**, dobranych świadomie: kolor główny, kolor akcentu i neutralne tła. Tekst musi mieć wystarczający **kontrast** z tłem — inaczej części osób trudno go przeczytać.

## Modele barw

| Model | Gdzie | Zapis w CSS |
|---|---|---|
| **RGB** | ekrany (barwy addytywne: światło) | `rgb(255, 136, 0)`, `#ff8800` |
| **HSL** | wygodne dobieranie odcieni | `hsl(32, 100%, 50%)` — odcień, nasycenie, jasność |
| **CMYK** | druk (barwy subtraktywne: farba) | nie używa się na stronach |

HSL ułatwia budowanie palety: ten sam odcień, różne jasności → spójny zestaw.

## Harmonie barw (koło barw)

- **Monochromatyczna** — jeden odcień w różnych jasnościach; spokojna i bezpieczna.
- **Analogiczna** — sąsiednie barwy na kole (np. niebieski, turkus, zieleń).
- **Dopełniająca** — barwy naprzeciw siebie (niebieski i pomarańczowy); mocny kontrast, dobra na akcent.
- **Triada** — trzy barwy co 120°.

## Zasada 60-30-10

- **60%** — kolor dominujący (zwykle tło, neutralny),
- **30%** — kolor uzupełniający,
- **10%** — **akcent**: przyciski, linki, ważne elementy.

## Kontrast (WCAG)

| Tekst | Minimalny kontrast |
|---|---|
| zwykły (poziom AA) | **4,5 : 1** |
| duży, od ok. 24 px lub 19 px pogrubiony (AA) | 3 : 1 |
| poziom AAA | 7 : 1 |

Szary tekst na szarym tle prawie zawsze nie przechodzi. Sprawdzisz to w narzędziach deweloperskich przeglądarki albo w kalkulatorze kontrastu WebAIM.

**Kolor nie może być jedyną informacją**: pole z błędem oznacz na czerwono *i* komunikatem tekstowym — osoby z daltonizmem mogą czerwieni nie odróżnić.

## Zmienne CSS — jedna paleta dla całej strony

```css
:root {
  --kolor-glowny: #1565c0;
  --kolor-akcent: #ff8f00;
  --tlo: #f5f7fa;
}
button { background: var(--kolor-akcent); }
```

## Na egzaminie

- Zapis `#RRGGBB` i `rgb()` — przelicz HEX na liczby (FF = 255).
- RGB dla ekranu, CMYK dla druku.
- Minimalny kontrast zwykłego tekstu (AA): 4,5 : 1.

## Sprawdź się

1. Jaki kontrast musi mieć zwykły tekst według WCAG na poziomie AA?
2. Który model barw stosuje się w druku?
3. Ile procent powierzchni według zasady 60-30-10 zajmuje kolor akcentu?

**Odpowiedzi:** 1. 4,5 : 1. 2. CMYK. 3. Ok. 10%.$t0$),
  ($t0$mm-cms-media$t0$, $t0$**W skrócie:** w CMS-ie (np. WordPressie) pliki trafiają do **biblioteki mediów**, skąd wstawia się je do wpisów i stron. Duże filmy zwykle **nie** wgrywa się na własny serwer — osadza się je z YouTube czy Vimeo, wklejając link.

## Biblioteka mediów (WordPress)

- **Media → Dodaj nowy** — wgrywanie obrazów, dźwięków, filmów i PDF-ów.
- Każdy plik ma pola: **tytuł**, **tekst alternatywny** (alt), podpis, opis.
- Przy wgraniu obrazu WordPress sam tworzy kilka **rozmiarów** (miniatura, średni, duży) — strona podaje przeglądarce odpowiedni.
- Limit wielkości przesyłanego pliku ustala serwer (w PHP `upload_max_filesize` i `post_max_size`).

## Wstawianie do treści (edytor blokowy)

| Blok | Do czego |
|---|---|
| **Obrazek** | pojedyncze zdjęcie z podpisem i alt |
| **Galeria** | kilka zdjęć w siatce |
| **Wideo** / **Audio** | plik z biblioteki mediów (odtwarzacz HTML5) |
| **Osadzanie (Embed)** | wklejony adres z YouTube, Vimeo, Spotify — WordPress sam zrobi ramkę |
| **Plik** | link do pobrania, np. PDF |

Wystarczy wkleić w edytor sam adres filmu z YouTube w osobnej linii — WordPress zamieni go na odtwarzacz.

## Dobre praktyki

1. **Zmniejsz przed wgraniem** — zdjęcie z aparatu 6000 px szerokości to marnowanie miejsca; wystarczy 1600–2000 px.
2. **Wypełniaj tekst alternatywny** — dostępność i SEO.
3. **Nazwy plików** opisowe, bez spacji i polskich znaków: `boisko-szkolne.jpg`, nie `IMG_2031.JPG`.
4. Duże filmy — przez serwis wideo, nie biblioteka mediów.
5. Wtyczki do optymalizacji obrazów (kompresja, format WebP) przyspieszają stronę.
6. Wgrywaj tylko materiały, do których masz **prawa** (licencja, zgoda na wizerunek).

## Na egzaminie

- Gdzie w WordPressie zarządza się plikami → **Media (biblioteka mediów)**.
- Tekst alternatywny jest polem pliku w bibliotece mediów.
- Osadzanie filmu z YouTube: blok **Osadzanie** albo wklejenie adresu.

## Sprawdź się

1. W którym miejscu panelu WordPressa wgrywa się zdjęcia?
2. Dlaczego długiego filmu zwykle nie wgrywa się do biblioteki mediów?
3. Po co wypełniać pole „Tekst alternatywny”?

**Odpowiedzi:** 1. Media → Dodaj nowy (biblioteka mediów). 2. Zajmuje dużo miejsca i obciąża serwer; serwis wideo zrobi to lepiej. 3. Dla dostępności (czytniki ekranu), SEO i gdy obraz się nie wczyta.$t0$),
  ($t0$mm-edycja$t0$, $t0$**W skrócie:** materiał nagrany telefonem prawie nigdy nie nadaje się wprost na stronę. Trzeba go **przyciąć**, często **zmniejszyć rozdzielczość**, wyrównać głośność i **wyeksportować** w formacie i jakości dobranej do internetu.

## Typowe narzędzia

| Rodzaj | Przykłady (darmowe) |
|---|---|
| Edycja dźwięku | **Audacity** |
| Edycja wideo | **Shotcut**, **OpenShot**, DaVinci Resolve |
| Konwersja i kompresja | **HandBrake**, FFmpeg (wiersz poleceń) |

## Podstawowe operacje

**Dźwięk (Audacity):**
- przycinanie ciszy na początku i końcu,
- **normalizacja** — wyrównanie głośności do ustalonego poziomu,
- usuwanie szumu (najpierw zaznacz fragment samego szumu jako próbkę),
- wyciszanie na końcu (*fade out*),
- eksport do MP3 / OGG.

**Wideo:**
- cięcie i łączenie ujęć na osi czasu,
- przejścia między ujęciami (bez przesady),
- napisy i plansze tekstowe,
- usunięcie ścieżki dźwiękowej, jeśli film ma być tłem strony,
- eksport: kontener MP4, kodek H.264, rozdzielczość 720p lub 1080p, rozsądny bitrate.

## Przykład: film w tle sekcji „O nas”

1. Wybierz 10–15 sekund nagrania, które dobrze się zapętla.
2. Zmniejsz do 1280×720.
3. Usuń dźwięk.
4. Wyeksportuj do MP4 (H.264), a opcjonalnie drugi raz do WebM.
5. Sprawdź rozmiar — celuj w kilka MB, nie kilkadziesiąt.
6. Osadź: `<video autoplay muted loop playsinline poster="kadr.jpg">`.

## Prawa i zgody

- Na nagraniu są ludzie? Potrzebna **zgoda na wykorzystanie wizerunku**.
- Muzyka w tle też jest utworem — użyj własnej, z licencją, która na to pozwala, albo z biblioteki bez opłat licencyjnych (sprawdź warunki).

## Na egzaminie

- Normalizacja = wyrównanie głośności.
- Do internetu: MP4 (H.264), niewygórowana rozdzielczość, mały rozmiar.
- Film w tle bez ścieżki dźwiękowej i z `muted`.

## Sprawdź się

1. Co robi normalizacja dźwięku?
2. Dlaczego film na tło strony warto pozbawić ścieżki audio?
3. Co jest potrzebne, żeby opublikować nagranie z uczniami na stronie szkoły?

**Odpowiedzi:** 1. Wyrównuje głośność do ustalonego poziomu. 2. I tak będzie wyciszony, a bez audio plik jest mniejszy. 3. Zgoda na wykorzystanie wizerunku (u niepełnoletnich — rodziców).$t0$),
  ($t0$mm-formaty$t0$, $t0$**W skrócie:** dźwięk i wideo na stronie muszą być **małe** (szybkie ładowanie) i w formacie, który **odtworzy każda przeglądarka**. Zmniejsza je **kompresja** — stratna (wyrzuca część informacji) albo bezstratna (nic nie traci, ale zmniejsza mniej).

## Kompresja stratna i bezstratna

| Rodzaj | Co robi | Przykłady |
|---|---|---|
| **Stratna** | usuwa dane, których człowiek prawie nie zauważy; dużo mniejszy plik | MP3, AAC, Opus, MP4 (H.264), WebM (VP9, AV1), JPEG |
| **Bezstratna** | da się odtworzyć dokładnie oryginał | FLAC, WAV (bez kompresji), PNG, ZIP |

Na stronę prawie zawsze wybiera się kompresję **stratną** — liczy się rozmiar.

## Formaty na stronę

| Rodzaj | Format (kontener) | Kodek | Uwagi |
|---|---|---|---|
| Wideo | **MP4** | H.264 (dźwięk AAC) | obsługują go praktycznie wszystkie przeglądarki — bezpieczny wybór |
| Wideo | **WebM** | VP9 / AV1 (dźwięk Opus) | otwarty format, mniejsze pliki przy tej samej jakości |
| Dźwięk | **MP3** | MP3 | uniwersalny |
| Dźwięk | AAC (.m4a), Ogg/Opus | AAC, Opus | dobra jakość przy małym rozmiarze |

**Kontener** (MP4, WebM) to „pudełko”, w którym siedzą ścieżki obrazu i dźwięku zakodowane **kodekami**.

## Parametry, od których zależy rozmiar

- **Bitrate** (przepływność, kb/s) — ile danych na sekundę nagrania. Mniej = mniejszy plik, gorsza jakość.
- **Rozdzielczość** wideo (np. 1280×720 = HD) i **liczba klatek** na sekundę (fps).
- **Częstotliwość próbkowania** dźwięku (np. 44,1 kHz) i liczba kanałów (mono/stereo).

Przybliżony rozmiar: **bitrate × czas**. Minuta dźwięku 128 kb/s: 128 × 60 = 7680 kb = 960 kB ≈ ok. 1 MB.

## Jak to rozumieć

Film tła na stronie głównej nie potrzebuje 4K ani dźwięku: wystarczy 720p, kilkanaście sekund w pętli, bez ścieżki audio — kilka MB zamiast kilkuset.

## Na egzaminie

- Odróżnij kompresję stratną i bezstratną (MP3 vs FLAC, JPEG vs PNG).
- Najbezpieczniejsze formaty dla `<video>`: **MP4 (H.264)**, opcjonalnie dodatkowo WebM.
- Zmniejszenie bitrate'u zmniejsza plik kosztem jakości.

## Sprawdź się

1. Który format dźwięku jest bezstratny: MP3, AAC czy FLAC?
2. Ile w przybliżeniu waży minuta dźwięku przy 128 kb/s?
3. Co to jest kontener w przypadku pliku wideo?

**Odpowiedzi:** 1. FLAC. 2. Ok. 1 MB. 3. Format „opakowania” łączący ścieżki obrazu i dźwięku zakodowane kodekami (np. MP4, WebM).$t0$),
  ($t0$mm-osadzanie$t0$, $t0$**W skrócie:** wideo i dźwięk wstawiasz znacznikami `<video>` i `<audio>`. Atrybuty decydują, czy pojawią się przyciski, czy plik odtworzy się sam i w pętli. Filmy z YouTube czy Vimeo osadza się ramką `<iframe>` z kodu udostępniania.

## Znacznik `<video>`

```html
<video controls width="640" poster="okladka.jpg">
  <source src="film.webm" type="video/webm">
  <source src="film.mp4" type="video/mp4">
  Twoja przeglądarka nie obsługuje wideo.
</video>
```

Przeglądarka bierze **pierwsze** źródło `<source>`, które umie odtworzyć. Tekst w środku widać tylko w bardzo starych przeglądarkach.

## Najważniejsze atrybuty

| Atrybut | Znaczenie |
|---|---|
| `controls` | pokazuje przyciski (odtwórz, głośność, pełny ekran) |
| `autoplay` | uruchamia od razu — przeglądarki pozwalają na to zwykle tylko z `muted` |
| `muted` | wycisza |
| `loop` | odtwarza w pętli |
| `poster` | obrazek widoczny przed uruchomieniem filmu |
| `preload` | `none` / `metadata` / `auto` — ile pobrać przed kliknięciem |
| `width`, `height` | wymiary odtwarzacza |

Tło strony z filmem: `<video autoplay muted loop playsinline>`.

## Znacznik `<audio>`

```html
<audio controls>
  <source src="utwor.mp3" type="audio/mpeg">
  <source src="utwor.ogg" type="audio/ogg">
</audio>
```

Atrybuty jak w `<video>` (bez `poster`, `width`, `height`).

## Napisy — `<track>`

```html
<track src="napisy.vtt" kind="subtitles" srclang="pl" label="Polski">
```

Plik napisów w formacie **WebVTT** (.vtt). Napisy to też wymóg dostępności (WCAG).

## Serwisy zewnętrzne

YouTube → „Udostępnij” → „Umieść” daje kod `<iframe src="https://www.youtube.com/embed/...">`. Zalety: brak obciążenia własnego serwera, gotowy odtwarzacz. Wady: reklamy, ciasteczka serwisu, zależność od zewnętrznego dostawcy.

## Na egzaminie

- Bez atrybutu `controls` uczeń nie zobaczy przycisków — częsty błąd w zadaniach praktycznych.
- `autoplay` zadziała zwykle dopiero z `muted`.
- Kilka `<source>` = zapas formatów dla różnych przeglądarek.

## Sprawdź się

1. Jakiego atrybutu brakuje, jeśli film się wyświetla, ale nie ma przycisków?
2. Do czego służy atrybut `poster`?
3. W jakim formacie zapisuje się napisy dla `<track>`?

**Odpowiedzi:** 1. `controls`. 2. Wyświetla obrazek przed uruchomieniem filmu. 3. WebVTT (.vtt).$t0$),
  ($t0$mm-projekt$t0$, $t0$**W skrócie:** stronę najpierw się **projektuje**, a dopiero potem koduje. Projekt odpowiada na pytania: dla kogo jest strona, co ma na niej być i gdzie. Jego efektem jest **makieta** (wireframe) — prosty szkic układu bez kolorów i ozdobników.

## Etapy projektowania

1. **Analiza** — cel strony, odbiorcy, wymagania klienta, przegląd konkurencji.
2. **Struktura treści** — jakie podstrony i sekcje, w jakiej kolejności (mapa strony).
3. **Makieta (wireframe)** — szare prostokąty: gdzie nagłówek, menu, treść, stopka.
4. **Projekt graficzny (mockup)** — kolory, kroje pisma, zdjęcia.
5. **Prototyp** — klikalna wersja, którą można przetestować z użytkownikiem.
6. **Kodowanie** i testy na różnych urządzeniach.

## Typowy układ strony

```
+--------------------------------+
|  header: logo + nav (menu)     |
+--------------------------------+
|  baner / sekcja główna         |
+----------------------+---------+
|  main: treść         | aside   |
|                      | (boczny)|
+----------------------+---------+
|  footer: kontakt, prawa        |
+--------------------------------+
```

W HTML5 odpowiadają mu znaczniki semantyczne: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`.

## Zasady dobrego projektu

- **Hierarchia wizualna** — najważniejsze rzeczy największe i najwyżej (jeden `h1`).
- **Siatka i wyrównanie** — elementy trzymają się wspólnych linii.
- **Odstępy (whitespace)** — puste miejsce poprawia czytelność.
- **Spójność** — te same przyciski, kolory i odstępy na każdej podstronie.
- **Mobile first** — projekt najpierw na telefon, potem na szersze ekrany (RWD).
- **Wezwanie do działania** — widoczny główny przycisk („Zapisz się”, „Kup”).

## Narzędzia

Kartka i ołówek, **Figma**, Penpot, Balsamiq.

## Analiza istniejącego projektu

Patrząc na gotową stronę, sprawdź: czy od razu wiadomo, czego dotyczy? czy menu jest jasne? czy tekst jest czytelny na telefonie? ile trwa wczytanie? czy da się obsłużyć stronę klawiaturą?

## Na egzaminie

- Makieta ≠ projekt graficzny: makieta to sam układ, bez kolorów.
- Znaczniki semantyczne odpowiadają częściom układu.
- W zadaniu praktycznym rozmieszczenie bloków jest zwykle podane rysunkiem — to właśnie makieta.

## Sprawdź się

1. Czym różni się makieta od projektu graficznego?
2. Który znacznik HTML5 odpowiada głównej treści strony?
3. Co oznacza podejście „mobile first”?

**Odpowiedzi:** 1. Makieta pokazuje tylko układ elementów, projekt graficzny dodaje kolory, kroje i zdjęcia. 2. `<main>`. 3. Projektowanie najpierw dla małych ekranów, potem rozszerzanie na większe.$t0$),
  ($t0$mm-typografia$t0$, $t0$**W skrócie:** typografia to dobór **kroju pisma, wielkości, odstępów i długości wiersza**. Dobrze ułożony tekst czyta się bez wysiłku — źle ułożony zniechęca, nawet gdy treść jest świetna.

## Kroje pisma

| Rodzaj | Cecha | Przykłady | Użycie |
|---|---|---|---|
| **Szeryfowy** (serif) | małe „stopki” na końcach liter | Georgia, Times New Roman | dłuższe teksty, styl klasyczny |
| **Bezszeryfowy** (sans-serif) | proste zakończenia | Arial, Roboto, Open Sans | interfejsy, ekrany — najczęstszy wybór |
| **Monospace** | wszystkie znaki tej samej szerokości | Courier New, Consolas | kod |
| Ozdobny / odręczny | wyrazisty | — | tylko nagłówki, oszczędnie |

Zasada: **najwyżej 2 kroje** na stronę (np. jeden do nagłówków, drugi do treści).

## Właściwości CSS

```css
body {
  font-family: "Open Sans", Arial, sans-serif;  /* lista zapasowa! */
  font-size: 16px;
  line-height: 1.5;
  color: #222;
}
h1 { font-size: 2rem; font-weight: 700; }
p  { max-width: 70ch; }
```

| Właściwość | Za co odpowiada |
|---|---|
| `font-family` | krój — zawsze z krojami zapasowymi na końcu (`sans-serif`) |
| `font-size` | wielkość: `px`, `em` (względem rodzica), `rem` (względem `html`) |
| `font-weight` | grubość: `normal` (400), `bold` (700) |
| `line-height` | interlinia — dla treści ok. **1,4–1,6** |
| `letter-spacing` | odstęp między literami |
| `text-align` | wyrównanie — długie teksty do lewej, nie do środka |
| `text-transform` | `uppercase` — wielkie litery bez przepisywania tekstu |

## Czytelność

- Tekst główny **co najmniej 16 px**.
- Długość wiersza ok. **50–75 znaków** (`max-width: 70ch`).
- Wyraźna **hierarchia**: `h1` > `h2` > `h3` > tekst — różnica wielkości i grubości.
- Unikaj długich bloków pisanych wielkimi literami i justowania bez dzielenia wyrazów (tworzą „rzeki” odstępów).

## Fonty z internetu

Google Fonts albo pliki na własnym serwerze przez `@font-face`. Każdy font to dodatkowe pobieranie — bierz tylko potrzebne grubości.

## Na egzaminie

- `font-family` z listą zapasową, zakończoną rodziną ogólną (`serif`, `sans-serif`, `monospace`).
- `rem` liczy się od wielkości czcionki elementu `html`, `em` — od rodzica.
- Krój bezszeryfowy = bez „stopek”.

## Sprawdź się

1. Dlaczego w `font-family` podaje się kilka krojów?
2. Jaką interlinię (`line-height`) zaleca się dla tekstu ciągłego?
3. Czym różni się jednostka `rem` od `em`?

**Odpowiedzi:** 1. Jeśli pierwszego nie ma na komputerze użytkownika, przeglądarka użyje kolejnego. 2. Ok. 1,4–1,6. 3. `rem` odnosi się do rozmiaru czcionki elementu `html`, `em` — do rozmiaru rodzica.$t0$),
  ($t0$alg-analiza$t0$, $t0$**W skrócie:** zanim napiszesz kod, musisz dokładnie wiedzieć, **co** ma robić program. Analiza problemu kończy się **specyfikacją**: opisem danych wejściowych, oczekiwanego wyniku i warunków, jakie mają spełniać.

## Specyfikacja zadania

| Element | Pytanie | Przykład: średnia ocen |
|---|---|---|
| **Dane wejściowe** | co program dostaje i w jakim zakresie? | liczba ocen *n* (1–30), oceny całkowite 1–6 |
| **Wynik (wyjście)** | co ma zwrócić lub wypisać? | średnia zaokrąglona do 2 miejsc |
| **Warunki / ograniczenia** | czego nie wolno, czego się spodziewać? | gdy *n* = 0 — komunikat zamiast dzielenia przez zero |

## Etapy rozwiązywania problemu

1. **Zrozumienie zadania** — przeczytaj dwa razy, wypisz dane i wynik.
2. **Specyfikacja** — zakresy, typy danych, przypadki szczególne.
3. **Wybór lub zaprojektowanie algorytmu** — opis kroków (lista kroków, schemat blokowy, pseudokod).
4. **Sprawdzenie na przykładzie** — „ręczne” przejście algorytmu na małych danych.
5. **Implementacja** — kod w wybranym języku.
6. **Testowanie** — także na danych brzegowych.

## Przypadki brzegowe

To dane na granicy zakresu albo nietypowe — tu programy najczęściej się mylą:
- pusta lista, jeden element, wszystkie elementy równe,
- 0, liczby ujemne, maksymalna dopuszczalna wartość,
- pusty napis, napis ze spacjami lub polskimi znakami.

## Cechy dobrego algorytmu

- **Poprawność** — daje dobry wynik dla każdych dopuszczalnych danych.
- **Skończoność** — kończy się po skończonej liczbie kroków.
- **Jednoznaczność** — każdy krok jest opisany precyzyjnie.
- **Efektywność** — nie marnuje czasu ani pamięci.

## Przykład: czy rok jest przestępny

- *Wejście:* rok — liczba całkowita dodatnia.
- *Wyjście:* „tak” albo „nie”.
- *Reguła:* przestępny, gdy dzieli się przez 4 i nie przez 100, **albo** dzieli się przez 400.
- *Testy:* 2024 → tak, 1900 → nie, 2000 → tak, 2023 → nie.

## Na egzaminie

- W zadaniu praktycznym specyfikacja jest w treści — wypisz sobie dane wejściowe i oczekiwany wynik, zanim zaczniesz kodować.
- Przetestuj program na danych brzegowych, zanim go oddasz.

## Sprawdź się

1. Jakie trzy elementy zawiera specyfikacja zadania?
2. Podaj dwa przypadki brzegowe dla funkcji szukającej największej liczby w tablicy.
3. Czy 1900 był rokiem przestępnym?

**Odpowiedzi:** 1. Dane wejściowe, wynik, warunki/ograniczenia. 2. Np. tablica pusta, tablica z jednym elementem, same liczby ujemne. 3. Nie — dzieli się przez 100, a nie przez 400.$t0$),
  ($t0$alg-liczbowe$t0$, $t0$**W skrócie:** trzy klasyczne algorytmy na liczbach całkowitych: **Euklides** (największy wspólny dzielnik), **sprawdzanie pierwszości** i **zamiana na inny system liczbowy**. Każdy opiera się na dzieleniu z resztą — operator `%` (modulo).

## Operator modulo

`a % b` to **reszta z dzielenia** a przez b: `17 % 5 = 2`, `10 % 2 = 0`.
- liczba parzysta: `n % 2 == 0`,
- ostatnia cyfra liczby: `n % 10`,
- „obcięcie” ostatniej cyfry: dzielenie całkowite `n / 10` (w C++ dla typu `int`).

## NWD — algorytm Euklidesa

Pomysł: NWD(a, b) = NWD(b, a % b), aż reszta wyniesie 0.

```
dopóki b ≠ 0
    r ← a % b
    a ← b
    b ← r
wynik: a
```

NWD(48, 18): (48, 18) → (18, 12) → (12, 6) → (6, 0) → **6**.

**NWW** (najmniejsza wspólna wielokrotność): `NWW(a, b) = a · b / NWD(a, b)` → NWW(4, 6) = 24 / 2 = 12.

## Czy liczba jest pierwsza

Liczba pierwsza ma dokładnie dwa dzielniki: 1 i siebie (1 nie jest pierwsza). Wystarczy sprawdzać dzielniki **do pierwiastka** z n:

```
jeżeli n < 2 → nie jest pierwsza
dla d od 2, dopóki d · d ≤ n
    jeżeli n % d = 0 → nie jest pierwsza
w przeciwnym razie → jest pierwsza
```

Dla n = 97 wystarczy sprawdzić d = 2…9, a nie 2…96.

## Zamiana na system dwójkowy (i dowolny inny)

Dziel przez podstawę i zbieraj reszty — czytane **od końca** dają wynik:

```
wynik ← ""
dopóki n > 0
    wynik ← (n % 2) + wynik
    n ← n / 2  (dzielenie całkowite)
```

13 → reszty 1, 0, 1, 1 → **1101**. Dla systemu szesnastkowego dziel przez 16, a reszty 10–15 zamieniaj na A–F.

## Suma cyfr liczby

```
suma ← 0
dopóki n > 0
    suma ← suma + n % 10
    n ← n / 10
```

## Na egzaminie

- Euklides przez modulo — zapamiętaj trzy linijki w pętli.
- Sprawdzanie pierwszości do √n, nie do n.
- `n % 10` daje ostatnią cyfrę, `n / 10` (całkowite) ją usuwa.

## Sprawdź się

1. Ile wynosi NWD(84, 36)?
2. Do jakiej liczby wystarczy sprawdzać dzielniki, żeby stwierdzić, czy 121 jest pierwsza?
3. Zapisz 19 w systemie dwójkowym.

**Odpowiedzi:** 1. 12. 2. Do 11 (√121 = 11) — i 11 go dzieli, więc 121 nie jest pierwsza. 3. 10011.$t0$),
  ($t0$alg-schematy$t0$, $t0$**W skrócie:** algorytm można zapisać **słownie (listą kroków)**, **schematem blokowym** (rysunek z ustalonych figur) albo **pseudokodem** (prawie kod, ale bez składni konkretnego języka). Wszystkie trzy opisują to samo — kolejne kroki rozwiązania.

## Bloki schematu

| Blok | Kształt | Znaczenie |
|---|---|---|
| **Start / Stop** | owal | początek i koniec algorytmu |
| **Operacja** | prostokąt | obliczenie, przypisanie, np. `suma ← suma + x` |
| **Wejście / wyjście** | równoległobok | wczytanie danych lub wypisanie wyniku |
| **Decyzja (warunek)** | romb | pytanie z dwiema strzałkami: TAK / NIE |
| Łącznik | małe kółko | połączenie części schematu |

Strzałki pokazują kierunek wykonywania. Z bloku decyzyjnego wychodzą **dwie** strzałki, z pozostałych — jedna.

## Struktury sterujące

- **Sekwencja** — kroki jeden po drugim.
- **Rozgałęzienie** — romb z warunkiem, dwie drogi.
- **Pętla (iteracja)** — strzałka wraca do wcześniejszego miejsca, dopóki warunek jest spełniony.

## Ten sam algorytm na trzy sposoby: największa z dwóch liczb

**Lista kroków:**
1. Wczytaj a i b.
2. Jeśli a > b, wynik = a, w przeciwnym razie wynik = b.
3. Wypisz wynik.

**Pseudokod:**

```
wczytaj a, b
jeżeli a > b to
    wynik ← a
w przeciwnym razie
    wynik ← b
wypisz wynik
```

**Schemat:** owal START → równoległobok „wczytaj a, b” → romb „a > b?” → (TAK) prostokąt „wynik ← a” / (NIE) prostokąt „wynik ← b” → równoległobok „wypisz wynik” → owal STOP.

## Pętla w pseudokodzie: suma liczb od 1 do n

```
wczytaj n
suma ← 0
i ← 1
dopóki i ≤ n wykonuj
    suma ← suma + i
    i ← i + 1
wypisz suma
```

## Na egzaminie

- Romb = decyzja, równoległobok = wejście/wyjście, prostokąt = operacja.
- W pytaniach „co wypisze ten schemat dla danych…” przejdź go ręcznie, zapisując wartości zmiennych w tabelce.
- Strzałka `←` w pseudokodzie oznacza **przypisanie**, nie porównanie.

## Sprawdź się

1. Jakim blokiem oznacza się wczytanie danych?
2. Ile strzałek wychodzi z bloku decyzyjnego?
3. Co wypisze pseudokod z sumą dla n = 4?

**Odpowiedzi:** 1. Równoległobokiem. 2. Dwie (TAK i NIE). 3. 10.$t0$),
  ($t0$alg-sortowanie$t0$, $t0$**W skrócie:** sortowanie układa elementy w kolejności. Trzy proste algorytmy — **bąbelkowe, przez wybór i przez wstawianie** — mają złożoność **O(n²)**: są łatwe do zrozumienia, ale wolne dla dużych danych. W prawdziwych programach używa się gotowych funkcji (np. `sort`), które działają w O(n log n).

## Sortowanie bąbelkowe

Porównuje **sąsiadów** i zamienia ich, gdy są w złej kolejności. Po każdym przejściu największy element „wypływa” na koniec.

```
dla i od 0 do n − 2
    dla j od 0 do n − 2 − i
        jeżeli t[j] > t[j + 1] → zamień t[j] i t[j + 1]
```

`[5, 2, 4, 1]` → po 1. przejściu `[2, 4, 1, 5]` → po 2. `[2, 1, 4, 5]` → po 3. `[1, 2, 4, 5]`.

Usprawnienie: jeśli w całym przejściu nie było zamiany, tablica jest już posortowana — można przerwać.

## Sortowanie przez wybór

W każdym kroku **wybiera najmniejszy** element z nieposortowanej części i stawia go na jej początku.

```
dla i od 0 do n − 2
    min ← i
    dla j od i + 1 do n − 1
        jeżeli t[j] < t[min] → min ← j
    zamień t[i] i t[min]
```

Mało zamian (najwyżej n − 1), ale zawsze tyle samo porównań.

## Sortowanie przez wstawianie

Jak układanie kart w ręce: bierze kolejny element i **wstawia go na właściwe miejsce** wśród już posortowanych.

```
dla i od 1 do n − 1
    x ← t[i]
    j ← i − 1
    dopóki j ≥ 0 i t[j] > x
        t[j + 1] ← t[j]
        j ← j − 1
    t[j + 1] ← x
```

Bardzo szybkie, gdy dane są **prawie posortowane**.

## Porównanie

| Algorytm | Pomysł | Najgorzej | Najlepiej |
|---|---|---|---|
| Bąbelkowe | zamiana sąsiadów | O(n²) | O(n) (z przerwaniem) |
| Przez wybór | szukaj minimum, postaw na początku | O(n²) | O(n²) |
| Przez wstawianie | wstaw element we właściwe miejsce | O(n²) | O(n) |
| Szybkie (quicksort), przez scalanie | dziel i zwyciężaj | O(n log n)* | O(n log n) |

*quicksort w najgorszym razie O(n²), ale w praktyce jest bardzo szybki.

## Gotowe funkcje

- PHP: `sort($t)`, `rsort($t)` (malejąco), `asort` (tablica asocjacyjna wg wartości), `ksort` (wg kluczy).
- C++: `sort(t, t + n)`.
- JavaScript: `t.sort((a, b) => a - b)` — **bez funkcji porównującej sortuje jak tekst**: `[10, 9, 1].sort()` daje `[1, 10, 9]`.

## Na egzaminie

- Rozpoznaj algorytm po opisie lub po stanie tablicy po kolejnych krokach.
- Wszystkie trzy proste mają O(n²).
- Pułapka JS: `sort()` bez funkcji porównującej.

## Sprawdź się

1. Który algorytm po każdym przejściu przesuwa największy element na koniec?
2. Jak będzie wyglądać `[4, 3, 1, 2]` po pierwszym kroku sortowania przez wybór?
3. Co da w JavaScripcie `[25, 100, 3].sort()`?

**Odpowiedzi:** 1. Bąbelkowe. 2. `[1, 3, 4, 2]` (minimum 1 zamienione z pierwszym elementem). 3. `[100, 25, 3]` — sortowanie jak tekstów.$t0$),
  ($t0$alg-strukturalne$t0$, $t0$**W skrócie:** programowanie strukturalne buduje program **tylko z trzech konstrukcji** — sekwencji, wyboru i powtarzania — i dzieli go na **funkcje**. Czytelny kod to taki, który inna osoba (albo Ty za miesiąc) zrozumie bez zgadywania.

## Trzy konstrukcje

| Konstrukcja | Instrukcje |
|---|---|
| **Sekwencja** | instrukcje jedna po drugiej |
| **Wybór** | `if`, `else`, `switch` |
| **Iteracja** | `for`, `while`, `do…while` |

Do tego **podprogramy (funkcje)** — fragmenty z nazwą, które można wywoływać wiele razy. Nie używa się skoków `goto`, które psują przejrzystość.

## Dziel na funkcje

Każda funkcja robi **jedną rzecz** i ma nazwę, która to mówi:

```php
function srednia(array $oceny): float {
    if (count($oceny) === 0) return 0;
    return array_sum($oceny) / count($oceny);
}
```

Zamiast kopiować ten sam kod w trzech miejscach — wywołaj funkcję trzy razy (zasada **DRY**: *Don't Repeat Yourself*).

## Zasady czytelnego kodu

1. **Nazwy mówiące, co przechowują**: `liczbaUczniow`, nie `x` czy `a1`.
2. **Wcięcia** pokazują strukturę — jedno wcięcie na każdy poziom zagnieżdżenia.
3. **Krótkie funkcje** — jeśli funkcja nie mieści się na ekranie, pewnie robi za dużo.
4. **Mało zagnieżdżeń** — zamiast pięciu `if` w sobie, wcześniej wyjdź z funkcji (`return`).
5. **Stałe zamiast „magicznych liczb”**: `const VAT = 0.23;` zamiast samego `0.23` w obliczeniach.
6. **Komentarze wyjaśniają „dlaczego”**, a nie „co” — co robi kod, powinno być widać z niego samego.
7. **Spójny styl** w całym projekcie (jedna konwencja nazw, jednakowe wcięcia).

## Konwencje nazw

| Konwencja | Przykład | Gdzie spotkasz |
|---|---|---|
| camelCase | `cenaBrutto` | JavaScript, Java, C# (zmienne) |
| snake_case | `cena_brutto` | PHP (często), SQL, Python |
| PascalCase | `KoszykZakupow` | nazwy klas |
| UPPER_CASE | `MAX_UCZNIOW` | stałe |

## Przed i po

```js
// przed
function f(a){let s=0;for(let i=0;i<a.length;i++){if(a[i]>0){s=s+a[i]}}return s}

// po
function sumaDodatnich(liczby) {
  let suma = 0;
  for (const liczba of liczby) {
    if (liczba > 0) suma += liczba;
  }
  return suma;
}
```

## Na egzaminie

- Kryteria ręczne w zadaniu praktycznym często oceniają **czytelność kodu**: wcięcia, nazwy, komentarze.
- Trzy konstrukcje programowania strukturalnego: sekwencja, wybór, iteracja.

## Sprawdź się

1. Jakie trzy konstrukcje tworzą program strukturalny?
2. Co oznacza zasada DRY?
3. Dlaczego `const VAT = 0.23` jest lepsze niż samo `0.23` w kilku miejscach kodu?

**Odpowiedzi:** 1. Sekwencja, wybór (rozgałęzienie), iteracja (pętla). 2. Nie powtarzaj tego samego kodu — wydziel go do funkcji. 3. Nazwa wyjaśnia znaczenie, a zmiana stawki wymaga poprawki w jednym miejscu.$t0$),
  ($t0$alg-wyszukiwanie$t0$, $t0$**W skrócie:** **wyszukiwanie liniowe** sprawdza elementy po kolei i działa zawsze. **Wyszukiwanie binarne** jest dużo szybsze, ale tylko w **posortowanej** tablicy: za każdym razem odrzuca połowę zakresu.

## Wyszukiwanie liniowe

```
dla i od 0 do n − 1
    jeżeli t[i] = szukana → zwróć i
zwróć −1   (nie znaleziono)
```

- Działa na **dowolnej** tablicy.
- W najgorszym razie sprawdza wszystkie *n* elementów — złożoność **O(n)**.

## Wyszukiwanie binarne (połówkowe)

```
lewy ← 0, prawy ← n − 1
dopóki lewy ≤ prawy
    srodek ← (lewy + prawy) / 2   (całkowite)
    jeżeli t[srodek] = szukana → zwróć srodek
    jeżeli t[srodek] < szukana → lewy ← srodek + 1
    w przeciwnym razie          → prawy ← srodek − 1
zwróć −1
```

**Przykład:** szukamy 23 w `[3, 8, 12, 17, 23, 31, 40]`:
1. lewy 0, prawy 6 → środek 3 (17) — za mało, lewy ← 4
2. lewy 4, prawy 6 → środek 5 (31) — za dużo, prawy ← 4
3. lewy 4, prawy 4 → środek 4 (23) — **znaleziono** po 3 krokach.

Złożoność **O(log n)**: dla miliona elementów najwyżej ok. 20 porównań (2²⁰ ≈ 1 mln).

## Porównanie

| | Liniowe | Binarne |
|---|---|---|
| Warunek | żaden | tablica **posortowana** |
| Kroki dla 1 000 000 elementów (najgorzej) | 1 000 000 | ~20 |
| Złożoność | O(n) | O(log n) |
| Kiedy | mała lub nieposortowana tablica, jednorazowe szukanie | wiele wyszukiwań w dużym, posortowanym zbiorze |

## Wyszukiwanie z wartownikiem

Wariant liniowego: na koniec tablicy dopisuje się szukaną wartość (**wartownik**), więc pętla nie musi co krok sprawdzać, czy nie wyszła poza tablicę — skończy się na pewno.

## Szukanie minimum i maksimum

Też przegląd liniowy: zapamiętaj pierwszy element, a potem porównuj z każdym kolejnym:

```
max ← t[0]
dla i od 1 do n − 1
    jeżeli t[i] > max → max ← t[i]
```

## Na egzaminie

- Binarne **wymaga posortowania** — najczęstsze pytanie zamknięte.
- Liczba kroków binarnego ≈ log₂ n: dla 1024 elementów najwyżej 10–11 porównań.
- Max/min zaczynaj od pierwszego elementu, nie od 0 (tablica może mieć same liczby ujemne).

## Sprawdź się

1. Czy wyszukiwanie binarne zadziała na tablicy `[5, 1, 9, 3]`?
2. Ile w przybliżeniu porównań potrzebuje wyszukiwanie binarne w tablicy 1000 elementów?
3. Dlaczego `max` warto zainicjować pierwszym elementem, a nie zerem?

**Odpowiedzi:** 1. Nie — tablica nie jest posortowana. 2. Ok. 10. 3. Gdyby wszystkie liczby były ujemne, wynik 0 byłby błędny.$t0$),
  ($t0$alg-zlozonosc$t0$, $t0$**W skrócie:** złożoność obliczeniowa mówi, **jak rośnie czas działania** (lub zużycie pamięci) algorytmu, gdy rośnie ilość danych *n*. Zapisuje się ją notacją **O(…)** („duże O”) — interesuje nas tempo wzrostu, a nie dokładna liczba sekund.

## Najczęstsze klasy złożoności

| Złożoność | Nazwa | Przykład | n = 1000 |
|---|---|---|---|
| **O(1)** | stała | dostęp do elementu tablicy `t[5]` | 1 |
| **O(log n)** | logarytmiczna | wyszukiwanie binarne | ~10 |
| **O(n)** | liniowa | wyszukiwanie liniowe, suma elementów | 1 000 |
| **O(n log n)** | liniowo-logarytmiczna | dobre sortowania (quicksort, przez scalanie) | ~10 000 |
| **O(n²)** | kwadratowa | sortowanie bąbelkowe, dwie zagnieżdżone pętle | 1 000 000 |
| **O(2ⁿ)** | wykładnicza | sprawdzanie wszystkich podzbiorów | astronomicznie dużo |

Im niżej w tabeli, tym szybciej algorytm przestaje być używalny przy dużych danych.

## Jak ją odczytać z kodu

- **Jedna pętla** po n elementach → O(n).
- **Dwie zagnieżdżone pętle** po n → O(n²).
- **Pętle jedna po drugiej** (nie w sobie) → O(n) + O(n) = O(n).
- Pętla, która za każdym razem **dzieli zakres na pół** → O(log n).
- Pomijamy stałe i mniejsze składniki: O(3n + 5) = O(n), O(n² + n) = O(n²).

```js
// O(n²) — czy w tablicy są dwa takie same elementy
for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++)
    if (t[i] === t[j]) return true;
```

## Przypadek pesymistyczny, średni i optymistyczny

Wyszukiwanie liniowe: szukany element jest pierwszy → 1 krok (najlepiej), ostatni lub nieobecny → n kroków (**najgorzej**). Złożoność podaje się zwykle dla przypadku **pesymistycznego**.

## Złożoność pamięciowa

Ile dodatkowej pamięci potrzebuje algorytm. Sortowanie bąbelkowe sortuje „w miejscu” — O(1) dodatkowej pamięci; sortowanie przez scalanie potrzebuje pomocniczej tablicy — O(n).

## Dlaczego to ważne

Dla n = 1 000 000 algorytm O(n²) wykona ok. 10¹² operacji (godziny), a O(n log n) — ok. 2·10⁷ (ułamek sekundy). Lepszy algorytm daje więcej niż szybszy komputer.

## Na egzaminie

- Dwie zagnieżdżone pętle po tej samej tablicy → O(n²).
- Wyszukiwanie binarne → O(log n), liniowe → O(n).
- Stałe pomijamy: O(2n) to O(n).

## Sprawdź się

1. Jaką złożoność ma sortowanie bąbelkowe?
2. Kod ma dwie pętle po n elementach, jedna **po** drugiej. Jaka jest złożoność?
3. Która złożoność rośnie najwolniej: O(n), O(1), O(log n)?

**Odpowiedzi:** 1. O(n²). 2. O(n). 3. O(1).$t0$),
  ($t0$cpp-budowa$t0$, $t0$**W skrócie:** program w C++ to plik `.cpp`, który **kompilator** zamienia na plik wykonywalny (np. `.exe`). Wykonanie zaczyna się zawsze od funkcji **`main`**. Dyrektywy `#include` dołączają biblioteki, np. `iostream` do wypisywania na ekran.

## Najprostszy program

```cpp
#include <iostream>       // biblioteka wejścia/wyjścia (cout, cin)
using namespace std;      // pozwala pisać cout zamiast std::cout

int main() {              // tu zaczyna się program
    cout << "Witaj, świecie!" << endl;
    return 0;             // 0 = program zakończył się poprawnie
}
```

| Element | Znaczenie |
|---|---|
| `#include <…>` | dyrektywa **preprocesora** — wkleja zawartość pliku nagłówkowego biblioteki |
| `using namespace std;` | korzystamy z przestrzeni nazw `std` bez dopisywania `std::` |
| `int main()` | funkcja główna; zwraca liczbę całkowitą do systemu |
| `{ }` | blok kodu |
| `;` | kończy **każdą** instrukcję |
| `//`, `/* */` | komentarze |

## Od kodu do programu

1. **Preprocesor** — wykonuje dyrektywy `#` (np. wkleja `iostream`).
2. **Kompilacja** — tłumaczy kod na kod maszynowy (plik obiektowy).
3. **Linkowanie (konsolidacja)** — łączy go z bibliotekami w gotowy plik wykonywalny.
4. **Uruchomienie** programu.

W praktyce robi to jedno kliknięcie w środowisku (Code::Blocks, Dev-C++, Visual Studio, VS Code) albo polecenie:

```
g++ program.cpp -o program
./program
```

C++ jest językiem **kompilowanym** — w przeciwieństwie do PHP czy JavaScriptu, które są interpretowane w trakcie działania.

## Rodzaje błędów

| Błąd | Kiedy wychodzi | Przykład |
|---|---|---|
| **Składniowy (kompilacji)** | kompilator odmawia | brak średnika, literówka w nazwie |
| **Linkera** | przy łączeniu | wywołana funkcja nie ma definicji |
| **Wykonania** | program się wysypuje | dzielenie przez zero, wyjście poza tablicę |
| **Logiczny** | program działa, ale wynik zły | `<` zamiast `<=` w pętli |

## Na egzaminie

- Program zaczyna się od `main`, a nie od pierwszej linii pliku.
- `#include` to dyrektywa preprocesora, nie instrukcja wykonywana w czasie działania.
- Brak `;` to błąd kompilacji, zły wynik to błąd logiczny.

## Sprawdź się

1. Od jakiej funkcji zaczyna się wykonywanie programu w C++?
2. Co oznacza `return 0;` w funkcji `main`?
3. Program skompilował się, ale wypisuje złą sumę. Jaki to rodzaj błędu?

**Odpowiedzi:** 1. Od `main`. 2. Że program zakończył się poprawnie. 3. Błąd logiczny.$t0$),
  ($t0$cpp-funkcje$t0$, $t0$**W skrócie:** funkcja to nazwany fragment kodu, który przyjmuje **parametry**, wykonuje zadanie i może **zwrócić wynik**. Dzięki funkcjom kod się nie powtarza, a program dzieli się na małe, czytelne części.

## Budowa funkcji

```cpp
//  typ wyniku   nazwa    parametry
    int          kwadrat (int x) {
        return x * x;        // zwraca wynik i kończy funkcję
    }

int main() {
    cout << kwadrat(5);      // wywołanie — 25
}
```

- **Typ zwracany** — `int`, `double`, `bool`, `string`… albo `void`, gdy funkcja nic nie zwraca.
- **Parametry** w definicji, **argumenty** przy wywołaniu.
- Funkcja musi być **zadeklarowana przed użyciem** — albo zdefiniowana wyżej niż `main`, albo z **prototypem**:

```cpp
double srednia(int a, int b);     // prototyp (deklaracja)
int main() { cout << srednia(3, 4); }
double srednia(int a, int b) { return (a + b) / 2.0; }   // definicja
```

## Przekazywanie parametrów

| Sposób | Zapis | Co się dzieje |
|---|---|---|
| **Przez wartość** | `void f(int x)` | funkcja dostaje **kopię** — zmiana nie wpływa na oryginał |
| **Przez referencję** | `void f(int &x)` | funkcja działa **na oryginale** |
| Przez stałą referencję | `void f(const string &s)` | bez kopiowania, ale bez możliwości zmiany |

```cpp
void zamien(int &a, int &b) {     // bez & zamiana nie zadziałałaby
    int tmp = a; a = b; b = tmp;
}
```

## Parametry domyślne

```cpp
double brutto(double netto, double vat = 0.23) { return netto * (1 + vat); }
brutto(100);        // 123
brutto(100, 0.08);  // 108
```

## Przeciążanie funkcji

Kilka funkcji o **tej samej nazwie**, ale różnych parametrach — kompilator wybierze właściwą:

```cpp
int pole(int a)               { return a * a; }        // kwadrat
int pole(int a, int b)        { return a * b; }        // prostokąt
double pole(double r)         { return 3.14159 * r * r; } // koło
```

Funkcje nie mogą różnić się **wyłącznie** typem zwracanym.

## Zasięg zmiennych

Zmienna zadeklarowana w funkcji jest **lokalna** — znika po jej zakończeniu i nie jest widoczna gdzie indziej. Zmiennych globalnych lepiej unikać.

## Rekurencja

Funkcja może wywołać samą siebie — musi mieć **warunek zakończenia**:

```cpp
long long silnia(int n) {
    if (n <= 1) return 1;          // warunek zakończenia
    return n * silnia(n - 1);
}
```

## Na egzaminie

- Przekazanie przez wartość nie zmienia oryginału, przez referencję (`&`) — zmienia.
- `void` = funkcja nic nie zwraca.
- Przeciążanie = ta sama nazwa, inne parametry.

## Sprawdź się

1. Co wypisze program: `void f(int x) { x = 10; }`, a w `main`: `int a = 1; f(a); cout << a;`?
2. Jak zmienić nagłówek, żeby `f` zmieniała `a`?
3. Czy mogą istnieć funkcje `int g(int)` i `double g(int)`?

**Odpowiedzi:** 1. 1 — funkcja zmieniła kopię. 2. `void f(int &x)`. 3. Nie — różnią się tylko typem zwracanym.$t0$),
  ($t0$cpp-obiekty$t0$, $t0$**W skrócie:** **klasa** to szablon opisujący pewien rodzaj rzeczy: jakie ma **dane (pola)** i co potrafi (**metody**). **Obiekt** to konkretny egzemplarz klasy. **Konstruktor** to specjalna metoda, która ustawia obiekt przy jego tworzeniu.

## Klasa i obiekt

```cpp
#include <iostream>
#include <string>
using namespace std;

class Uczen {
private:                       // dostęp tylko wewnątrz klasy
    string imie;
    double srednia;

public:                        // dostęp z zewnątrz
    Uczen(string i, double s) {     // konstruktor
        imie = i;
        srednia = s;
    }

    void przedstaw() {               // metoda
        cout << imie << ", średnia: " << srednia << endl;
    }

    bool maPasek() {
        return srednia >= 4.75;
    }
};

int main() {
    Uczen ola("Ola", 5.1);      // obiekt — wywołuje konstruktor
    Uczen jan("Jan", 3.9);
    ola.przedstaw();             // Ola, średnia: 5.1
    cout << jan.maPasek();       // 0 (false)
}
```

## Pojęcia

| Pojęcie | Znaczenie |
|---|---|
| **Klasa** | projekt (np. „Uczeń”) |
| **Obiekt** | konkretny egzemplarz (Ola, Jan) |
| **Pole** | dana obiektu (`imie`, `srednia`) |
| **Metoda** | funkcja należąca do klasy (`przedstaw()`) |
| **Konstruktor** | metoda o nazwie klasy, bez typu zwracanego, wywoływana przy tworzeniu obiektu |
| **Destruktor** | `~Uczen()` — wywoływany przy usuwaniu obiektu |

## Modyfikatory dostępu i hermetyzacja

- `private` — tylko metody tej klasy (domyślne w `class`),
- `public` — każdy,
- `protected` — ta klasa i klasy po niej dziedziczące.

**Hermetyzacja (enkapsulacja):** pola są `private`, a zmienia się je przez metody, które pilnują poprawności:

```cpp
void ustawSrednia(double s) {
    if (s >= 1 && s <= 6) srednia = s;   // nie dopuszczamy bzdur
}
double getSrednia() { return srednia; }   // getter
```

## Cztery filary programowania obiektowego

1. **Hermetyzacja** — ukrywanie danych za metodami.
2. **Abstrakcja** — pokazujemy, *co* obiekt robi, a nie *jak*.
3. **Dziedziczenie** — klasa pochodna przejmuje pola i metody bazowej: `class Maturzysta : public Uczen { … };`
4. **Polimorfizm** — ta sama metoda działa różnie w różnych klasach (metody wirtualne).

## Lista inicjalizacyjna konstruktora

Krótszy i zalecany zapis tego samego konstruktora:

```cpp
Uczen(string i, double s) : imie(i), srednia(s) {}
```

## Na egzaminie

- Konstruktor ma nazwę klasy i **nie ma typu zwracanego**.
- `private` pola + `public` metody = hermetyzacja.
- Rozróżnij klasę (projekt) i obiekt (egzemplarz).

## Sprawdź się

1. Czym różni się klasa od obiektu?
2. Jak rozpoznać konstruktor w kodzie?
3. Dlaczego pola klasy zwykle są `private`?

**Odpowiedzi:** 1. Klasa to szablon, obiekt — jej konkretny egzemplarz. 2. Ma nazwę klasy i nie ma typu zwracanego. 3. Żeby zmieniać je tylko przez metody, które mogą sprawdzić poprawność (hermetyzacja).$t0$),
  ($t0$cpp-operatory$t0$, $t0$**W skrócie:** operatory to „działania” na wartościach: **arytmetyczne** liczą, **porównania** dają `true`/`false`, a **logiczne** łączą warunki. Największe pułapki to pomylenie `=` z `==` i dzielenie całkowite.

## Arytmetyczne

| Operator | Działanie | Przykład (`int`) |
|---|---|---|
| `+ - *` | dodawanie, odejmowanie, mnożenie | `7 * 2` → 14 |
| `/` | dzielenie — **całkowite** dla `int` | `7 / 2` → 3 |
| `%` | reszta z dzielenia (tylko liczby całkowite) | `7 % 2` → 1 |
| `++`, `--` | zwiększ / zmniejsz o 1 | `i++` |
| `+=`, `-=`, `*=`, `/=` | operacja z przypisaniem | `suma += x` to `suma = suma + x` |

`i++` (postinkrementacja) najpierw zwraca starą wartość, potem zwiększa; `++i` — odwrotnie:

```cpp
int i = 5;
int a = i++;   // a = 5, i = 6
int b = ++i;   // i = 7, b = 7
```

## Porównania

| Operator | Znaczenie |
|---|---|
| `==` | równe |
| `!=` | różne |
| `<  >  <=  >=` | mniejsze, większe… |

**Uwaga:** `=` to **przypisanie**, `==` to **porównanie**. `if (x = 5)` przypisze 5 i zawsze będzie „prawdą” — kompilator to przepuści.

## Logiczne

| Operator | Znaczenie | Przykład |
|---|---|---|
| `&&` | i (oba warunki) | `wiek >= 18 && maDowod` |
| `\|\|` | lub (co najmniej jeden) | `dzien == 6 \|\| dzien == 7` |
| `!` | zaprzeczenie | `!zalogowany` |

**Leniwa ewaluacja:** w `a && b`, gdy `a` jest fałszem, `b` nie jest już sprawdzane — przydatne np. w `n != 0 && suma / n > 3` (nie podzieli przez zero).

## Priorytet (od najwyższego)

1. `!`, `++`, `--`
2. `*`, `/`, `%`
3. `+`, `-`
4. `<`, `>`, `<=`, `>=`
5. `==`, `!=`
6. `&&`
7. `||`
8. `=`, `+=`…

Gdy masz wątpliwość — **dopisz nawiasy**. `2 + 3 * 4` = 14, a `(2 + 3) * 4` = 20.

## Na egzaminie

- `=` vs `==`, `/` całkowite, `%` z liczbami całkowitymi.
- Kolejność działań: mnożenie przed dodawaniem, `&&` przed `||`.
- Różnica `i++` i `++i` w wyrażeniu.

## Sprawdź się

1. Ile wynosi `17 % 5`?
2. Co wypisze `int i = 3; cout << i++ + 1;` i ile wynosi potem `i`?
3. Jak zapisać warunek „x należy do przedziału ⟨1, 10⟩”?

**Odpowiedzi:** 1. 2. 2. Wypisze 4, a `i` wyniesie 4. 3. `x >= 1 && x <= 10`.$t0$),
  ($t0$cpp-petle$t0$, $t0$**W skrócie:** pętla powtarza fragment kodu. **`for`** — gdy znasz liczbę powtórzeń, **`while`** — gdy powtarzasz, dopóki warunek jest prawdziwy, **`do…while`** — gdy kod ma wykonać się co najmniej raz. `break` przerywa pętlę, `continue` przeskakuje do następnego obrotu.

## for

```cpp
for (int i = 1; i <= 5; i++) {
    cout << i << " ";          // 1 2 3 4 5
}
```

Trzy części: **inicjalizacja** (raz na początku) ; **warunek** (przed każdym obrotem) ; **krok** (po każdym obrocie).

## while

```cpp
int liczba;
cin >> liczba;
while (liczba != 0) {          // sprawdza warunek PRZED wykonaniem
    cout << liczba % 10;       // wypisuje cyfry od końca
    liczba /= 10;
}
```

Jeśli warunek jest fałszywy od razu, ciało nie wykona się ani razu.

## do…while

```cpp
int x;
do {
    cout << "Podaj liczbę dodatnią: ";
    cin >> x;
} while (x <= 0);              // warunek PO wykonaniu
```

Idealna do **walidacji danych** — trzeba najpierw zapytać, potem sprawdzić.

## break i continue

```cpp
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) continue;  // pomiń parzyste
    if (i > 7) break;          // przerwij całą pętlę
    cout << i << " ";          // 1 3 5 7
}
```

## Pętle zagnieżdżone

```cpp
for (int w = 1; w <= 3; w++) {
    for (int k = 1; k <= 3; k++)
        cout << w * k << "\t";
    cout << "\n";
}
```

Wypisze tabliczkę mnożenia 3×3. Wewnętrzna pętla wykonuje się w całości przy każdym obrocie zewnętrznej (3 · 3 = 9 razy).

## Typowe błędy

- **Pętla nieskończona**: zapomniany krok (`i++`) albo warunek, który zawsze jest prawdziwy.
- **Błąd o jeden**: `i < n` vs `i <= n` — sprawdź pierwszy i ostatni obrót.
- Średnik po nagłówku: `for (int i = 0; i < 5; i++);` — pusta pętla, blok wykona się raz.

## Na egzaminie

- Ile razy wykona się pętla — policz granice (`for (i = 0; i < 10; i += 2)` → 5 razy).
- `do…while` wykona się co najmniej raz, `while` — może ani razu.
- Działanie `break` i `continue`.

## Sprawdź się

1. Ile razy wykona się `for (int i = 10; i > 0; i -= 3)`?
2. Która pętla zawsze wykona się przynajmniej raz?
3. Co wypisze `for (int i = 0; i < 5; i++) { if (i == 2) continue; cout << i; }`?

**Odpowiedzi:** 1. 4 razy (i = 10, 7, 4, 1). 2. `do…while`. 3. `0134`.$t0$),
  ($t0$cpp-tablice$t0$, $t0$**W skrócie:** tablica przechowuje **wiele wartości tego samego typu** pod jedną nazwą; do elementów sięga się przez **indeks liczony od 0**. Napis w C++ najwygodniej trzymać w typie `string`, który zachowuje się podobnie do tablicy znaków.

## Tablica jednowymiarowa

```cpp
int oceny[5] = {5, 4, 3, 6, 4};   // 5 elementów: indeksy 0…4

cout << oceny[0];   // 5 — pierwszy
cout << oceny[4];   // 4 — ostatni (rozmiar − 1)

int suma = 0;
for (int i = 0; i < 5; i++) suma += oceny[i];
```

- Rozmiar zwykłej tablicy jest **stały**, ustalany przy deklaracji.
- **C++ nie sprawdza zakresu**: `oceny[5]` czyta pamięć poza tablicą — błąd, który nie zawsze widać od razu.
- `int t[100] = {0};` — wszystkie elementy wyzerowane.

## Tablica dwuwymiarowa

```cpp
int m[3][4];                       // 3 wiersze, 4 kolumny

for (int w = 0; w < 3; w++)
    for (int k = 0; k < 4; k++)
        m[w][k] = w * k;

cout << m[2][3];                   // wiersz 2, kolumna 3 → 6
```

Pierwszy indeks to **wiersz**, drugi — **kolumna**. Przydaje się do plansz, tabel, macierzy.

## vector — tablica, która rośnie

```cpp
#include <vector>
vector<int> liczby;
liczby.push_back(7);      // dodaj na koniec
liczby.push_back(3);
cout << liczby.size();    // 2
for (int x : liczby) cout << x << " ";   // pętla zakresowa
```

## Napisy — string

```cpp
#include <string>
string s = "Programowanie";

s.length()           // 13
s[0]                 // 'P' — pojedynczy znak
s + " w C++"         // łączenie napisów
s.substr(0, 7)       // "Program" — od indeksu 0, 7 znaków
s.find("gram")       // 3 — pozycja; string::npos, gdy brak
```

**Odwracanie napisu:**

```cpp
string odwrocony = "";
for (int i = s.length() - 1; i >= 0; i--) odwrocony += s[i];
```

**Palindrom** (czyta się tak samo od tyłu): porównaj `s[i]` z `s[s.length() - 1 - i]` dla pierwszej połowy.

Uwaga: `s.length()` liczy **bajty** — polskie litery w UTF-8 zajmują po 2, więc „żółw” ma długość większą niż 4.

## Na egzaminie

- Indeksy od 0, ostatni element to `rozmiar − 1`.
- `m[w][k]` — najpierw wiersz, potem kolumna.
- Odwracanie napisu i sprawdzanie palindromu to częste zadania.

## Sprawdź się

1. Jaki indeks ma ostatni element tablicy `int t[10]`?
2. Ile elementów ma tablica `int m[4][5]`?
3. Co zwróci `string("informatyka").substr(2, 5)`?

**Odpowiedzi:** 1. 9. 2. 20. 3. "forma".$t0$),
  ($t0$cpp-typy$t0$, $t0$**W skrócie:** w C++ każda zmienna ma **typ** ustalony przy deklaracji — decyduje on, co zmienna przechowuje i ile zajmuje pamięci. Typu nie można potem zmienić (inaczej niż w PHP czy JavaScripcie).

## Podstawowe typy

| Typ | Co przechowuje | Rozmiar (typowo) | Przykład |
|---|---|---|---|
| `int` | liczba całkowita | 4 B (ok. ±2,1 mld) | `int wiek = 17;` |
| `long long` | duża liczba całkowita | 8 B | `long long ludnosc = 8000000000;` |
| `float` | liczba rzeczywista, mniejsza precyzja | 4 B | `float t = 36.6f;` |
| `double` | liczba rzeczywista, większa precyzja | 8 B | `double pi = 3.14159;` |
| `char` | jeden znak | 1 B | `char ocena = 'A';` |
| `bool` | prawda/fałsz | 1 B | `bool zdal = true;` |
| `string` | napis (z `<string>`) | zmienny | `string imie = "Ola";` |

`unsigned int` — tylko nieujemne, za to dwa razy większy zakres dodatni.

## Deklaracja, inicjalizacja, stałe

```cpp
int liczba;            // deklaracja (wartość nieokreślona — nie czytaj jej przed nadaniem!)
int licznik = 0;       // deklaracja z inicjalizacją
const double VAT = 0.23;   // stała — próba zmiany = błąd kompilacji
auto x = 5;            // auto: kompilator sam ustali typ (tu int)
```

Nazwy zmiennych: litery, cyfry i `_`, nie mogą zaczynać się cyfrą; **wielkość liter ma znaczenie** (`suma` ≠ `Suma`).

## Konwersje typów

**Niejawna** (automatyczna):

```cpp
int a = 7, b = 2;
double wynik = a / b;    // 3 !!! — dzielenie dwóch int jest całkowite
int c = 3.99;            // 3 — część ułamkowa obcięta (nie zaokrąglona)
```

**Jawna** (rzutowanie):

```cpp
double wynik = (double)a / b;          // 3.5
double w2 = static_cast<double>(a) / b; // 3.5 — zapis zalecany w C++
```

`char` to w środku liczba (kod ASCII): `char z = 'A'; int kod = z;` → 65.

## Przepełnienie

Gdy wynik nie mieści się w typie, „przekręca się”: `int` powyżej 2 147 483 647 daje wartość ujemną. Do dużych liczb używaj `long long`.

## Na egzaminie

- `7 / 2` w C++ to **3**, a `7.0 / 2` to **3.5** — klasyczna pułapka.
- Przypisanie liczby rzeczywistej do `int` **obcina** część ułamkową.
- `const` — wartość nie może się zmienić.

## Sprawdź się

1. Jaki wynik da `int x = 9 / 4;`?
2. Jak poprawić `double s = suma / n;`, gdy `suma` i `n` są typu `int`?
3. Jaki typ wybierzesz na liczbę mieszkańców Ziemi?

**Odpowiedzi:** 1. 2. 2. Rzutować: `double s = (double)suma / n;` 3. `long long` (nie mieści się w `int`).$t0$),
  ($t0$cpp-warunki$t0$, $t0$**W skrócie:** instrukcje warunkowe wybierają, który fragment kodu się wykona. `if` / `else if` / `else` sprawdza dowolne warunki, a `switch` wygodnie wybiera spośród **konkretnych wartości** jednej zmiennej.

## if, else if, else

```cpp
int punkty;
cin >> punkty;

if (punkty >= 90) {
    cout << "celujący";
} else if (punkty >= 75) {
    cout << "bardzo dobry";
} else if (punkty >= 50) {
    cout << "dostateczny";
} else {
    cout << "niedostateczny";
}
```

- Warunki sprawdzane są **od góry**; wykona się **pierwszy** spełniony, reszta jest pomijana. Dlatego kolejność progów ma znaczenie.
- `else` jest opcjonalny.
- Przy jednej instrukcji klamry można pominąć, ale lepiej ich nie pomijać — łatwo o błąd przy dopisywaniu kolejnej linii.

## Operator warunkowy (trójargumentowy)

```cpp
string wynik = (punkty >= 50) ? "zdał" : "nie zdał";
```

`warunek ? wartość_gdy_prawda : wartość_gdy_fałsz` — skrót prostego `if/else`.

## switch

```cpp
int dzien;
cin >> dzien;
switch (dzien) {
    case 1: cout << "poniedziałek"; break;
    case 2: cout << "wtorek"; break;
    case 6:
    case 7: cout << "weekend"; break;   // dwa przypadki, jedna akcja
    default: cout << "inny dzień";
}
```

- Działa dla typów całkowitych i `char` (nie dla `string` ani `double`).
- **`break` jest konieczny** — bez niego wykonanie „przelatuje” do kolejnych `case` (*fall-through*).
- `default` — gdy żaden `case` nie pasuje.

## Typowe błędy

```cpp
if (x = 5)      // BŁĄD: przypisanie zamiast porównania
if (x == 5);    // BŁĄD: średnik kończy if — blok poniżej wykona się zawsze
if (1 < x < 10) // BŁĄD: tak się nie sprawdza przedziału → (x > 1 && x < 10)
```

## Na egzaminie

- Kolejność `else if` — pierwszy pasujący wygrywa.
- Brak `break` w `switch` = przejście do następnego przypadku.
- Przedział zapisuje się dwoma warunkami połączonymi `&&`.

## Sprawdź się

1. Co wypisze `switch` dla `dzien = 6`, jeśli przy `case 6:` zapomnisz `break`, a `case 7:` wypisuje „niedziela”?
2. Popraw warunek `if (0 < x < 100)`.
3. Zapisz krócej: `if (a > b) m = a; else m = b;`

**Odpowiedzi:** 1. Wypisze tekst z `case 6` i dalej „niedziela” (przelatuje). 2. `if (x > 0 && x < 100)`. 3. `m = (a > b) ? a : b;`$t0$),
  ($t0$cpp-wejscie$t0$, $t0$**W skrócie:** w C++ dane czyta się ze **strumienia** `cin` (klawiatura), a wypisuje do `cout` (ekran). Operator `>>` „wyciąga” dane ze strumienia do zmiennej, a `<<` „wkłada” dane do strumienia.

## Podstawy

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    int wiek;
    string imie;

    cout << "Podaj imię i wiek: ";
    cin >> imie >> wiek;           // wczyta dwa słowa oddzielone spacją/Enterem

    cout << "Cześć, " << imie << "! Za rok masz " << wiek + 1 << " lat." << endl;
    return 0;
}
```

| Element | Znaczenie |
|---|---|
| `cout << x` | wypisz x |
| `cin >> x` | wczytaj do x (typ zgodny z typem zmiennej) |
| `endl` | nowa linia i opróżnienie bufora; `"\n"` — sama nowa linia (szybsze) |
| `cerr` | strumień błędów |

## Napisy ze spacjami — `getline`

`cin >> imie` czyta **tylko do pierwszej spacji**. Całą linię wczytasz tak:

```cpp
string zdanie;
getline(cin, zdanie);
```

Pułapka: po `cin >> liczba;` w strumieniu zostaje znak Enter, więc następne `getline` dostanie pustą linię. Rozwiązanie: `cin.ignore();` przed `getline`.

## Formatowanie liczb (`<iomanip>`)

```cpp
#include <iomanip>
double srednia = 4.56789;
cout << fixed << setprecision(2) << srednia;   // 4.57
cout << setw(6) << 42;                          // "    42" — szerokość 6 znaków
```

## Złe dane

Jeśli użytkownik wpisze „abc” do zmiennej `int`, `cin` wejdzie w stan błędu (`cin.fail()` zwróci `true`), a zmienna nie dostanie poprawnej wartości. W poważniejszych programach trzeba to sprawdzić.

## Pliki — `<fstream>`

Działa tak samo jak `cin`/`cout`:

```cpp
#include <fstream>
ifstream wej("dane.txt");    // odczyt
ofstream wyj("wynik.txt");   // zapis
int x;
while (wej >> x) wyj << x * 2 << "\n";
```

## Na egzaminie

- `<<` z `cout`, `>>` z `cin` — kierunek strzałek pokazuje kierunek danych.
- `cin >>` kończy na spacji, `getline` czyta całą linię.
- Zaokrąglenie wyniku do 2 miejsc: `fixed << setprecision(2)`.

## Sprawdź się

1. Co wczyta `cin >> s` (typ `string`), gdy wpiszesz „Jan Kowalski”?
2. Jak wypisać liczbę `3.14159` z dwoma miejscami po przecinku?
3. Jakiej biblioteki potrzeba do zapisu do pliku?

**Odpowiedzi:** 1. Tylko „Jan”. 2. `cout << fixed << setprecision(2) << 3.14159;` (z `<iomanip>`). 3. `<fstream>` (`ofstream`).$t0$),
  ($t0$cpp-wskazniki$t0$, $t0$**W skrócie:** **wskaźnik** to zmienna, która przechowuje **adres** innej zmiennej w pamięci. **Referencja** to druga nazwa (alias) dla istniejącej zmiennej. Oba pozwalają funkcji działać na oryginale, bez kopiowania danych.

## Adres i wskaźnik

```cpp
int x = 42;
int *p = &x;      // p przechowuje ADRES x  (& = „adres zmiennej”)

cout << p;        // np. 0x7ffd5c3a — adres w pamięci
cout << *p;       // 42 — wartość spod adresu (* = „wyłuskanie”)

*p = 100;         // zmieniamy x przez wskaźnik
cout << x;        // 100
```

| Zapis | Znaczenie |
|---|---|
| `int *p;` | deklaracja wskaźnika na `int` |
| `&x` | adres zmiennej x |
| `*p` | wartość, na którą wskazuje p |
| `nullptr` | wskaźnik „na nic” — przed użyciem trzeba to sprawdzić |

Gwiazdka ma dwa znaczenia: w **deklaracji** (`int *p`) tworzy wskaźnik, w **wyrażeniu** (`*p`) sięga po wartość.

## Referencja

```cpp
int a = 5;
int &r = a;       // r to inna nazwa a — musi być od razu zainicjalizowana
r = 8;
cout << a;        // 8
```

Referencji nie da się później „przepiąć” na inną zmienną i nie może być pusta.

## Referencja a wskaźnik

| | Wskaźnik | Referencja |
|---|---|---|
| Może być pusty | tak (`nullptr`) | nie |
| Można zmienić, na co wskazuje | tak | nie |
| Składnia użycia | `*p`, `p->pole` | jak zwykła zmienna |
| Typowe użycie | dynamiczna pamięć, struktury danych, tablice | parametry funkcji |

## Typowe zastosowania

**1. Funkcja zmieniająca argument:**

```cpp
void podwoj(int &x)  { x *= 2; }   // przez referencję
void podwoj2(int *x) { *x *= 2; }  // przez wskaźnik — wywołanie: podwoj2(&a);
```

**2. Tablice:** nazwa tablicy to adres jej pierwszego elementu, więc `t[i]` to to samo co `*(t + i)`.

**3. Pamięć dynamiczna** — rozmiar znany dopiero w czasie działania:

```cpp
int n; cin >> n;
int *tab = new int[n];   // przydział pamięci
// ... praca na tab[i] ...
delete[] tab;            // zwolnienie — inaczej wyciek pamięci
```

W nowoczesnym C++ zamiast `new`/`delete` zwykle używa się `vector` albo inteligentnych wskaźników.

## Na egzaminie

- `&` przy zmiennej = adres, `*` przy wskaźniku = wartość spod adresu.
- Parametr `int &x` pozwala funkcji zmienić oryginał.
- Każde `new` wymaga `delete` (dla tablic `delete[]`).

## Sprawdź się

1. Co wypisze: `int a = 3; int *p = &a; *p = *p + 4; cout << a;`?
2. Czy referencja może istnieć bez przypisanej zmiennej?
3. Co oznacza `p->nazwa`?

**Odpowiedzi:** 1. 7. 2. Nie — musi być zainicjalizowana przy deklaracji. 3. Dostęp do pola `nazwa` obiektu, na który wskazuje `p` (to samo co `(*p).nazwa`).$t0$),
  ($t0$php-formularze$t0$, $t0$**W skrócie:** formularz HTML wysyła dane do skryptu PHP metodą **GET** (dane w adresie) albo **POST** (dane w treści żądania). W PHP odbierasz je z tablic **`$_GET`** i **`$_POST`** — kluczem jest atrybut **`name`** pola formularza.

## Formularz i skrypt

```html
<form action="wynik.php" method="post">
  <label for="imie">Imię</label>
  <input type="text" id="imie" name="imie">
  <label for="wiek">Wiek</label>
  <input type="number" id="wiek" name="wiek">
  <button type="submit">Wyślij</button>
</form>
```

```php
<?php
// wynik.php
if (isset($_POST["imie"], $_POST["wiek"])) {
    $imie = trim($_POST["imie"]);
    $wiek = (int) $_POST["wiek"];

    if ($imie === "" || $wiek <= 0) {
        echo "Uzupełnij poprawnie formularz.";
    } else {
        echo "Witaj, " . htmlspecialchars($imie) . "! Masz $wiek lat.";
    }
}
?>
```

Bez atrybutu `name` pole **w ogóle nie zostanie wysłane**.

## GET a POST

| | GET | POST |
|---|---|---|
| Gdzie są dane | w adresie: `wynik.php?imie=Ola&wiek=17` | w treści żądania, niewidoczne w adresie |
| Tablica w PHP | `$_GET` | `$_POST` |
| Rozmiar | ograniczony długością adresu | duży (np. przesyłanie plików) |
| Zakładki, historia | adres z danymi da się zapisać | nie |
| Kiedy | wyszukiwarka, filtry, numer strony | logowanie, rejestracja, zapis do bazy |

Haseł **nigdy** nie wysyłaj metodą GET — trafią do historii przeglądarki i logów serwera.

## Formularz i obsługa w jednym pliku

```php
<form method="post">              <!-- brak action = wysyła do tego samego pliku -->
  <input name="liczba" type="number">
  <button>Policz kwadrat</button>
</form>
<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $x = (int) $_POST["liczba"];
    echo "Kwadrat: " . $x * $x;
}
?>
```

## Bezpieczeństwo — nigdy nie ufaj danym z formularza

1. **Sprawdź, czy dane przyszły**: `isset()`, `empty()`.
2. **Waliduj**: typ, zakres, format (`filter_var($email, FILTER_VALIDATE_EMAIL)`).
3. **Wypisując dane na stronie, używaj `htmlspecialchars()`** — inaczej ktoś wpisze `<script>` i zrobi atak **XSS**.
4. **Zapisując do bazy, używaj zapytań przygotowanych** — chroni przed **SQL injection** (zob. temat mysqli).
5. Walidacja w HTML (`required`) czy JavaScripcie to wygoda dla użytkownika, ale **nie zabezpieczenie** — łatwo ją obejść.

## Na egzaminie

- Klucz w `$_POST` = wartość atrybutu `name`, nie `id`.
- `method="post"` → `$_POST`, `method="get"` → `$_GET`.
- `isset` przed odczytem, `htmlspecialchars` przed wypisaniem.

## Sprawdź się

1. Pole ma `id="mail"` i `name="email"`. Jak odczytasz je w PHP przy metodzie POST?
2. Którą metodę wybierzesz do formularza logowania i dlaczego?
3. Po co wypisywać dane z formularza przez `htmlspecialchars()`?

**Odpowiedzi:** 1. `$_POST["email"]`. 2. POST — hasło nie pojawi się w adresie, historii ani logach. 3. Żeby wpisany kod HTML/JavaScript wyświetlił się jako tekst, a nie wykonał (ochrona przed XSS).$t0$),
  ($t0$php-funkcje-tablice$t0$, $t0$**W skrócie:** tablice w PHP są elastyczne: **indeksowane** (klucze 0, 1, 2…) albo **asocjacyjne** (klucze tekstowe, np. `"imie"`). Wynik zapytania do bazy to właśnie tablica asocjacyjna, więc to podstawa pracy z MySQL. Własne funkcje definiuje się słowem `function`.

## Tablica indeksowana

```php
$owoce = ["jabłko", "gruszka", "śliwka"];
echo $owoce[0];            // jabłko
$owoce[] = "wiśnia";       // dopisanie na koniec
echo count($owoce);        // 4

foreach ($owoce as $owoc) {
    echo "<li>$owoc</li>";
}
```

## Tablica asocjacyjna

```php
$uczen = ["imie" => "Ola", "klasa" => "2a", "srednia" => 4.8];
echo $uczen["imie"];       // Ola

foreach ($uczen as $klucz => $wartosc) {
    echo "$klucz: $wartosc<br>";
}
```

**Tablica tablic** — jak wiersze z bazy:

```php
$uczniowie = [
    ["imie" => "Ola", "srednia" => 4.8],
    ["imie" => "Jan", "srednia" => 3.9],
];
foreach ($uczniowie as $u) echo $u["imie"] . " — " . $u["srednia"] . "<br>";
```

## Przydatne funkcje tablicowe

| Funkcja | Działanie |
|---|---|
| `count($t)` | liczba elementów |
| `sort($t)` / `rsort($t)` | sortowanie wartości rosnąco / malejąco |
| `asort($t)` / `ksort($t)` | sortowanie asocjacyjnej wg wartości / kluczy (z zachowaniem kluczy) |
| `in_array($x, $t)` | czy wartość jest w tablicy |
| `array_sum($t)` | suma elementów |
| `implode(", ", $t)` | tablica → napis |
| `explode(",", $s)` | napis → tablica |
| `print_r($t)`, `var_dump($t)` | podgląd zawartości (do szukania błędów) |

## Funkcje

```php
function brutto(float $netto, float $vat = 0.23): float {
    return round($netto * (1 + $vat), 2);
}

echo brutto(100);          // 123
echo brutto(100, 0.08);    // 108
```

- Parametry mogą mieć **wartości domyślne** i **typy** (`float`, `string`, `array`…).
- Zmienne z zewnątrz **nie są widoczne** w funkcji — przekaż je jako parametry.
- `&$x` w parametrze — przekazanie przez referencję (funkcja zmienia oryginał).

## Funkcje wbudowane, które warto znać

`strlen`, `strtoupper`, `strtolower`, `trim`, `str_replace`, `substr`, `round`, `rand`, `date("Y-m-d")`, `number_format`, `isset`, `empty`.

## Na egzaminie

- `foreach ($tablica as $klucz => $wartosc)` — przegląd tablicy asocjacyjnej.
- `count()` zamiast ręcznego liczenia.
- Wiersz z `mysqli_fetch_assoc` to tablica asocjacyjna: `$wiersz["nazwa_kolumny"]`.

## Sprawdź się

1. Jak dopisać element na koniec tablicy `$t`?
2. Co wypisze `echo implode("-", [1, 2, 3]);`?
3. Jak odczytać kolumnę `nazwisko` z wiersza `$w` pobranego z bazy?

**Odpowiedzi:** 1. `$t[] = wartość;` 2. `1-2-3`. 3. `$w["nazwisko"]`.$t0$),
  ($t0$php-mysqli$t0$, $t0$**W skrócie:** praca z bazą z poziomu PHP to zawsze te same kroki: **połącz się → wyślij zapytanie → odczytaj wynik → zamknij połączenie**. W zadaniach egzaminacyjnych używa się rozszerzenia **mysqli**.

## Schemat (styl proceduralny)

```php
<?php
$polaczenie = mysqli_connect("localhost", "root", "", "szkola");
if (!$polaczenie) {
    die("Błąd połączenia z bazą");
}
mysqli_set_charset($polaczenie, "utf8mb4");   // polskie znaki

$wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko, srednia FROM uczniowie ORDER BY nazwisko");

while ($wiersz = mysqli_fetch_assoc($wynik)) {
    echo "<tr><td>" . $wiersz["imie"] . "</td><td>" . $wiersz["nazwisko"] . "</td><td>" . $wiersz["srednia"] . "</td></tr>";
}

mysqli_close($polaczenie);
?>
```

| Funkcja | Działanie |
|---|---|
| `mysqli_connect(host, użytkownik, hasło, baza)` | połączenie; w XAMPP domyślnie `localhost`, `root`, puste hasło |
| `mysqli_query($p, $sql)` | wykonanie zapytania; dla SELECT zwraca wynik, dla INSERT/UPDATE/DELETE — `true`/`false` |
| `mysqli_fetch_assoc($w)` | kolejny wiersz jako tablica asocjacyjna; `null`, gdy wierszy już nie ma |
| `mysqli_fetch_row($w)` | wiersz jako tablica indeksowana (`$wiersz[0]`) |
| `mysqli_num_rows($w)` | liczba wierszy wyniku |
| `mysqli_affected_rows($p)` | ile wierszy zmienił INSERT/UPDATE/DELETE |
| `mysqli_insert_id($p)` | identyfikator ostatnio dodanego wiersza (AUTO_INCREMENT) |
| `mysqli_close($p)` | zamknięcie połączenia |

## Zapis danych z formularza — bezpiecznie

**Źle** (SQL injection — dane wklejone wprost do zapytania):

```php
$sql = "SELECT * FROM uzytkownicy WHERE login = '" . $_POST["login"] . "'";
```

Wpisanie w polu `' OR '1'='1` zmienia sens zapytania.

**Dobrze — zapytanie przygotowane:**

```php
$zap = mysqli_prepare($polaczenie, "INSERT INTO uczniowie (imie, nazwisko, srednia) VALUES (?, ?, ?)");
mysqli_stmt_bind_param($zap, "ssd", $imie, $nazwisko, $srednia);   // s = string, i = int, d = double
mysqli_stmt_execute($zap);
```

Znaki `?` to miejsca na dane — baza traktuje je zawsze jako **wartości**, nigdy jako część polecenia SQL.

## Styl obiektowy (to samo)

```php
$db = new mysqli("localhost", "root", "", "szkola");
$wynik = $db->query("SELECT * FROM uczniowie");
while ($w = $wynik->fetch_assoc()) { /* ... */ }
$db->close();
```

## Typowe błędy

- Zła nazwa bazy lub tabeli → `mysqli_query` zwraca `false`, a `fetch_assoc` sypie ostrzeżeniem.
- Brak `mysqli_set_charset` → „krzaczki” zamiast polskich liter.
- Pomylone nazwy kolumn w `$wiersz["…"]` — muszą być identyczne jak w zapytaniu (albo jak alias z `AS`).

## Na egzaminie

- Kolejność: `mysqli_connect` → `mysqli_query` → `mysqli_fetch_assoc` w pętli `while` → `mysqli_close`.
- W zadaniach praktycznych wynik zapytania zwykle trafia do tabeli `<table>` albo listy.
- Zapytania przygotowane chronią przed SQL injection.

## Sprawdź się

1. Jaka pętla służy do odczytania wszystkich wierszy wyniku?
2. Co zwraca `mysqli_fetch_assoc`, gdy wierszy już nie ma?
3. Jak w `mysqli_stmt_bind_param` oznacza się parametr typu liczba całkowita?

**Odpowiedzi:** 1. `while ($w = mysqli_fetch_assoc($wynik)) { … }`. 2. `null` (pętla się kończy). 3. Literą `i`.$t0$),
  ($t0$php-pliki$t0$, $t0$**W skrócie:** PHP potrafi **czytać i zapisywać pliki na serwerze** (np. licznik odwiedzin, prosty dziennik) oraz **przyjmować pliki wysłane formularzem** (np. zdjęcie profilowe). Przy przesyłaniu plików najważniejsze jest bezpieczeństwo — nie wolno ufać nazwie ani typowi pliku od użytkownika.

## Odczyt i zapis — najprostszy sposób

```php
<?php
// zapis (nadpisuje plik)
file_put_contents("notatka.txt", "Pierwsza linia\n");
// dopisanie na koniec
file_put_contents("notatka.txt", "Kolejna linia\n", FILE_APPEND);

// odczyt całego pliku jako napis
$tresc = file_get_contents("notatka.txt");
// odczyt jako tablica linii
$linie = file("notatka.txt", FILE_IGNORE_NEW_LINES);
foreach ($linie as $linia) echo htmlspecialchars($linia) . "<br>";
?>
```

**Licznik odwiedzin:**

```php
$plik = "licznik.txt";
$ile = file_exists($plik) ? (int) file_get_contents($plik) : 0;
$ile++;
file_put_contents($plik, $ile);
echo "Odwiedzin: $ile";
```

## Odczyt linia po linii — fopen

```php
$f = fopen("dane.csv", "r");       // tryby: r — odczyt, w — zapis (czyści plik), a — dopisywanie
while (($linia = fgets($f)) !== false) {
    $pola = explode(";", trim($linia));
    echo $pola[0] . "<br>";
}
fclose($f);
```

## Przesyłanie pliku na serwer

**Formularz** — potrzebny `enctype="multipart/form-data"` i metoda POST:

```html
<form action="upload.php" method="post" enctype="multipart/form-data">
  <input type="file" name="zdjecie" accept="image/jpeg,image/png">
  <button>Wyślij</button>
</form>
```

**Skrypt:**

```php
<?php
if (isset($_FILES["zdjecie"]) && $_FILES["zdjecie"]["error"] === UPLOAD_ERR_OK) {
    $plik = $_FILES["zdjecie"];

    if ($plik["size"] > 2 * 1024 * 1024) die("Plik większy niż 2 MB.");

    // typ sprawdzamy na podstawie ZAWARTOŚCI, nie nazwy podanej przez użytkownika
    $typ = mime_content_type($plik["tmp_name"]);
    $rozszerzenia = ["image/jpeg" => "jpg", "image/png" => "png"];
    if (!isset($rozszerzenia[$typ])) die("Dozwolone są tylko JPG i PNG.");

    // własna, bezpieczna nazwa zamiast tej od użytkownika
    $nazwa = uniqid("img_") . "." . $rozszerzenia[$typ];
    move_uploaded_file($plik["tmp_name"], "uploads/" . $nazwa);
    echo "Zapisano.";
}
?>
```

| Element `$_FILES["pole"]` | Znaczenie |
|---|---|
| `name` | oryginalna nazwa (od użytkownika — nie ufaj jej) |
| `tmp_name` | tymczasowa ścieżka na serwerze |
| `size` | rozmiar w bajtach |
| `error` | kod błędu, `UPLOAD_ERR_OK` (0) = w porządku |

## Zasady bezpieczeństwa

1. Ogranicz **rozmiar** i **typy** plików; typ sprawdzaj po zawartości.
2. **Nadawaj własną nazwę** — oryginalna może zawierać `../` albo rozszerzenie `.php`.
3. Nigdy nie pozwól wgrać pliku `.php`, który potem da się uruchomić w katalogu `uploads`.
4. Limity serwera ustawia `php.ini`: `upload_max_filesize`, `post_max_size`.

## Na egzaminie

- `enctype="multipart/form-data"` — bez tego plik nie zostanie wysłany.
- `move_uploaded_file()` przenosi plik z katalogu tymczasowego.
- `file_put_contents` z `FILE_APPEND` dopisuje zamiast nadpisywać.

## Sprawdź się

1. Jakiego atrybutu formularza potrzeba do wysłania pliku?
2. Czym różni się tryb `"w"` od `"a"` w `fopen`?
3. Dlaczego nie zapisuje się pliku pod nazwą z `$_FILES["zdjecie"]["name"]`?

**Odpowiedzi:** 1. `enctype="multipart/form-data"` (i `method="post"`). 2. `w` czyści plik i pisze od nowa, `a` dopisuje na końcu. 3. Nazwa pochodzi od użytkownika — może zawierać niebezpieczne znaki, ścieżkę albo rozszerzenie `.php`.$t0$),
  ($t0$php-sesje$t0$, $t0$**W skrócie:** HTTP „nie pamięta” poprzednich żądań. Żeby strona wiedziała, że to ten sam użytkownik, używa się **ciasteczek** (dane zapisane w przeglądarce) albo **sesji** (dane na serwerze, a w przeglądarce tylko identyfikator sesji).

## Ciasteczka (cookies)

```php
<?php
// ustawienie — MUSI być przed jakimkolwiek wypisaniem treści (przed HTML i echo)
setcookie("motyw", "ciemny", time() + 30 * 24 * 3600);   // ważne 30 dni

// odczyt — dostępny dopiero przy NASTĘPNYM wczytaniu strony
if (isset($_COOKIE["motyw"])) {
    echo "Twój motyw: " . htmlspecialchars($_COOKIE["motyw"]);
}

// usunięcie — data ważności w przeszłości
setcookie("motyw", "", time() - 3600);
?>
```

Ciasteczko leży **u użytkownika** — może je podejrzeć i zmienić. Nie trzymaj w nim haseł ani uprawnień.

## Sesje

```php
<?php
session_start();                       // na początku KAŻDEGO pliku, który używa sesji

$_SESSION["login"] = "ola";           // zapis
echo $_SESSION["login"];               // odczyt na dowolnej podstronie

unset($_SESSION["login"]);             // usunięcie jednej zmiennej
session_destroy();                     // zakończenie całej sesji (wylogowanie)
?>
```

Dane sesji są **na serwerze**; przeglądarka dostaje tylko ciasteczko z identyfikatorem (domyślnie `PHPSESSID`).

## Porównanie

| | Ciasteczko | Sesja |
|---|---|---|
| Gdzie są dane | w przeglądarce | na serwerze |
| Czy użytkownik może je zmienić | tak | nie (ma tylko identyfikator) |
| Jak długo | do daty ważności | zwykle do zamknięcia przeglądarki lub wygaśnięcia |
| Typowe użycie | preferencje, „zapamiętaj mnie”, zgoda na cookies | logowanie, koszyk, uprawnienia |

## Logowanie — schemat

```php
<?php
session_start();
// ... po sprawdzeniu loginu i hasła w bazie:
if (password_verify($_POST["haslo"], $hashZBazy)) {
    session_regenerate_id(true);       // nowy identyfikator po zalogowaniu
    $_SESSION["uzytkownik"] = $login;
}

// na stronie tylko dla zalogowanych:
if (!isset($_SESSION["uzytkownik"])) {
    header("Location: logowanie.php");
    exit;
}
?>
```

Hasła w bazie przechowuje się jako skrót: `password_hash($haslo, PASSWORD_DEFAULT)`, a sprawdza `password_verify`.

## Na egzaminie

- `session_start()` przed użyciem `$_SESSION`, `setcookie()` przed wysłaniem treści.
- Ciasteczko ustawione teraz widać w `$_COOKIE` dopiero przy kolejnym żądaniu.
- Sesja = dane na serwerze, ciasteczko = dane w przeglądarce.

## Sprawdź się

1. Gdzie są przechowywane dane zapisane w `$_SESSION`?
2. Jak usunąć ciasteczko?
3. Dlaczego nie warto zapisywać w ciasteczku informacji „admin = 1”?

**Odpowiedzi:** 1. Na serwerze (przeglądarka ma tylko identyfikator sesji). 2. Ustawić je ponownie z datą ważności w przeszłości. 3. Użytkownik może samodzielnie zmienić wartość ciasteczka i nadać sobie uprawnienia.$t0$),
  ($t0$php-skladnia$t0$, $t0$**W skrócie:** PHP działa **na serwerze**: wykonuje kod, a do przeglądarki wysyła gotowy HTML. Uczeń nigdy nie zobaczy kodu PHP w „Pokaż źródło”. Zmienne zaczynają się od `$`, a typ ustala się sam, na podstawie przypisanej wartości.

## Jak to działa

1. Przeglądarka prosi o `index.php`.
2. Serwer (Apache z PHP, np. w XAMPP) **wykonuje** kod PHP.
3. Do przeglądarki trafia wynik — zwykły HTML.

Dlatego plik musi być na serwerze (`htdocs`) i otwierany przez `http://localhost/...`, a nie dwuklikiem z dysku.

## Podstawy składni

```php
<?php
// komentarz jednoliniowy
$imie = "Ola";            // napis
$wiek = 17;               // liczba całkowita
$srednia = 4.75;          // liczba zmiennoprzecinkowa
$zdala = true;            // logiczna

echo "Cześć, $imie!";              // w "" zmienne są podstawiane
echo 'Cześć, $imie!';              // w '' NIE — wypisze dosłownie $imie
echo "Masz " . $wiek . " lat";     // kropka łączy napisy
?>
```

PHP można przeplatać z HTML-em:

```php
<h1>Witaj, <?php echo $imie; ?></h1>
<p>Rok: <?= date("Y") ?></p>     <!-- <?= to skrót od <?php echo -->
```

## Typy i porównania

Typy: `int`, `float`, `string`, `bool`, `array`, `null`. Sprawdzisz je funkcją `var_dump($x)`.

| Operator | Znaczenie | Przykład |
|---|---|---|
| `==` | równe po konwersji typów | `"5" == 5` → true |
| `===` | równe **i tego samego typu** | `"5" === 5` → false |
| `!=`, `!==` | różne | |
| `.` | łączenie napisów | `"a" . "b"` → "ab" |
| `.=` | doklejenie | `$s .= "x";` |

Zalecane jest `===` — mniej niespodzianek.

## Instrukcje sterujące

```php
if ($srednia >= 4.75) {
    echo "Świadectwo z paskiem";
} elseif ($srednia >= 2) {
    echo "Promocja";
} else {
    echo "Brak promocji";
}

for ($i = 1; $i <= 5; $i++) echo $i;      // 12345

$i = 0;
while ($i < 3) { echo $i; $i++; }          // 012

switch ($dzien) {
    case 6: case 7: echo "weekend"; break;
    default: echo "dzień roboczy";
}
```

## Na egzaminie

- `"…$zmienna…"` podstawia wartość, `'…$zmienna…'` — nie.
- Łączenie napisów kropką (`.`), nie plusem.
- `elseif` w PHP piszesz łącznie (dopuszczalne też `else if`).
- Brak średnika na końcu linii = błąd składni (Parse error).

## Sprawdź się

1. Co wypisze `$x = 3; echo 'x = $x';`?
2. Jaki jest wynik `"10" === 10`?
3. Dlaczego plik `.php` otwarty dwuklikiem z dysku pokazuje kod zamiast wyniku?

**Odpowiedzi:** 1. `x = $x` (apostrofy nie podstawiają zmiennych). 2. `false` (różne typy). 3. Bo nikt go nie wykonał — PHP działa tylko przez serwer (np. `http://localhost/...`).$t0$)
) as n(id, tresc)
join subtopics s on s.id = n.id
on conflict (subtopic_id) do nothing;
