**W skrócie:** sortowanie układa elementy w kolejności. Trzy proste algorytmy — **bąbelkowe, przez wybór i przez wstawianie** — mają złożoność **O(n²)**: są łatwe do zrozumienia, ale wolne dla dużych danych. W prawdziwych programach używa się gotowych funkcji (np. `sort`), które działają w O(n log n).

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

**Odpowiedzi:** 1. Bąbelkowe. 2. `[1, 3, 4, 2]` (minimum 1 zamienione z pierwszym elementem). 3. `[100, 25, 3]` — sortowanie jak tekstów.
