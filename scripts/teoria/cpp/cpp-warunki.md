**W skrócie:** instrukcje warunkowe wybierają, który fragment kodu się wykona. `if` / `else if` / `else` sprawdza dowolne warunki, a `switch` wygodnie wybiera spośród **konkretnych wartości** jednej zmiennej.

## if, else if, else

```cpp
int punkty;
cin >> punkty;

if (punkty >= 90) {
    cout << "celujący";
} else if (punkty >= 75) {
    cout << "bardzo dobry";
} else if (punkty >= 50) {
    cout << "dostateczny";
} else {
    cout << "niedostateczny";
}
```

- Warunki sprawdzane są **od góry**; wykona się **pierwszy** spełniony, reszta jest pomijana. Dlatego kolejność progów ma znaczenie.
- `else` jest opcjonalny.
- Przy jednej instrukcji klamry można pominąć, ale lepiej ich nie pomijać — łatwo o błąd przy dopisywaniu kolejnej linii.

## Operator warunkowy (trójargumentowy)

```cpp
string wynik = (punkty >= 50) ? "zdał" : "nie zdał";
```

`warunek ? wartość_gdy_prawda : wartość_gdy_fałsz` — skrót prostego `if/else`.

## switch

```cpp
int dzien;
cin >> dzien;
switch (dzien) {
    case 1: cout << "poniedziałek"; break;
    case 2: cout << "wtorek"; break;
    case 6:
    case 7: cout << "weekend"; break;   // dwa przypadki, jedna akcja
    default: cout << "inny dzień";
}
```

- Działa dla typów całkowitych i `char` (nie dla `string` ani `double`).
- **`break` jest konieczny** — bez niego wykonanie „przelatuje” do kolejnych `case` (*fall-through*).
- `default` — gdy żaden `case` nie pasuje.

## Typowe błędy

```cpp
if (x = 5)      // BŁĄD: przypisanie zamiast porównania
if (x == 5);    // BŁĄD: średnik kończy if — blok poniżej wykona się zawsze
if (1 < x < 10) // BŁĄD: tak się nie sprawdza przedziału → (x > 1 && x < 10)
```

## Na egzaminie

- Kolejność `else if` — pierwszy pasujący wygrywa.
- Brak `break` w `switch` = przejście do następnego przypadku.
- Przedział zapisuje się dwoma warunkami połączonymi `&&`.

## Sprawdź się

1. Co wypisze `switch` dla `dzien = 6`, jeśli przy `case 6:` zapomnisz `break`, a `case 7:` wypisuje „niedziela”?
2. Popraw warunek `if (0 < x < 100)`.
3. Zapisz krócej: `if (a > b) m = a; else m = b;`

**Odpowiedzi:** 1. Wypisze tekst z `case 6` i dalej „niedziela” (przelatuje). 2. `if (x > 0 && x < 100)`. 3. `m = (a > b) ? a : b;`
