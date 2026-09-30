// Migracja 017 — dwa zadania praktyczne na 60 minut.
//
// Testy automatyczne tych zadań biegną w przeglądarce, więc tutaj sprawdzamy
// to, co widać z bazy: czy zadania są gotowe do użycia, czy definicje testów
// mają komplet wymaganych pól i czy punkty się zgadzają. Samo przejście testów
// na rozwiązaniu wzorcowym weryfikuje panel („Sprawdź na wzorcu”).
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key, email text);
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
  insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'szef@szkola.pl');
`);
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
                 "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};

const TYTULY = ["Lista zadań (HTML/CSS/JS)", "Kalkulator napiwku (HTML/CSS/JS)"];

console.log("== ZADANIA ==");
const zadania = (
  await db.query(
    `select title, default_minutes, is_ready, allow_new_files, student_can_run_tests,
            files, reference_files, auto_tests, manual_criteria, content_md
     from practical_tasks where title = any($1) order by title`,
    [TYTULY],
  )
).rows;
ok("obie prace są w bazie", zadania.length === 2, `znaleziono ${zadania.length}`);

for (const z of zadania) {
  console.log(`\n-- ${z.title}`);
  ok("czas to 60 minut", z.default_minutes === 60, String(z.default_minutes));
  ok("zadanie oznaczone jako gotowe", z.is_ready === true);
  ok("uczeń może sam uruchamiać podgląd", z.student_can_run_tests === true);
  ok("trzy pliki startowe: index.html, styl.css, skrypt.js",
    z.files.length === 3 && z.files.every((f) => ["index.html", "styl.css", "skrypt.js"].includes(f.name)));
  ok("jest rozwiązanie wzorcowe z trzema plikami", z.reference_files.length === 3);
  ok("pliki startowe nie zawierają gotowego rozwiązania",
    !z.files.some((f) => f.content.includes("addEventListener")));
  ok("wzorzec zawiera obsługę zdarzenia",
    z.reference_files.some((f) => f.name === "skrypt.js" && f.content.includes("addEventListener")));

  const testy = z.auto_tests;
  const kryteria = z.manual_criteria;
  const punktyAuto = testy.reduce((s, t) => s + t.points, 0);
  const punktyRecz = kryteria.reduce((s, k) => s + k.points, 0);
  console.log(`      ${testy.length} testów automatycznych (${punktyAuto} pkt) + ${kryteria.length} kryteriów (${punktyRecz} pkt)`);

  ok("identyfikatory testów są unikalne", new Set(testy.map((t) => t.id)).size === testy.length);
  ok("każdy test ma nazwę i dodatnie punkty", testy.every((t) => t.name && t.points > 0));
  ok("wszystkie testy dotyczą istniejących plików",
    testy.every((t) => !t.page || t.page === "index.html"));
  ok("test typu interaction ma kroki i oczekiwanie",
    testy.filter((t) => t.type === "interaction").every((t) => Array.isArray(t.steps) && t.steps.length > 0 && t.expect?.selector));
  ok("są testy interakcyjne (sprawdzają działanie skryptu)",
    testy.filter((t) => t.type === "interaction").length >= 3);
  ok("są testy stylów CSS", testy.filter((t) => t.type === "css_computed").length >= 2);
  ok("suma punktów mieści się w rozsądnych granicach", punktyAuto + punktyRecz >= 50 && punktyAuto + punktyRecz <= 100,
    String(punktyAuto + punktyRecz));
  ok("kryteria ręczne mają opis dla nauczyciela", kryteria.every((k) => k.description && k.description.length > 10));
  ok("arkusz podaje czas i przykład działania",
    z.content_md.includes("60 minut") && /Przykład/i.test(z.content_md));
}

console.log("\n== SESJA NA NOWYM ZADANIU ==");
await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
const id = (await db.query(`select id from practical_tasks where title = $1`, [TYTULY[0]])).rows[0].id;
try {
  const r = await db.query(`select practical_create_session($1::uuid, '4e', 60) as s`, [id]);
  ok("nauczyciel tworzy sesję na 60 minut", Boolean(r.rows[0].s.pin));
} catch (e) {
  ok("nauczyciel tworzy sesję na 60 minut", false, e.message);
}

console.log("\n== IDEMPOTENCJA ==");
await db.exec("reset role;");
const przed = (await db.query(`select count(*)::int n from practical_tasks`)).rows[0].n;
await db.exec(read("017_praktyka_todo_kalkulator.sql"));
const po = (await db.query(`select count(*)::int n from practical_tasks`)).rows[0].n;
ok("ponowne uruchomienie nie dubluje zadań", przed === po, `${przed} → ${po}`);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
