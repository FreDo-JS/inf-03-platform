-- =============================================================================
-- 027_praktyka_zadania.sql — pięć kolejnych zadań praktycznych (HTML/CSS/JS)
--
-- Uruchom po 026_praktyka_typy_testow.sql.
--
-- PLIK GENEROWANY: źródła w scripts/praktyka/zadania/*.mjs, generator
-- scripts/praktyka/generuj.mjs. Poprawiasz zadanie w źródle i generujesz od nowa.
--
--   1. Cennik w tabeli (HTML/CSS)
--   2. Formularz rejestracyjny z walidacją (HTML/CSS/JS)
--   3. Galeria responsywna (HTML/CSS)
--   4. Licznik i przełącznik motywu (HTML/CSS/JS)
--   5. Strona firmowa z trzech podstron (HTML/CSS)
--
-- Zadania korzystają z nowych typów testów (026): etykiety formularzy, alt,
-- struktura nagłówków, media queries, sprawdzanie przy szerokości telefonu,
-- linki między plikami i zawartość źródła. Każde ma rozwiązanie wzorcowe
-- (reference_files), które przechodzi testy w 100% — przycisk „Sprawdź na wzorcu”
-- w panelu to potwierdza. Powtórne uruchomienie nie dubluje zadań (po tytule).
-- =============================================================================

do $$
begin
  if to_regclass('public.practical_tasks') is null then
    raise exception 'Brakuje migracji 006_practical.sql — uruchom migracje po kolei przed 027.';
  end if;
  if not public.practical_tests_valid('[{"id":"x","name":"x","points":1,"type":"file_content"}]'::jsonb) then
    raise exception 'Brakuje migracji 026_praktyka_typy_testow.sql — uruchom ją przed 027.';
  end if;
end $$;

-- =============================================================================
-- ZADANIE 1 — Cennik w tabeli (HTML/CSS)
-- 30 pkt automatycznie + 10 pkt ręcznie, 60 min
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  $q0$Cennik w tabeli (HTML/CSS)$q0$,
  $q0$Tabela z nagłówkiem, podpisem i zebrą w CSS — semantyczna, bez sztuczek z układem.$q0$,
  $q0$## Zadanie: cennik warsztatu

Przygotuj stronę z cennikiem usług warsztatu w **prawdziwej tabeli HTML**
(nie w układzie z `div`-ów). Pracuj w plikach `index.html` i `styl.css`.
Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony: **Cennik**. Nagłówek pierwszego stopnia: **Cennik warsztatu**.
3. Tabela o identyfikatorze `cennik` z podpisem `<caption>`: **Cennik usług**.
4. Wiersz nagłówkowy w `<thead>`: trzy komórki `<th scope="col">` o treści
   **Usługa**, **Czas**, **Cena**.
5. W `<tbody>` co najmniej **pięć** wierszy, po trzy komórki `<td>`
   (nazwa usługi, czas, cena — dane wymyśl sam).
6. Pod tabelą akapit o identyfikatorze `uwaga` z tekstem
   **Ceny zawierają podatek VAT.**

### 2. Plik styl.css

1. Tabela zajmuje całą szerokość strony, a obramowania komórek są scalone
   (`border-collapse: collapse`).
2. Komórki nagłówka: tło `#263238`, biały tekst.
3. Co drugi wiersz ciała tabeli (`tbody tr:nth-child(even)`) ma tło `#eceff1`.
4. Komórki mają odstęp wewnętrzny `8px`, a **ceny (ostatnia kolumna)** są wyrównane do prawej.
5. Czcionka strony: bezszeryfowa.
$q0$,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Cennik</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n\n  <!-- Tutaj wstaw nagłówek, tabelę i akapit z uwagą -->\n\n</body>\n</html>\n"},{"name":"styl.css","content":"/* Tutaj wpisz style tabeli */\n"}]$q0$::jsonb,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Cennik</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <h1>Cennik warsztatu</h1>\n\n  <table id=\"cennik\">\n    <caption>Cennik usług</caption>\n    <thead>\n      <tr>\n        <th scope=\"col\">Usługa</th>\n        <th scope=\"col\">Czas</th>\n        <th scope=\"col\">Cena</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>Przegląd okresowy</td>\n        <td>60 min</td>\n        <td>150 zł</td>\n      </tr>\n      <tr>\n        <td>Wymiana oleju</td>\n        <td>45 min</td>\n        <td>120 zł</td>\n      </tr>\n      <tr>\n        <td>Wymiana klocków hamulcowych</td>\n        <td>90 min</td>\n        <td>280 zł</td>\n      </tr>\n      <tr>\n        <td>Geometria kół</td>\n        <td>50 min</td>\n        <td>130 zł</td>\n      </tr>\n      <tr>\n        <td>Diagnostyka komputerowa</td>\n        <td>30 min</td>\n        <td>90 zł</td>\n      </tr>\n      <tr>\n        <td>Wymiana opon</td>\n        <td>40 min</td>\n        <td>100 zł</td>\n      </tr>\n    </tbody>\n  </table>\n\n  <p id=\"uwaga\">Ceny zawierają podatek VAT.</p>\n</body>\n</html>\n"},{"name":"styl.css","content":"body {\n  font-family: Arial, sans-serif;\n  margin: 24px;\n}\n\ntable {\n  width: 100%;\n  border-collapse: collapse;\n}\n\nth {\n  background-color: #263238;\n  color: #ffffff;\n  text-align: left;\n}\n\nth,\ntd {\n  padding: 8px;\n  border: 1px solid #b0bec5;\n}\n\ntbody tr:nth-child(even) {\n  background-color: #eceff1;\n}\n\ntd:last-child {\n  text-align: right;\n}\n"}]$q0$::jsonb,
  $q0$[{"id":"t1","name":"DOCTYPE i język strony pl","points":1,"type":"html_lang_doctype","page":"index.html","lang":"pl"},{"id":"t2","name":"Tytuł strony: Cennik","points":1,"type":"selector_text","page":"index.html","selector":"title","mode":"equals","value":"Cennik"},{"id":"t3","name":"Nagłówek h1: Cennik warsztatu","points":1,"type":"selector_text","page":"index.html","selector":"h1","mode":"equals","value":"Cennik warsztatu"},{"id":"t4","name":"Tabela #cennik","points":1,"type":"selector_count","page":"index.html","selector":"table#cennik","min":1,"max":1},{"id":"t5","name":"Podpis tabeli (caption): Cennik usług","points":2,"type":"selector_text","page":"index.html","selector":"table#cennik > caption","mode":"equals","value":"Cennik usług"},{"id":"t6","name":"Trzy nagłówki kolumn w thead","points":2,"type":"selector_count","page":"index.html","selector":"table#cennik > thead th","min":3,"max":3},{"id":"t7","name":"Nagłówki mają scope=col","points":2,"type":"selector_count","page":"index.html","selector":"table#cennik th[scope=col]","min":3},{"id":"t8","name":"Nagłówek pierwszej kolumny: Usługa","points":1,"type":"selector_text","page":"index.html","selector":"thead th:nth-child(1)","mode":"equals","value":"Usługa"},{"id":"t9","name":"Nagłówek ostatniej kolumny: Cena","points":1,"type":"selector_text","page":"index.html","selector":"thead th:nth-child(3)","mode":"equals","value":"Cena"},{"id":"t10","name":"Co najmniej pięć wierszy w tbody","points":2,"type":"selector_count","page":"index.html","selector":"table#cennik > tbody > tr","min":5},{"id":"t11","name":"Każdy wiersz ma trzy komórki td","points":2,"type":"selector_count","page":"index.html","selector":"tbody tr td:nth-child(3)","min":5},{"id":"t12","name":"Akapit z uwagą o VAT","points":1,"type":"selector_text","page":"index.html","selector":"p#uwaga","mode":"equals","value":"Ceny zawierają podatek VAT."},{"id":"t13","name":"Obramowania komórek scalone","points":2,"type":"css_computed","page":"index.html","selector":"table#cennik","property":"border-collapse","expected":"collapse"},{"id":"t14","name":"Nagłówek: tło #263238","points":2,"type":"css_computed","page":"index.html","selector":"thead th","property":"background-color","expected":"#263238"},{"id":"t15","name":"Nagłówek: biały tekst","points":1,"type":"css_computed","page":"index.html","selector":"thead th","property":"color","expected":"#ffffff"},{"id":"t16","name":"Zebra: parzysty wiersz ma tło #eceff1","points":3,"type":"css_computed","page":"index.html","selector":"tbody tr:nth-child(2)","property":"background-color","expected":"#eceff1"},{"id":"t17","name":"Odstęp wewnętrzny komórek 8px","points":1,"type":"css_computed","page":"index.html","selector":"tbody td","property":"padding-top","expected":"8px"},{"id":"t18","name":"Ceny wyrównane do prawej","points":2,"type":"css_computed","page":"index.html","selector":"tbody tr:nth-child(1) td:last-child","property":"text-align","expected":"right"},{"id":"t19","name":"Struktura nagłówków (jeden h1)","points":1,"type":"heading_structure","page":"index.html"},{"id":"t20","name":"Tabela nie jest stylowana atrybutami (bez border= i bgcolor=)","points":1,"type":"file_content","file":"index.html","mode":"regex","value":"(border|bgcolor|cellpadding|cellspacing)\\s*=","ignoreCase":true,"negate":true}]$q0$::jsonb,
  $q0$[{"id":"k1","name":"Czytelność tabeli","description":"Odstępy, kontrast, zebra — tabelę dobrze się czyta.","points":4},{"id":"k2","name":"Poprawna semantyka","description":"thead/tbody/caption użyte zgodnie z przeznaczeniem.","points":3},{"id":"k3","name":"Porządek w kodzie","description":"Wcięcia, brak powtórzeń w CSS.","points":3}]$q0$::jsonb,
  60, false, true, true
where not exists (select 1 from practical_tasks where title = $q0$Cennik w tabeli (HTML/CSS)$q0$);

-- =============================================================================
-- ZADANIE 2 — Formularz rejestracyjny z walidacją (HTML/CSS/JS)
-- 34 pkt automatycznie + 10 pkt ręcznie, 90 min
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  $q0$Formularz rejestracyjny z walidacją (HTML/CSS/JS)$q0$,
  $q0$Formularz z etykietami i skrypt, który sprawdza dane i wyświetla pierwszy napotkany błąd.$q0$,
  $q0$## Zadanie: formularz rejestracyjny

Przygotuj stronę z formularzem zakładania konta. Dane sprawdza **Twój skrypt** —
przeglądarka nie ma ich blokować. Pracuj w plikach `index.html`, `styl.css`
i `skrypt.js`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **90 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony: **Rejestracja**. Nagłówek pierwszego stopnia: **Rejestracja konta**.
3. Formularz o identyfikatorze `formularz` z atrybutem `novalidate` (walidację robi skrypt).
4. W formularzu pięć pól, **każde z powiązaną etykietą** `<label>` (atrybuty `for` i `id`):
   - `imie` — pole tekstowe,
   - `email` — pole typu `email`,
   - `haslo` — pole typu `password`,
   - `powtorz` — drugie pole typu `password`,
   - `regulamin` — pole wyboru (checkbox).
5. Przycisk `<button type="submit">` z napisem **Zarejestruj**.
6. Dwa puste akapity: `blad` (komunikat o błędzie) i `sukces` (komunikat o powodzeniu).

### 2. Plik styl.css

1. Tło strony `#f5f7fa`.
2. Przycisk w formularzu: tło `#1565c0`, biały tekst.
3. Akapit `blad` ma kolor tekstu `#c62828`, akapit `sukces` — `#2e7d32`.
4. Pola formularza ułóż czytelnie, jedno pod drugim (ocenia nauczyciel).

### 3. Plik skrypt.js

Po wysłaniu formularza (zdarzenie `submit`, strona **nie** może się przeładować)
sprawdzaj dane **w tej kolejności** i wyświetl w akapicie `blad` tylko **pierwszy** napotkany błąd:

1. imię puste → **Podaj imię**,
2. e-mail bez znaku `@` albo bez kropki po `@` → **Podaj poprawny e-mail**,
3. hasło krótsze niż 8 znaków → **Hasło musi mieć co najmniej 8 znaków**,
4. hasła różne → **Hasła nie są takie same**,
5. regulamin niezaznaczony → **Zaakceptuj regulamin**.

Gdy wszystko jest poprawne, akapit `blad` jest pusty, a w akapicie `sukces`
pojawia się tekst **Konto zostało utworzone dla: ** i imię z formularza.
Przy kolejnym wysłaniu stare komunikaty znikają. Nie używaj okienek `alert`.

### Przykład

Imię `Ola`, e-mail `olaexample.com` → w akapicie `blad`: *Podaj poprawny e-mail*.
Imię `Ola`, e-mail `ola@example.com`, hasło i powtórzenie `tajnehaslo1`, regulamin zaznaczony →
w akapicie `sukces`: *Konto zostało utworzone dla: Ola*.
$q0$,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Rejestracja</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n\n  <!-- Tutaj wstaw nagłówek, formularz i akapity na komunikaty -->\n\n  <script src=\"skrypt.js\"></script>\n</body>\n</html>\n"},{"name":"styl.css","content":"/* Tutaj wpisz style strony */\n"},{"name":"skrypt.js","content":"// Tutaj wpisz skrypt sprawdzający formularz\n"}]$q0$::jsonb,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Rejestracja</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <h1>Rejestracja konta</h1>\n\n  <form id=\"formularz\" novalidate>\n    <div>\n      <label for=\"imie\">Imię</label>\n      <input type=\"text\" id=\"imie\" name=\"imie\">\n    </div>\n    <div>\n      <label for=\"email\">E-mail</label>\n      <input type=\"email\" id=\"email\" name=\"email\">\n    </div>\n    <div>\n      <label for=\"haslo\">Hasło</label>\n      <input type=\"password\" id=\"haslo\" name=\"haslo\">\n    </div>\n    <div>\n      <label for=\"powtorz\">Powtórz hasło</label>\n      <input type=\"password\" id=\"powtorz\" name=\"powtorz\">\n    </div>\n    <div>\n      <input type=\"checkbox\" id=\"regulamin\" name=\"regulamin\">\n      <label for=\"regulamin\">Akceptuję regulamin</label>\n    </div>\n    <button type=\"submit\">Zarejestruj</button>\n  </form>\n\n  <p id=\"blad\"></p>\n  <p id=\"sukces\"></p>\n\n  <script src=\"skrypt.js\"></script>\n</body>\n</html>\n"},{"name":"styl.css","content":"body {\n  background-color: #f5f7fa;\n  font-family: Arial, sans-serif;\n  margin: 24px;\n}\n\nform div {\n  margin-bottom: 12px;\n}\n\nlabel {\n  display: inline-block;\n  min-width: 120px;\n}\n\nbutton {\n  background-color: #1565c0;\n  color: #ffffff;\n  border: none;\n  padding: 8px 20px;\n  cursor: pointer;\n}\n\n#blad {\n  color: #c62828;\n}\n\n#sukces {\n  color: #2e7d32;\n}\n"},{"name":"skrypt.js","content":"var formularz = document.getElementById(\"formularz\");\nvar blad = document.getElementById(\"blad\");\nvar sukces = document.getElementById(\"sukces\");\n\nformularz.addEventListener(\"submit\", function (zdarzenie) {\n  zdarzenie.preventDefault();\n  blad.textContent = \"\";\n  sukces.textContent = \"\";\n\n  var imie = document.getElementById(\"imie\").value.trim();\n  var email = document.getElementById(\"email\").value.trim();\n  var haslo = document.getElementById(\"haslo\").value;\n  var powtorz = document.getElementById(\"powtorz\").value;\n  var regulamin = document.getElementById(\"regulamin\").checked;\n\n  var komunikat = \"\";\n  if (imie === \"\") {\n    komunikat = \"Podaj imię\";\n  } else if (email.indexOf(\"@\") < 1 || email.indexOf(\".\", email.indexOf(\"@\")) === -1) {\n    komunikat = \"Podaj poprawny e-mail\";\n  } else if (haslo.length < 8) {\n    komunikat = \"Hasło musi mieć co najmniej 8 znaków\";\n  } else if (haslo !== powtorz) {\n    komunikat = \"Hasła nie są takie same\";\n  } else if (!regulamin) {\n    komunikat = \"Zaakceptuj regulamin\";\n  }\n\n  if (komunikat !== \"\") {\n    blad.textContent = komunikat;\n    return;\n  }\n\n  sukces.textContent = \"Konto zostało utworzone dla: \" + imie;\n});\n"}]$q0$::jsonb,
  $q0$[{"id":"t1","name":"DOCTYPE i język strony pl","points":1,"type":"html_lang_doctype","page":"index.html","lang":"pl"},{"id":"t2","name":"Tytuł strony: Rejestracja","points":1,"type":"selector_text","page":"index.html","selector":"title","mode":"equals","value":"Rejestracja"},{"id":"t3","name":"Nagłówek h1: Rejestracja konta","points":1,"type":"selector_text","page":"index.html","selector":"h1","mode":"equals","value":"Rejestracja konta"},{"id":"t4","name":"Formularz #formularz z atrybutem novalidate","points":2,"type":"selector_count","page":"index.html","selector":"form#formularz[novalidate]","min":1,"max":1},{"id":"t5","name":"Pola mają etykiety (min. 5)","points":3,"type":"form_labels","page":"index.html","min":5},{"id":"t6","name":"Pole e-mail ma typ email","points":1,"type":"selector_attribute","page":"index.html","selector":"#email","attribute":"type","mode":"equals","value":"email"},{"id":"t7","name":"Pole hasła ma typ password","points":1,"type":"selector_attribute","page":"index.html","selector":"#haslo","attribute":"type","mode":"equals","value":"password"},{"id":"t8","name":"Pole wyboru #regulamin (checkbox)","points":1,"type":"selector_attribute","page":"index.html","selector":"#regulamin","attribute":"type","mode":"equals","value":"checkbox"},{"id":"t9","name":"Przycisk Zarejestruj","points":1,"type":"selector_text","page":"index.html","selector":"#formularz button[type=submit]","mode":"equals","value":"Zarejestruj"},{"id":"t10","name":"Tło strony #f5f7fa","points":1,"type":"css_computed","page":"index.html","selector":"body","property":"background-color","expected":"#f5f7fa"},{"id":"t11","name":"Przycisk: tło #1565c0","points":1,"type":"css_computed","page":"index.html","selector":"#formularz button","property":"background-color","expected":"#1565c0"},{"id":"t12","name":"Błąd: kolor tekstu #c62828","points":1,"type":"css_computed","page":"index.html","selector":"#blad","property":"color","expected":"#c62828"},{"id":"t13","name":"Sukces: kolor tekstu #2e7d32","points":1,"type":"css_computed","page":"index.html","selector":"#sukces","property":"color","expected":"#2e7d32"},{"id":"t14","name":"Skrypt działa bez błędów","points":2,"type":"no_js_errors","page":"index.html"},{"id":"t15","name":"Skrypt używa addEventListener","points":1,"type":"file_content","file":"skrypt.js","mode":"contains","value":"addEventListener"},{"id":"t16","name":"Bez okienek alert","points":1,"type":"file_content","file":"skrypt.js","mode":"contains","value":"alert(","negate":true},{"id":"t17","name":"Puste imię → Podaj imię","points":2,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":""},{"action":"fill","selector":"#email","value":"ola@example.com"},{"action":"fill","selector":"#haslo","value":"tajnehaslo1"},{"action":"fill","selector":"#powtorz","value":"tajnehaslo1"},{"action":"click","selector":"#regulamin"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#blad","mode":"equals","value":"Podaj imię"}},{"id":"t18","name":"E-mail bez @ → Podaj poprawny e-mail","points":2,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":"Ola"},{"action":"fill","selector":"#email","value":"olaexample.com"},{"action":"fill","selector":"#haslo","value":"tajnehaslo1"},{"action":"fill","selector":"#powtorz","value":"tajnehaslo1"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#blad","mode":"equals","value":"Podaj poprawny e-mail"}},{"id":"t19","name":"Krótkie hasło → komunikat o 8 znakach","points":2,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":"Ola"},{"action":"fill","selector":"#email","value":"ola@example.com"},{"action":"fill","selector":"#haslo","value":"krotkie"},{"action":"fill","selector":"#powtorz","value":"krotkie"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#blad","mode":"equals","value":"Hasło musi mieć co najmniej 8 znaków"}},{"id":"t20","name":"Różne hasła → Hasła nie są takie same","points":2,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":"Ola"},{"action":"fill","selector":"#email","value":"ola@example.com"},{"action":"fill","selector":"#haslo","value":"tajnehaslo1"},{"action":"fill","selector":"#powtorz","value":"innehaslo22"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#blad","mode":"equals","value":"Hasła nie są takie same"}},{"id":"t21","name":"Brak zgody → Zaakceptuj regulamin","points":2,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":"Ola"},{"action":"fill","selector":"#email","value":"ola@example.com"},{"action":"fill","selector":"#haslo","value":"tajnehaslo1"},{"action":"fill","selector":"#powtorz","value":"tajnehaslo1"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#blad","mode":"equals","value":"Zaakceptuj regulamin"}},{"id":"t22","name":"Poprawne dane → komunikat sukcesu","points":3,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":"Ola"},{"action":"fill","selector":"#email","value":"ola@example.com"},{"action":"fill","selector":"#haslo","value":"tajnehaslo1"},{"action":"fill","selector":"#powtorz","value":"tajnehaslo1"},{"action":"click","selector":"#regulamin"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#sukces","mode":"equals","value":"Konto zostało utworzone dla: Ola"}},{"id":"t23","name":"Poprawne dane → pusty komunikat błędu","points":1,"type":"interaction","page":"index.html","steps":[{"action":"fill","selector":"#imie","value":"Ola"},{"action":"fill","selector":"#email","value":"ola@example.com"},{"action":"fill","selector":"#haslo","value":"tajnehaslo1"},{"action":"fill","selector":"#powtorz","value":"tajnehaslo1"},{"action":"click","selector":"#regulamin"},{"action":"click","selector":"#formularz button"}],"expect":{"selector":"#blad","mode":"equals","value":""}}]$q0$::jsonb,
  $q0$[{"id":"k1","name":"Czytelny układ formularza","description":"Pola jedno pod drugim, etykiety równo, odstępy.","points":4},{"id":"k2","name":"Czytelność i porządek kodu","description":"Wcięcia, sensowne nazwy zmiennych, brak zbędnego kodu.","points":3},{"id":"k3","name":"Komunikaty zrozumiałe dla użytkownika","description":"Błąd i sukces widoczne, stare komunikaty znikają przy kolejnym wysłaniu.","points":3}]$q0$::jsonb,
  90, false, true, true
where not exists (select 1 from practical_tasks where title = $q0$Formularz rejestracyjny z walidacją (HTML/CSS/JS)$q0$);

-- =============================================================================
-- ZADANIE 3 — Galeria responsywna (HTML/CSS)
-- 27 pkt automatycznie + 10 pkt ręcznie, 60 min
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  $q0$Galeria responsywna (HTML/CSS)$q0$,
  $q0$Galeria sześciu obrazków, która na telefonie ustawia się w jednej kolumnie (media queries).$q0$,
  $q0$## Zadanie: galeria responsywna

Zbuduj stronę z galerią, która dobrze wygląda i na komputerze, i na telefonie.
Pracuj w plikach `index.html` i `styl.css`. Adresy obrazków znajdziesz w pliku
`obrazy.txt` — skopiuj je do atrybutów `src`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony: **Galeria**. Nagłówek pierwszego stopnia: **Moja galeria**.
3. Element `<section>` o identyfikatorze `galeria`, a w nim **sześć** elementów `<figure>`.
4. Każdy `<figure>` zawiera `<img>` z **opisem alternatywnym** (`alt`) oraz `<figcaption>`
   z nazwą koloru.

### 2. Plik styl.css

1. Tło strony: `#fafafa`, czcionka bezszeryfowa.
2. `#galeria` jest kontenerem elastycznym (`display: flex`) z zawijaniem elementów;
   na szerokim ekranie obrazki leżą **w rzędzie** (`flex-direction: row`).
3. Obrazki nigdy nie wychodzą poza swój kontener (`max-width: 100%`).
4. Podpisy `figcaption` są wyśrodkowane.
5. **Media query**: gdy okno ma szerokość **do 600 px**, `#galeria` układa elementy
   **w kolumnie** (`flex-direction: column`).

Układ przy 1024 px i przy 375 px sprawdzisz przyciskiem testów — strona jest wtedy
oglądana przy obu szerokościach.
$q0$,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Galeria</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n\n  <!-- Tutaj wstaw nagłówek i galerię -->\n\n</body>\n</html>\n"},{"name":"styl.css","content":"/* Tutaj wpisz style galerii */\n"},{"name":"obrazy.txt","content":"Adresy obrazków do atrybutów src:\n\n1. Czerwony\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e57373'/%3E%3C/svg%3E\n\n2. Niebieski\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%2364b5f6'/%3E%3C/svg%3E\n\n3. Zielony\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%2381c784'/%3E%3C/svg%3E\n\n4. Żółty\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ffd54f'/%3E%3C/svg%3E\n\n5. Fioletowy\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ba68c8'/%3E%3C/svg%3E\n\n6. Morski\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%234db6ac'/%3E%3C/svg%3E\n"}]$q0$::jsonb,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Galeria</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <h1>Moja galeria</h1>\n\n  <section id=\"galeria\">\n    <figure>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e57373'/%3E%3C/svg%3E\" alt=\"Kolorowy prostokąt: czerwony\">\n      <figcaption>Czerwony</figcaption>\n    </figure>\n    <figure>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%2364b5f6'/%3E%3C/svg%3E\" alt=\"Kolorowy prostokąt: niebieski\">\n      <figcaption>Niebieski</figcaption>\n    </figure>\n    <figure>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%2381c784'/%3E%3C/svg%3E\" alt=\"Kolorowy prostokąt: zielony\">\n      <figcaption>Zielony</figcaption>\n    </figure>\n    <figure>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ffd54f'/%3E%3C/svg%3E\" alt=\"Kolorowy prostokąt: żółty\">\n      <figcaption>Żółty</figcaption>\n    </figure>\n    <figure>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ba68c8'/%3E%3C/svg%3E\" alt=\"Kolorowy prostokąt: fioletowy\">\n      <figcaption>Fioletowy</figcaption>\n    </figure>\n    <figure>\n      <img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%234db6ac'/%3E%3C/svg%3E\" alt=\"Kolorowy prostokąt: morski\">\n      <figcaption>Morski</figcaption>\n    </figure>\n  </section>\n</body>\n</html>\n"},{"name":"styl.css","content":"body {\n  background-color: #fafafa;\n  font-family: Arial, sans-serif;\n  margin: 16px;\n}\n\n#galeria {\n  display: flex;\n  flex-direction: row;\n  flex-wrap: wrap;\n  gap: 16px;\n}\n\nfigure {\n  margin: 0;\n  flex: 1 1 30%;\n}\n\nimg {\n  max-width: 100%;\n  display: block;\n}\n\nfigcaption {\n  text-align: center;\n  padding: 6px 0;\n}\n\n@media (max-width: 600px) {\n  #galeria {\n    flex-direction: column;\n  }\n}\n"},{"name":"obrazy.txt","content":"Adresy obrazków do atrybutów src:\n\n1. Czerwony\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23e57373'/%3E%3C/svg%3E\n\n2. Niebieski\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%2364b5f6'/%3E%3C/svg%3E\n\n3. Zielony\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%2381c784'/%3E%3C/svg%3E\n\n4. Żółty\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ffd54f'/%3E%3C/svg%3E\n\n5. Fioletowy\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23ba68c8'/%3E%3C/svg%3E\n\n6. Morski\ndata:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%234db6ac'/%3E%3C/svg%3E\n"}]$q0$::jsonb,
  $q0$[{"id":"t1","name":"DOCTYPE i język strony pl","points":1,"type":"html_lang_doctype","page":"index.html","lang":"pl"},{"id":"t2","name":"Tytuł strony: Galeria","points":1,"type":"selector_text","page":"index.html","selector":"title","mode":"equals","value":"Galeria"},{"id":"t3","name":"Nagłówek h1: Moja galeria","points":1,"type":"selector_text","page":"index.html","selector":"h1","mode":"equals","value":"Moja galeria"},{"id":"t4","name":"Struktura nagłówków (jeden h1)","points":1,"type":"heading_structure","page":"index.html"},{"id":"t5","name":"Sekcja #galeria","points":1,"type":"selector_count","page":"index.html","selector":"section#galeria","min":1,"max":1},{"id":"t6","name":"Sześć elementów figure w galerii","points":2,"type":"selector_count","page":"index.html","selector":"#galeria > figure","min":6,"max":6},{"id":"t7","name":"Każdy figure ma figcaption","points":1,"type":"selector_count","page":"index.html","selector":"#galeria figure > figcaption","min":6},{"id":"t8","name":"Obrazki mają opis alt (min. 6)","points":3,"type":"images_alt","page":"index.html","min":6},{"id":"t9","name":"Tło strony #fafafa","points":1,"type":"css_computed","page":"index.html","selector":"body","property":"background-color","expected":"#fafafa"},{"id":"t10","name":"Galeria jest kontenerem flex","points":2,"type":"css_computed","page":"index.html","selector":"#galeria","property":"display","expected":"flex"},{"id":"t11","name":"Szeroki ekran (1024 px): układ w rzędzie","points":3,"type":"css_computed","page":"index.html","selector":"#galeria","property":"flex-direction","expected":"row","viewport":1024},{"id":"t12","name":"Telefon (375 px): układ w kolumnie","points":4,"type":"css_computed","page":"index.html","selector":"#galeria","property":"flex-direction","expected":"column","viewport":375},{"id":"t13","name":"W stylach jest media query z szerokością","points":3,"type":"css_media","page":"index.html","min":1},{"id":"t14","name":"Obrazki nie wychodzą poza kontener (max-width 100%)","points":2,"type":"css_computed","page":"index.html","selector":"#galeria img","property":"max-width","expected":"100%"},{"id":"t15","name":"Podpisy wyśrodkowane","points":1,"type":"css_computed","page":"index.html","selector":"figcaption","property":"text-align","expected":"center"}]$q0$::jsonb,
  $q0$[{"id":"k1","name":"Wygląd galerii","description":"Odstępy, równe rozmiary, czytelne podpisy.","points":4},{"id":"k2","name":"Znaczące opisy alt","description":"Opisy mówią, co jest na obrazku, a nie „obrazek 1”.","points":3},{"id":"k3","name":"Porządek w kodzie","description":"Wcięcia, brak powtórzeń w CSS, sensowna kolejność reguł.","points":3}]$q0$::jsonb,
  60, false, true, true
where not exists (select 1 from practical_tasks where title = $q0$Galeria responsywna (HTML/CSS)$q0$);

-- =============================================================================
-- ZADANIE 4 — Licznik i przełącznik motywu (HTML/CSS/JS)
-- 34 pkt automatycznie + 10 pkt ręcznie, 60 min
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  $q0$Licznik i przełącznik motywu (HTML/CSS/JS)$q0$,
  $q0$Licznik z przyciskami +, − i reset oraz przełączanie jasnego i ciemnego motywu klasą CSS.$q0$,
  $q0$## Zadanie: licznik i motyw strony

Zbuduj prostą aplikację: licznik, który można zwiększać, zmniejszać i zerować,
oraz przycisk zmieniający motyw strony. Pracuj w plikach `index.html`, `styl.css`
i `skrypt.js`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją `<!DOCTYPE html>`, język strony to `pl`, kodowanie UTF-8.
2. Tytuł strony: **Licznik**. Nagłówek pierwszego stopnia: **Licznik**.
3. Element `<span>` o identyfikatorze `wartosc` z początkową treścią **0**.
4. Cztery przyciski: `plus` (napis **+**), `minus` (napis **-**), `reset` (napis **Reset**)
   oraz `motyw` (napis **Zmień motyw**).
5. Akapit o identyfikatorze `info` na komunikaty (na starcie pusty).

### 2. Plik styl.css

1. Strona ma białe tło (`#ffffff`) i ciemny tekst (`#212121`).
2. Klasa `.ciemny` nadana elementowi `body` zmienia tło na `#212121`, a tekst na `#ffffff`.

### 3. Plik skrypt.js

1. **+** zwiększa wartość o 1, **-** zmniejsza o 1, **Reset** ustawia **0**.
   Aktualna wartość jest zawsze widoczna w elemencie `wartosc`.
2. Wartość **nie może być ujemna**: gdy jest `0` i klikniesz **-**, wartość zostaje `0`,
   a w akapicie `info` pojawia się **Wartość nie może być ujemna**.
3. Gdy wartość dojdzie do **10**, w akapicie `info` wyświetl **Osiągnięto 10!**.
   Gdy spadnie poniżej 10 albo po resecie — akapit `info` jest znów pusty.
4. Przycisk **Zmień motyw** przełącza klasę `ciemny` na elemencie `body`
   (metoda `classList.toggle`). Kolejne kliknięcie wraca do jasnego motywu.
5. Używaj `addEventListener`; nie wstawiaj treści przez `innerHTML`.
$q0$,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Licznik</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n\n  <!-- Tutaj wstaw nagłówek, licznik, przyciski i akapit z komunikatem -->\n\n  <script src=\"skrypt.js\"></script>\n</body>\n</html>\n"},{"name":"styl.css","content":"/* Tutaj wpisz style, w tym motyw ciemny */\n"},{"name":"skrypt.js","content":"// Tutaj wpisz skrypt licznika\n"}]$q0$::jsonb,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Licznik</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <h1>Licznik</h1>\n\n  <p>Wartość: <span id=\"wartosc\">0</span></p>\n\n  <button id=\"plus\">+</button>\n  <button id=\"minus\">-</button>\n  <button id=\"reset\">Reset</button>\n  <button id=\"motyw\">Zmień motyw</button>\n\n  <p id=\"info\"></p>\n\n  <script src=\"skrypt.js\"></script>\n</body>\n</html>\n"},{"name":"styl.css","content":"body {\n  background-color: #ffffff;\n  color: #212121;\n  font-family: Arial, sans-serif;\n  margin: 24px;\n}\n\nbody.ciemny {\n  background-color: #212121;\n  color: #ffffff;\n}\n\nbutton {\n  padding: 6px 14px;\n  margin-right: 6px;\n}\n"},{"name":"skrypt.js","content":"var wartosc = 0;\nvar pole = document.getElementById(\"wartosc\");\nvar info = document.getElementById(\"info\");\n\nfunction odswiez() {\n  pole.textContent = wartosc;\n  info.textContent = wartosc >= 10 ? \"Osiągnięto 10!\" : \"\";\n}\n\ndocument.getElementById(\"plus\").addEventListener(\"click\", function () {\n  wartosc++;\n  odswiez();\n});\n\ndocument.getElementById(\"minus\").addEventListener(\"click\", function () {\n  if (wartosc === 0) {\n    info.textContent = \"Wartość nie może być ujemna\";\n    return;\n  }\n  wartosc--;\n  odswiez();\n});\n\ndocument.getElementById(\"reset\").addEventListener(\"click\", function () {\n  wartosc = 0;\n  odswiez();\n});\n\ndocument.getElementById(\"motyw\").addEventListener(\"click\", function () {\n  document.body.classList.toggle(\"ciemny\");\n});\n"}]$q0$::jsonb,
  $q0$[{"id":"t1","name":"DOCTYPE i język strony pl","points":1,"type":"html_lang_doctype","page":"index.html","lang":"pl"},{"id":"t2","name":"Tytuł strony: Licznik","points":1,"type":"selector_text","page":"index.html","selector":"title","mode":"equals","value":"Licznik"},{"id":"t3","name":"Nagłówek h1: Licznik","points":1,"type":"selector_text","page":"index.html","selector":"h1","mode":"equals","value":"Licznik"},{"id":"t4","name":"Wartość początkowa 0","points":1,"type":"selector_text","page":"index.html","selector":"span#wartosc","mode":"equals","value":"0"},{"id":"t5","name":"Cztery przyciski o właściwych identyfikatorach","points":2,"type":"selector_count","page":"index.html","selector":"button#plus, button#minus, button#reset, button#motyw","min":4,"max":4},{"id":"t6","name":"Akapit #info jest na starcie pusty","points":1,"type":"selector_text","page":"index.html","selector":"p#info","mode":"equals","value":""},{"id":"t7","name":"Tło strony #ffffff","points":1,"type":"css_computed","page":"index.html","selector":"body","property":"background-color","expected":"#ffffff"},{"id":"t8","name":"Kolor tekstu #212121","points":1,"type":"css_computed","page":"index.html","selector":"body","property":"color","expected":"#212121"},{"id":"t9","name":"Styl .ciemny w arkuszu","points":2,"type":"file_content","file":"styl.css","mode":"regex","value":"\\.ciemny"},{"id":"t10","name":"Skrypt działa bez błędów","points":2,"type":"no_js_errors","page":"index.html"},{"id":"t11","name":"Skrypt używa addEventListener i classList","points":2,"type":"file_content","file":"skrypt.js","mode":"regex","value":"addEventListener[\\s\\S]*classList|classList[\\s\\S]*addEventListener"},{"id":"t12","name":"Bez innerHTML","points":1,"type":"file_content","file":"skrypt.js","mode":"contains","value":"innerHTML","negate":true},{"id":"t13","name":"Trzy kliknięcia + → 3","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"}],"expect":{"selector":"#wartosc","mode":"equals","value":"3"}},{"id":"t14","name":"+ + − → 1","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#minus"}],"expect":{"selector":"#wartosc","mode":"equals","value":"1"}},{"id":"t15","name":"Reset po kliknięciach → 0","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#reset"}],"expect":{"selector":"#wartosc","mode":"equals","value":"0"}},{"id":"t16","name":"Minus przy 0: wartość zostaje 0","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#minus"}],"expect":{"selector":"#wartosc","mode":"equals","value":"0"}},{"id":"t17","name":"Minus przy 0: komunikat o ujemnej wartości","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#minus"}],"expect":{"selector":"#info","mode":"equals","value":"Wartość nie może być ujemna"}},{"id":"t18","name":"Przy 10: komunikat Osiągnięto 10!","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"}],"expect":{"selector":"#info","mode":"equals","value":"Osiągnięto 10!"}},{"id":"t19","name":"Reset czyści komunikat","points":1,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#plus"},{"action":"click","selector":"#reset"}],"expect":{"selector":"#info","mode":"equals","value":""}},{"id":"t20","name":"Przycisk motywu nadaje klasę ciemny","points":3,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#motyw"}],"expect":{"selector":"body","mode":"attribute","attribute":"class","value":"ciemny"}},{"id":"t21","name":"Drugie kliknięcie wraca do jasnego motywu","points":2,"type":"interaction","page":"index.html","steps":[{"action":"click","selector":"#motyw"},{"action":"click","selector":"#motyw"}],"expect":{"selector":"body","mode":"attribute","attribute":"class","value":""}}]$q0$::jsonb,
  $q0$[{"id":"k1","name":"Czytelność i porządek kodu","description":"Wcięcia, sensowne nazwy, brak powtarzania tej samej logiki.","points":4},{"id":"k2","name":"Wygląd motywów","description":"Oba motywy są czytelne, kontrast tekstu i tła.","points":3},{"id":"k3","name":"Obsługa skrajnych przypadków","description":"Zachowanie przy 0 i 10 jest sensowne i zrozumiałe.","points":3}]$q0$::jsonb,
  60, false, true, true
where not exists (select 1 from practical_tasks where title = $q0$Licznik i przełącznik motywu (HTML/CSS/JS)$q0$);

-- =============================================================================
-- ZADANIE 5 — Strona firmowa z trzech podstron (HTML/CSS)
-- 36 pkt automatycznie + 10 pkt ręcznie, 90 min
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  $q0$Strona firmowa z trzech podstron (HTML/CSS)$q0$,
  $q0$Trzy powiązane pliki HTML, wspólne menu, semantyczny układ i jeden arkusz stylów.$q0$,
  $q0$## Zadanie: strona firmowa z trzech podstron

Zbuduj małą stronę pracowni „Pracownia Zielona”. Składa się z trzech plików
`index.html`, `o-nas.html` i `kontakt.html`, które korzystają z **jednego** arkusza
`styl.css`. Podgląd otworzysz przyciskiem **Uruchom**; przełączaj strony listą nad podglądem.

Czas: **90 minut**.

### 1. Każda z trzech stron

1. Deklaracja `<!DOCTYPE html>`, język `pl`, kodowanie UTF-8, połączenie z `styl.css`.
2. Tytuły stron: **Strona główna**, **O nas**, **Kontakt** (w tej kolejności dla plików).
3. Układ semantyczny: `<header>` z menu `<nav>`, `<main>` z treścią, `<footer>`.
4. W `<nav>` **trzy linki** do wszystkich podstron: **Start** (`index.html`),
   **O nas** (`o-nas.html`), **Kontakt** (`kontakt.html`) — na każdej stronie te same.
5. Dokładnie **jeden** nagłówek `<h1>` (**Witamy**, **O nas**, **Kontakt**), bez przeskoków
   poziomów (po `h1` może być `h2`, nie od razu `h4`).
6. W stopce akapit: **© 2026 Pracownia Zielona**.

### 2. Dodatkowo na stronie Kontakt

W `<main>` formularz z trzema polami, każde z etykietą `<label>`:
imię (`text`), e-mail (`email`) i wiadomość (`textarea`), oraz przycisk **Wyślij**.

### 3. Plik styl.css

1. Nagłówek `header` ma tło `#1b5e20`, a linki w menu — biały kolor tekstu.
2. Menu `nav` jest ułożone w rzędzie (`display: flex`) z odstępem między linkami.
3. Stopka `footer` ma wyśrodkowany tekst i tło `#e8f5e9`.
4. Czcionka strony: bezszeryfowa.
$q0$,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Strona główna</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n\n  <!-- header z menu, main z nagłówkiem, footer -->\n\n</body>\n</html>\n"},{"name":"o-nas.html","content":"<!-- Tutaj zbuduj stronę „O nas” na wzór index.html -->\n"},{"name":"kontakt.html","content":"<!-- Tutaj zbuduj stronę „Kontakt” z formularzem -->\n"},{"name":"styl.css","content":"/* Wspólny arkusz stylów dla wszystkich stron */\n"}]$q0$::jsonb,
  $q0$[{"name":"index.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Strona główna</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <header>\n    <nav>\n      <a href=\"index.html\">Start</a>\n      <a href=\"o-nas.html\">O nas</a>\n      <a href=\"kontakt.html\">Kontakt</a>\n    </nav>\n  </header>\n  <main>\n    <h1>Witamy</h1>\n    <p>Pracownia Zielona zajmuje się projektowaniem ogrodów.</p>\n  </main>\n  <footer>\n    <p>© 2026 Pracownia Zielona</p>\n  </footer>\n</body>\n</html>\n"},{"name":"o-nas.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>O nas</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <header>\n    <nav>\n      <a href=\"index.html\">Start</a>\n      <a href=\"o-nas.html\">O nas</a>\n      <a href=\"kontakt.html\">Kontakt</a>\n    </nav>\n  </header>\n  <main>\n    <h1>O nas</h1>\n    <h2>Nasz zespół</h2>\n    <p>Od 2010 roku tworzymy ogrody dla domów i firm.</p>\n  </main>\n  <footer>\n    <p>© 2026 Pracownia Zielona</p>\n  </footer>\n</body>\n</html>\n"},{"name":"kontakt.html","content":"<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Kontakt</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <header>\n    <nav>\n      <a href=\"index.html\">Start</a>\n      <a href=\"o-nas.html\">O nas</a>\n      <a href=\"kontakt.html\">Kontakt</a>\n    </nav>\n  </header>\n  <main>\n    <h1>Kontakt</h1>\n    <form>\n      <p><label for=\"imie\">Imię</label> <input type=\"text\" id=\"imie\" name=\"imie\"></p>\n      <p><label for=\"email\">E-mail</label> <input type=\"email\" id=\"email\" name=\"email\"></p>\n      <p><label for=\"wiadomosc\">Wiadomość</label><br><textarea id=\"wiadomosc\" name=\"wiadomosc\" rows=\"4\"></textarea></p>\n      <button type=\"submit\">Wyślij</button>\n    </form>\n  </main>\n  <footer>\n    <p>© 2026 Pracownia Zielona</p>\n  </footer>\n</body>\n</html>\n"},{"name":"styl.css","content":"body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n}\n\nheader {\n  background-color: #1b5e20;\n  padding: 12px 24px;\n}\n\nnav {\n  display: flex;\n  gap: 24px;\n}\n\nnav a {\n  color: #ffffff;\n  text-decoration: none;\n}\n\nmain {\n  padding: 24px;\n}\n\nfooter {\n  background-color: #e8f5e9;\n  text-align: center;\n  padding: 12px;\n}\n"}]$q0$::jsonb,
  $q0$[{"id":"t1","name":"index.html: DOCTYPE i język pl","points":1,"type":"html_lang_doctype","page":"index.html","lang":"pl"},{"id":"t2","name":"index.html: tytuł „Strona główna”","points":1,"type":"selector_text","page":"index.html","selector":"title","mode":"equals","value":"Strona główna"},{"id":"t3","name":"index.html: nagłówek h1 „Witamy”","points":1,"type":"selector_text","page":"index.html","selector":"main h1","mode":"equals","value":"Witamy"},{"id":"t4","name":"index.html: header, main i footer","points":1,"type":"selector_count","page":"index.html","selector":"body > header nav, body > main, body > footer","min":3},{"id":"t5","name":"index.html: trzy linki w menu","points":1,"type":"selector_count","page":"index.html","selector":"header nav a","min":3,"max":3},{"id":"t6","name":"index.html: linki prowadzą do plików projektu","points":1,"type":"links_valid","page":"index.html","min":3},{"id":"t7","name":"index.html: struktura nagłówków","points":1,"type":"heading_structure","page":"index.html"},{"id":"t8","name":"index.html: stopka z informacją o prawach","points":1,"type":"selector_text","page":"index.html","selector":"footer p","mode":"contains","value":"© 2026 Pracownia Zielona"},{"id":"t9","name":"o-nas.html: DOCTYPE i język pl","points":1,"type":"html_lang_doctype","page":"o-nas.html","lang":"pl"},{"id":"t10","name":"o-nas.html: tytuł „O nas”","points":1,"type":"selector_text","page":"o-nas.html","selector":"title","mode":"equals","value":"O nas"},{"id":"t11","name":"o-nas.html: nagłówek h1 „O nas”","points":1,"type":"selector_text","page":"o-nas.html","selector":"main h1","mode":"equals","value":"O nas"},{"id":"t12","name":"o-nas.html: header, main i footer","points":1,"type":"selector_count","page":"o-nas.html","selector":"body > header nav, body > main, body > footer","min":3},{"id":"t13","name":"o-nas.html: trzy linki w menu","points":1,"type":"selector_count","page":"o-nas.html","selector":"header nav a","min":3,"max":3},{"id":"t14","name":"o-nas.html: linki prowadzą do plików projektu","points":1,"type":"links_valid","page":"o-nas.html","min":3},{"id":"t15","name":"o-nas.html: struktura nagłówków","points":1,"type":"heading_structure","page":"o-nas.html"},{"id":"t16","name":"o-nas.html: stopka z informacją o prawach","points":1,"type":"selector_text","page":"o-nas.html","selector":"footer p","mode":"contains","value":"© 2026 Pracownia Zielona"},{"id":"t17","name":"kontakt.html: DOCTYPE i język pl","points":1,"type":"html_lang_doctype","page":"kontakt.html","lang":"pl"},{"id":"t18","name":"kontakt.html: tytuł „Kontakt”","points":1,"type":"selector_text","page":"kontakt.html","selector":"title","mode":"equals","value":"Kontakt"},{"id":"t19","name":"kontakt.html: nagłówek h1 „Kontakt”","points":1,"type":"selector_text","page":"kontakt.html","selector":"main h1","mode":"equals","value":"Kontakt"},{"id":"t20","name":"kontakt.html: header, main i footer","points":1,"type":"selector_count","page":"kontakt.html","selector":"body > header nav, body > main, body > footer","min":3},{"id":"t21","name":"kontakt.html: trzy linki w menu","points":1,"type":"selector_count","page":"kontakt.html","selector":"header nav a","min":3,"max":3},{"id":"t22","name":"kontakt.html: linki prowadzą do plików projektu","points":1,"type":"links_valid","page":"kontakt.html","min":3},{"id":"t23","name":"kontakt.html: struktura nagłówków","points":1,"type":"heading_structure","page":"kontakt.html"},{"id":"t24","name":"kontakt.html: stopka z informacją o prawach","points":1,"type":"selector_text","page":"kontakt.html","selector":"footer p","mode":"contains","value":"© 2026 Pracownia Zielona"},{"id":"t25","name":"Kontakt: pola formularza mają etykiety","points":3,"type":"form_labels","page":"kontakt.html","min":3},{"id":"t26","name":"Kontakt: pole wiadomości to textarea","points":1,"type":"selector_count","page":"kontakt.html","selector":"form textarea","min":1,"max":1},{"id":"t27","name":"Kontakt: przycisk Wyślij","points":1,"type":"selector_text","page":"kontakt.html","selector":"form button","mode":"equals","value":"Wyślij"},{"id":"t28","name":"Header: tło #1b5e20","points":1,"type":"css_computed","page":"index.html","selector":"header","property":"background-color","expected":"#1b5e20"},{"id":"t29","name":"Header na podstronie O nas ma ten sam styl","points":1,"type":"css_computed","page":"o-nas.html","selector":"header","property":"background-color","expected":"#1b5e20"},{"id":"t30","name":"Menu ułożone w rzędzie (flex)","points":2,"type":"css_computed","page":"index.html","selector":"nav","property":"display","expected":"flex"},{"id":"t31","name":"Linki menu: biały tekst","points":1,"type":"css_computed","page":"index.html","selector":"nav a","property":"color","expected":"#ffffff"},{"id":"t32","name":"Stopka: wyśrodkowany tekst","points":1,"type":"css_computed","page":"kontakt.html","selector":"footer","property":"text-align","expected":"center"},{"id":"t33","name":"Stopka: tło #e8f5e9","points":1,"type":"css_computed","page":"index.html","selector":"footer","property":"background-color","expected":"#e8f5e9"}]$q0$::jsonb,
  $q0$[{"id":"k1","name":"Spójny wygląd wszystkich stron","description":"Strony wyglądają jak jedna witryna, menu w tym samym miejscu.","points":4},{"id":"k2","name":"Sensowna treść i nazwy plików","description":"Treść ma sens, pliki nazwane zgodnie z poleceniem.","points":3},{"id":"k3","name":"Porządek w kodzie","description":"Wcięcia, brak powtórzeń w CSS, jeden arkusz dla wszystkich.","points":3}]$q0$::jsonb,
  90, false, true, true
where not exists (select 1 from practical_tasks where title = $q0$Strona firmowa z trzech podstron (HTML/CSS)$q0$);
