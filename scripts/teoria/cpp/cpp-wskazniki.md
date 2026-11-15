**W skrócie:** **wskaźnik** to zmienna, która przechowuje **adres** innej zmiennej w pamięci. **Referencja** to druga nazwa (alias) dla istniejącej zmiennej. Oba pozwalają funkcji działać na oryginale, bez kopiowania danych.

## Adres i wskaźnik

```cpp
int x = 42;
int *p = &x;      // p przechowuje ADRES x  (& = „adres zmiennej”)

cout << p;        // np. 0x7ffd5c3a — adres w pamięci
cout << *p;       // 42 — wartość spod adresu (* = „wyłuskanie”)

*p = 100;         // zmieniamy x przez wskaźnik
cout << x;        // 100
```

| Zapis | Znaczenie |
|---|---|
| `int *p;` | deklaracja wskaźnika na `int` |
| `&x` | adres zmiennej x |
| `*p` | wartość, na którą wskazuje p |
| `nullptr` | wskaźnik „na nic” — przed użyciem trzeba to sprawdzić |

Gwiazdka ma dwa znaczenia: w **deklaracji** (`int *p`) tworzy wskaźnik, w **wyrażeniu** (`*p`) sięga po wartość.

## Referencja

```cpp
int a = 5;
int &r = a;       // r to inna nazwa a — musi być od razu zainicjalizowana
r = 8;
cout << a;        // 8
```

Referencji nie da się później „przepiąć” na inną zmienną i nie może być pusta.

## Referencja a wskaźnik

| | Wskaźnik | Referencja |
|---|---|---|
| Może być pusty | tak (`nullptr`) | nie |
| Można zmienić, na co wskazuje | tak | nie |
| Składnia użycia | `*p`, `p->pole` | jak zwykła zmienna |
| Typowe użycie | dynamiczna pamięć, struktury danych, tablice | parametry funkcji |

## Typowe zastosowania

**1. Funkcja zmieniająca argument:**

```cpp
void podwoj(int &x)  { x *= 2; }   // przez referencję
void podwoj2(int *x) { *x *= 2; }  // przez wskaźnik — wywołanie: podwoj2(&a);
```

**2. Tablice:** nazwa tablicy to adres jej pierwszego elementu, więc `t[i]` to to samo co `*(t + i)`.

**3. Pamięć dynamiczna** — rozmiar znany dopiero w czasie działania:

```cpp
int n; cin >> n;
int *tab = new int[n];   // przydział pamięci
// ... praca na tab[i] ...
delete[] tab;            // zwolnienie — inaczej wyciek pamięci
```

W nowoczesnym C++ zamiast `new`/`delete` zwykle używa się `vector` albo inteligentnych wskaźników.

## Na egzaminie

- `&` przy zmiennej = adres, `*` przy wskaźniku = wartość spod adresu.
- Parametr `int &x` pozwala funkcji zmienić oryginał.
- Każde `new` wymaga `delete` (dla tablic `delete[]`).

## Sprawdź się

1. Co wypisze: `int a = 3; int *p = &a; *p = *p + 4; cout << a;`?
2. Czy referencja może istnieć bez przypisanej zmiennej?
3. Co oznacza `p->nazwa`?

**Odpowiedzi:** 1. 7. 2. Nie — musi być zainicjalizowana przy deklaracji. 3. Dostęp do pola `nazwa` obiektu, na który wskazuje `p` (to samo co `(*p).nazwa`).
