**W skrócie:** formularz HTML wysyła dane do skryptu PHP metodą **GET** (dane w adresie) albo **POST** (dane w treści żądania). W PHP odbierasz je z tablic **`$_GET`** i **`$_POST`** — kluczem jest atrybut **`name`** pola formularza.

## Formularz i skrypt

```html
<form action="wynik.php" method="post">
  <label for="imie">Imię</label>
  <input type="text" id="imie" name="imie">
  <label for="wiek">Wiek</label>
  <input type="number" id="wiek" name="wiek">
  <button type="submit">Wyślij</button>
</form>
```

```php
<?php
// wynik.php
if (isset($_POST["imie"], $_POST["wiek"])) {
    $imie = trim($_POST["imie"]);
    $wiek = (int) $_POST["wiek"];

    if ($imie === "" || $wiek <= 0) {
        echo "Uzupełnij poprawnie formularz.";
    } else {
        echo "Witaj, " . htmlspecialchars($imie) . "! Masz $wiek lat.";
    }
}
?>
```

Bez atrybutu `name` pole **w ogóle nie zostanie wysłane**.

## GET a POST

| | GET | POST |
|---|---|---|
| Gdzie są dane | w adresie: `wynik.php?imie=Ola&wiek=17` | w treści żądania, niewidoczne w adresie |
| Tablica w PHP | `$_GET` | `$_POST` |
| Rozmiar | ograniczony długością adresu | duży (np. przesyłanie plików) |
| Zakładki, historia | adres z danymi da się zapisać | nie |
| Kiedy | wyszukiwarka, filtry, numer strony | logowanie, rejestracja, zapis do bazy |

Haseł **nigdy** nie wysyłaj metodą GET — trafią do historii przeglądarki i logów serwera.

## Formularz i obsługa w jednym pliku

```php
<form method="post">              <!-- brak action = wysyła do tego samego pliku -->
  <input name="liczba" type="number">
  <button>Policz kwadrat</button>
</form>
<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $x = (int) $_POST["liczba"];
    echo "Kwadrat: " . $x * $x;
}
?>
```

## Bezpieczeństwo — nigdy nie ufaj danym z formularza

1. **Sprawdź, czy dane przyszły**: `isset()`, `empty()`.
2. **Waliduj**: typ, zakres, format (`filter_var($email, FILTER_VALIDATE_EMAIL)`).
3. **Wypisując dane na stronie, używaj `htmlspecialchars()`** — inaczej ktoś wpisze `<script>` i zrobi atak **XSS**.
4. **Zapisując do bazy, używaj zapytań przygotowanych** — chroni przed **SQL injection** (zob. temat mysqli).
5. Walidacja w HTML (`required`) czy JavaScripcie to wygoda dla użytkownika, ale **nie zabezpieczenie** — łatwo ją obejść.

## Na egzaminie

- Klucz w `$_POST` = wartość atrybutu `name`, nie `id`.
- `method="post"` → `$_POST`, `method="get"` → `$_GET`.
- `isset` przed odczytem, `htmlspecialchars` przed wypisaniem.

## Sprawdź się

1. Pole ma `id="mail"` i `name="email"`. Jak odczytasz je w PHP przy metodzie POST?
2. Którą metodę wybierzesz do formularza logowania i dlaczego?
3. Po co wypisywać dane z formularza przez `htmlspecialchars()`?

**Odpowiedzi:** 1. `$_POST["email"]`. 2. POST — hasło nie pojawi się w adresie, historii ani logach. 3. Żeby wpisany kod HTML/JavaScript wyświetlił się jako tekst, a nie wykonał (ochrona przed XSS).
