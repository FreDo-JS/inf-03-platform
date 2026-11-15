**W skrócie:** **kanał alfa** to dodatkowa informacja przy każdym pikselu mówiąca, **jak bardzo jest nieprzezroczysty** — od całkiem widocznego do całkiem przezroczystego. Dzięki niemu logo może leżeć na dowolnym tle bez białego prostokąta wokół.

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

**Odpowiedzi:** 1. Zostanie wypełnione kolorem (zwykle białym). 2. Warstwa nie ma kanału alfa — trzeba go dodać. 3. JPG (lub WebP) — przezroczystość nie jest potrzebna, a plik będzie mniejszy.
