**W skrócie:** trzy klasyczne algorytmy na liczbach całkowitych: **Euklides** (największy wspólny dzielnik), **sprawdzanie pierwszości** i **zamiana na inny system liczbowy**. Każdy opiera się na dzieleniu z resztą — operator `%` (modulo).

## Operator modulo

`a % b` to **reszta z dzielenia** a przez b: `17 % 5 = 2`, `10 % 2 = 0`.
- liczba parzysta: `n % 2 == 0`,
- ostatnia cyfra liczby: `n % 10`,
- „obcięcie” ostatniej cyfry: dzielenie całkowite `n / 10` (w C++ dla typu `int`).

## NWD — algorytm Euklidesa

Pomysł: NWD(a, b) = NWD(b, a % b), aż reszta wyniesie 0.

```
dopóki b ≠ 0
    r ← a % b
    a ← b
    b ← r
wynik: a
```

NWD(48, 18): (48, 18) → (18, 12) → (12, 6) → (6, 0) → **6**.

**NWW** (najmniejsza wspólna wielokrotność): `NWW(a, b) = a · b / NWD(a, b)` → NWW(4, 6) = 24 / 2 = 12.

## Czy liczba jest pierwsza

Liczba pierwsza ma dokładnie dwa dzielniki: 1 i siebie (1 nie jest pierwsza). Wystarczy sprawdzać dzielniki **do pierwiastka** z n:

```
jeżeli n < 2 → nie jest pierwsza
dla d od 2, dopóki d · d ≤ n
    jeżeli n % d = 0 → nie jest pierwsza
w przeciwnym razie → jest pierwsza
```

Dla n = 97 wystarczy sprawdzić d = 2…9, a nie 2…96.

## Zamiana na system dwójkowy (i dowolny inny)

Dziel przez podstawę i zbieraj reszty — czytane **od końca** dają wynik:

```
wynik ← ""
dopóki n > 0
    wynik ← (n % 2) + wynik
    n ← n / 2  (dzielenie całkowite)
```

13 → reszty 1, 0, 1, 1 → **1101**. Dla systemu szesnastkowego dziel przez 16, a reszty 10–15 zamieniaj na A–F.

## Suma cyfr liczby

```
suma ← 0
dopóki n > 0
    suma ← suma + n % 10
    n ← n / 10
```

## Na egzaminie

- Euklides przez modulo — zapamiętaj trzy linijki w pętli.
- Sprawdzanie pierwszości do √n, nie do n.
- `n % 10` daje ostatnią cyfrę, `n / 10` (całkowite) ją usuwa.

## Sprawdź się

1. Ile wynosi NWD(84, 36)?
2. Do jakiej liczby wystarczy sprawdzać dzielniki, żeby stwierdzić, czy 121 jest pierwsza?
3. Zapisz 19 w systemie dwójkowym.

**Odpowiedzi:** 1. 12. 2. Do 11 (√121 = 11) — i 11 go dzieli, więc 121 nie jest pierwsza. 3. 10011.
