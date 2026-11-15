**W skrócie:** funkcja to nazwany fragment kodu, który przyjmuje **parametry**, wykonuje zadanie i może **zwrócić wynik**. Dzięki funkcjom kod się nie powtarza, a program dzieli się na małe, czytelne części.

## Budowa funkcji

```cpp
//  typ wyniku   nazwa    parametry
    int          kwadrat (int x) {
        return x * x;        // zwraca wynik i kończy funkcję
    }

int main() {
    cout << kwadrat(5);      // wywołanie — 25
}
```

- **Typ zwracany** — `int`, `double`, `bool`, `string`… albo `void`, gdy funkcja nic nie zwraca.
- **Parametry** w definicji, **argumenty** przy wywołaniu.
- Funkcja musi być **zadeklarowana przed użyciem** — albo zdefiniowana wyżej niż `main`, albo z **prototypem**:

```cpp
double srednia(int a, int b);     // prototyp (deklaracja)
int main() { cout << srednia(3, 4); }
double srednia(int a, int b) { return (a + b) / 2.0; }   // definicja
```

## Przekazywanie parametrów

| Sposób | Zapis | Co się dzieje |
|---|---|---|
| **Przez wartość** | `void f(int x)` | funkcja dostaje **kopię** — zmiana nie wpływa na oryginał |
| **Przez referencję** | `void f(int &x)` | funkcja działa **na oryginale** |
| Przez stałą referencję | `void f(const string &s)` | bez kopiowania, ale bez możliwości zmiany |

```cpp
void zamien(int &a, int &b) {     // bez & zamiana nie zadziałałaby
    int tmp = a; a = b; b = tmp;
}
```

## Parametry domyślne

```cpp
double brutto(double netto, double vat = 0.23) { return netto * (1 + vat); }
brutto(100);        // 123
brutto(100, 0.08);  // 108
```

## Przeciążanie funkcji

Kilka funkcji o **tej samej nazwie**, ale różnych parametrach — kompilator wybierze właściwą:

```cpp
int pole(int a)               { return a * a; }        // kwadrat
int pole(int a, int b)        { return a * b; }        // prostokąt
double pole(double r)         { return 3.14159 * r * r; } // koło
```

Funkcje nie mogą różnić się **wyłącznie** typem zwracanym.

## Zasięg zmiennych

Zmienna zadeklarowana w funkcji jest **lokalna** — znika po jej zakończeniu i nie jest widoczna gdzie indziej. Zmiennych globalnych lepiej unikać.

## Rekurencja

Funkcja może wywołać samą siebie — musi mieć **warunek zakończenia**:

```cpp
long long silnia(int n) {
    if (n <= 1) return 1;          // warunek zakończenia
    return n * silnia(n - 1);
}
```

## Na egzaminie

- Przekazanie przez wartość nie zmienia oryginału, przez referencję (`&`) — zmienia.
- `void` = funkcja nic nie zwraca.
- Przeciążanie = ta sama nazwa, inne parametry.

## Sprawdź się

1. Co wypisze program: `void f(int x) { x = 10; }`, a w `main`: `int a = 1; f(a); cout << a;`?
2. Jak zmienić nagłówek, żeby `f` zmieniała `a`?
3. Czy mogą istnieć funkcje `int g(int)` i `double g(int)`?

**Odpowiedzi:** 1. 1 — funkcja zmieniła kopię. 2. `void f(int &x)`. 3. Nie — różnią się tylko typem zwracanym.
