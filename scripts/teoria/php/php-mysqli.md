**W skrócie:** praca z bazą z poziomu PHP to zawsze te same kroki: **połącz się → wyślij zapytanie → odczytaj wynik → zamknij połączenie**. W zadaniach egzaminacyjnych używa się rozszerzenia **mysqli**.

## Schemat (styl proceduralny)

```php
<?php
$polaczenie = mysqli_connect("localhost", "root", "", "szkola");
if (!$polaczenie) {
    die("Błąd połączenia z bazą");
}
mysqli_set_charset($polaczenie, "utf8mb4");   // polskie znaki

$wynik = mysqli_query($polaczenie, "SELECT imie, nazwisko, srednia FROM uczniowie ORDER BY nazwisko");

while ($wiersz = mysqli_fetch_assoc($wynik)) {
    echo "<tr><td>" . $wiersz["imie"] . "</td><td>" . $wiersz["nazwisko"] . "</td><td>" . $wiersz["srednia"] . "</td></tr>";
}

mysqli_close($polaczenie);
?>
```

| Funkcja | Działanie |
|---|---|
| `mysqli_connect(host, użytkownik, hasło, baza)` | połączenie; w XAMPP domyślnie `localhost`, `root`, puste hasło |
| `mysqli_query($p, $sql)` | wykonanie zapytania; dla SELECT zwraca wynik, dla INSERT/UPDATE/DELETE — `true`/`false` |
| `mysqli_fetch_assoc($w)` | kolejny wiersz jako tablica asocjacyjna; `null`, gdy wierszy już nie ma |
| `mysqli_fetch_row($w)` | wiersz jako tablica indeksowana (`$wiersz[0]`) |
| `mysqli_num_rows($w)` | liczba wierszy wyniku |
| `mysqli_affected_rows($p)` | ile wierszy zmienił INSERT/UPDATE/DELETE |
| `mysqli_insert_id($p)` | identyfikator ostatnio dodanego wiersza (AUTO_INCREMENT) |
| `mysqli_close($p)` | zamknięcie połączenia |

## Zapis danych z formularza — bezpiecznie

**Źle** (SQL injection — dane wklejone wprost do zapytania):

```php
$sql = "SELECT * FROM uzytkownicy WHERE login = '" . $_POST["login"] . "'";
```

Wpisanie w polu `' OR '1'='1` zmienia sens zapytania.

**Dobrze — zapytanie przygotowane:**

```php
$zap = mysqli_prepare($polaczenie, "INSERT INTO uczniowie (imie, nazwisko, srednia) VALUES (?, ?, ?)");
mysqli_stmt_bind_param($zap, "ssd", $imie, $nazwisko, $srednia);   // s = string, i = int, d = double
mysqli_stmt_execute($zap);
```

Znaki `?` to miejsca na dane — baza traktuje je zawsze jako **wartości**, nigdy jako część polecenia SQL.

## Styl obiektowy (to samo)

```php
$db = new mysqli("localhost", "root", "", "szkola");
$wynik = $db->query("SELECT * FROM uczniowie");
while ($w = $wynik->fetch_assoc()) { /* ... */ }
$db->close();
```

## Typowe błędy

- Zła nazwa bazy lub tabeli → `mysqli_query` zwraca `false`, a `fetch_assoc` sypie ostrzeżeniem.
- Brak `mysqli_set_charset` → „krzaczki” zamiast polskich liter.
- Pomylone nazwy kolumn w `$wiersz["…"]` — muszą być identyczne jak w zapytaniu (albo jak alias z `AS`).

## Na egzaminie

- Kolejność: `mysqli_connect` → `mysqli_query` → `mysqli_fetch_assoc` w pętli `while` → `mysqli_close`.
- W zadaniach praktycznych wynik zapytania zwykle trafia do tabeli `<table>` albo listy.
- Zapytania przygotowane chronią przed SQL injection.

## Sprawdź się

1. Jaka pętla służy do odczytania wszystkich wierszy wyniku?
2. Co zwraca `mysqli_fetch_assoc`, gdy wierszy już nie ma?
3. Jak w `mysqli_stmt_bind_param` oznacza się parametr typu liczba całkowita?

**Odpowiedzi:** 1. `while ($w = mysqli_fetch_assoc($wynik)) { … }`. 2. `null` (pętla się kończy). 3. Literą `i`.
