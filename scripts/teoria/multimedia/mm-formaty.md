**W skrócie:** dźwięk i wideo na stronie muszą być **małe** (szybkie ładowanie) i w formacie, który **odtworzy każda przeglądarka**. Zmniejsza je **kompresja** — stratna (wyrzuca część informacji) albo bezstratna (nic nie traci, ale zmniejsza mniej).

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

**Odpowiedzi:** 1. FLAC. 2. Ok. 1 MB. 3. Format „opakowania” łączący ścieżki obrazu i dźwięku zakodowane kodekami (np. MP4, WebM).
