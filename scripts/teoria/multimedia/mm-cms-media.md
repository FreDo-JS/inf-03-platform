**W skrócie:** w CMS-ie (np. WordPressie) pliki trafiają do **biblioteki mediów**, skąd wstawia się je do wpisów i stron. Duże filmy zwykle **nie** wgrywa się na własny serwer — osadza się je z YouTube czy Vimeo, wklejając link.

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

**Odpowiedzi:** 1. Media → Dodaj nowy (biblioteka mediów). 2. Zajmuje dużo miejsca i obciąża serwer; serwis wideo zrobi to lepiej. 3. Dla dostępności (czytniki ekranu), SEO i gdy obraz się nie wczyta.
