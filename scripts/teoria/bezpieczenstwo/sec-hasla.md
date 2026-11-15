**W skrócie:** hasła **nigdy nie zapisuje się w bazie wprost**. Zapisuje się ich **skrót (hash)** utworzony wolną funkcją z **solą**. Przy logowaniu oblicza się skrót wpisanego hasła i porównuje — samego hasła nie da się ze skrótu odczytać. W PHP robią to `password_hash()` i `password_verify()`.

## Dlaczego nie zwykły tekst ani szyfrowanie

- **Zwykły tekst** — wyciek bazy = wszystkie hasła od razu w rękach atakującego (a ludzie używają tych samych haseł w wielu serwisach).
- **Szyfrowanie** da się odwrócić kluczem — a klucz zwykle leży na tym samym serwerze.
- **Skrót** jest **jednokierunkowy**: z hasła łatwo policzyć skrót, ze skrótu nie da się odtworzyć hasła.

## Dlaczego nie MD5 ani SHA-1

To szybkie funkcje skrótu — komputer liczy ich miliardy na sekundę, więc proste hasła da się odgadnąć metodą prób (atak słownikowy, siłowy). Do tego bez soli identyczne hasła mają identyczne skróty i działają **tablice tęczowe** (gotowe zestawy skrótów popularnych haseł).

## Sól i wolne funkcje

- **Sól** — losowy ciąg dodawany do hasła przed liczeniem skrótu, inny dla każdego użytkownika. Dwa takie same hasła dają różne skróty, a tablice tęczowe przestają działać.
- **Wolne algorytmy** — **bcrypt**, **Argon2** — celowo kosztowne obliczeniowo, co spowalnia odgadywanie.

`password_hash` robi wszystko naraz: losuje sól, używa bcrypt (lub nowszego) i zapisuje wszystko w jednym napisie, np.:

```
$2y$10$wD1n5u3k2Q...   ← algorytm ($2y = bcrypt), koszt (10), sól i skrót
```

## W praktyce (PHP)

**Rejestracja:**

```php
$hash = password_hash($_POST["haslo"], PASSWORD_DEFAULT);
// zapis $hash do kolumny VARCHAR(255) — zapytaniem przygotowanym
```

**Logowanie:**

```php
// $hashZBazy pobrany po loginie
if (password_verify($_POST["haslo"], $hashZBazy)) {
    session_regenerate_id(true);
    $_SESSION["uzytkownik"] = $login;
} else {
    echo "Nieprawidłowy login lub hasło.";   // nie zdradzaj, które pole jest złe
}
```

`password_needs_rehash()` pozwala po zmianie algorytmu przeliczyć skrót przy najbliższym logowaniu.

## Dobre praktyki

- Kolumna na skrót: `VARCHAR(255)` — długość zależy od algorytmu.
- Wymagaj sensownej **długości** hasła (np. min. 12 znaków) zamiast skomplikowanych reguł.
- **Ogranicz liczbę prób logowania** i rozważ uwierzytelnianie dwuskładnikowe (2FA).
- Jeden komunikat dla złego loginu i złego hasła.
- Hasła wysyłaj tylko przez **HTTPS** i metodą **POST**.

## Na egzaminie

- `password_hash` przy zapisie, `password_verify` przy logowaniu.
- MD5/SHA-1 nie nadają się do haseł.
- Skrót jest jednokierunkowy; sól sprawia, że takie same hasła mają różne skróty.

## Sprawdź się

1. Dlaczego nie porównuje się `password_hash($haslo)` z wartością w bazie przez `==`?
2. Co daje sól?
3. Jaki typ i długość kolumny wybierzesz na skrót hasła?

**Odpowiedzi:** 1. Każde wywołanie losuje nową sól, więc skróty będą różne — do sprawdzenia służy `password_verify`. 2. Takie same hasła mają różne skróty, więc tablice tęczowe i porównywanie skrótów nie działają. 3. `VARCHAR(255)`.
