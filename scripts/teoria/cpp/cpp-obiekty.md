**W skrócie:** **klasa** to szablon opisujący pewien rodzaj rzeczy: jakie ma **dane (pola)** i co potrafi (**metody**). **Obiekt** to konkretny egzemplarz klasy. **Konstruktor** to specjalna metoda, która ustawia obiekt przy jego tworzeniu.

## Klasa i obiekt

```cpp
#include <iostream>
#include <string>
using namespace std;

class Uczen {
private:                       // dostęp tylko wewnątrz klasy
    string imie;
    double srednia;

public:                        // dostęp z zewnątrz
    Uczen(string i, double s) {     // konstruktor
        imie = i;
        srednia = s;
    }

    void przedstaw() {               // metoda
        cout << imie << ", średnia: " << srednia << endl;
    }

    bool maPasek() {
        return srednia >= 4.75;
    }
};

int main() {
    Uczen ola("Ola", 5.1);      // obiekt — wywołuje konstruktor
    Uczen jan("Jan", 3.9);
    ola.przedstaw();             // Ola, średnia: 5.1
    cout << jan.maPasek();       // 0 (false)
}
```

## Pojęcia

| Pojęcie | Znaczenie |
|---|---|
| **Klasa** | projekt (np. „Uczeń”) |
| **Obiekt** | konkretny egzemplarz (Ola, Jan) |
| **Pole** | dana obiektu (`imie`, `srednia`) |
| **Metoda** | funkcja należąca do klasy (`przedstaw()`) |
| **Konstruktor** | metoda o nazwie klasy, bez typu zwracanego, wywoływana przy tworzeniu obiektu |
| **Destruktor** | `~Uczen()` — wywoływany przy usuwaniu obiektu |

## Modyfikatory dostępu i hermetyzacja

- `private` — tylko metody tej klasy (domyślne w `class`),
- `public` — każdy,
- `protected` — ta klasa i klasy po niej dziedziczące.

**Hermetyzacja (enkapsulacja):** pola są `private`, a zmienia się je przez metody, które pilnują poprawności:

```cpp
void ustawSrednia(double s) {
    if (s >= 1 && s <= 6) srednia = s;   // nie dopuszczamy bzdur
}
double getSrednia() { return srednia; }   // getter
```

## Cztery filary programowania obiektowego

1. **Hermetyzacja** — ukrywanie danych za metodami.
2. **Abstrakcja** — pokazujemy, *co* obiekt robi, a nie *jak*.
3. **Dziedziczenie** — klasa pochodna przejmuje pola i metody bazowej: `class Maturzysta : public Uczen { … };`
4. **Polimorfizm** — ta sama metoda działa różnie w różnych klasach (metody wirtualne).

## Lista inicjalizacyjna konstruktora

Krótszy i zalecany zapis tego samego konstruktora:

```cpp
Uczen(string i, double s) : imie(i), srednia(s) {}
```

## Na egzaminie

- Konstruktor ma nazwę klasy i **nie ma typu zwracanego**.
- `private` pola + `public` metody = hermetyzacja.
- Rozróżnij klasę (projekt) i obiekt (egzemplarz).

## Sprawdź się

1. Czym różni się klasa od obiektu?
2. Jak rozpoznać konstruktor w kodzie?
3. Dlaczego pola klasy zwykle są `private`?

**Odpowiedzi:** 1. Klasa to szablon, obiekt — jej konkretny egzemplarz. 2. Ma nazwę klasy i nie ma typu zwracanego. 3. Żeby zmieniać je tylko przez metody, które mogą sprawdzić poprawność (hermetyzacja).
