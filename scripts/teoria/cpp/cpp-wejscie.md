**W skrócie:** w C++ dane czyta się ze **strumienia** `cin` (klawiatura), a wypisuje do `cout` (ekran). Operator `>>` „wyciąga” dane ze strumienia do zmiennej, a `<<` „wkłada” dane do strumienia.

## Podstawy

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    int wiek;
    string imie;

    cout << "Podaj imię i wiek: ";
    cin >> imie >> wiek;           // wczyta dwa słowa oddzielone spacją/Enterem

    cout << "Cześć, " << imie << "! Za rok masz " << wiek + 1 << " lat." << endl;
    return 0;
}
```

| Element | Znaczenie |
|---|---|
| `cout << x` | wypisz x |
| `cin >> x` | wczytaj do x (typ zgodny z typem zmiennej) |
| `endl` | nowa linia i opróżnienie bufora; `"\n"` — sama nowa linia (szybsze) |
| `cerr` | strumień błędów |

## Napisy ze spacjami — `getline`

`cin >> imie` czyta **tylko do pierwszej spacji**. Całą linię wczytasz tak:

```cpp
string zdanie;
getline(cin, zdanie);
```

Pułapka: po `cin >> liczba;` w strumieniu zostaje znak Enter, więc następne `getline` dostanie pustą linię. Rozwiązanie: `cin.ignore();` przed `getline`.

## Formatowanie liczb (`<iomanip>`)

```cpp
#include <iomanip>
double srednia = 4.56789;
cout << fixed << setprecision(2) << srednia;   // 4.57
cout << setw(6) << 42;                          // "    42" — szerokość 6 znaków
```

## Złe dane

Jeśli użytkownik wpisze „abc” do zmiennej `int`, `cin` wejdzie w stan błędu (`cin.fail()` zwróci `true`), a zmienna nie dostanie poprawnej wartości. W poważniejszych programach trzeba to sprawdzić.

## Pliki — `<fstream>`

Działa tak samo jak `cin`/`cout`:

```cpp
#include <fstream>
ifstream wej("dane.txt");    // odczyt
ofstream wyj("wynik.txt");   // zapis
int x;
while (wej >> x) wyj << x * 2 << "\n";
```

## Na egzaminie

- `<<` z `cout`, `>>` z `cin` — kierunek strzałek pokazuje kierunek danych.
- `cin >>` kończy na spacji, `getline` czyta całą linię.
- Zaokrąglenie wyniku do 2 miejsc: `fixed << setprecision(2)`.

## Sprawdź się

1. Co wczyta `cin >> s` (typ `string`), gdy wpiszesz „Jan Kowalski”?
2. Jak wypisać liczbę `3.14159` z dwoma miejscami po przecinku?
3. Jakiej biblioteki potrzeba do zapisu do pliku?

**Odpowiedzi:** 1. Tylko „Jan”. 2. `cout << fixed << setprecision(2) << 3.14159;` (z `<iomanip>`). 3. `<fstream>` (`ofstream`).
