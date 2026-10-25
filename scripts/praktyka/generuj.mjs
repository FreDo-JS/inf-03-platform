// Generator migracji z zadaniami praktycznymi.
//
// Źródłem prawdy są pliki scripts/praktyka/zadania/*.mjs (arkusz, pliki startowe,
// rozwiązanie wzorcowe, testy automatyczne, kryteria ręczne). Z nich powstaje
// supabase/027_praktyka_zadania.sql — nie edytuj go ręcznie.
//
//   node scripts/praktyka/generuj.mjs            zapisuje migrację
//   node scripts/praktyka/generuj.mjs --cases    dodatkowo public/harness-tmp/cases.json
//                                                 (do sprawdzenia wzorców w przeglądarce)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const KATALOG = join(here, "zadania");

const ts = readFileSync(join(repo, "types", "practical.ts"), "utf8");
const TYPY = [...(ts.match(/AUTO_TEST_TYPES = \[([\s\S]*?)\] as const;/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
if (TYPY.length === 0) throw new Error("Nie znaleziono AUTO_TEST_TYPES w types/practical.ts");

const NAZWA_PLIKU = /^[A-Za-z0-9_-]{1,40}\.(html|css|js|txt)$/;

/** Cudzysłów dolarowy z etykietą, której nie ma w treści. */
function dq(tekst) {
  let n = 0;
  let tag;
  do {
    tag = `$q${n++}$`;
  } while (tekst.includes(tag));
  return `${tag}${tekst}${tag}`;
}

function sprawdz(z, plik) {
  const blad = (opis) => {
    throw new Error(`${plik}: ${opis}`);
  };
  for (const pole of ["title", "summary", "sheet"]) if (typeof z[pole] !== "string" || !z[pole].trim()) blad(`brak pola ${pole}`);
  if (z.title.length > 120) blad("tytuł dłuższy niż 120 znaków");
  if (z.summary.length > 300) blad("opis dłuższy niż 300 znaków");
  if (z.sheet.length > 20000) blad("arkusz dłuższy niż 20000 znaków");
  if (!Number.isInteger(z.minutes) || z.minutes < 5 || z.minutes > 300) blad("minuty poza zakresem 5–300");

  for (const [nazwa, pliki] of [["files", z.files], ["reference", z.reference]]) {
    if (!Array.isArray(pliki) || pliki.length === 0 || pliki.length > 15) blad(`${nazwa}: 1–15 plików`);
    const nazwy = new Set();
    let razem = 0;
    for (const f of pliki) {
      if (!NAZWA_PLIKU.test(f.name)) blad(`${nazwa}: zła nazwa pliku ${f.name}`);
      if (nazwy.has(f.name)) blad(`${nazwa}: powtórzony plik ${f.name}`);
      nazwy.add(f.name);
      razem += Buffer.byteLength(f.content);
      if (Buffer.byteLength(f.content) > 200000) blad(`${nazwa}: plik ${f.name} > 200 KB`);
    }
    if (razem > 1000000) blad(`${nazwa}: razem > 1 MB`);
  }
  const startowe = new Set(z.files.map((f) => f.name));
  const wzor = new Set(z.reference.map((f) => f.name));
  for (const n of startowe) if (!wzor.has(n)) blad(`plik startowy ${n} nie ma odpowiednika we wzorcu`);

  const idy = new Set();
  for (const t of z.tests) {
    if (!TYPY.includes(t.type)) blad(`test ${t.id}: nieznany typ ${t.type}`);
    if (!/^[a-z0-9-]{1,40}$/.test(t.id)) blad(`test ${t.id}: zły identyfikator`);
    if (idy.has(t.id)) blad(`powtórzony identyfikator testu ${t.id}`);
    idy.add(t.id);
    if (!t.name || t.name.length > 200) blad(`test ${t.id}: nazwa 1–200 znaków`);
    if (typeof t.points !== "number" || t.points < 0 || t.points > 100) blad(`test ${t.id}: punkty 0–100`);
    if ("page" in t && !wzor.has(t.page)) blad(`test ${t.id}: strona ${t.page} nie istnieje`);
    if ("file" in t && !wzor.has(t.file)) blad(`test ${t.id}: plik ${t.file} nie istnieje`);
  }
  const kryteria = new Set();
  for (const k of z.criteria) {
    if (kryteria.has(k.id)) blad(`powtórzone kryterium ${k.id}`);
    kryteria.add(k.id);
    if (!k.name || k.name.length > 200) blad(`kryterium ${k.id}: nazwa 1–200 znaków`);
    if (typeof k.points !== "number" || k.points < 0 || k.points > 100) blad(`kryterium ${k.id}: punkty 0–100`);
  }
}

const pliki = readdirSync(KATALOG).filter((f) => f.endsWith(".mjs")).sort();
const zadania = [];
for (const plik of pliki) {
  const z = (await import(pathToFileURL(join(KATALOG, plik)).href)).default;
  sprawdz(z, plik);
  zadania.push(z);
}
const tytuly = zadania.map((z) => z.title);
if (new Set(tytuly).size !== tytuly.length) throw new Error("Powtórzone tytuły zadań");

const json = (obiekt) => `${dq(JSON.stringify(obiekt))}::jsonb`;

const bloki = zadania
  .map(
    (z, i) => `-- =============================================================================
-- ZADANIE ${i + 1} — ${z.title}
-- ${z.tests.reduce((s, t) => s + t.points, 0)} pkt automatycznie + ${z.criteria.reduce((s, k) => s + k.points, 0)} pkt ręcznie, ${z.minutes} min
-- =============================================================================
insert into practical_tasks (
  title, summary, content_md, files, reference_files, auto_tests, manual_criteria,
  default_minutes, allow_new_files, student_can_run_tests, is_ready
)
select
  ${dq(z.title)},
  ${dq(z.summary)},
  ${dq(z.sheet)},
  ${json(z.files)},
  ${json(z.reference)},
  ${json(z.tests)},
  ${json(z.criteria)},
  ${z.minutes}, ${z.allowNewFiles === true}, ${z.studentCanRunTests === true}, true
where not exists (select 1 from practical_tasks where title = ${dq(z.title)});
`,
  )
  .join("\n");

const sql = `-- =============================================================================
-- 027_praktyka_zadania.sql — pięć kolejnych zadań praktycznych (HTML/CSS/JS)
--
-- Uruchom po 026_praktyka_typy_testow.sql.
--
-- PLIK GENEROWANY: źródła w scripts/praktyka/zadania/*.mjs, generator
-- scripts/praktyka/generuj.mjs. Poprawiasz zadanie w źródle i generujesz od nowa.
--
${zadania.map((z, i) => `--   ${i + 1}. ${z.title}`).join("\n")}
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

${bloki}`;

writeFileSync(join(repo, "supabase", "027_praktyka_zadania.sql"), sql, "utf8");
console.log(`027_praktyka_zadania.sql: ${zadania.length} zadań`);
for (const z of zadania) {
  console.log(`  ${z.title}: ${z.tests.length} testów / ${z.tests.reduce((s, t) => s + t.points, 0)} pkt + ${z.criteria.reduce((s, k) => s + k.points, 0)} pkt ręcznie`);
}

if (process.argv.includes("--cases")) {
  const przypadki = [];
  for (const z of zadania) {
    przypadki.push({
      name: `${z.title} — wzorzec`,
      files: z.reference,
      tests: z.tests,
      expect: Object.fromEntries(z.tests.map((t) => [t.id, true])),
    });
    przypadki.push({ name: `${z.title} — start`, files: z.files, tests: z.tests });
  }
  const dir = join(repo, "public", "harness-tmp");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cases.json"), JSON.stringify(przypadki), "utf8");
  console.log(`cases.json: ${przypadki.length} przypadków`);
}
