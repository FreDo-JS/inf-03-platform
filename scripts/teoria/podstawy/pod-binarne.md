**W skrócie:** na liczbach dwójkowych liczy się jak na dziesiętnych, tylko „przeniesienie” następuje już przy 2. Operacje logiczne (AND, OR, XOR, NOT) działają na każdym bicie osobno — z nich korzystają maski sieciowe, uprawnienia i warunki w programach.

## Dodawanie

| a | b | wynik | przeniesienie |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | **1** |

```
   1011   (11)
 + 0110   ( 6)
 ------
  10001   (17)
```

## Odejmowanie i mnożenie

- **Odejmowanie** robi się jak pisemnie, z pożyczką — albo jako dodanie liczby przeciwnej w kodzie U2.
- **Mnożenie** to dodawanie przesuniętych kopii: `101 · 11 = 101 + 1010 = 1111` (5 · 3 = 15).
- **Przesunięcie w lewo o 1 bit** mnoży przez 2, **w prawo** — dzieli przez 2 (bez reszty).

## Operacje logiczne

| a | b | a AND b | a OR b | a XOR b | NOT a |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 |

Zapamiętaj:
- **AND** — 1 tylko gdy **oba** są 1 („i”),
- **OR** — 1 gdy **którykolwiek** jest 1 („lub”),
- **XOR** — 1 gdy są **różne**,
- **NOT** — odwraca.

## Gdzie to się przydaje

**Adres sieci = adres IP AND maska:**

```
  192.168.1.130  = 11000000.10101000.00000001.10000010
  255.255.255.192 = 11111111.11111111.11111111.11000000
  AND             = 11000000.10101000.00000001.10000000 = 192.168.1.128
```

W programowaniu te same operacje są w warunkach: `if (zalogowany && admin)` to AND, `||` to OR, `!` to NOT.

## Na egzaminie

- Dodawanie binarne z przeniesieniem — sprawdzaj wynik, przeliczając na dziesiętny.
- Pytania „jaki będzie wynik `1100 AND 1010`” — licz bit po bicie: `1000`.
- Przepełnienie: suma dwóch 8-bitowych liczb może potrzebować 9 bitów.

## Sprawdź się

1. Policz `1101 + 0011` w systemie dwójkowym.
2. Ile wynosi `1100 XOR 1010`?
3. Jak przesunięcie bitowe w lewo o 2 pozycje zmienia liczbę?

**Odpowiedzi:** 1. `10000` (13 + 3 = 16). 2. `0110`. 3. Mnoży ją przez 4.
