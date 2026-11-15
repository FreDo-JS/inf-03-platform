**W skrócie:** złożoność obliczeniowa mówi, **jak rośnie czas działania** (lub zużycie pamięci) algorytmu, gdy rośnie ilość danych *n*. Zapisuje się ją notacją **O(…)** („duże O”) — interesuje nas tempo wzrostu, a nie dokładna liczba sekund.

## Najczęstsze klasy złożoności

| Złożoność | Nazwa | Przykład | n = 1000 |
|---|---|---|---|
| **O(1)** | stała | dostęp do elementu tablicy `t[5]` | 1 |
| **O(log n)** | logarytmiczna | wyszukiwanie binarne | ~10 |
| **O(n)** | liniowa | wyszukiwanie liniowe, suma elementów | 1 000 |
| **O(n log n)** | liniowo-logarytmiczna | dobre sortowania (quicksort, przez scalanie) | ~10 000 |
| **O(n²)** | kwadratowa | sortowanie bąbelkowe, dwie zagnieżdżone pętle | 1 000 000 |
| **O(2ⁿ)** | wykładnicza | sprawdzanie wszystkich podzbiorów | astronomicznie dużo |

Im niżej w tabeli, tym szybciej algorytm przestaje być używalny przy dużych danych.

## Jak ją odczytać z kodu

- **Jedna pętla** po n elementach → O(n).
- **Dwie zagnieżdżone pętle** po n → O(n²).
- **Pętle jedna po drugiej** (nie w sobie) → O(n) + O(n) = O(n).
- Pętla, która za każdym razem **dzieli zakres na pół** → O(log n).
- Pomijamy stałe i mniejsze składniki: O(3n + 5) = O(n), O(n² + n) = O(n²).

```js
// O(n²) — czy w tablicy są dwa takie same elementy
for (let i = 0; i < n; i++)
  for (let j = i + 1; j < n; j++)
    if (t[i] === t[j]) return true;
```

## Przypadek pesymistyczny, średni i optymistyczny

Wyszukiwanie liniowe: szukany element jest pierwszy → 1 krok (najlepiej), ostatni lub nieobecny → n kroków (**najgorzej**). Złożoność podaje się zwykle dla przypadku **pesymistycznego**.

## Złożoność pamięciowa

Ile dodatkowej pamięci potrzebuje algorytm. Sortowanie bąbelkowe sortuje „w miejscu” — O(1) dodatkowej pamięci; sortowanie przez scalanie potrzebuje pomocniczej tablicy — O(n).

## Dlaczego to ważne

Dla n = 1 000 000 algorytm O(n²) wykona ok. 10¹² operacji (godziny), a O(n log n) — ok. 2·10⁷ (ułamek sekundy). Lepszy algorytm daje więcej niż szybszy komputer.

## Na egzaminie

- Dwie zagnieżdżone pętle po tej samej tablicy → O(n²).
- Wyszukiwanie binarne → O(log n), liniowe → O(n).
- Stałe pomijamy: O(2n) to O(n).

## Sprawdź się

1. Jaką złożoność ma sortowanie bąbelkowe?
2. Kod ma dwie pętle po n elementach, jedna **po** drugiej. Jaka jest złożoność?
3. Która złożoność rośnie najwolniej: O(n), O(1), O(log n)?

**Odpowiedzi:** 1. O(n²). 2. O(n). 3. O(1).
