-- =============================================================================
-- INF.03 — dane startowe. Uruchom PO schema.sql i 002_test_pin.sql.
-- PIN-y testów są losowane automatycznie — sprawdzisz je w panelu admina (zakładka Testy).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Kategorie (kolejność = sekwencja programu nauczania)
-- -----------------------------------------------------------------------------
insert into categories (id, position, title, description) values
  ('html-css',     1, 'HTML i CSS',                   'Struktura dokumentu, semantyka, style, układ strony i responsywność.'),
  ('javascript',   2, 'JavaScript',                   'Skrypty po stronie klienta: składnia, DOM, zdarzenia, walidacja formularzy.'),
  ('php',          3, 'PHP',                          'Skrypty po stronie serwera, obsługa formularzy, sesje, komunikacja z bazą.'),
  ('sql',          4, 'Bazy danych i SQL',            'Projektowanie baz, DDL, DML, zapytania, złączenia, agregacja, uprawnienia.'),
  ('serwer',       5, 'Administracja serwerem WWW',   'Środowisko XAMPP, Apache, HTTP, phpMyAdmin, hosting i publikacja.'),
  ('cms',          6, 'CMS',                          'Systemy zarządzania treścią na przykładzie WordPressa.'),
  ('bezpieczenstwo',7,'Bezpieczeństwo aplikacji',     'SQL injection, XSS, przechowywanie haseł, HTTPS, OWASP Top 10.'),
  ('dokumentacja', 8, 'Dokumentacja i wdrożenie',     'Walidacja kodu, dokumentowanie, wersjonowanie, dostępność, wdrożenie.');

-- -----------------------------------------------------------------------------
-- Podtematy
-- -----------------------------------------------------------------------------
insert into subtopics (id, category_id, position, title, theory_url, tasks_url) values
  -- 1. HTML i CSS
  ('html-struktura',   'html-css', 1, 'Struktura dokumentu HTML5 i znaczniki semantyczne', 'https://developer.mozilla.org/en-US/docs/Web/HTML', 'https://www.w3schools.com/html/html_exercises.asp'),
  ('html-tabele-formularze','html-css', 2, 'Tabele, listy i formularze',             'https://www.w3schools.com/html/html_forms.asp', 'https://www.w3schools.com/html/html_exercises.asp'),
  ('html-multimedia',  'html-css', 3, 'Grafika i multimedia (formaty, atrybuty, optymalizacja)', 'https://www.w3schools.com/html/html_images.asp', null),
  ('css-selektory',    'html-css', 4, 'Selektory, kaskada, dziedziczenie, model pudełkowy', 'https://developer.mozilla.org/en-US/docs/Web/CSS', 'https://www.w3schools.com/css/css_exercises.asp'),
  ('css-uklad',        'html-css', 5, 'Układ strony: Flexbox, Grid, pozycjonowanie',       'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout', 'https://www.w3schools.com/css/css_exercises.asp'),
  ('css-rwd',          'html-css', 6, 'RWD i media queries',                               'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries', null),

  -- 2. JavaScript
  ('js-podstawy',      'javascript', 1, 'Zmienne, typy danych i operatory',                'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'https://www.w3schools.com/js/js_exercises.asp'),
  ('js-sterowanie',    'javascript', 2, 'Instrukcje warunkowe, pętle i funkcje',           'https://www.w3schools.com/js/js_functions.asp', 'https://www.w3schools.com/js/js_exercises.asp'),
  ('js-tablice-obiekty','javascript',3, 'Tablice, obiekty i ich metody',                   'https://www.w3schools.com/js/js_arrays.asp', 'https://www.w3schools.com/js/js_exercises.asp'),
  ('js-dom',           'javascript', 4, 'DOM i obsługa zdarzeń',                           'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model', null),
  ('js-formularze',    'javascript', 5, 'Walidacja formularzy po stronie klienta',         'https://www.w3schools.com/js/js_validation.asp', null),

  -- 3. PHP
  ('php-skladnia',     'php', 1, 'Składnia, zmienne, typy i instrukcje sterujące',         'https://www.php.net/manual/pl/langref.php', 'https://www.w3schools.com/php/php_exercises.asp'),
  ('php-funkcje-tablice','php', 2, 'Funkcje i tablice (indeksowane, asocjacyjne)',         'https://www.w3schools.com/php/php_arrays.asp', 'https://www.w3schools.com/php/php_exercises.asp'),
  ('php-formularze',   'php', 3, 'Obsługa formularzy: $_GET, $_POST',                      'https://www.w3schools.com/php/php_forms.asp', null),
  ('php-mysqli',       'php', 4, 'Połączenie z bazą MySQL (mysqli)',                       'https://www.php.net/manual/pl/book.mysqli.php', null),
  ('php-sesje',        'php', 5, 'Sesje i ciasteczka',                                     'https://www.w3schools.com/php/php_sessions.asp', null),

  -- 4. Bazy danych i SQL
  ('sql-projektowanie','sql', 1, 'Projektowanie bazy: encje, relacje, klucze, normalizacja', 'https://www.w3schools.com/sql/sql_primarykey.asp', null),
  ('sql-ddl',          'sql', 2, 'DDL: CREATE, ALTER, DROP',                               'https://www.w3schools.com/sql/sql_create_table.asp', 'https://www.w3schools.com/sql/sql_exercises.asp'),
  ('sql-select',       'sql', 3, 'SELECT, WHERE, ORDER BY, LIMIT',                         'https://www.w3schools.com/sql/sql_select.asp', 'https://www.w3schools.com/sql/sql_exercises.asp'),
  ('sql-join',         'sql', 4, 'Złączenia tabel (JOIN)',                                 'https://www.w3schools.com/sql/sql_join.asp', 'https://www.w3schools.com/sql/sql_exercises.asp'),
  ('sql-agregacja',    'sql', 5, 'Funkcje agregujące, GROUP BY, HAVING',                   'https://www.w3schools.com/sql/sql_groupby.asp', 'https://www.w3schools.com/sql/sql_exercises.asp'),
  ('sql-dml',          'sql', 6, 'DML: INSERT, UPDATE, DELETE',                            'https://www.w3schools.com/sql/sql_insert.asp', 'https://www.w3schools.com/sql/sql_exercises.asp'),
  ('sql-uprawnienia',  'sql', 7, 'Użytkownicy i uprawnienia: GRANT, REVOKE',               'https://dev.mysql.com/doc/refman/8.0/en/grant.html', null),

  -- 5. Administracja serwerem WWW
  ('srv-xampp',        'serwer', 1, 'Środowisko XAMPP (Apache, MySQL/MariaDB, PHP)',       'https://www.apachefriends.org/', null),
  ('srv-http',         'serwer', 2, 'Protokół HTTP: metody, nagłówki, kody odpowiedzi',    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status', null),
  ('srv-apache',       'serwer', 3, 'Konfiguracja Apache i hosty wirtualne',               'https://httpd.apache.org/docs/2.4/vhosts/', null),
  ('srv-phpmyadmin',   'serwer', 4, 'phpMyAdmin: import, eksport, kopie zapasowe',         'https://docs.phpmyadmin.net/', null),
  ('srv-hosting',      'serwer', 5, 'Hosting, domeny, DNS i FTP',                          'https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name', null),

  -- 6. CMS
  ('cms-instalacja',   'cms', 1, 'Instalacja i konfiguracja WordPressa',                   'https://wordpress.org/documentation/', null),
  ('cms-motywy',       'cms', 2, 'Motywy i wtyczki',                                       'https://wordpress.org/documentation/', null),
  ('cms-tresci',       'cms', 3, 'Strony, wpisy, menu, media, role użytkowników',          'https://wordpress.org/documentation/', null),
  ('cms-aktualizacje', 'cms', 4, 'Aktualizacje i kopie zapasowe CMS',                     'https://wordpress.org/documentation/', null),

  -- 7. Bezpieczeństwo aplikacji
  ('sec-sqli',         'bezpieczenstwo', 1, 'SQL injection i zapytania przygotowane',      'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html', null),
  ('sec-xss',          'bezpieczenstwo', 2, 'XSS i escapowanie danych wyjściowych',        'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', null),
  ('sec-hasla',        'bezpieczenstwo', 3, 'Przechowywanie haseł (password_hash)',        'https://www.php.net/manual/pl/function.password-hash.php', null),
  ('sec-https',        'bezpieczenstwo', 4, 'HTTPS i certyfikaty TLS',                     'https://letsencrypt.org/docs/', null),
  ('sec-owasp',        'bezpieczenstwo', 5, 'OWASP Top 10 — przegląd zagrożeń',            'https://owasp.org/www-project-top-ten/', null),

  -- 8. Dokumentacja i wdrożenie
  ('doc-walidacja',    'dokumentacja', 1, 'Walidacja kodu HTML/CSS (W3C)',                  'https://validator.w3.org/', null),
  ('doc-komentarze',   'dokumentacja', 2, 'Komentarze i dokumentacja kodu',                 'https://www.php.net/manual/pl/language.basic-syntax.comments.php', null),
  ('doc-git',          'dokumentacja', 3, 'Wersjonowanie kodu (Git)',                       'https://git-scm.com/book/pl/v2', null),
  ('doc-dostepnosc',   'dokumentacja', 4, 'Dostępność (WCAG)',                              'https://www.w3.org/WAI/standards-guidelines/wcag/', null),
  ('doc-wdrozenie',    'dokumentacja', 5, 'Publikacja aplikacji na serwerze i testowanie', null, null);

-- -----------------------------------------------------------------------------
-- Przykładowe testy (pytania publiczne w tests, odpowiedzi w test_keys)
-- -----------------------------------------------------------------------------

with t as (
  insert into tests (title, time_limit, questions) values (
    'HTML i CSS — podstawy', 600,
    '[
      {"type":"closed","text":"Który znacznik HTML tworzy nagłówek najwyższego stopnia?","options":["<h1>","<head>","<header>","<h6>"]},
      {"type":"select","text":"Która właściwość CSS zmienia kolor tekstu?","options":["color","background-color","font-color","text-color"]},
      {"type":"input","text":"Podaj nazwę atrybutu znacznika <img>, który zawiera tekst alternatywny."},
      {"type":"closed","text":"Który selektor CSS wybiera element o id=\"menu\"?","options":["#menu",".menu","menu","*menu"]},
      {"type":"select","text":"Jaka wartość właściwości display tworzy kontener Flexbox?","options":["flex","block","inline","table"]}
    ]'::jsonb
  ) returning id
)
insert into test_keys (test_id, answers)
select id, '[["<h1>"],["color"],["alt"],["#menu"],["flex"]]'::jsonb from t;

with t as (
  insert into tests (title, time_limit, questions) values (
    'SQL — zapytania', 600,
    '[
      {"type":"closed","text":"Które polecenie SQL służy do pobierania danych z tabeli?","options":["SELECT","INSERT","UPDATE","DELETE"]},
      {"type":"select","text":"Która klauzula sortuje wyniki zapytania?","options":["ORDER BY","GROUP BY","SORT BY","HAVING"]},
      {"type":"input","text":"Podaj nazwę funkcji agregującej, która zlicza wiersze."},
      {"type":"closed","text":"Które złączenie zwraca wszystkie wiersze z lewej tabeli, nawet bez dopasowania w prawej?","options":["LEFT JOIN","INNER JOIN","RIGHT JOIN","CROSS JOIN"]},
      {"type":"input","text":"Jakie słowo kluczowe po SELECT usuwa z wyniku powtarzające się wiersze?"}
    ]'::jsonb
  ) returning id
)
insert into test_keys (test_id, answers)
select id, '[["SELECT"],["ORDER BY"],["COUNT","COUNT()","COUNT(*)"],["LEFT JOIN"],["DISTINCT"]]'::jsonb from t;

with t as (
  insert into tests (title, time_limit, questions) values (
    'PHP — podstawy', 480,
    '[
      {"type":"closed","text":"Od jakiego znaku zaczyna się nazwa zmiennej w PHP?","options":["$","@","#","&"]},
      {"type":"select","text":"Która tablica superglobalna przechowuje dane wysłane formularzem metodą POST?","options":["$_POST","$_GET","$_SESSION","$_COOKIE"]},
      {"type":"input","text":"Jaki operator służy w PHP do łączenia (konkatenacji) napisów? Wpisz sam znak."},
      {"type":"closed","text":"Która funkcja jest zalecana do bezpiecznego haszowania haseł?","options":["password_hash()","md5()","sha1()","base64_encode()"]},
      {"type":"select","text":"Która funkcja (mysqli, styl proceduralny) wykonuje zapytanie do bazy?","options":["mysqli_query","mysqli_connect","mysqli_fetch_row","mysqli_close"]}
    ]'::jsonb
  ) returning id
)
insert into test_keys (test_id, answers)
select id, '[["$"],["$_POST"],[".","kropka"],["password_hash()"],["mysqli_query"]]'::jsonb from t;
