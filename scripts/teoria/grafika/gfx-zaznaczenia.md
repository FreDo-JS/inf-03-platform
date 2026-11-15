**W skrócie:** **zaznaczenie** ogranicza działanie narzędzi do wybranego obszaru — wszystko poza nim jest chronione. **Maska warstwy** ukrywa części warstwy bez ich kasowania: czarne = niewidoczne, białe = widoczne. Maskę zawsze można poprawić, a wymazanych pikseli już nie odzyskasz.

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

**Odpowiedzi:** 1. Zaznaczenie → Odwróć (Ctrl+I). 2. Ten fragment warstwy jest niewidoczny. 3. Żeby krawędź była naturalna, bez ostrych schodków.
