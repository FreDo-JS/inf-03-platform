**W skrócie:** format pliku decyduje o **jakości, rozmiarze i możliwościach** grafiki: czy ma przezroczystość, czy może być animowana, czy kompresja coś traci. Na stronę wybiera się zwykle **JPG/WebP do zdjęć**, **PNG do grafik z przezroczystością** i **SVG do logo i ikon**.

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

**Odpowiedzi:** 1. XCF. 2. JPG nie obsługuje przezroczystości, a kompresja stratna rozmywa krawędzie napisów. 3. 256.
