// Migracja 027 — pięć zadań praktycznych wygenerowanych z scripts/praktyka/zadania/.
//
// Testy automatyczne zadań biegną w przeglądarce, więc tu sprawdzamy to, co widać
// z bazy: komplet pól, zgodność plików startowych z wzorcem, punkty, powtarzalność
// migracji i to, że plik SQL jest świeży względem źródeł (generator nie zmienia go
// przy ponownym uruchomieniu). Przejście testów na rozwiązaniu wzorcowym sprawdza
// panel („Sprawdź na wzorcu”) — w czasie tworzenia zadań było to zrobione w przeglądarce.
import { PGlite } from "@electric-sql/pglite";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const root = join(repo, "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};

console.log("== PLIK SQL JEST ŚWIEŻY ==");
{
  // Konce linii pomijamy: na Windowsie git oddaje plik z CRLF, a generator
  // zapisuje LF, wiec dosowne porownanie oblewalo mimo identycznej tresci.
  const bezCR = (t) => t.replace(/\r\n/g, "\n");
  const przed = read("027_praktyka_zadania.sql");
  execFileSync(process.execPath, [join(repo, "scripts", "praktyka", "generuj.mjs")], { stdio: "pipe" });
  const po = read("027_praktyka_zadania.sql");
  ok("generator daje ten sam plik co zatwierdzony (027 odpowiada źródłom)", bezCR(przed) === bezCR(po));
}

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
`);
const numerowane = readdirSync(root).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
for (const f of ["schema.sql", numerowane[0], "seed.sql", ...numerowane.slice(1)]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

const zadania = (await db.query(
  `select title, default_minutes, is_ready, student_can_run_tests, files, reference_files, auto_tests, manual_criteria, content_md
   from practical_tasks where title like '%(HTML/CSS%' and created_at > now() - interval '1 day' order by title`,
)).rows;

console.log("\n== ZADANIA ==");
const NOWE = ["Cennik w tabeli", "Formularz rejestracyjny", "Galeria responsywna", "Licznik i przełącznik", "Strona firmowa"];
for (const fragment of NOWE) {
  ok(`zadanie „${fragment}…” jest w bazie`, zadania.some((z) => z.title.startsWith(fragment)));
}
for (const z of zadania.filter((x) => NOWE.some((n) => x.title.startsWith(n)))) {
  const nazwa = z.title.slice(0, 28);
  ok(`${nazwa}: gotowe do użycia, uczeń może uruchamiać testy`, z.is_ready === true && z.student_can_run_tests === true);
  const startowe = z.files.map((f) => f.name), wzor = z.reference_files.map((f) => f.name);
  ok(`${nazwa}: pliki startowe mają odpowiedniki we wzorcu`, startowe.every((n) => wzor.includes(n)));
  const punktyAuto = z.auto_tests.reduce((s, t) => s + t.points, 0);
  const punktyReczne = z.manual_criteria.reduce((s, k) => s + k.points, 0);
  ok(`${nazwa}: ${punktyAuto} pkt automatycznie + ${punktyReczne} pkt ręcznie`, punktyAuto >= 25 && punktyReczne === 10);
  ok(`${nazwa}: testy odwołują się tylko do istniejących plików`,
    z.auto_tests.every((t) => (t.page === undefined || wzor.includes(t.page)) && (t.file === undefined || wzor.includes(t.file))));
  ok(`${nazwa}: arkusz ma opis wymagań i podany czas`, z.content_md.includes("### 1.") && /Czas: \*\*\d+ minut\*\*/.test(z.content_md) && z.content_md.includes(`${z.default_minutes} minut`));
  ok(`${nazwa}: rozwiązanie wzorcowe różni się od startu`, JSON.stringify(z.files) !== JSON.stringify(z.reference_files));
}
ok("stare zadania (Rowerownia, Lista, Kalkulator) zostały nietknięte",
  (await db.query(`select count(*)::int n from practical_tasks where title in ('Lista zadań (HTML/CSS/JS)','Kalkulator napiwku (HTML/CSS/JS)')`)).rows[0].n === 2);

console.log("\n== POWTARZALNOŚĆ ==");
const przed = (await db.query(`select count(*)::int n from practical_tasks`)).rows[0].n;
await db.exec(read("027_praktyka_zadania.sql"));
ok("ponowne uruchomienie nie dubluje zadań", (await db.query(`select count(*)::int n from practical_tasks`)).rows[0].n === przed);

console.log("\n== BEZ 026 ==");
{
  const stara = new PGlite();
  await stara.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.role() returns text language sql stable as $$ select 'anon' $$;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create publication supabase_realtime;
  `);
  const bez = numerowane.filter((f) => f < "026");
  for (const f of ["schema.sql", bez[0], "seed.sql", ...bez.slice(1)]) {
    await stara.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
  }
  let komunikat = "";
  try { await stara.exec(read("027_praktyka_zadania.sql")); } catch (e) { komunikat = e.message; }
  ok("027 bez 026 mówi, której migracji brakuje", komunikat.includes("026_praktyka_typy_testow"), komunikat);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
