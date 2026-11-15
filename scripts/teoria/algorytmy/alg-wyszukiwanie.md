**W skrócie:** **wyszukiwanie liniowe** sprawdza elementy po kolei i działa zawsze. **Wyszukiwanie binarne** jest dużo szybsze, ale tylko w **posortowanej** tablicy: za każdym razem odrzuca połowę zakresu.

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

**Odpowiedzi:** 1. Nie — tablica nie jest posortowana. 2. Ok. 10. 3. Gdyby wszystkie liczby były ujemne, wynik 0 byłby błędny.
