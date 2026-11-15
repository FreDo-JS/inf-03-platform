**W skrócie:** tablice w PHP są elastyczne: **indeksowane** (klucze 0, 1, 2…) albo **asocjacyjne** (klucze tekstowe, np. `"imie"`). Wynik zapytania do bazy to właśnie tablica asocjacyjna, więc to podstawa pracy z MySQL. Własne funkcje definiuje się słowem `function`.

## Tablica indeksowana

```php
$owoce = ["jabłko", "gruszka", "śliwka"];
echo $owoce[0];            // jabłko
$owoce[] = "wiśnia";       // dopisanie na koniec
echo count($owoce);        // 4

foreach ($owoce as $owoc) {
    echo "<li>$owoc</li>";
}
```

## Tablica asocjacyjna

```php
$uczen = ["imie" => "Ola", "klasa" => "2a", "srednia" => 4.8];
echo $uczen["imie"];       // Ola

foreach ($uczen as $klucz => $wartosc) {
    echo "$klucz: $wartosc<br>";
}
```

**Tablica tablic** — jak wiersze z bazy:

```php
$uczniowie = [
    ["imie" => "Ola", "srednia" => 4.8],
    ["imie" => "Jan", "srednia" => 3.9],
];
foreach ($uczniowie as $u) echo $u["imie"] . " — " . $u["srednia"] . "<br>";
```

## Przydatne funkcje tablicowe

| Funkcja | Działanie |
|---|---|
| `count($t)` | liczba elementów |
| `sort($t)` / `rsort($t)` | sortowanie wartości rosnąco / malejąco |
| `asort($t)` / `ksort($t)` | sortowanie asocjacyjnej wg wartości / kluczy (z zachowaniem kluczy) |
| `in_array($x, $t)` | czy wartość jest w tablicy |
| `array_sum($t)` | suma elementów |
| `implode(", ", $t)` | tablica → napis |
| `explode(",", $s)` | napis → tablica |
| `print_r($t)`, `var_dump($t)` | podgląd zawartości (do szukania błędów) |

## Funkcje

```php
function brutto(float $netto, float $vat = 0.23): float {
    return round($netto * (1 + $vat), 2);
}

echo brutto(100);          // 123
echo brutto(100, 0.08);    // 108
```

- Parametry mogą mieć **wartości domyślne** i **typy** (`float`, `string`, `array`…).
- Zmienne z zewnątrz **nie są widoczne** w funkcji — przekaż je jako parametry.
- `&$x` w parametrze — przekazanie przez referencję (funkcja zmienia oryginał).

## Funkcje wbudowane, które warto znać

`strlen`, `strtoupper`, `strtolower`, `trim`, `str_replace`, `substr`, `round`, `rand`, `date("Y-m-d")`, `number_format`, `isset`, `empty`.

## Na egzaminie

- `foreach ($tablica as $klucz => $wartosc)` — przegląd tablicy asocjacyjnej.
- `count()` zamiast ręcznego liczenia.
- Wiersz z `mysqli_fetch_assoc` to tablica asocjacyjna: `$wiersz["nazwa_kolumny"]`.

## Sprawdź się

1. Jak dopisać element na koniec tablicy `$t`?
2. Co wypisze `echo implode("-", [1, 2, 3]);`?
3. Jak odczytać kolumnę `nazwisko` z wiersza `$w` pobranego z bazy?

**Odpowiedzi:** 1. `$t[] = wartość;` 2. `1-2-3`. 3. `$w["nazwisko"]`.
