import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
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
  insert into auth.users values ('11111111-1111-1111-1111-111111111111');
`);
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}
// idempotencja migracji: kluczowe powtarzamy
await db.exec(read("003_subtopic_links.sql"));
await db.exec(read("005_tab_switch.sql"));
await db.exec(read("007_practical_seed.sql"));
await db.exec(read("008_security_hardening.sql"));

let pass = 0, fail = 0;
const ok = async (label, sql, check) => {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 150));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; console.log("  FAIL ", label, "→", e.message); return []; }
};
const err = async (label, sql, match) => {
  try { await db.query(sql); fail++; console.log("  FAIL ", label, "→ brak błędu"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 45) + ")"); }
  }
};
const asAnon = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); set role anon; select set_config('request.headers','{"x-forwarded-for":"2.2.2.2"}',false);`);
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);

// pytanie matching: left w kolejności, right POTASOWANE, klucz = right w kolejności left
const QS = `[
  {"type":"matching","text":"Dopasuj polecenie SQL do opisu.",
   "left":["SELECT","INSERT","DELETE"],
   "right":["usuwanie wierszy","pobieranie danych","dodawanie wierszy"]},
  {"type":"closed","text":"2+2?","options":["4","5"]}
]`;
const KEYS = `[["pobieranie danych","dodawanie wierszy","usuwanie wierszy"],["4"]]`;

console.log("== ADMIN: tworzenie testu ==");
await asAdmin();
const [{ r: created }] = await ok("test z pytaniem matching",
  `select create_test('Matching', 300, '${QS}', '${KEYS}', '424242') r`, (r) => r[0].r.id);
await err("klucz nie jest permutacją kolumny right",
  `select create_test('X', 300, '${QS}', '[["pobieranie danych","pobieranie danych","usuwanie wierszy"],"4"]', '111111')`, "invalid_keys");
await err("klucz krótszy niż lewa kolumna",
  `select create_test('X', 300, '${QS}', '[["pobieranie danych"],"4"]', '111111')`, "invalid_keys");
await err("tylko 1 para", `select create_test('X', 300,
  '[{"type":"matching","text":"Q","left":["a"],"right":["b"]}]', '[["b"]]', '111111')`, "invalid_questions");
await err("różna długość kolumn", `select create_test('X', 300,
  '[{"type":"matching","text":"Q","left":["a","b"],"right":["x"]}]', '[["x","x"]]', '111111')`, "invalid_questions");
await err("duplikat w lewej kolumnie", `select create_test('X', 300,
  '[{"type":"matching","text":"Q","left":["a","a"],"right":["x","y"]}]', '[["x","y"]]', '111111')`, "invalid_questions");
await err("duplikat w prawej kolumnie", `select create_test('X', 300,
  '[{"type":"matching","text":"Q","left":["a","b"],"right":["x","x"]}]', '[["x","x"]]', '111111')`, "invalid_questions");
await err("wartość dłuższa niż 150 znaków", `select create_test('X', 300,
  ('[{"type":"matching","text":"Q","left":["a","'||repeat('b',151)||'"],"right":["x","y"]}]')::jsonb, '[["x","y"]]', '111111')`, "invalid_questions");
await err("bezpośredni insert złego matching (CHECK)",
  `insert into tests(title,time_limit,questions) values ('x',300,'[{"type":"matching","text":"Q","left":["a"],"right":["b"]}]')`, "tests_questions_valid");
await ok("pytanie publiczne nie zdradza par (right w innej kolejności niż klucz)",
  `select (questions->0->'right')::text r, (select answers->0 from test_keys where test_id='${created.id}')::text k from tests where id='${created.id}'`,
  (r) => r[0].r !== r[0].k);

console.log("\n== UCZEŃ: ocenianie ==");
const startSession = async () => {
  const [{ r }] = (await db.query(`select open_test('${created.id}', '424242') r`)).rows;
  await db.query(`select begin_session('${r.session_id}', 'Uczeń')`);
  return r.session_id;
};
await asAnon();
let s = await startSession();
await ok("komplet poprawnych par = 1 pkt",
  `select submit_attempt('${s}', '[["pobieranie danych","dodawanie wierszy","usuwanie wierszy"],"4"]') r`,
  (r) => r[0].r.score === 2 && JSON.stringify(r[0].r.results) === "[true,true]");

s = await startSession();
await ok("jedna para źle = całe pytanie błędne (brak punktacji częściowej)",
  `select submit_attempt('${s}', '[["pobieranie danych","usuwanie wierszy","dodawanie wierszy"],"4"]') r`,
  (r) => r[0].r.score === 1 && JSON.stringify(r[0].r.results) === "[false,true]");

s = await startSession();
await ok("wielkość liter i spacje bez znaczenia",
  `select submit_attempt('${s}', '[["  POBIERANIE   danych ","Dodawanie Wierszy","usuwanie wierszy"],"4"]') r`,
  (r) => r[0].r.results[0] === true);

s = await startSession();
await ok("niekompletne dopasowanie (null w tablicy) = błędne",
  `select submit_attempt('${s}', '[["pobieranie danych",null,"usuwanie wierszy"],"4"]') r`,
  (r) => r[0].r.results[0] === false);

s = await startSession();
await ok("brak odpowiedzi (null) = błędne",
  `select submit_attempt('${s}', '[null,null]') r`, (r) => r[0].r.score === 0);

s = await startSession();
await ok("string zamiast tablicy = błędne, nie wywala funkcji",
  `select submit_attempt('${s}', '["cokolwiek","4"]') r`, (r) => r[0].r.score === 1);

s = await startSession();
await ok("za krótka tablica = błędne",
  `select submit_attempt('${s}', '[["pobieranie danych"],"4"]') r`, (r) => r[0].r.results[0] === false);

console.log("\n== stare typy pytań nadal działają ==");
await db.exec(`reset role`);
const [{ id: htmlId, pin: htmlPin }] = (await db.query(`select t.id, k.pin from tests t join test_keys k on k.test_id=t.id where title like 'HTML%'`)).rows;
await asAnon();
const [{ r: o }] = (await db.query(`select open_test('${htmlId}', '${htmlPin}') r`)).rows;
await db.query(`select begin_session('${o.session_id}', 'Ola')`);
await ok("closed/select/input: 5/5",
  `select submit_attempt('${o.session_id}', '["<h1>","color"," ALT ","#menu","flex"]') r`, (r) => r[0].r.score === 5);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
