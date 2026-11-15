**W skrócie:** algorytm można zapisać **słownie (listą kroków)**, **schematem blokowym** (rysunek z ustalonych figur) albo **pseudokodem** (prawie kod, ale bez składni konkretnego języka). Wszystkie trzy opisują to samo — kolejne kroki rozwiązania.

## Bloki schematu

| Blok | Kształt | Znaczenie |
|---|---|---|
| **Start / Stop** | owal | początek i koniec algorytmu |
| **Operacja** | prostokąt | obliczenie, przypisanie, np. `suma ← suma + x` |
| **Wejście / wyjście** | równoległobok | wczytanie danych lub wypisanie wyniku |
| **Decyzja (warunek)** | romb | pytanie z dwiema strzałkami: TAK / NIE |
| Łącznik | małe kółko | połączenie części schematu |

Strzałki pokazują kierunek wykonywania. Z bloku decyzyjnego wychodzą **dwie** strzałki, z pozostałych — jedna.

## Struktury sterujące

- **Sekwencja** — kroki jeden po drugim.
- **Rozgałęzienie** — romb z warunkiem, dwie drogi.
- **Pętla (iteracja)** — strzałka wraca do wcześniejszego miejsca, dopóki warunek jest spełniony.

## Ten sam algorytm na trzy sposoby: największa z dwóch liczb

**Lista kroków:**
1. Wczytaj a i b.
2. Jeśli a > b, wynik = a, w przeciwnym razie wynik = b.
3. Wypisz wynik.

**Pseudokod:**

```
wczytaj a, b
jeżeli a > b to
    wynik ← a
w przeciwnym razie
    wynik ← b
wypisz wynik
```

**Schemat:** owal START → równoległobok „wczytaj a, b” → romb „a > b?” → (TAK) prostokąt „wynik ← a” / (NIE) prostokąt „wynik ← b” → równoległobok „wypisz wynik” → owal STOP.

## Pętla w pseudokodzie: suma liczb od 1 do n

```
wczytaj n
suma ← 0
i ← 1
dopóki i ≤ n wykonuj
    suma ← suma + i
    i ← i + 1
wypisz suma
```

## Na egzaminie

- Romb = decyzja, równoległobok = wejście/wyjście, prostokąt = operacja.
- W pytaniach „co wypisze ten schemat dla danych…” przejdź go ręcznie, zapisując wartości zmiennych w tabelce.
- Strzałka `←` w pseudokodzie oznacza **przypisanie**, nie porównanie.

## Sprawdź się

1. Jakim blokiem oznacza się wczytanie danych?
2. Ile strzałek wychodzi z bloku decyzyjnego?
3. Co wypisze pseudokod z sumą dla n = 4?

**Odpowiedzi:** 1. Równoległobokiem. 2. Dwie (TAK i NIE). 3. 10.
