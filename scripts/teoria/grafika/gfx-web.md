**W skrócie:** grafika na stronę ma być **możliwie lekka przy dobrej jakości**. Zdjęcie prosto z aparatu waży kilka MB i ma 6000 px szerokości — na stronie wystarczy zwykle 1200–2000 px i 100–300 KB. Ciężkie obrazki to najczęstsza przyczyna wolnych stron.

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

**Odpowiedzi:** 1. Przeskaluję do ok. 900–1800 px szerokości z zachowaniem proporcji i wyeksportuję jako JPG/WebP z jakością ok. 80%. 2. Ok. 75–85%. 3. Żeby przeglądarka zarezerwowała miejsce i układ strony nie przeskakiwał podczas ładowania.
