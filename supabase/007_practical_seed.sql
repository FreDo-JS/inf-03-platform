-- =============================================================================
-- INF.03 — migracja 007: przykładowe zadanie praktyczne (HTML/CSS/JS)
-- Uruchom po 006_practical.sql. Można uruchomić ponownie — nie duplikuje.
--
-- Zadanie w stylu arkusza CKE, ale bez PHP i bazy danych (ta część dojdzie
-- razem z etapem PHP + SQLite).
-- =============================================================================

insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  'Rowerownia — strona sklepu (HTML/CSS/JS)',
  'Strona sklepu rowerowego: struktura, tabela produktów, formularz i skrypt.',
$md$
## Zadanie: strona sklepu „Rowerownia”

Wykonaj stronę internetową sklepu rowerowego. Pracuj w plikach `index.html`,
`styl.css` i `skrypt.js`. Wynik sprawdź w podglądzie (przycisk **Uruchom**).

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony (widoczny na karcie przeglądarki): **Rowerownia**.
3. W sekcji `header` nagłówek pierwszego stopnia o treści **Rowerownia**.
4. Menu `nav` z **trzema** odnośnikami: *Rowery*, *Akcesoria*, *Kontakt*.
5. Obraz `img` o tekście alternatywnym **Rower górski** (plik może nie istnieć — liczy się atrybut `alt`).
6. Tabela o klasie `produkty`, zawierająca wiersz nagłówkowy oraz **trzy** wiersze z produktami.
   Kolumny: *Nazwa*, *Cena*, *Dostępność*.
7. Formularz z polami:
   - pole tekstowe o identyfikatorze `imie`,
   - pole e-mail o identyfikatorze `email`,
   - przycisk o identyfikatorze `wyslij` z napisem *Zapisz się*.
8. Pusty akapit (lub `div`) o identyfikatorze `komunikat` — tam pojawi się wiadomość ze skryptu.

### 2. Plik styl.css

1. Tekst strony w kolorze `#333333`, tło strony `#ffffff`.
2. Komórki nagłówkowe tabeli (`th`) w tabeli `produkty` mają tło `#cccccc`.
3. Tabela ma obramowanie komórek i czytelne odstępy (oceniane przez nauczyciela).

### 3. Plik skrypt.js

Po kliknięciu przycisku `Zapisz się` w akapicie `komunikat` pojawia się tekst:

```
Dziękujemy, IMIĘ!
```

gdzie `IMIĘ` to wartość wpisana w polu `imie`. Strona nie może się przy tym przeładować.
$md$,
  jsonb_build_array(
    jsonb_build_object('name', 'index.html', 'content', $f1$<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Rowerownia</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek, menu, obraz, tabelę i formularz -->

  <script src="skrypt.js"></script>
</body>
</html>
$f1$),
    jsonb_build_object('name', 'styl.css', 'content', $f2$/* Tutaj wpisz style strony */
$f2$),
    jsonb_build_object('name', 'skrypt.js', 'content', $f3$// Tutaj wpisz skrypt obsługujący przycisk
$f3$)
  ),
  jsonb_build_array(
    jsonb_build_object('name', 'index.html', 'content', $r1$<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Rowerownia</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <header>
    <h1>Rowerownia</h1>
  </header>

  <nav>
    <a href="#rowery">Rowery</a>
    <a href="#akcesoria">Akcesoria</a>
    <a href="#kontakt">Kontakt</a>
  </nav>

  <img src="rower.png" alt="Rower górski">

  <table class="produkty">
    <tr>
      <th>Nazwa</th>
      <th>Cena</th>
      <th>Dostępność</th>
    </tr>
    <tr>
      <td>Rower górski Trek</td>
      <td>3200 zł</td>
      <td>tak</td>
    </tr>
    <tr>
      <td>Rower miejski Kross</td>
      <td>1899 zł</td>
      <td>tak</td>
    </tr>
    <tr>
      <td>Rower szosowy Giant</td>
      <td>4500 zł</td>
      <td>nie</td>
    </tr>
  </table>

  <form id="zapisy">
    <label for="imie">Imię</label>
    <input type="text" id="imie" name="imie">
    <label for="email">E-mail</label>
    <input type="email" id="email" name="email">
    <button type="button" id="wyslij">Zapisz się</button>
  </form>

  <p id="komunikat"></p>

  <script src="skrypt.js"></script>
</body>
</html>
$r1$),
    jsonb_build_object('name', 'styl.css', 'content', $r2$body {
  background-color: #ffffff;
  color: #333333;
  font-family: Arial, sans-serif;
  margin: 20px;
}

h1 {
  font-size: 32px;
}

nav a {
  margin-right: 12px;
}

table.produkty {
  border-collapse: collapse;
  margin-top: 16px;
}

table.produkty th {
  background-color: #cccccc;
  border: 1px solid #333333;
  padding: 8px;
}

table.produkty td {
  border: 1px solid #333333;
  padding: 8px;
}
$r2$),
    jsonb_build_object('name', 'skrypt.js', 'content', $r3$document.getElementById("wyslij").addEventListener("click", function () {
  var imie = document.getElementById("imie").value;
  document.getElementById("komunikat").textContent = "Dziękujemy, " + imie + "!";
});
$r3$)
  ),
  $tests$[
    {"id":"t-css-file","name":"Plik styl.css nie jest pusty","type":"file_not_empty","points":2,"file":"styl.css"},
    {"id":"t-js-file","name":"Plik skrypt.js nie jest pusty","type":"file_not_empty","points":2,"file":"skrypt.js"},
    {"id":"t-doctype","name":"Poprawna deklaracja DOCTYPE i język strony","type":"html_lang_doctype","points":3,"page":"index.html","lang":"pl"},
    {"id":"t-h1","name":"Nagłówek pierwszego stopnia o treści Rowerownia","type":"selector_text","points":3,"page":"index.html","selector":"header h1","mode":"equals","value":"Rowerownia","ignoreCase":true},
    {"id":"t-nav","name":"Menu zawiera trzy odnośniki","type":"selector_count","points":3,"page":"index.html","selector":"nav a","min":3,"max":3},
    {"id":"t-tabela","name":"Tabela produktów ma nagłówek i trzy produkty","type":"selector_count","points":4,"page":"index.html","selector":"table.produkty tr","min":4,"max":4},
    {"id":"t-img","name":"Obraz ma tekst alternatywny Rower górski","type":"selector_attribute","points":3,"page":"index.html","selector":"img","attribute":"alt","mode":"equals","value":"Rower górski","ignoreCase":true},
    {"id":"t-form","name":"Formularz ma pola imie i email","type":"selector_count","points":3,"page":"index.html","selector":"form input#imie, form input#email","min":2,"max":2},
    {"id":"t-th-bg","name":"Komórki nagłówkowe tabeli mają tło #cccccc","type":"css_computed","points":4,"page":"index.html","selector":"table.produkty th","property":"background-color","expected":"#cccccc"},
    {"id":"t-body-color","name":"Tekst strony w kolorze #333333","type":"css_computed","points":3,"page":"index.html","selector":"body","property":"color","expected":"#333333"},
    {"id":"t-skrypt","name":"Skrypt wyświetla podziękowanie po kliknięciu przycisku","type":"interaction","points":5,"page":"index.html",
     "steps":[{"action":"fill","selector":"#imie","value":"Ala"},{"action":"click","selector":"#wyslij"},{"action":"wait","ms":150}],
     "expect":{"selector":"#komunikat","mode":"contains","value":"Dziękujemy, Ala","ignoreCase":true}}
  ]$tests$::jsonb,
  $crit$[
    {"id":"c-estetyka","name":"Estetyka i układ strony","description":"Czytelny układ, odstępy, obramowanie tabeli, wygląd zbliżony do opisu.","points":6},
    {"id":"c-kod","name":"Poprawność i czytelność kodu","description":"Semantyczne znaczniki, wcięcia, sensowne nazwy, brak zbędnego kodu.","points":4}
  ]$crit$::jsonb,
  150, false, true, true
where not exists (select 1 from practical_tasks where title = 'Rowerownia — strona sklepu (HTML/CSS/JS)');
