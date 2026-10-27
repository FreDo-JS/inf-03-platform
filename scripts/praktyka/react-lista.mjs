// Zadanie praktyczne „Lista zakupów w Reakcie" — źródło migracji 038.
//
// Trzymamy je w .mjs, a nie wprost w SQL-u, z tego samego powodu co testy
// teoretyczne: ten sam plik czyta weryfikacja (uruchamia testy na rozwiązaniu
// wzorcowym w prawdziwej przeglądarce), więc treść zadania i jego testy nie
// mogą się rozjechać z tym, co wyląduje w bazie.
//
//   node scripts/praktyka/react-lista.mjs    → supabase/038_praktyka_react_zadanie.sql
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

// --------------------------------------------------------------------------
// Pliki startowe — bez rozwiązania. Układ i nazwy są wymagane przez testy,
// więc uczeń dostaje je gotowe; cała logika jest do napisania.
// --------------------------------------------------------------------------
const START_HTML = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lista zakupow</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <div id="root"></div>
  <script src="app.jsx"></script>
</body>
</html>
`;

const START_CSS = `body {
  margin: 0;
  padding: 24px;
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f6f8;
}

/* Style do uzupelnienia zgodnie z trescia zadania. */
`;

const START_APP = `// Tutaj zbuduj komponent listy zakupow i zamontuj go w <div id="root">.
//
// Dostepne importy: "react", "react-dom/client" oraz pliki tego projektu
// (np. "./Produkt.jsx"). Nie uzywaj innerHTML ani recznego tworzenia
// elementow - cala strona ma powstawac z komponentow.
`;

const START_PRODUKT = `// Tutaj zbuduj komponent pojedynczego produktu.
// Ma przyjmowac dane przez props i byc eksportowany domyslnie.
`;

// --------------------------------------------------------------------------
// Rozwiązanie wzorcowe — musi przechodzić wszystkie testy automatyczne.
// --------------------------------------------------------------------------
const REF_APP = `import { useState } from "react";
import { createRoot } from "react-dom/client";
import Produkt from "./Produkt.jsx";

function Lista() {
  const [produkty, setProdukty] = useState([]);
  const [nazwa, setNazwa] = useState("");

  function dodaj(event) {
    event.preventDefault();
    const czysta = nazwa.trim();
    if (czysta === "") return;
    setProdukty([...produkty, czysta]);
    setNazwa("");
  }

  function usun(index) {
    setProdukty(produkty.filter((_, i) => i !== index));
  }

  return (
    <div className="panel">
      <h1>Lista zakupow</h1>

      <form onSubmit={dodaj}>
        <input
          id="nazwa"
          value={nazwa}
          placeholder="np. mleko"
          onChange={(event) => setNazwa(event.target.value)}
        />
        <button type="submit">Dodaj</button>
      </form>

      {produkty.length === 0 ? (
        <p className="pusta">Brak produktow na liscie</p>
      ) : (
        <ul className="produkty">
          {produkty.map((produkt, index) => (
            <Produkt key={produkt + index} nazwa={produkt} onUsun={() => usun(index)} />
          ))}
        </ul>
      )}

      <p className="licznik">Produkty: {produkty.length}</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Lista />);
`;

const REF_PRODUKT = `export default function Produkt({ nazwa, onUsun }) {
  return (
    <li className="produkt">
      <span className="nazwa">{nazwa}</span>
      <button type="button" className="usun" onClick={onUsun}>
        Usun
      </button>
    </li>
  );
}
`;

const REF_CSS = `body {
  margin: 0;
  padding: 24px;
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f6f8;
}

.panel {
  max-width: 420px;
  margin: 0 auto;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #d7dde3;
}

h1 {
  margin-top: 0;
  font-size: 22px;
}

form {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  padding: 8px;
  border: 1px solid #b9c3cc;
}

button {
  padding: 8px 14px;
  border: 1px solid #1f7a8c;
  background: #1f7a8c;
  color: #ffffff;
  cursor: pointer;
}

ul.produkty {
  list-style-type: none;
  margin: 16px 0;
  padding: 0;
}

li.produkt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e3e8ec;
}

.pusta {
  color: #6b7a87;
  font-style: italic;
}

.licznik {
  margin-bottom: 0;
  font-weight: bold;
}
`;

const CONTENT_MD = `## Lista zakupow w Reakcie

Czas: **60 minut**. Pracujesz w plikach \`index.html\`, \`styl.css\`, \`app.jsx\`
i \`Produkt.jsx\`. Plik \`index.html\` jest gotowy — nie musisz go zmieniac.

### Co ma dzialac

1. Aplikacja montuje sie w \`<div id="root">\` przez \`createRoot\` z \`react-dom/client\`.
2. Na stronie jest naglowek \`<h1>\` z tekstem **Lista zakupow**.
3. Formularz sklada sie z pola tekstowego (\`<input>\`) i przycisku **Dodaj**.
4. Po dodaniu produktu pojawia sie on jako element listy \`<ul class="produkty">\`.
   Pusta nazwa (same spacje) nie dodaje nic.
5. Kazdy produkt to **osobny komponent** w pliku \`Produkt.jsx\`: dostaje nazwe przez
   props i ma wlasny przycisk **Usun**, ktory kasuje tylko ten produkt.
6. Gdy lista jest pusta, widac akapit \`Brak produktow na liscie\`
   (z klasa \`pusta\`) — zamiast listy, nie obok niej.
7. Pod lista jest akapit z liczba produktow w formie \`Produkty: 3\`.

### Wymagania techniczne

- Stan trzymasz w \`useState\`. Nie uzywaj \`innerHTML\` ani \`document.createElement\` —
  strona ma powstawac z komponentow.
- \`Produkt.jsx\` eksportuje komponent domyslnie (\`export default\`), a \`app.jsx\` go importuje.

### Wymagania CSS (plik styl.css)

- przycisk z \`cursor: pointer\`,
- akapit \`Brak produktow na liscie\` kursywa (\`font-style: italic\`),
- lista \`ul.produkty\` bez kropek — tego nie sprawdza test automatyczny,
  bo przy pustej liscie nie ma czego mierzyc; patrzy na to nauczyciel.

### Przyklad

Wpisujesz \`mleko\`, klikasz **Dodaj** — na liscie pojawia sie \`mleko\`, a licznik
pokazuje \`Produkty: 1\`. Klikasz **Usun** przy tym produkcie — lista znika,
a na jej miejscu widac \`Brak produktow na liscie\`.
`;

// --------------------------------------------------------------------------
// Testy automatyczne (50 pkt) + kryteria ręczne (10 pkt)
// --------------------------------------------------------------------------
const autoTests = [
  { id: "r-plik-app", name: "Plik app.jsx ma tresc", type: "file_not_empty", file: "app.jsx", points: 1 },
  { id: "r-plik-prod", name: "Plik Produkt.jsx ma tresc", type: "file_not_empty", file: "Produkt.jsx", points: 1 },
  {
    id: "r-doctype",
    name: "Poprawny szkielet dokumentu",
    type: "html_lang_doctype",
    page: "index.html",
    lang: "pl",
    points: 2,
  },
  {
    id: "r-mount",
    name: "Aplikacja montowana przez createRoot",
    description: "Sprawdzenie kodu: w app.jsx jest wywolanie createRoot.",
    type: "source_matches",
    file: "app.jsx",
    mode: "regex",
    value: "createRoot\\s*\\(",
    points: 3,
  },
  {
    id: "r-usestate",
    name: "Stan trzymany w useState",
    type: "source_matches",
    file: "app.jsx",
    mode: "contains",
    value: "useState",
    points: 3,
  },
  {
    id: "r-import",
    name: "app.jsx importuje komponent z Produkt.jsx",
    type: "source_matches",
    file: "app.jsx",
    mode: "regex",
    value: "from\\s*['\"]\\./Produkt",
    points: 3,
  },
  {
    id: "r-export",
    name: "Produkt.jsx eksportuje komponent domyslnie",
    type: "source_matches",
    file: "Produkt.jsx",
    mode: "regex",
    value: "export\\s+default",
    points: 3,
  },
  {
    id: "r-props",
    name: "Komponent Produkt korzysta z props nazwa",
    type: "source_matches",
    file: "Produkt.jsx",
    mode: "contains",
    value: "nazwa",
    points: 2,
  },
  {
    id: "r-bez-innerhtml",
    name: "Bez innerHTML",
    description: "Strona ma powstawac z komponentow, nie z recznie wpisywanego HTML-a.",
    type: "source_matches",
    file: "app.jsx",
    mode: "not_contains",
    value: "innerHTML",
    points: 2,
  },
  {
    id: "r-bez-createelement",
    name: "Bez document.createElement",
    type: "source_matches",
    file: "app.jsx",
    mode: "not_contains",
    value: "document.createElement",
    points: 1,
  },
  {
    id: "r-naglowek",
    name: "Naglowek h1 z tytulem listy",
    type: "selector_text",
    page: "index.html",
    selector: "h1",
    mode: "contains",
    value: "lista zakup",
    ignoreCase: true,
    points: 2,
  },
  {
    id: "r-formularz",
    name: "Formularz z polem i przyciskiem",
    type: "selector_count",
    page: "index.html",
    selector: "form input",
    min: 1,
    points: 2,
  },
  {
    id: "r-pusta-lista",
    name: "Na start komunikat o pustej liscie",
    type: "selector_text",
    page: "index.html",
    selector: ".pusta",
    mode: "contains",
    value: "brak produkt",
    ignoreCase: true,
    points: 3,
  },
  {
    id: "r-css-pusta",
    name: "Komunikat o pustej liscie kursywa",
    type: "css_computed",
    page: "index.html",
    selector: ".pusta",
    property: "font-style",
    expected: "italic",
    points: 2,
  },
  {
    id: "r-css-kursor",
    name: "Przycisk z kursorem wskaznika",
    type: "css_computed",
    page: "index.html",
    selector: "button",
    property: "cursor",
    expected: "pointer",
    points: 2,
  },
  {
    id: "r-dodaj",
    name: "Dodanie produktu pojawia sie na liscie",
    type: "interaction",
    page: "index.html",
    steps: [
      { action: "fill", selector: "form input", value: "mleko" },
      { action: "click", selector: "form button" },
    ],
    expect: { selector: "ul", mode: "contains", value: "mleko" },
    points: 6,
  },
  {
    id: "r-dwa",
    name: "Dwa produkty to dwa elementy listy",
    type: "interaction",
    page: "index.html",
    steps: [
      { action: "fill", selector: "form input", value: "mleko" },
      { action: "click", selector: "form button" },
      { action: "fill", selector: "form input", value: "chleb" },
      { action: "click", selector: "form button" },
    ],
    expect: { selector: "ul li:nth-child(2)", mode: "contains", value: "chleb" },
    points: 5,
  },
  {
    id: "r-licznik",
    name: "Licznik produktow sie zgadza",
    type: "interaction",
    page: "index.html",
    steps: [
      { action: "fill", selector: "form input", value: "mleko" },
      { action: "click", selector: "form button" },
      { action: "fill", selector: "form input", value: "chleb" },
      { action: "click", selector: "form button" },
    ],
    expect: { selector: ".licznik", mode: "contains", value: "2" },
    points: 3,
  },
  {
    id: "r-puste-pole",
    name: "Puste pole nie dodaje produktu",
    type: "interaction",
    page: "index.html",
    steps: [
      { action: "fill", selector: "form input", value: "   " },
      { action: "click", selector: "form button" },
    ],
    expect: { selector: ".pusta", mode: "exists" },
    points: 2,
  },
  {
    id: "r-usun",
    name: "Usuniecie produktu czysci liste",
    type: "interaction",
    page: "index.html",
    steps: [
      { action: "fill", selector: "form input", value: "mleko" },
      { action: "click", selector: "form button" },
      { action: "click", selector: "ul li button" },
    ],
    expect: { selector: ".pusta", mode: "exists" },
    points: 5,
  },
];

const manualCriteria = [
  {
    id: "r-k-podzial",
    name: "Sensowny podzial na komponenty",
    description:
      "Czy komponent Produkt odpowiada za jeden element listy i dostaje dane przez props, "
      + "a nie siega po stan rodzica ani nie powtarza jego logiki.",
    points: 4,
  },
  {
    id: "r-k-stan",
    name: "Poprawna praca ze stanem",
    description:
      "Czy stan jest aktualizowany bez mutacji (nowa tablica zamiast push), czy pole formularza "
      + "jest kontrolowane i czyszczone po dodaniu.",
    points: 4,
  },
  {
    id: "r-k-czytelnosc",
    name: "Czytelnosc kodu i wyglad",
    description: "Nazwy, wciecia, brak zakomentowanych fragmentow; strona wyglada schludnie.",
    points: 2,
  },
];

export const TASK = {
  title: "Lista zakupow (React)",
  summary: "Komponenty, props i stan: lista zakupow z dodawaniem, usuwaniem i licznikiem.",
  content_md: CONTENT_MD,
  runtime: "react",
  default_minutes: 60,
  allow_new_files: true,
  student_can_run_tests: true,
  files: [
    { name: "index.html", content: START_HTML },
    { name: "styl.css", content: START_CSS },
    { name: "app.jsx", content: START_APP },
    { name: "Produkt.jsx", content: START_PRODUKT },
  ],
  reference_files: [
    { name: "index.html", content: START_HTML },
    { name: "styl.css", content: REF_CSS },
    { name: "app.jsx", content: REF_APP },
    { name: "Produkt.jsx", content: REF_PRODUKT },
  ],
  auto_tests: autoTests,
  manual_criteria: manualCriteria,
};

// --------------------------------------------------------------------------
// Generowanie migracji
// --------------------------------------------------------------------------
const sqlStr = (v) => "'" + String(v).replace(/'/g, "''") + "'";
const sqlJson = (v) => sqlStr(JSON.stringify(v, null, 2)) + "::jsonb";

const punktyAuto = TASK.auto_tests.reduce((s, t) => s + t.points, 0);
const punktyRecz = TASK.manual_criteria.reduce((s, k) => s + k.points, 0);

const sql = `-- =============================================================================
-- 038_praktyka_react_zadanie.sql — zadanie praktyczne „${TASK.title}"
--
-- Uruchom po 037_praktyka_react.sql (potrzebne: kolumna runtime, pliki .jsx
-- i typ testu source_matches).
--
-- PLIK JEST GENEROWANY — nie edytuj go ręcznie.
-- Źródło: scripts/praktyka/react-lista.mjs → node scripts/praktyka/react-lista.mjs
--
-- ${TASK.auto_tests.length} testów automatycznych (${punktyAuto} pkt)
-- + ${TASK.manual_criteria.length} kryteria ręczne (${punktyRecz} pkt) = ${punktyAuto + punktyRecz} pkt.
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
  ${sqlStr(TASK.title)},
  ${sqlStr(TASK.summary)},
  ${sqlStr(TASK.content_md)},
  ${sqlJson(TASK.files)},
  ${sqlJson(TASK.reference_files)},
  ${sqlJson(TASK.auto_tests)},
  ${sqlJson(TASK.manual_criteria)},
  ${TASK.default_minutes},
  ${TASK.allow_new_files},
  ${TASK.student_can_run_tests},
  'react',
  true
where not exists (select 1 from practical_tasks where title = ${sqlStr(TASK.title)});

update practical_tasks set
  summary = ${sqlStr(TASK.summary)},
  content_md = ${sqlStr(TASK.content_md)},
  files = ${sqlJson(TASK.files)},
  reference_files = ${sqlJson(TASK.reference_files)},
  auto_tests = ${sqlJson(TASK.auto_tests)},
  manual_criteria = ${sqlJson(TASK.manual_criteria)},
  default_minutes = ${TASK.default_minutes},
  allow_new_files = ${TASK.allow_new_files},
  student_can_run_tests = ${TASK.student_can_run_tests},
  runtime = 'react',
  is_ready = true,
  updated_at = now()
where title = ${sqlStr(TASK.title)};
`;

const out = join(root, "supabase", "038_praktyka_react_zadanie.sql");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sql);
console.log(`supabase/038_praktyka_react_zadanie.sql — ${TASK.auto_tests.length} testow (${punktyAuto} pkt) + ${TASK.manual_criteria.length} kryteria (${punktyRecz} pkt)`);
