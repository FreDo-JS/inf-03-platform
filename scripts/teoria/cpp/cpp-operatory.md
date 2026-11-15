**W skrócie:** operatory to „działania” na wartościach: **arytmetyczne** liczą, **porównania** dają `true`/`false`, a **logiczne** łączą warunki. Największe pułapki to pomylenie `=` z `==` i dzielenie całkowite.

## Arytmetyczne

| Operator | Działanie | Przykład (`int`) |
|---|---|---|
| `+ - *` | dodawanie, odejmowanie, mnożenie | `7 * 2` → 14 |
| `/` | dzielenie — **całkowite** dla `int` | `7 / 2` → 3 |
| `%` | reszta z dzielenia (tylko liczby całkowite) | `7 % 2` → 1 |
| `++`, `--` | zwiększ / zmniejsz o 1 | `i++` |
| `+=`, `-=`, `*=`, `/=` | operacja z przypisaniem | `suma += x` to `suma = suma + x` |

`i++` (postinkrementacja) najpierw zwraca starą wartość, potem zwiększa; `++i` — odwrotnie:

```cpp
int i = 5;
int a = i++;   // a = 5, i = 6
int b = ++i;   // i = 7, b = 7
```

## Porównania

| Operator | Znaczenie |
|---|---|
| `==` | równe |
| `!=` | różne |
| `<  >  <=  >=` | mniejsze, większe… |

**Uwaga:** `=` to **przypisanie**, `==` to **porównanie**. `if (x = 5)` przypisze 5 i zawsze będzie „prawdą” — kompilator to przepuści.

## Logiczne

| Operator | Znaczenie | Przykład |
|---|---|---|
| `&&` | i (oba warunki) | `wiek >= 18 && maDowod` |
| `\|\|` | lub (co najmniej jeden) | `dzien == 6 \|\| dzien == 7` |
| `!` | zaprzeczenie | `!zalogowany` |

**Leniwa ewaluacja:** w `a && b`, gdy `a` jest fałszem, `b` nie jest już sprawdzane — przydatne np. w `n != 0 && suma / n > 3` (nie podzieli przez zero).

## Priorytet (od najwyższego)

1. `!`, `++`, `--`
2. `*`, `/`, `%`
3. `+`, `-`
4. `<`, `>`, `<=`, `>=`
5. `==`, `!=`
6. `&&`
7. `||`
8. `=`, `+=`…

Gdy masz wątpliwość — **dopisz nawiasy**. `2 + 3 * 4` = 14, a `(2 + 3) * 4` = 20.

## Na egzaminie

- `=` vs `==`, `/` całkowite, `%` z liczbami całkowitymi.
- Kolejność działań: mnożenie przed dodawaniem, `&&` przed `||`.
- Różnica `i++` i `++i` w wyrażeniu.

## Sprawdź się

1. Ile wynosi `17 % 5`?
2. Co wypisze `int i = 3; cout << i++ + 1;` i ile wynosi potem `i`?
3. Jak zapisać warunek „x należy do przedziału ⟨1, 10⟩”?

**Odpowiedzi:** 1. 2. 2. Wypisze 4, a `i` wyniesie 4. 3. `x >= 1 && x <= 10`.
