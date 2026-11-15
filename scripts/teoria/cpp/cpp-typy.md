**W skrócie:** w C++ każda zmienna ma **typ** ustalony przy deklaracji — decyduje on, co zmienna przechowuje i ile zajmuje pamięci. Typu nie można potem zmienić (inaczej niż w PHP czy JavaScripcie).

## Podstawowe typy

| Typ | Co przechowuje | Rozmiar (typowo) | Przykład |
|---|---|---|---|
| `int` | liczba całkowita | 4 B (ok. ±2,1 mld) | `int wiek = 17;` |
| `long long` | duża liczba całkowita | 8 B | `long long ludnosc = 8000000000;` |
| `float` | liczba rzeczywista, mniejsza precyzja | 4 B | `float t = 36.6f;` |
| `double` | liczba rzeczywista, większa precyzja | 8 B | `double pi = 3.14159;` |
| `char` | jeden znak | 1 B | `char ocena = 'A';` |
| `bool` | prawda/fałsz | 1 B | `bool zdal = true;` |
| `string` | napis (z `<string>`) | zmienny | `string imie = "Ola";` |

`unsigned int` — tylko nieujemne, za to dwa razy większy zakres dodatni.

## Deklaracja, inicjalizacja, stałe

```cpp
int liczba;            // deklaracja (wartość nieokreślona — nie czytaj jej przed nadaniem!)
int licznik = 0;       // deklaracja z inicjalizacją
const double VAT = 0.23;   // stała — próba zmiany = błąd kompilacji
auto x = 5;            // auto: kompilator sam ustali typ (tu int)
```

Nazwy zmiennych: litery, cyfry i `_`, nie mogą zaczynać się cyfrą; **wielkość liter ma znaczenie** (`suma` ≠ `Suma`).

## Konwersje typów

**Niejawna** (automatyczna):

```cpp
int a = 7, b = 2;
double wynik = a / b;    // 3 !!! — dzielenie dwóch int jest całkowite
int c = 3.99;            // 3 — część ułamkowa obcięta (nie zaokrąglona)
```

**Jawna** (rzutowanie):

```cpp
double wynik = (double)a / b;          // 3.5
double w2 = static_cast<double>(a) / b; // 3.5 — zapis zalecany w C++
```

`char` to w środku liczba (kod ASCII): `char z = 'A'; int kod = z;` → 65.

## Przepełnienie

Gdy wynik nie mieści się w typie, „przekręca się”: `int` powyżej 2 147 483 647 daje wartość ujemną. Do dużych liczb używaj `long long`.

## Na egzaminie

- `7 / 2` w C++ to **3**, a `7.0 / 2` to **3.5** — klasyczna pułapka.
- Przypisanie liczby rzeczywistej do `int` **obcina** część ułamkową.
- `const` — wartość nie może się zmienić.

## Sprawdź się

1. Jaki wynik da `int x = 9 / 4;`?
2. Jak poprawić `double s = suma / n;`, gdy `suma` i `n` są typu `int`?
3. Jaki typ wybierzesz na liczbę mieszkańców Ziemi?

**Odpowiedzi:** 1. 2. 2. Rzutować: `double s = (double)suma / n;` 3. `long long` (nie mieści się w `int`).
