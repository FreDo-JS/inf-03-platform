**W skrócie:** program w C++ to plik `.cpp`, który **kompilator** zamienia na plik wykonywalny (np. `.exe`). Wykonanie zaczyna się zawsze od funkcji **`main`**. Dyrektywy `#include` dołączają biblioteki, np. `iostream` do wypisywania na ekran.

## Najprostszy program

```cpp
#include <iostream>       // biblioteka wejścia/wyjścia (cout, cin)
using namespace std;      // pozwala pisać cout zamiast std::cout

int main() {              // tu zaczyna się program
    cout << "Witaj, świecie!" << endl;
    return 0;             // 0 = program zakończył się poprawnie
}
```

| Element | Znaczenie |
|---|---|
| `#include <…>` | dyrektywa **preprocesora** — wkleja zawartość pliku nagłówkowego biblioteki |
| `using namespace std;` | korzystamy z przestrzeni nazw `std` bez dopisywania `std::` |
| `int main()` | funkcja główna; zwraca liczbę całkowitą do systemu |
| `{ }` | blok kodu |
| `;` | kończy **każdą** instrukcję |
| `//`, `/* */` | komentarze |

## Od kodu do programu

1. **Preprocesor** — wykonuje dyrektywy `#` (np. wkleja `iostream`).
2. **Kompilacja** — tłumaczy kod na kod maszynowy (plik obiektowy).
3. **Linkowanie (konsolidacja)** — łączy go z bibliotekami w gotowy plik wykonywalny.
4. **Uruchomienie** programu.

W praktyce robi to jedno kliknięcie w środowisku (Code::Blocks, Dev-C++, Visual Studio, VS Code) albo polecenie:

```
g++ program.cpp -o program
./program
```

C++ jest językiem **kompilowanym** — w przeciwieństwie do PHP czy JavaScriptu, które są interpretowane w trakcie działania.

## Rodzaje błędów

| Błąd | Kiedy wychodzi | Przykład |
|---|---|---|
| **Składniowy (kompilacji)** | kompilator odmawia | brak średnika, literówka w nazwie |
| **Linkera** | przy łączeniu | wywołana funkcja nie ma definicji |
| **Wykonania** | program się wysypuje | dzielenie przez zero, wyjście poza tablicę |
| **Logiczny** | program działa, ale wynik zły | `<` zamiast `<=` w pętli |

## Na egzaminie

- Program zaczyna się od `main`, a nie od pierwszej linii pliku.
- `#include` to dyrektywa preprocesora, nie instrukcja wykonywana w czasie działania.
- Brak `;` to błąd kompilacji, zły wynik to błąd logiczny.

## Sprawdź się

1. Od jakiej funkcji zaczyna się wykonywanie programu w C++?
2. Co oznacza `return 0;` w funkcji `main`?
3. Program skompilował się, ale wypisuje złą sumę. Jaki to rodzaj błędu?

**Odpowiedzi:** 1. Od `main`. 2. Że program zakończył się poprawnie. 3. Błąd logiczny.
