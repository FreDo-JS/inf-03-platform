// Migracje 037 i 038 — zadania praktyczne w Reakcie.
//
// Sam silnik (transpilacja JSX, rejestr modułów, montowanie Reacta) chodzi
// w przeglądarce i tu go nie ma. Z bazy sprawdzamy to, od czego zależy: czy
// wolno trzymać pliki .jsx, czy tryb zadania jest ograniczony do znanych
// wartości, czy nowy typ testu przechodzi walidację razem ze swoimi polami
// i czy uczeń dostaje w stanie podejścia informację, jak uruchomić pracę.
import { PGlite } from "@electric-sql/pglite";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
  create function auth.role() returns text language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  create publication supabase_realtime;
  insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'szef@szkola.pl', now());
`);
// Wszystkie migracje po kolei, nie wybrany podzbiór: 032 nadpisuje
// `practical_tests_valid` z 026 i `practical_practice_task` z 029, więc test
// ma wartość tylko wtedy, gdy tamte naprawdę wcześniej weszły.
const numerowane = readdirSync(root).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
for (const f of ["schema.sql", numerowane[0], "seed.sql", ...numerowane.slice(1)]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const err = async (label, fn, match) => {
  try { await fn(); fail++; console.log("  FAIL ", label, "→ brak błędu"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 45) + ")"); }
  }
};
const jeden = async (sql, params = []) => (await db.query(sql, params)).rows[0];

const TYTUL = "Lista zakupow (React)";

console.log("== PLIK SQL JEST ŚWIEŻY ==");
{
  // 038 powstaje z scripts/praktyka/react-lista.mjs — treść zadania i jego testy
  // nie mogą się rozjechać z plikiem wklejanym do bazy.
  // Końce linii pomijamy: na Windowsie git oddaje plik z CRLF, a generator pisze LF.
  const bezCR = (t) => t.replace(/\r\n/g, "\n");
  const przed = read("038_praktyka_react_zadanie.sql");
  execFileSync(process.execPath, [join(root, "..", "scripts", "praktyka", "react-lista.mjs")], { stdio: "pipe" });
  const po = read("038_praktyka_react_zadanie.sql");
  // oddajemy oryginalne bajty, zeby przebieg testow nie zostawial pliku
  // "zmodyfikowanego" w git status (generator pisze LF, git oddaje CRLF)
  writeFileSync(root + "038_praktyka_react_zadanie.sql", przed);
  ok("generator daje ten sam plik co zatwierdzony (038 odpowiada źródłom)", bezCR(przed) === bezCR(po));
}

console.log("== PLIKI .JSX ==");
{
  const w = await jeden(`select
    practical_filename_valid('app.jsx') a,
    practical_filename_valid('Produkt.jsx') b,
    practical_filename_valid('styl.css') c,
    practical_filename_valid('app.jsx.exe') d,
    practical_filename_valid('../app.jsx') e,
    practical_filename_valid('app.ts') f`);
  ok("app.jsx i Produkt.jsx są dozwolone", w.a === true && w.b === true);
  ok("stare rozszerzenia dalej działają", w.c === true);
  ok("nazwa z drugim rozszerzeniem odrzucona", w.d === false);
  ok("ścieżka w nazwie odrzucona", w.e === false);
  ok("nieobsługiwane rozszerzenie (.ts) odrzucone", w.f === false);
}

console.log("\n== TRYB ZADANIA ==");
{
  const kol = await jeden(`select column_default, is_nullable from information_schema.columns
                           where table_name = 'practical_tasks' and column_name = 'runtime'`);
  ok("kolumna runtime istnieje z domyślnym 'html'",
    kol !== undefined && String(kol.column_default).includes("html") && kol.is_nullable === "NO");
  const stare = await jeden(`select count(*)::int n from practical_tasks where runtime = 'html'`);
  ok("zadania sprzed migracji zostały przy html", stare.n >= 2, String(stare.n));
  await err("nieznany tryb odrzucony przez CHECK", () => db.query(
    `insert into practical_tasks (title, runtime) values ('x-tryb', 'vue')`), "check constraint");
}

console.log("\n== TYP TESTU source_matches ==");
{
  const dobry = JSON.stringify([
    { id: "a", name: "Jest useState", type: "source_matches", file: "app.jsx", mode: "contains", value: "useState", points: 3 },
    { id: "b", name: "Bez innerHTML", type: "source_matches", file: "app.jsx", mode: "not_contains", value: "innerHTML", points: 2 },
    { id: "c", name: "Montowanie", type: "source_matches", file: "app.jsx", mode: "regex", value: "createRoot\\s*\\(", points: 3 },
  ]);
  const w = await jeden(`select practical_tests_valid($1::jsonb) v`, [dobry]);
  ok("trzy tryby dopasowania przechodzą walidację", w.v === true);

  const zly = (t) => jeden(`select practical_tests_valid($1::jsonb) v`, [JSON.stringify([t])]);
  ok("nieznany tryb odrzucony",
    (await zly({ id: "a", name: "x", type: "source_matches", file: "app.jsx", mode: "starts_with", value: "a", points: 1 })).v === false);
  ok("brak pliku odrzucony",
    (await zly({ id: "a", name: "x", type: "source_matches", mode: "contains", value: "a", points: 1 })).v === false);
  ok("zła nazwa pliku odrzucona",
    (await zly({ id: "a", name: "x", type: "source_matches", file: "../tajne.txt", mode: "contains", value: "a", points: 1 })).v === false);
  ok("pusty szukany fragment odrzucony",
    (await zly({ id: "a", name: "x", type: "source_matches", file: "app.jsx", mode: "contains", value: "", points: 1 })).v === false);
  ok("stare typy testów dalej przechodzą",
    (await zly({ id: "a", name: "x", type: "selector_count", page: "index.html", selector: "li", min: 1, points: 1 })).v === true);
  ok("wymyślony typ testu dalej odrzucany",
    (await zly({ id: "a", name: "x", type: "react_component", points: 1 })).v === false);
}

console.log("\n== ZADANIE „LISTA ZAKUPOW (REACT)” ==");
const zadanie = await jeden(
  `select id, runtime, default_minutes, is_ready, student_can_run_tests, files, reference_files,
          auto_tests, manual_criteria, content_md
   from practical_tasks where title = $1`,
  [TYTUL],
);
{
  ok("zadanie jest w bazie", zadanie !== undefined);
  ok("tryb react", zadanie.runtime === "react");
  ok("czas 60 minut", zadanie.default_minutes === 60);
  ok("oznaczone jako gotowe", zadanie.is_ready === true);

  const nazwy = zadanie.files.map((f) => f.name).sort();
  ok("cztery pliki startowe: HTML, CSS i dwa komponenty",
    nazwy.join(",") === "Produkt.jsx,app.jsx,index.html,styl.css", nazwy.join(","));
  ok("wzorzec ma komplet plików", zadanie.reference_files.length === 4);

  const plik = (zrodlo, n) => zrodlo.find((f) => f.name === n)?.content ?? "";
  ok("index.html montuje aplikację w #root i ładuje app.jsx",
    plik(zadanie.files, "index.html").includes('id="root"') && plik(zadanie.files, "index.html").includes('src="app.jsx"'));
  ok("pliki startowe nie zawierają rozwiązania",
    !plik(zadanie.files, "app.jsx").includes("createRoot") && !plik(zadanie.files, "app.jsx").includes("useState"));
  ok("wzorzec montuje aplikację przez createRoot",
    plik(zadanie.reference_files, "app.jsx").includes("createRoot"));
  ok("wzorzec dzieli kod na komponenty (import z ./Produkt.jsx)",
    plik(zadanie.reference_files, "app.jsx").includes("./Produkt.jsx")
      && plik(zadanie.reference_files, "Produkt.jsx").includes("export default"));
  ok("wzorzec nie grzebie w DOM ręcznie",
    !plik(zadanie.reference_files, "app.jsx").includes("innerHTML"));

  const testy = zadanie.auto_tests;
  const punktyAuto = testy.reduce((s, t) => s + t.points, 0);
  const punktyRecz = zadanie.manual_criteria.reduce((s, k) => s + k.points, 0);
  console.log(`      ${testy.length} testów (${punktyAuto} pkt) + ${zadanie.manual_criteria.length} kryteria (${punktyRecz} pkt)`);

  ok("definicje testów przechodzą walidację bazy",
    (await jeden(`select practical_tests_valid($1::jsonb) v`, [JSON.stringify(testy)])).v === true);
  ok("identyfikatory testów są unikalne", new Set(testy.map((t) => t.id)).size === testy.length);
  ok("są testy na kodzie źródłowym (technika, nie tylko efekt)",
    testy.filter((t) => t.type === "source_matches").length >= 5);
  ok("jest test pilnujący, żeby nie budować DOM ręcznie",
    testy.some((t) => t.type === "source_matches" && t.mode === "not_contains" && t.value === "innerHTML"));
  ok("są testy interakcyjne (dodawanie i usuwanie)",
    testy.filter((t) => t.type === "interaction").length >= 4);
  ok("testy dotyczą wyłącznie plików z zadania",
    testy.every((t) => !t.page || t.page === "index.html")
      && testy.every((t) => !t.file || zadanie.files.some((f) => f.name === t.file)));
  ok("suma punktów w rozsądnym zakresie", punktyAuto + punktyRecz >= 50 && punktyAuto + punktyRecz <= 100,
    String(punktyAuto + punktyRecz));
  ok("arkusz podaje czas, przykład i wymagane nazwy plików",
    zadanie.content_md.includes("60 minut") && /Przykład|Przyklad/i.test(zadanie.content_md)
      && zadanie.content_md.includes("Produkt.jsx"));
}

console.log("\n== UCZEŃ DOSTAJE TRYB URUCHOMIENIA ==");
{
  await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
  await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
  const sesja = (await db.query(`select practical_create_session($1::uuid, '4e', 60) as s`, [zadanie.id])).rows[0].s;
  await db.query(`select practical_start_session($1::uuid)`, [sesja.id]);

  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"7.7.7.7"}',false);`);
  const dolaczenie = (await db.query(`select practical_join($1, $2) as r`, [sesja.pin, "Ala"])).rows[0].r;
  ok("uczeń dołącza do sesji z zadaniem reactowym", dolaczenie.ok === true);
  ok("stan podejścia niesie runtime = react", dolaczenie.state.task.runtime === "react",
    String(dolaczenie.state.task?.runtime));
  ok("uczeń dostaje pliki startowe z .jsx",
    dolaczenie.state.task.files.some((f) => f.name === "app.jsx"));
  ok("uczeń nie dostaje rozwiązania wzorcowego ani parametrów testów",
    dolaczenie.state.task.reference_files === undefined && dolaczenie.state.task.auto_tests === undefined);
  ok("nazwy testów bez parametrów (zadanie na to pozwala)",
    Array.isArray(dolaczenie.state.task.test_names) && dolaczenie.state.task.test_names.length > 0
      && dolaczenie.state.task.test_names.every((t) => Object.keys(t).sort().join(",") === "id,name"));

  const zapis = (await db.query(`select practical_save($1, $2::jsonb) as r`, [
    dolaczenie.attempt_token,
    JSON.stringify([
      { name: "index.html", content: "<!DOCTYPE html><html lang=\"pl\"><body><div id=\"root\"></div></body></html>" },
      { name: "styl.css", content: "body { margin: 0; }" },
      { name: "app.jsx", content: "import { createRoot } from \"react-dom/client\";\n" },
      { name: "Produkt.jsx", content: "export default function Produkt() { return null; }\n" },
    ]),
  ])).rows[0].r;
  ok("uczeń zapisuje pracę z plikami .jsx", zapis.ok === true);
  await db.exec("reset role;");
}

console.log("\n== 037 NIE KASUJE WCZEŚNIEJSZYCH MIGRACJI ==");
{
  // 037 nadpisuje `practical_tests_valid` (026) i `practical_practice_task` (029)
  // w całości. Pominięcie czegokolwiek w tych ciałach przechodzi jako poprawny
  // SQL i wychodzi dopiero przy edycji zadania — stąd te asercje.
  const typy = [
    "images_alt", "form_labels", "heading_structure",
    "css_media", "links_valid", "no_js_errors", "file_content",
  ];
  const tests = typy.map((type, i) => {
    const base = { id: `t${i}`, name: type, points: 1 };
    if (type === "file_content") return { ...base, type, file: "index.html", mode: "contains", value: "x" };
    return { ...base, type, page: "index.html" };
  });
  const czy = (await jeden(`select public.practical_tests_valid($1::jsonb) v`, [JSON.stringify(tests)])).v;
  ok("siedem typów testów z 026 dalej przechodzi walidację", czy === true);

  const zle = (await jeden(
    `select count(*)::int n from practical_tasks where not public.practical_tests_valid(auto_tests)`)).n;
  ok("zadania z wcześniejszych migracji dalej są poprawne", zle === 0, String(zle));

  await db.exec(`update practical_tasks set practice = true where title = '${TYTUL}'`);
  const cwiczenie = (await jeden(
    `select public.practical_practice_task(id) t from practical_tasks where title = $1`, [TYTUL])).t;
  ok("tryb ćwiczeniowy podaje runtime", cwiczenie.runtime === "react", JSON.stringify(cwiczenie.runtime));
  ok("tryb ćwiczeniowy dalej nie wydaje wzorca",
    cwiczenie.reference_files === undefined && Array.isArray(cwiczenie.auto_tests));
  await db.exec(`update practical_tasks set practice = false where title = '${TYTUL}'`);
}

console.log("\n== IDEMPOTENCJA ==");
{
  const przed = (await jeden(`select count(*)::int n from practical_tasks`)).n;
  await db.exec(read("037_praktyka_react.sql"));
  await db.exec(read("038_praktyka_react_zadanie.sql"));
  const po = (await jeden(`select count(*)::int n from practical_tasks`)).n;
  ok("ponowne uruchomienie nie dubluje zadania", przed === po, `${przed} → ${po}`);
  const dalej = await jeden(`select runtime, is_ready from practical_tasks where title = $1`, [TYTUL]);
  ok("zadanie zostaje gotowe i w trybie react", dalej.runtime === "react" && dalej.is_ready === true);
  const ile = (await jeden(
    `select count(*)::int n from pg_constraint where conname = 'practical_tasks_runtime_check'`)).n;
  ok("CHECK na tryb nie duplikuje się", ile === 1, String(ile));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
