**W skrócie:** HTTP „nie pamięta” poprzednich żądań. Żeby strona wiedziała, że to ten sam użytkownik, używa się **ciasteczek** (dane zapisane w przeglądarce) albo **sesji** (dane na serwerze, a w przeglądarce tylko identyfikator sesji).

## Ciasteczka (cookies)

```php
<?php
// ustawienie — MUSI być przed jakimkolwiek wypisaniem treści (przed HTML i echo)
setcookie("motyw", "ciemny", time() + 30 * 24 * 3600);   // ważne 30 dni

// odczyt — dostępny dopiero przy NASTĘPNYM wczytaniu strony
if (isset($_COOKIE["motyw"])) {
    echo "Twój motyw: " . htmlspecialchars($_COOKIE["motyw"]);
}

// usunięcie — data ważności w przeszłości
setcookie("motyw", "", time() - 3600);
?>
```

Ciasteczko leży **u użytkownika** — może je podejrzeć i zmienić. Nie trzymaj w nim haseł ani uprawnień.

## Sesje

```php
<?php
session_start();                       // na początku KAŻDEGO pliku, który używa sesji

$_SESSION["login"] = "ola";           // zapis
echo $_SESSION["login"];               // odczyt na dowolnej podstronie

unset($_SESSION["login"]);             // usunięcie jednej zmiennej
session_destroy();                     // zakończenie całej sesji (wylogowanie)
?>
```

Dane sesji są **na serwerze**; przeglądarka dostaje tylko ciasteczko z identyfikatorem (domyślnie `PHPSESSID`).

## Porównanie

| | Ciasteczko | Sesja |
|---|---|---|
| Gdzie są dane | w przeglądarce | na serwerze |
| Czy użytkownik może je zmienić | tak | nie (ma tylko identyfikator) |
| Jak długo | do daty ważności | zwykle do zamknięcia przeglądarki lub wygaśnięcia |
| Typowe użycie | preferencje, „zapamiętaj mnie”, zgoda na cookies | logowanie, koszyk, uprawnienia |

## Logowanie — schemat

```php
<?php
session_start();
// ... po sprawdzeniu loginu i hasła w bazie:
if (password_verify($_POST["haslo"], $hashZBazy)) {
    session_regenerate_id(true);       // nowy identyfikator po zalogowaniu
    $_SESSION["uzytkownik"] = $login;
}

// na stronie tylko dla zalogowanych:
if (!isset($_SESSION["uzytkownik"])) {
    header("Location: logowanie.php");
    exit;
}
?>
```

Hasła w bazie przechowuje się jako skrót: `password_hash($haslo, PASSWORD_DEFAULT)`, a sprawdza `password_verify`.

## Na egzaminie

- `session_start()` przed użyciem `$_SESSION`, `setcookie()` przed wysłaniem treści.
- Ciasteczko ustawione teraz widać w `$_COOKIE` dopiero przy kolejnym żądaniu.
- Sesja = dane na serwerze, ciasteczko = dane w przeglądarce.

## Sprawdź się

1. Gdzie są przechowywane dane zapisane w `$_SESSION`?
2. Jak usunąć ciasteczko?
3. Dlaczego nie warto zapisywać w ciasteczku informacji „admin = 1”?

**Odpowiedzi:** 1. Na serwerze (przeglądarka ma tylko identyfikator sesji). 2. Ustawić je ponownie z datą ważności w przeszłości. 3. Użytkownik może samodzielnie zmienić wartość ciasteczka i nadać sobie uprawnienia.
