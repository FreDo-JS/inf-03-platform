**W skrócie:** pętla powtarza fragment kodu. **`for`** — gdy znasz liczbę powtórzeń, **`while`** — gdy powtarzasz, dopóki warunek jest prawdziwy, **`do…while`** — gdy kod ma wykonać się co najmniej raz. `break` przerywa pętlę, `continue` przeskakuje do następnego obrotu.

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

**Odpowiedzi:** 1. 4 razy (i = 10, 7, 4, 1). 2. `do…while`. 3. `0134`.
