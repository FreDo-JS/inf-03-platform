-- =============================================================================
-- 038_praktyka_react_zadanie.sql — zadanie praktyczne „Lista zakupow (React)"
--
-- Uruchom po 037_praktyka_react.sql (potrzebne: kolumna runtime, pliki .jsx
-- i typ testu source_matches).
--
-- PLIK JEST GENEROWANY — nie edytuj go ręcznie.
-- Źródło: scripts/praktyka/react-lista.mjs → node scripts/praktyka/react-lista.mjs
--
-- 20 testów automatycznych (53 pkt)
-- + 3 kryteria ręczne (10 pkt) = 63 pkt.
-- Rozwiązanie wzorcowe przechodzi wszystkie testy automatyczne; pliki startowe
-- dają tylko punkty za szkielet dokumentu i obecność plików.
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'practical_tasks' and column_name = 'runtime') then
    raise exception 'Brakuje migracji 037_praktyka_react.sql — uruchom ją przed 038.';
  end if;
end $$;

-- Ponowne uruchomienie aktualizuje zadanie zamiast dodawać drugie o tym samym
-- tytule (tak samo jak 017). Sesje wskazują zadanie przez id, więc poprawka
-- treści nie zrywa powiązań.
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, runtime, is_ready
)
select
  'Lista zakupow (React)',
  'Komponenty, props i stan: lista zakupow z dodawaniem, usuwaniem i licznikiem.',
  '## Lista zakupow w Reakcie

Czas: **60 minut**. Pracujesz w plikach `index.html`, `styl.css`, `app.jsx`
i `Produkt.jsx`. Plik `index.html` jest gotowy — nie musisz go zmieniac.

### Co ma dzialac

1. Aplikacja montuje sie w `<div id="root">` przez `createRoot` z `react-dom/client`.
2. Na stronie jest naglowek `<h1>` z tekstem **Lista zakupow**.
3. Formularz sklada sie z pola tekstowego (`<input>`) i przycisku **Dodaj**.
4. Po dodaniu produktu pojawia sie on jako element listy `<ul class="produkty">`.
   Pusta nazwa (same spacje) nie dodaje nic.
5. Kazdy produkt to **osobny komponent** w pliku `Produkt.jsx`: dostaje nazwe przez
   props i ma wlasny przycisk **Usun**, ktory kasuje tylko ten produkt.
6. Gdy lista jest pusta, widac akapit `Brak produktow na liscie`
   (z klasa `pusta`) — zamiast listy, nie obok niej.
7. Pod lista jest akapit z liczba produktow w formie `Produkty: 3`.

### Wymagania techniczne

- Stan trzymasz w `useState`. Nie uzywaj `innerHTML` ani `document.createElement` —
  strona ma powstawac z komponentow.
- `Produkt.jsx` eksportuje komponent domyslnie (`export default`), a `app.jsx` go importuje.

### Wymagania CSS (plik styl.css)

- przycisk z `cursor: pointer`,
- akapit `Brak produktow na liscie` kursywa (`font-style: italic`),
- lista `ul.produkty` bez kropek — tego nie sprawdza test automatyczny,
  bo przy pustej liscie nie ma czego mierzyc; patrzy na to nauczyciel.

### Przyklad

Wpisujesz `mleko`, klikasz **Dodaj** — na liscie pojawia sie `mleko`, a licznik
pokazuje `Produkty: 1`. Klikasz **Usun** przy tym produkcie — lista znika,
a na jej miejscu widac `Brak produktow na liscie`.
',
  '[
  {
    "name": "index.html",
    "content": "<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Lista zakupow</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script src=\"app.jsx\"></script>\n</body>\n</html>\n"
  },
  {
    "name": "styl.css",
    "content": "body {\n  margin: 0;\n  padding: 24px;\n  font-family: Arial, Helvetica, sans-serif;\n  background: #f4f6f8;\n}\n\n/* Style do uzupelnienia zgodnie z trescia zadania. */\n"
  },
  {
    "name": "app.jsx",
    "content": "// Tutaj zbuduj komponent listy zakupow i zamontuj go w <div id=\"root\">.\n//\n// Dostepne importy: \"react\", \"react-dom/client\" oraz pliki tego projektu\n// (np. \"./Produkt.jsx\"). Nie uzywaj innerHTML ani recznego tworzenia\n// elementow - cala strona ma powstawac z komponentow.\n"
  },
  {
    "name": "Produkt.jsx",
    "content": "// Tutaj zbuduj komponent pojedynczego produktu.\n// Ma przyjmowac dane przez props i byc eksportowany domyslnie.\n"
  }
]'::jsonb,
  '[
  {
    "name": "index.html",
    "content": "<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Lista zakupow</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script src=\"app.jsx\"></script>\n</body>\n</html>\n"
  },
  {
    "name": "styl.css",
    "content": "body {\n  margin: 0;\n  padding: 24px;\n  font-family: Arial, Helvetica, sans-serif;\n  background: #f4f6f8;\n}\n\n.panel {\n  max-width: 420px;\n  margin: 0 auto;\n  padding: 20px;\n  background: #ffffff;\n  border: 1px solid #d7dde3;\n}\n\nh1 {\n  margin-top: 0;\n  font-size: 22px;\n}\n\nform {\n  display: flex;\n  gap: 8px;\n}\n\ninput {\n  flex: 1;\n  padding: 8px;\n  border: 1px solid #b9c3cc;\n}\n\nbutton {\n  padding: 8px 14px;\n  border: 1px solid #1f7a8c;\n  background: #1f7a8c;\n  color: #ffffff;\n  cursor: pointer;\n}\n\nul.produkty {\n  list-style-type: none;\n  margin: 16px 0;\n  padding: 0;\n}\n\nli.produkt {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 8px 0;\n  border-bottom: 1px solid #e3e8ec;\n}\n\n.pusta {\n  color: #6b7a87;\n  font-style: italic;\n}\n\n.licznik {\n  margin-bottom: 0;\n  font-weight: bold;\n}\n"
  },
  {
    "name": "app.jsx",
    "content": "import { useState } from \"react\";\nimport { createRoot } from \"react-dom/client\";\nimport Produkt from \"./Produkt.jsx\";\n\nfunction Lista() {\n  const [produkty, setProdukty] = useState([]);\n  const [nazwa, setNazwa] = useState(\"\");\n\n  function dodaj(event) {\n    event.preventDefault();\n    const czysta = nazwa.trim();\n    if (czysta === \"\") return;\n    setProdukty([...produkty, czysta]);\n    setNazwa(\"\");\n  }\n\n  function usun(index) {\n    setProdukty(produkty.filter((_, i) => i !== index));\n  }\n\n  return (\n    <div className=\"panel\">\n      <h1>Lista zakupow</h1>\n\n      <form onSubmit={dodaj}>\n        <input\n          id=\"nazwa\"\n          value={nazwa}\n          placeholder=\"np. mleko\"\n          onChange={(event) => setNazwa(event.target.value)}\n        />\n        <button type=\"submit\">Dodaj</button>\n      </form>\n\n      {produkty.length === 0 ? (\n        <p className=\"pusta\">Brak produktow na liscie</p>\n      ) : (\n        <ul className=\"produkty\">\n          {produkty.map((produkt, index) => (\n            <Produkt key={produkt + index} nazwa={produkt} onUsun={() => usun(index)} />\n          ))}\n        </ul>\n      )}\n\n      <p className=\"licznik\">Produkty: {produkty.length}</p>\n    </div>\n  );\n}\n\ncreateRoot(document.getElementById(\"root\")).render(<Lista />);\n"
  },
  {
    "name": "Produkt.jsx",
    "content": "export default function Produkt({ nazwa, onUsun }) {\n  return (\n    <li className=\"produkt\">\n      <span className=\"nazwa\">{nazwa}</span>\n      <button type=\"button\" className=\"usun\" onClick={onUsun}>\n        Usun\n      </button>\n    </li>\n  );\n}\n"
  }
]'::jsonb,
  '[
  {
    "id": "r-plik-app",
    "name": "Plik app.jsx ma tresc",
    "type": "file_not_empty",
    "file": "app.jsx",
    "points": 1
  },
  {
    "id": "r-plik-prod",
    "name": "Plik Produkt.jsx ma tresc",
    "type": "file_not_empty",
    "file": "Produkt.jsx",
    "points": 1
  },
  {
    "id": "r-doctype",
    "name": "Poprawny szkielet dokumentu",
    "type": "html_lang_doctype",
    "page": "index.html",
    "lang": "pl",
    "points": 2
  },
  {
    "id": "r-mount",
    "name": "Aplikacja montowana przez createRoot",
    "description": "Sprawdzenie kodu: w app.jsx jest wywolanie createRoot.",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "regex",
    "value": "createRoot\\s*\\(",
    "points": 3
  },
  {
    "id": "r-usestate",
    "name": "Stan trzymany w useState",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "contains",
    "value": "useState",
    "points": 3
  },
  {
    "id": "r-import",
    "name": "app.jsx importuje komponent z Produkt.jsx",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "regex",
    "value": "from\\s*[''\"]\\./Produkt",
    "points": 3
  },
  {
    "id": "r-export",
    "name": "Produkt.jsx eksportuje komponent domyslnie",
    "type": "source_matches",
    "file": "Produkt.jsx",
    "mode": "regex",
    "value": "export\\s+default",
    "points": 3
  },
  {
    "id": "r-props",
    "name": "Komponent Produkt korzysta z props nazwa",
    "type": "source_matches",
    "file": "Produkt.jsx",
    "mode": "contains",
    "value": "nazwa",
    "points": 2
  },
  {
    "id": "r-bez-innerhtml",
    "name": "Bez innerHTML",
    "description": "Strona ma powstawac z komponentow, nie z recznie wpisywanego HTML-a.",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "not_contains",
    "value": "innerHTML",
    "points": 2
  },
  {
    "id": "r-bez-createelement",
    "name": "Bez document.createElement",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "not_contains",
    "value": "document.createElement",
    "points": 1
  },
  {
    "id": "r-naglowek",
    "name": "Naglowek h1 z tytulem listy",
    "type": "selector_text",
    "page": "index.html",
    "selector": "h1",
    "mode": "contains",
    "value": "lista zakup",
    "ignoreCase": true,
    "points": 2
  },
  {
    "id": "r-formularz",
    "name": "Formularz z polem i przyciskiem",
    "type": "selector_count",
    "page": "index.html",
    "selector": "form input",
    "min": 1,
    "points": 2
  },
  {
    "id": "r-pusta-lista",
    "name": "Na start komunikat o pustej liscie",
    "type": "selector_text",
    "page": "index.html",
    "selector": ".pusta",
    "mode": "contains",
    "value": "brak produkt",
    "ignoreCase": true,
    "points": 3
  },
  {
    "id": "r-css-pusta",
    "name": "Komunikat o pustej liscie kursywa",
    "type": "css_computed",
    "page": "index.html",
    "selector": ".pusta",
    "property": "font-style",
    "expected": "italic",
    "points": 2
  },
  {
    "id": "r-css-kursor",
    "name": "Przycisk z kursorem wskaznika",
    "type": "css_computed",
    "page": "index.html",
    "selector": "button",
    "property": "cursor",
    "expected": "pointer",
    "points": 2
  },
  {
    "id": "r-dodaj",
    "name": "Dodanie produktu pojawia sie na liscie",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": "ul",
      "mode": "contains",
      "value": "mleko"
    },
    "points": 6
  },
  {
    "id": "r-dwa",
    "name": "Dwa produkty to dwa elementy listy",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      },
      {
        "action": "fill",
        "selector": "form input",
        "value": "chleb"
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": "ul li:nth-child(2)",
      "mode": "contains",
      "value": "chleb"
    },
    "points": 5
  },
  {
    "id": "r-licznik",
    "name": "Licznik produktow sie zgadza",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      },
      {
        "action": "fill",
        "selector": "form input",
        "value": "chleb"
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": ".licznik",
      "mode": "contains",
      "value": "2"
    },
    "points": 3
  },
  {
    "id": "r-puste-pole",
    "name": "Puste pole nie dodaje produktu",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "   "
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": ".pusta",
      "mode": "exists"
    },
    "points": 2
  },
  {
    "id": "r-usun",
    "name": "Usuniecie produktu czysci liste",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      },
      {
        "action": "click",
        "selector": "ul li button"
      }
    ],
    "expect": {
      "selector": ".pusta",
      "mode": "exists"
    },
    "points": 5
  }
]'::jsonb,
  '[
  {
    "id": "r-k-podzial",
    "name": "Sensowny podzial na komponenty",
    "description": "Czy komponent Produkt odpowiada za jeden element listy i dostaje dane przez props, a nie siega po stan rodzica ani nie powtarza jego logiki.",
    "points": 4
  },
  {
    "id": "r-k-stan",
    "name": "Poprawna praca ze stanem",
    "description": "Czy stan jest aktualizowany bez mutacji (nowa tablica zamiast push), czy pole formularza jest kontrolowane i czyszczone po dodaniu.",
    "points": 4
  },
  {
    "id": "r-k-czytelnosc",
    "name": "Czytelnosc kodu i wyglad",
    "description": "Nazwy, wciecia, brak zakomentowanych fragmentow; strona wyglada schludnie.",
    "points": 2
  }
]'::jsonb,
  60,
  true,
  true,
  'react',
  true
where not exists (select 1 from practical_tasks where title = 'Lista zakupow (React)');

update practical_tasks set
  summary = 'Komponenty, props i stan: lista zakupow z dodawaniem, usuwaniem i licznikiem.',
  content_md = '## Lista zakupow w Reakcie

Czas: **60 minut**. Pracujesz w plikach `index.html`, `styl.css`, `app.jsx`
i `Produkt.jsx`. Plik `index.html` jest gotowy — nie musisz go zmieniac.

### Co ma dzialac

1. Aplikacja montuje sie w `<div id="root">` przez `createRoot` z `react-dom/client`.
2. Na stronie jest naglowek `<h1>` z tekstem **Lista zakupow**.
3. Formularz sklada sie z pola tekstowego (`<input>`) i przycisku **Dodaj**.
4. Po dodaniu produktu pojawia sie on jako element listy `<ul class="produkty">`.
   Pusta nazwa (same spacje) nie dodaje nic.
5. Kazdy produkt to **osobny komponent** w pliku `Produkt.jsx`: dostaje nazwe przez
   props i ma wlasny przycisk **Usun**, ktory kasuje tylko ten produkt.
6. Gdy lista jest pusta, widac akapit `Brak produktow na liscie`
   (z klasa `pusta`) — zamiast listy, nie obok niej.
7. Pod lista jest akapit z liczba produktow w formie `Produkty: 3`.

### Wymagania techniczne

- Stan trzymasz w `useState`. Nie uzywaj `innerHTML` ani `document.createElement` —
  strona ma powstawac z komponentow.
- `Produkt.jsx` eksportuje komponent domyslnie (`export default`), a `app.jsx` go importuje.

### Wymagania CSS (plik styl.css)

- przycisk z `cursor: pointer`,
- akapit `Brak produktow na liscie` kursywa (`font-style: italic`),
- lista `ul.produkty` bez kropek — tego nie sprawdza test automatyczny,
  bo przy pustej liscie nie ma czego mierzyc; patrzy na to nauczyciel.

### Przyklad

Wpisujesz `mleko`, klikasz **Dodaj** — na liscie pojawia sie `mleko`, a licznik
pokazuje `Produkty: 1`. Klikasz **Usun** przy tym produkcie — lista znika,
a na jej miejscu widac `Brak produktow na liscie`.
',
  files = '[
  {
    "name": "index.html",
    "content": "<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Lista zakupow</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script src=\"app.jsx\"></script>\n</body>\n</html>\n"
  },
  {
    "name": "styl.css",
    "content": "body {\n  margin: 0;\n  padding: 24px;\n  font-family: Arial, Helvetica, sans-serif;\n  background: #f4f6f8;\n}\n\n/* Style do uzupelnienia zgodnie z trescia zadania. */\n"
  },
  {
    "name": "app.jsx",
    "content": "// Tutaj zbuduj komponent listy zakupow i zamontuj go w <div id=\"root\">.\n//\n// Dostepne importy: \"react\", \"react-dom/client\" oraz pliki tego projektu\n// (np. \"./Produkt.jsx\"). Nie uzywaj innerHTML ani recznego tworzenia\n// elementow - cala strona ma powstawac z komponentow.\n"
  },
  {
    "name": "Produkt.jsx",
    "content": "// Tutaj zbuduj komponent pojedynczego produktu.\n// Ma przyjmowac dane przez props i byc eksportowany domyslnie.\n"
  }
]'::jsonb,
  reference_files = '[
  {
    "name": "index.html",
    "content": "<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Lista zakupow</title>\n  <link rel=\"stylesheet\" href=\"styl.css\">\n</head>\n<body>\n  <div id=\"root\"></div>\n  <script src=\"app.jsx\"></script>\n</body>\n</html>\n"
  },
  {
    "name": "styl.css",
    "content": "body {\n  margin: 0;\n  padding: 24px;\n  font-family: Arial, Helvetica, sans-serif;\n  background: #f4f6f8;\n}\n\n.panel {\n  max-width: 420px;\n  margin: 0 auto;\n  padding: 20px;\n  background: #ffffff;\n  border: 1px solid #d7dde3;\n}\n\nh1 {\n  margin-top: 0;\n  font-size: 22px;\n}\n\nform {\n  display: flex;\n  gap: 8px;\n}\n\ninput {\n  flex: 1;\n  padding: 8px;\n  border: 1px solid #b9c3cc;\n}\n\nbutton {\n  padding: 8px 14px;\n  border: 1px solid #1f7a8c;\n  background: #1f7a8c;\n  color: #ffffff;\n  cursor: pointer;\n}\n\nul.produkty {\n  list-style-type: none;\n  margin: 16px 0;\n  padding: 0;\n}\n\nli.produkt {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 8px 0;\n  border-bottom: 1px solid #e3e8ec;\n}\n\n.pusta {\n  color: #6b7a87;\n  font-style: italic;\n}\n\n.licznik {\n  margin-bottom: 0;\n  font-weight: bold;\n}\n"
  },
  {
    "name": "app.jsx",
    "content": "import { useState } from \"react\";\nimport { createRoot } from \"react-dom/client\";\nimport Produkt from \"./Produkt.jsx\";\n\nfunction Lista() {\n  const [produkty, setProdukty] = useState([]);\n  const [nazwa, setNazwa] = useState(\"\");\n\n  function dodaj(event) {\n    event.preventDefault();\n    const czysta = nazwa.trim();\n    if (czysta === \"\") return;\n    setProdukty([...produkty, czysta]);\n    setNazwa(\"\");\n  }\n\n  function usun(index) {\n    setProdukty(produkty.filter((_, i) => i !== index));\n  }\n\n  return (\n    <div className=\"panel\">\n      <h1>Lista zakupow</h1>\n\n      <form onSubmit={dodaj}>\n        <input\n          id=\"nazwa\"\n          value={nazwa}\n          placeholder=\"np. mleko\"\n          onChange={(event) => setNazwa(event.target.value)}\n        />\n        <button type=\"submit\">Dodaj</button>\n      </form>\n\n      {produkty.length === 0 ? (\n        <p className=\"pusta\">Brak produktow na liscie</p>\n      ) : (\n        <ul className=\"produkty\">\n          {produkty.map((produkt, index) => (\n            <Produkt key={produkt + index} nazwa={produkt} onUsun={() => usun(index)} />\n          ))}\n        </ul>\n      )}\n\n      <p className=\"licznik\">Produkty: {produkty.length}</p>\n    </div>\n  );\n}\n\ncreateRoot(document.getElementById(\"root\")).render(<Lista />);\n"
  },
  {
    "name": "Produkt.jsx",
    "content": "export default function Produkt({ nazwa, onUsun }) {\n  return (\n    <li className=\"produkt\">\n      <span className=\"nazwa\">{nazwa}</span>\n      <button type=\"button\" className=\"usun\" onClick={onUsun}>\n        Usun\n      </button>\n    </li>\n  );\n}\n"
  }
]'::jsonb,
  auto_tests = '[
  {
    "id": "r-plik-app",
    "name": "Plik app.jsx ma tresc",
    "type": "file_not_empty",
    "file": "app.jsx",
    "points": 1
  },
  {
    "id": "r-plik-prod",
    "name": "Plik Produkt.jsx ma tresc",
    "type": "file_not_empty",
    "file": "Produkt.jsx",
    "points": 1
  },
  {
    "id": "r-doctype",
    "name": "Poprawny szkielet dokumentu",
    "type": "html_lang_doctype",
    "page": "index.html",
    "lang": "pl",
    "points": 2
  },
  {
    "id": "r-mount",
    "name": "Aplikacja montowana przez createRoot",
    "description": "Sprawdzenie kodu: w app.jsx jest wywolanie createRoot.",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "regex",
    "value": "createRoot\\s*\\(",
    "points": 3
  },
  {
    "id": "r-usestate",
    "name": "Stan trzymany w useState",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "contains",
    "value": "useState",
    "points": 3
  },
  {
    "id": "r-import",
    "name": "app.jsx importuje komponent z Produkt.jsx",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "regex",
    "value": "from\\s*[''\"]\\./Produkt",
    "points": 3
  },
  {
    "id": "r-export",
    "name": "Produkt.jsx eksportuje komponent domyslnie",
    "type": "source_matches",
    "file": "Produkt.jsx",
    "mode": "regex",
    "value": "export\\s+default",
    "points": 3
  },
  {
    "id": "r-props",
    "name": "Komponent Produkt korzysta z props nazwa",
    "type": "source_matches",
    "file": "Produkt.jsx",
    "mode": "contains",
    "value": "nazwa",
    "points": 2
  },
  {
    "id": "r-bez-innerhtml",
    "name": "Bez innerHTML",
    "description": "Strona ma powstawac z komponentow, nie z recznie wpisywanego HTML-a.",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "not_contains",
    "value": "innerHTML",
    "points": 2
  },
  {
    "id": "r-bez-createelement",
    "name": "Bez document.createElement",
    "type": "source_matches",
    "file": "app.jsx",
    "mode": "not_contains",
    "value": "document.createElement",
    "points": 1
  },
  {
    "id": "r-naglowek",
    "name": "Naglowek h1 z tytulem listy",
    "type": "selector_text",
    "page": "index.html",
    "selector": "h1",
    "mode": "contains",
    "value": "lista zakup",
    "ignoreCase": true,
    "points": 2
  },
  {
    "id": "r-formularz",
    "name": "Formularz z polem i przyciskiem",
    "type": "selector_count",
    "page": "index.html",
    "selector": "form input",
    "min": 1,
    "points": 2
  },
  {
    "id": "r-pusta-lista",
    "name": "Na start komunikat o pustej liscie",
    "type": "selector_text",
    "page": "index.html",
    "selector": ".pusta",
    "mode": "contains",
    "value": "brak produkt",
    "ignoreCase": true,
    "points": 3
  },
  {
    "id": "r-css-pusta",
    "name": "Komunikat o pustej liscie kursywa",
    "type": "css_computed",
    "page": "index.html",
    "selector": ".pusta",
    "property": "font-style",
    "expected": "italic",
    "points": 2
  },
  {
    "id": "r-css-kursor",
    "name": "Przycisk z kursorem wskaznika",
    "type": "css_computed",
    "page": "index.html",
    "selector": "button",
    "property": "cursor",
    "expected": "pointer",
    "points": 2
  },
  {
    "id": "r-dodaj",
    "name": "Dodanie produktu pojawia sie na liscie",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": "ul",
      "mode": "contains",
      "value": "mleko"
    },
    "points": 6
  },
  {
    "id": "r-dwa",
    "name": "Dwa produkty to dwa elementy listy",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      },
      {
        "action": "fill",
        "selector": "form input",
        "value": "chleb"
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": "ul li:nth-child(2)",
      "mode": "contains",
      "value": "chleb"
    },
    "points": 5
  },
  {
    "id": "r-licznik",
    "name": "Licznik produktow sie zgadza",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      },
      {
        "action": "fill",
        "selector": "form input",
        "value": "chleb"
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": ".licznik",
      "mode": "contains",
      "value": "2"
    },
    "points": 3
  },
  {
    "id": "r-puste-pole",
    "name": "Puste pole nie dodaje produktu",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "   "
      },
      {
        "action": "click",
        "selector": "form button"
      }
    ],
    "expect": {
      "selector": ".pusta",
      "mode": "exists"
    },
    "points": 2
  },
  {
    "id": "r-usun",
    "name": "Usuniecie produktu czysci liste",
    "type": "interaction",
    "page": "index.html",
    "steps": [
      {
        "action": "fill",
        "selector": "form input",
        "value": "mleko"
      },
      {
        "action": "click",
        "selector": "form button"
      },
      {
        "action": "click",
        "selector": "ul li button"
      }
    ],
    "expect": {
      "selector": ".pusta",
      "mode": "exists"
    },
    "points": 5
  }
]'::jsonb,
  manual_criteria = '[
  {
    "id": "r-k-podzial",
    "name": "Sensowny podzial na komponenty",
    "description": "Czy komponent Produkt odpowiada za jeden element listy i dostaje dane przez props, a nie siega po stan rodzica ani nie powtarza jego logiki.",
    "points": 4
  },
  {
    "id": "r-k-stan",
    "name": "Poprawna praca ze stanem",
    "description": "Czy stan jest aktualizowany bez mutacji (nowa tablica zamiast push), czy pole formularza jest kontrolowane i czyszczone po dodaniu.",
    "points": 4
  },
  {
    "id": "r-k-czytelnosc",
    "name": "Czytelnosc kodu i wyglad",
    "description": "Nazwy, wciecia, brak zakomentowanych fragmentow; strona wyglada schludnie.",
    "points": 2
  }
]'::jsonb,
  default_minutes = 60,
  allow_new_files = true,
  student_can_run_tests = true,
  runtime = 'react',
  is_ready = true,
  updated_at = now()
where title = 'Lista zakupow (React)';
