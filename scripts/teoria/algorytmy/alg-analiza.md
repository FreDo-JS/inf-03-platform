**W skrócie:** zanim napiszesz kod, musisz dokładnie wiedzieć, **co** ma robić program. Analiza problemu kończy się **specyfikacją**: opisem danych wejściowych, oczekiwanego wyniku i warunków, jakie mają spełniać.

## Specyfikacja zadania

| Element | Pytanie | Przykład: średnia ocen |
|---|---|---|
| **Dane wejściowe** | co program dostaje i w jakim zakresie? | liczba ocen *n* (1–30), oceny całkowite 1–6 |
| **Wynik (wyjście)** | co ma zwrócić lub wypisać? | średnia zaokrąglona do 2 miejsc |
| **Warunki / ograniczenia** | czego nie wolno, czego się spodziewać? | gdy *n* = 0 — komunikat zamiast dzielenia przez zero |

## Etapy rozwiązywania problemu

1. **Zrozumienie zadania** — przeczytaj dwa razy, wypisz dane i wynik.
2. **Specyfikacja** — zakresy, typy danych, przypadki szczególne.
3. **Wybór lub zaprojektowanie algorytmu** — opis kroków (lista kroków, schemat blokowy, pseudokod).
4. **Sprawdzenie na przykładzie** — „ręczne” przejście algorytmu na małych danych.
5. **Implementacja** — kod w wybranym języku.
6. **Testowanie** — także na danych brzegowych.

## Przypadki brzegowe

To dane na granicy zakresu albo nietypowe — tu programy najczęściej się mylą:
- pusta lista, jeden element, wszystkie elementy równe,
- 0, liczby ujemne, maksymalna dopuszczalna wartość,
- pusty napis, napis ze spacjami lub polskimi znakami.

## Cechy dobrego algorytmu

- **Poprawność** — daje dobry wynik dla każdych dopuszczalnych danych.
- **Skończoność** — kończy się po skończonej liczbie kroków.
- **Jednoznaczność** — każdy krok jest opisany precyzyjnie.
- **Efektywność** — nie marnuje czasu ani pamięci.

## Przykład: czy rok jest przestępny

- *Wejście:* rok — liczba całkowita dodatnia.
- *Wyjście:* „tak” albo „nie”.
- *Reguła:* przestępny, gdy dzieli się przez 4 i nie przez 100, **albo** dzieli się przez 400.
- *Testy:* 2024 → tak, 1900 → nie, 2000 → tak, 2023 → nie.

## Na egzaminie

- W zadaniu praktycznym specyfikacja jest w treści — wypisz sobie dane wejściowe i oczekiwany wynik, zanim zaczniesz kodować.
- Przetestuj program na danych brzegowych, zanim go oddasz.

## Sprawdź się

1. Jakie trzy elementy zawiera specyfikacja zadania?
2. Podaj dwa przypadki brzegowe dla funkcji szukającej największej liczby w tablicy.
3. Czy 1900 był rokiem przestępnym?

**Odpowiedzi:** 1. Dane wejściowe, wynik, warunki/ograniczenia. 2. Np. tablica pusta, tablica z jednym elementem, same liczby ujemne. 3. Nie — dzieli się przez 100, a nie przez 400.
