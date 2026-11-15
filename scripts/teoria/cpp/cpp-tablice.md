**W skrócie:** tablica przechowuje **wiele wartości tego samego typu** pod jedną nazwą; do elementów sięga się przez **indeks liczony od 0**. Napis w C++ najwygodniej trzymać w typie `string`, który zachowuje się podobnie do tablicy znaków.

## Tablica jednowymiarowa

```cpp
int oceny[5] = {5, 4, 3, 6, 4};   // 5 elementów: indeksy 0…4

cout << oceny[0];   // 5 — pierwszy
cout << oceny[4];   // 4 — ostatni (rozmiar − 1)

int suma = 0;
for (int i = 0; i < 5; i++) suma += oceny[i];
```

- Rozmiar zwykłej tablicy jest **stały**, ustalany przy deklaracji.
- **C++ nie sprawdza zakresu**: `oceny[5]` czyta pamięć poza tablicą — błąd, który nie zawsze widać od razu.
- `int t[100] = {0};` — wszystkie elementy wyzerowane.

## Tablica dwuwymiarowa

```cpp
int m[3][4];                       // 3 wiersze, 4 kolumny

for (int w = 0; w < 3; w++)
    for (int k = 0; k < 4; k++)
        m[w][k] = w * k;

cout << m[2][3];                   // wiersz 2, kolumna 3 → 6
```

Pierwszy indeks to **wiersz**, drugi — **kolumna**. Przydaje się do plansz, tabel, macierzy.

## vector — tablica, która rośnie

```cpp
#include <vector>
vector<int> liczby;
liczby.push_back(7);      // dodaj na koniec
liczby.push_back(3);
cout << liczby.size();    // 2
for (int x : liczby) cout << x << " ";   // pętla zakresowa
```

## Napisy — string

```cpp
#include <string>
string s = "Programowanie";

s.length()           // 13
s[0]                 // 'P' — pojedynczy znak
s + " w C++"         // łączenie napisów
s.substr(0, 7)       // "Program" — od indeksu 0, 7 znaków
s.find("gram")       // 3 — pozycja; string::npos, gdy brak
```

**Odwracanie napisu:**

```cpp
string odwrocony = "";
for (int i = s.length() - 1; i >= 0; i--) odwrocony += s[i];
```

**Palindrom** (czyta się tak samo od tyłu): porównaj `s[i]` z `s[s.length() - 1 - i]` dla pierwszej połowy.

Uwaga: `s.length()` liczy **bajty** — polskie litery w UTF-8 zajmują po 2, więc „żółw” ma długość większą niż 4.

## Na egzaminie

- Indeksy od 0, ostatni element to `rozmiar − 1`.
- `m[w][k]` — najpierw wiersz, potem kolumna.
- Odwracanie napisu i sprawdzanie palindromu to częste zadania.

## Sprawdź się

1. Jaki indeks ma ostatni element tablicy `int t[10]`?
2. Ile elementów ma tablica `int m[4][5]`?
3. Co zwróci `string("informatyka").substr(2, 5)`?

**Odpowiedzi:** 1. 9. 2. 20. 3. "forma".
