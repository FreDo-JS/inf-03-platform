**W skrócie:** materiał nagrany telefonem prawie nigdy nie nadaje się wprost na stronę. Trzeba go **przyciąć**, często **zmniejszyć rozdzielczość**, wyrównać głośność i **wyeksportować** w formacie i jakości dobranej do internetu.

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

**Odpowiedzi:** 1. Wyrównuje głośność do ustalonego poziomu. 2. I tak będzie wyciszony, a bez audio plik jest mniejszy. 3. Zgoda na wykorzystanie wizerunku (u niepełnoletnich — rodziców).
