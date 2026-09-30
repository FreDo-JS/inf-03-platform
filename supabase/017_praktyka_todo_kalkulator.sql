-- =============================================================================
-- 017_praktyka_todo_kalkulator.sql — dwa zadania praktyczne na 60 minut
--
-- Uruchom po 016_cpp_grafika_java.sql.
--
-- Oba zadania są krótsze od arkusza CKE (60 zamiast 150 minut) i obejmują
-- HTML, CSS oraz JavaScript operujący na DOM — dokładnie to, co uczniowie
-- przerabiali w materiałach: pobranie elementu, obsługa kliknięcia,
-- createElement, textContent, walidacja pustego pola.
--
-- Można uruchomić ponownie — zadania nie zduplikują się.
-- =============================================================================

do $$
begin
  if to_regclass('public.practical_tasks') is null then
    raise exception 'Brakuje migracji 006_practical.sql — uruchom migracje po kolei przed 017.';
  end if;
end $$;

-- =============================================================================
-- ZADANIE 1 — Lista zadań
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  'Lista zadań (HTML/CSS/JS)',
  'Strona z polem tekstowym i przyciskiem: dodane zadanie pojawia się jako element listy.',
$md$
## Zadanie: lista zadań

Przygotuj stronę, na której można zapisywać zadania do zrobienia. Pracuj
w plikach `index.html`, `styl.css` i `skrypt.js`. Podgląd otworzysz przyciskiem
**Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony (widoczny na karcie przeglądarki): **Lista zadań**.
3. Nagłówek pierwszego stopnia o treści **Lista zadań**.
4. Pole tekstowe o identyfikatorze `zadanie` z podpowiedzią (`placeholder`) **Co masz do zrobienia?**
5. Przycisk o identyfikatorze `dodaj` z napisem **Dodaj**.
6. Pusta lista punktowana o identyfikatorze `lista` — to w niej pojawią się zadania.
7. Akapit o identyfikatorze `komunikat` — tam wyświetlisz informację o błędzie.

### 2. Plik styl.css

1. Tło strony: `#f4f4f4`, kolor tekstu: `#222222`.
2. Przycisk `dodaj` ma tło `#2e7d32` i biały tekst.
3. Elementy listy mają odstęp wewnętrzny i są czytelnie oddzielone (ocenia nauczyciel).

### 3. Plik skrypt.js

Po kliknięciu przycisku **Dodaj**:

1. Jeśli pole `zadanie` **nie jest puste** — do listy `lista` dochodzi nowy element `li`
   z tekstem wpisanym przez użytkownika.
2. Pole `zadanie` zostaje wyczyszczone, gotowe na kolejny wpis.
3. Jeśli pole `zadanie` **jest puste** — nic nie dochodzi do listy, a w akapicie
   `komunikat` pojawia się tekst **Wpisz treść zadania**.

Kolejne dodane zadania mają układać się jedno pod drugim, w kolejności dodawania.
Strona nie może się przy tym przeładowywać.

### Przykład działania

Wpisanie `Kupić mleko` i kliknięcie **Dodaj** daje listę z jedną pozycją:
`Kupić mleko`. Po wpisaniu `Odrobić zadanie` i ponownym kliknięciu lista ma
dwie pozycje, w tej samej kolejności.
$md$,
  jsonb_build_array(
    jsonb_build_object('name', 'index.html', 'content', $f1$<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Lista zadań</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek, pole tekstowe, przycisk, listę i akapit na komunikat -->

  <script src="skrypt.js"></script>
</body>
</html>
$f1$),
    jsonb_build_object('name', 'styl.css', 'content', $f2$/* Tutaj wpisz style strony */
$f2$),
    jsonb_build_object('name', 'skrypt.js', 'content', $f3$// Tutaj wpisz skrypt dodający zadania do listy
$f3$)
  ),
  jsonb_build_array(
    jsonb_build_object('name', 'index.html', 'content', $r1$<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Lista zadań</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Lista zadań</h1>

  <input type="text" id="zadanie" placeholder="Co masz do zrobienia?">
  <button id="dodaj">Dodaj</button>

  <ul id="lista"></ul>
  <p id="komunikat"></p>

  <script src="skrypt.js"></script>
</body>
</html>
$r1$),
    jsonb_build_object('name', 'styl.css', 'content', $r2$body {
  background-color: #f4f4f4;
  color: #222222;
  font-family: Arial, sans-serif;
  margin: 24px;
}

#dodaj {
  background-color: #2e7d32;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
}

#lista li {
  background-color: #ffffff;
  padding: 8px;
  margin-bottom: 6px;
  border: 1px solid #dddddd;
}

#komunikat {
  color: #b00020;
}
$r2$),
    jsonb_build_object('name', 'skrypt.js', 'content', $r3$const pole = document.getElementById("zadanie");
const przycisk = document.getElementById("dodaj");
const lista = document.getElementById("lista");
const komunikat = document.getElementById("komunikat");

przycisk.addEventListener("click", function () {
  const tresc = pole.value.trim();

  if (tresc === "") {
    komunikat.textContent = "Wpisz treść zadania";
    return;
  }

  const element = document.createElement("li");
  element.textContent = tresc;
  lista.appendChild(element);

  pole.value = "";
  komunikat.textContent = "";
});
$r3$)
  ),
  $tests$[
    {"id":"t1-css-file","name":"Plik styl.css nie jest pusty","type":"file_not_empty","points":2,"file":"styl.css"},
    {"id":"t1-js-file","name":"Plik skrypt.js nie jest pusty","type":"file_not_empty","points":2,"file":"skrypt.js"},
    {"id":"t1-doctype","name":"Poprawna deklaracja DOCTYPE i język strony","type":"html_lang_doctype","points":3,"page":"index.html","lang":"pl"},
    {"id":"t1-h1","name":"Nagłówek pierwszego stopnia o treści Lista zadań","type":"selector_text","points":3,"page":"index.html","selector":"h1","mode":"equals","value":"Lista zadań","ignoreCase":true},
    {"id":"t1-input","name":"Pole tekstowe o identyfikatorze zadanie","type":"selector_count","points":3,"page":"index.html","selector":"input#zadanie","min":1,"max":1},
    {"id":"t1-placeholder","name":"Pole ma podpowiedź Co masz do zrobienia?","type":"selector_attribute","points":2,"page":"index.html","selector":"input#zadanie","attribute":"placeholder","mode":"equals","value":"Co masz do zrobienia?","ignoreCase":true},
    {"id":"t1-button","name":"Przycisk o identyfikatorze dodaj z napisem Dodaj","type":"selector_text","points":3,"page":"index.html","selector":"#dodaj","mode":"equals","value":"Dodaj","ignoreCase":true},
    {"id":"t1-lista","name":"Na stronie jest lista punktowana o identyfikatorze lista","type":"selector_count","points":3,"page":"index.html","selector":"ul#lista","min":1,"max":1},
    {"id":"t1-komunikat","name":"Akapit o identyfikatorze komunikat istnieje","type":"selector_count","points":2,"page":"index.html","selector":"#komunikat","min":1,"max":1},
    {"id":"t1-tlo","name":"Tło strony #f4f4f4, tekst #222222","type":"css_computed","points":3,"page":"index.html","selector":"body","property":"background-color","expected":"#f4f4f4"},
    {"id":"t1-kolor","name":"Kolor tekstu strony to #222222","type":"css_computed","points":2,"page":"index.html","selector":"body","property":"color","expected":"#222222"},
    {"id":"t1-przycisk-tlo","name":"Przycisk Dodaj ma tło #2e7d32","type":"css_computed","points":3,"page":"index.html","selector":"#dodaj","property":"background-color","expected":"#2e7d32"},
    {"id":"t1-dodaje","name":"Kliknięcie Dodaj dopisuje zadanie do listy","type":"interaction","points":6,"page":"index.html",
     "steps":[{"action":"fill","selector":"#zadanie","value":"Kupić mleko"},{"action":"click","selector":"#dodaj"},{"action":"wait","ms":150}],
     "expect":{"selector":"ul#lista li","mode":"contains","value":"Kupić mleko","ignoreCase":true}},
    {"id":"t1-dwa","name":"Drugie zadanie trafia pod pierwsze","type":"interaction","points":5,"page":"index.html",
     "steps":[{"action":"fill","selector":"#zadanie","value":"Kupić mleko"},{"action":"click","selector":"#dodaj"},{"action":"wait","ms":100},{"action":"fill","selector":"#zadanie","value":"Odrobić zadanie"},{"action":"click","selector":"#dodaj"},{"action":"wait","ms":150}],
     "expect":{"selector":"ul#lista li:nth-child(2)","mode":"contains","value":"Odrobić zadanie","ignoreCase":true}},
    {"id":"t1-puste","name":"Puste pole nie dodaje zadania, tylko komunikat","type":"interaction","points":5,"page":"index.html",
     "steps":[{"action":"click","selector":"#dodaj"},{"action":"wait","ms":150}],
     "expect":{"selector":"#komunikat","mode":"contains","value":"Wpisz treść zadania","ignoreCase":true}},
    {"id":"t1-puste-lista","name":"Po kliknięciu z pustym polem lista nadal jest pusta","type":"interaction","points":3,"page":"index.html",
     "steps":[{"action":"click","selector":"#dodaj"},{"action":"wait","ms":150}],
     "expect":{"selector":"ul#lista","mode":"equals","value":""}}
  ]$tests$::jsonb,
  $crit$[
    {"id":"c1-czyszczenie","name":"Pole czyści się po dodaniu zadania","description":"Po kliknięciu Dodaj pole tekstowe jest puste i gotowe na kolejny wpis.","points":3},
    {"id":"c1-estetyka","name":"Estetyka i czytelność strony","description":"Sensowne odstępy, czytelna lista, wygląd zgodny z opisem zadania.","points":5},
    {"id":"c1-kod","name":"Poprawność i czytelność kodu","description":"Sensowne nazwy zmiennych, wcięcia, brak zbędnego kodu, obsługa zdarzenia zamiast atrybutu onclick w HTML.","points":4}
  ]$crit$::jsonb,
  60, false, true, true
where not exists (select 1 from practical_tasks where title = 'Lista zadań (HTML/CSS/JS)');

-- =============================================================================
-- ZADANIE 2 — Kalkulator napiwku i podziału rachunku
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  'Kalkulator napiwku (HTML/CSS/JS)',
  'Formularz liczący kwotę z napiwkiem i kwotę przypadającą na jedną osobę.',
$md$
## Zadanie: kalkulator napiwku

Przygotuj stronę, która policzy rachunek w restauracji: doliczy napiwek
i podzieli kwotę na kilka osób. Pracuj w plikach `index.html`, `styl.css`
i `skrypt.js`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony (widoczny na karcie przeglądarki): **Kalkulator napiwku**.
3. Nagłówek pierwszego stopnia o treści **Kalkulator napiwku**.
4. Pole liczbowe o identyfikatorze `kwota` — kwota rachunku.
5. Lista rozwijana o identyfikatorze `procent` z **trzema** opcjami o wartościach
   `5`, `10` i `15` (napiwek w procentach).
6. Pole liczbowe o identyfikatorze `osoby` — liczba osób przy stole.
7. Przycisk o identyfikatorze `oblicz` z napisem **Oblicz**.
8. Akapit o identyfikatorze `wynik` — tam pojawi się rezultat.

Każde pole musi mieć opisującą je etykietę `label` powiązaną atrybutem `for`.

### 2. Plik styl.css

1. Tło strony: `#eef2f5`, kolor tekstu: `#1b2530`.
2. Przycisk `oblicz` ma tło `#0b6bcb` i biały tekst.
3. Formularz jest czytelnie rozmieszczony — pola jedno pod drugim (ocenia nauczyciel).

### 3. Plik skrypt.js

Po kliknięciu przycisku **Oblicz** w akapicie `wynik` pojawia się tekst w formacie:

```
Razem: 220.00 zł, na osobę: 55.00 zł
```

Zasady obliczeń:

- **Razem** = kwota rachunku powiększona o wybrany procent napiwku.
- **Na osobę** = kwota razem podzielona przez liczbę osób.
- Obie kwoty zaokrąglij do **dwóch miejsc po przecinku**.
- Jeśli kwota jest pusta lub liczba osób jest mniejsza niż 1, w akapicie `wynik`
  pojawia się tekst **Podaj poprawne dane** i żadne obliczenia się nie wykonują.

### Przykład

Rachunek `200`, napiwek `10`, osoby `4` → `Razem: 220.00 zł, na osobę: 55.00 zł`.

Strona nie może się przeładowywać po kliknięciu przycisku.
$md$,
  jsonb_build_array(
    jsonb_build_object('name', 'index.html', 'content', $g1$<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Kalkulator napiwku</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek, pola z etykietami, listę rozwijaną, przycisk i akapit na wynik -->

  <script src="skrypt.js"></script>
</body>
</html>
$g1$),
    jsonb_build_object('name', 'styl.css', 'content', $g2$/* Tutaj wpisz style strony */
$g2$),
    jsonb_build_object('name', 'skrypt.js', 'content', $g3$// Tutaj wpisz skrypt liczący napiwek
$g3$)
  ),
  jsonb_build_array(
    jsonb_build_object('name', 'index.html', 'content', $s1$<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Kalkulator napiwku</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Kalkulator napiwku</h1>

  <label for="kwota">Kwota rachunku</label>
  <input type="number" id="kwota" min="0">

  <label for="procent">Napiwek</label>
  <select id="procent">
    <option value="5">5%</option>
    <option value="10">10%</option>
    <option value="15">15%</option>
  </select>

  <label for="osoby">Liczba osób</label>
  <input type="number" id="osoby" min="1" value="1">

  <button id="oblicz">Oblicz</button>

  <p id="wynik"></p>

  <script src="skrypt.js"></script>
</body>
</html>
$s1$),
    jsonb_build_object('name', 'styl.css', 'content', $s2$body {
  background-color: #eef2f5;
  color: #1b2530;
  font-family: Arial, sans-serif;
  margin: 24px;
}

label {
  display: block;
  margin-top: 12px;
}

#oblicz {
  background-color: #0b6bcb;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  margin-top: 16px;
  cursor: pointer;
}

#wynik {
  margin-top: 16px;
  font-weight: bold;
}
$s2$),
    jsonb_build_object('name', 'skrypt.js', 'content', $s3$const przycisk = document.getElementById("oblicz");
const wynik = document.getElementById("wynik");

przycisk.addEventListener("click", function () {
  const kwota = parseFloat(document.getElementById("kwota").value);
  const procent = parseFloat(document.getElementById("procent").value);
  const osoby = parseInt(document.getElementById("osoby").value);

  if (isNaN(kwota) || isNaN(osoby) || osoby < 1) {
    wynik.textContent = "Podaj poprawne dane";
    return;
  }

  const razem = kwota + (kwota * procent) / 100;
  const naOsobe = razem / osoby;

  wynik.textContent =
    "Razem: " + razem.toFixed(2) + " zł, na osobę: " + naOsobe.toFixed(2) + " zł";
});
$s3$)
  ),
  $tests2$[
    {"id":"t2-css-file","name":"Plik styl.css nie jest pusty","type":"file_not_empty","points":2,"file":"styl.css"},
    {"id":"t2-js-file","name":"Plik skrypt.js nie jest pusty","type":"file_not_empty","points":2,"file":"skrypt.js"},
    {"id":"t2-doctype","name":"Poprawna deklaracja DOCTYPE i język strony","type":"html_lang_doctype","points":3,"page":"index.html","lang":"pl"},
    {"id":"t2-h1","name":"Nagłówek pierwszego stopnia o treści Kalkulator napiwku","type":"selector_text","points":3,"page":"index.html","selector":"h1","mode":"equals","value":"Kalkulator napiwku","ignoreCase":true},
    {"id":"t2-pola","name":"Pola liczbowe kwota i osoby","type":"selector_count","points":4,"page":"index.html","selector":"input#kwota[type=number], input#osoby[type=number]","min":2,"max":2},
    {"id":"t2-select","name":"Lista rozwijana procent ma trzy opcje","type":"selector_count","points":4,"page":"index.html","selector":"select#procent option","min":3,"max":3},
    {"id":"t2-select-wartosc","name":"Opcje listy mają wartości 5, 10 i 15","type":"selector_attribute","points":3,"page":"index.html","selector":"select#procent option:nth-child(2)","attribute":"value","mode":"equals","value":"10"},
    {"id":"t2-etykiety","name":"Każde pole ma etykietę powiązaną atrybutem for","type":"selector_count","points":4,"page":"index.html","selector":"label[for=kwota], label[for=procent], label[for=osoby]","min":3,"max":3},
    {"id":"t2-button","name":"Przycisk o identyfikatorze oblicz z napisem Oblicz","type":"selector_text","points":3,"page":"index.html","selector":"#oblicz","mode":"equals","value":"Oblicz","ignoreCase":true},
    {"id":"t2-wynik","name":"Akapit o identyfikatorze wynik istnieje","type":"selector_count","points":2,"page":"index.html","selector":"#wynik","min":1,"max":1},
    {"id":"t2-tlo","name":"Tło strony #eef2f5","type":"css_computed","points":3,"page":"index.html","selector":"body","property":"background-color","expected":"#eef2f5"},
    {"id":"t2-kolor","name":"Kolor tekstu strony to #1b2530","type":"css_computed","points":2,"page":"index.html","selector":"body","property":"color","expected":"#1b2530"},
    {"id":"t2-przycisk-tlo","name":"Przycisk Oblicz ma tło #0b6bcb","type":"css_computed","points":3,"page":"index.html","selector":"#oblicz","property":"background-color","expected":"#0b6bcb"},
    {"id":"t2-razem","name":"Rachunek 200 z napiwkiem 10% daje razem 220.00","type":"interaction","points":6,"page":"index.html",
     "steps":[{"action":"fill","selector":"#kwota","value":"200"},{"action":"select","selector":"#procent","value":"10"},{"action":"fill","selector":"#osoby","value":"4"},{"action":"click","selector":"#oblicz"},{"action":"wait","ms":150}],
     "expect":{"selector":"#wynik","mode":"contains","value":"220.00"}},
    {"id":"t2-na-osobe","name":"Ta sama kwota na cztery osoby daje 55.00","type":"interaction","points":6,"page":"index.html",
     "steps":[{"action":"fill","selector":"#kwota","value":"200"},{"action":"select","selector":"#procent","value":"10"},{"action":"fill","selector":"#osoby","value":"4"},{"action":"click","selector":"#oblicz"},{"action":"wait","ms":150}],
     "expect":{"selector":"#wynik","mode":"contains","value":"55.00"}},
    {"id":"t2-inny-procent","name":"Napiwek 15% od 100 zł daje razem 115.00","type":"interaction","points":4,"page":"index.html",
     "steps":[{"action":"fill","selector":"#kwota","value":"100"},{"action":"select","selector":"#procent","value":"15"},{"action":"fill","selector":"#osoby","value":"1"},{"action":"click","selector":"#oblicz"},{"action":"wait","ms":150}],
     "expect":{"selector":"#wynik","mode":"contains","value":"115.00"}},
    {"id":"t2-walidacja","name":"Brak kwoty daje komunikat Podaj poprawne dane","type":"interaction","points":5,"page":"index.html",
     "steps":[{"action":"fill","selector":"#osoby","value":"2"},{"action":"click","selector":"#oblicz"},{"action":"wait","ms":150}],
     "expect":{"selector":"#wynik","mode":"contains","value":"Podaj poprawne dane","ignoreCase":true}}
  ]$tests2$::jsonb,
  $crit2$[
    {"id":"c2-zaokraglenie","name":"Kwoty zawsze z dwoma miejscami po przecinku","description":"Także dla wyników niecałkowitych, np. rachunek 99.99 podzielony na 3 osoby.","points":4},
    {"id":"c2-estetyka","name":"Estetyka i układ formularza","description":"Pola jedno pod drugim, etykiety czytelne, sensowne odstępy.","points":4},
    {"id":"c2-kod","name":"Poprawność i czytelność kodu","description":"Sensowne nazwy zmiennych, wcięcia, obsługa zdarzenia zamiast atrybutu onclick w HTML.","points":4}
  ]$crit2$::jsonb,
  60, false, true, true
where not exists (select 1 from practical_tasks where title = 'Kalkulator napiwku (HTML/CSS/JS)');
