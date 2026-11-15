**W skrócie:** PHP działa **na serwerze**: wykonuje kod, a do przeglądarki wysyła gotowy HTML. Uczeń nigdy nie zobaczy kodu PHP w „Pokaż źródło”. Zmienne zaczynają się od `$`, a typ ustala się sam, na podstawie przypisanej wartości.

## Jak to działa

1. Przeglądarka prosi o `index.php`.
2. Serwer (Apache z PHP, np. w XAMPP) **wykonuje** kod PHP.
3. Do przeglądarki trafia wynik — zwykły HTML.

Dlatego plik musi być na serwerze (`htdocs`) i otwierany przez `http://localhost/...`, a nie dwuklikiem z dysku.

## Podstawy składni

```php
<?php
// komentarz jednoliniowy
$imie = "Ola";            // napis
$wiek = 17;               // liczba całkowita
$srednia = 4.75;          // liczba zmiennoprzecinkowa
$zdala = true;            // logiczna

echo "Cześć, $imie!";              // w "" zmienne są podstawiane
echo 'Cześć, $imie!';              // w '' NIE — wypisze dosłownie $imie
echo "Masz " . $wiek . " lat";     // kropka łączy napisy
?>
```

PHP można przeplatać z HTML-em:

```php
<h1>Witaj, <?php echo $imie; ?></h1>
<p>Rok: <?= date("Y") ?></p>     <!-- <?= to skrót od <?php echo -->
```

## Typy i porównania

Typy: `int`, `float`, `string`, `bool`, `array`, `null`. Sprawdzisz je funkcją `var_dump($x)`.

| Operator | Znaczenie | Przykład |
|---|---|---|
| `==` | równe po konwersji typów | `"5" == 5` → true |
| `===` | równe **i tego samego typu** | `"5" === 5` → false |
| `!=`, `!==` | różne | |
| `.` | łączenie napisów | `"a" . "b"` → "ab" |
| `.=` | doklejenie | `$s .= "x";` |

Zalecane jest `===` — mniej niespodzianek.

## Instrukcje sterujące

```php
if ($srednia >= 4.75) {
    echo "Świadectwo z paskiem";
} elseif ($srednia >= 2) {
    echo "Promocja";
} else {
    echo "Brak promocji";
}

for ($i = 1; $i <= 5; $i++) echo $i;      // 12345

$i = 0;
while ($i < 3) { echo $i; $i++; }          // 012

switch ($dzien) {
    case 6: case 7: echo "weekend"; break;
    default: echo "dzień roboczy";
}
```

## Na egzaminie

- `"…$zmienna…"` podstawia wartość, `'…$zmienna…'` — nie.
- Łączenie napisów kropką (`.`), nie plusem.
- `elseif` w PHP piszesz łącznie (dopuszczalne też `else if`).
- Brak średnika na końcu linii = błąd składni (Parse error).

## Sprawdź się

1. Co wypisze `$x = 3; echo 'x = $x';`?
2. Jaki jest wynik `"10" === 10`?
3. Dlaczego plik `.php` otwarty dwuklikiem z dysku pokazuje kod zamiast wyniku?

**Odpowiedzi:** 1. `x = $x` (apostrofy nie podstawiają zmiennych). 2. `false` (różne typy). 3. Bo nikt go nie wykonał — PHP działa tylko przez serwer (np. `http://localhost/...`).
