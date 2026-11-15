**W skrócie:** **SQL injection** to atak, w którym dane wpisane przez użytkownika stają się **częścią polecenia SQL**. Dzieje się tak, gdy program skleja zapytanie z tekstu formularza. Obrona jest jedna i skuteczna: **zapytania przygotowane** (parametryzowane), w których dane nigdy nie są traktowane jak kod.

## Jak działa atak

Podatny kod logowania:

```php
$login = $_POST["login"];
$haslo = $_POST["haslo"];
$sql = "SELECT * FROM uzytkownicy WHERE login = '$login' AND haslo = '$haslo'";
$wynik = mysqli_query($polaczenie, $sql);
```

Atakujący wpisuje w pole login: `admin' -- ` (z apostrofem i spacją po myślnikach). Zapytanie robi się takie:

```sql
SELECT * FROM uzytkownicy WHERE login = 'admin' -- ' AND haslo = '...'
```

`--` rozpoczyna komentarz w SQL, więc sprawdzanie hasła **znika** — atakujący loguje się jako admin bez hasła.

Inne warianty: `' OR '1'='1` (warunek zawsze prawdziwy — zwraca wszystkie rekordy), dopisywanie `UNION SELECT` do wykradania innych tabel, a przy złej konfiguracji nawet `; DROP TABLE …`.

## Obrona: zapytania przygotowane

```php
$zap = mysqli_prepare($polaczenie,
    "SELECT id, haslo_hash FROM uzytkownicy WHERE login = ?");
mysqli_stmt_bind_param($zap, "s", $login);
mysqli_stmt_execute($zap);
$wynik = mysqli_stmt_get_result($zap);
```

1. Najpierw do bazy idzie **szablon zapytania** ze znakami `?`.
2. Osobno idą **dane** — baza wstawia je jako wartości, nigdy nie interpretuje jako SQL.
3. Typy parametrów: `s` — tekst, `i` — liczba całkowita, `d` — zmiennoprzecinkowa, `b` — dane binarne.

To samo w PDO: `$db->prepare("… WHERE login = :login")` i `execute(["login" => $login])`.

## Dodatkowe zabezpieczenia

- **Walidacja danych** — liczba ma być liczbą (`(int)`, `filter_var`), e-mail e-mailem.
- **Zasada najmniejszych uprawnień** — konto bazy, którego używa strona, nie powinno mieć prawa do `DROP` ani do innych baz.
- **Nie pokazuj błędów bazy użytkownikowi** — komunikat „You have an error in your SQL syntax…” podpowiada atakującemu budowę zapytania.
- `mysqli_real_escape_string` to stara, słabsza metoda — zapytania przygotowane są lepsze.

## Na egzaminie

- Przyczyna: sklejanie zapytania z danymi użytkownika.
- Obrona: zapytania przygotowane (`prepare` + `bind_param`).
- `' OR '1'='1` i `--` to klasyczne przykłady ataku.

## Sprawdź się

1. Dlaczego wpisanie `' OR '1'='1` w pole może zwrócić wszystkie rekordy?
2. Co oznacza `"si"` w `mysqli_stmt_bind_param`?
3. Czy ukrycie formularza przed użytkownikiem chroni przed SQL injection?

**Odpowiedzi:** 1. Bo warunek `'1'='1'` jest zawsze prawdziwy, a `OR` sprawia, że cały WHERE staje się prawdą. 2. Pierwszy parametr to tekst (string), drugi — liczba całkowita. 3. Nie — atakujący może wysłać żądanie bezpośrednio, z pominięciem formularza.
