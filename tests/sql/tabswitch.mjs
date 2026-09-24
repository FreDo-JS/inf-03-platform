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

const [{ id: testId, pin }] = (await db.query(
  `select t.id, k.pin from tests t join test_keys k on k.test_id=t.id where title like 'HTML%'`)).rows;

await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); set role anon;
               select set_config('request.headers','{"x-forwarded-for":"5.5.5.5"}',false);`);
const session = async (name) => {
  const [{ r }] = (await db.query(`select open_test('${testId}', '${pin}') r`)).rows;
  await db.query(`select begin_session('${r.session_id}', '${name}')`);
  return r.session_id;
};

console.log("== kolumny ==");
await db.exec("reset role");
await ok("attempts ma nowe kolumny z domyślnymi wartościami",
  `select column_name, column_default from information_schema.columns
   where table_name='attempts' and column_name in ('tab_switch_count','ended_reason') order by 1`,
  (r) => r.length === 2 && r[0].column_default.includes("completed") && r[1].column_default === "0");
await db.exec(`select set_config('request.jwt.claim.role','anon',false); set role anon;`);

console.log("\n== zapis powodu zakończenia ==");
let s = await session("Kuba");
await ok("normalne zakończenie → completed, 0 zmian karty",
  `select submit_attempt('${s}', '["<h1>","color","alt","#menu","flex"]') r`,
  (r) => r[0].r.ended_reason === "completed" && r[0].r.tab_switch_count === 0 && r[0].r.score === 5);

s = await session("Ola");
await ok("ostrzeżenie, ale uczciwy koniec → completed z licznikiem 1",
  `select submit_attempt('${s}', '["<h1>","color","alt","#menu","flex"]', 'completed', 1) r`,
  (r) => r[0].r.ended_reason === "completed" && r[0].r.tab_switch_count === 1);

s = await session("Zosia");
await ok("koniec czasu → time_up",
  `select submit_attempt('${s}', '["<h1>",null,null,null,null]', 'time_up', 0) r`,
  (r) => r[0].r.ended_reason === "time_up" && r[0].r.score === 1);

s = await session("Marek");
await ok("druga zmiana karty → tab_switch, brak odpowiedzi = 0 pkt",
  `select submit_attempt('${s}', '[null,null,null,null,null]', 'tab_switch', 2) r`,
  (r) => r[0].r.ended_reason === "tab_switch" && r[0].r.tab_switch_count === 2 && r[0].r.score === 0);

s = await session("Ewa");
await ok("tab_switch z licznikiem 0 → licznik podnoszony do 1",
  `select submit_attempt('${s}', '[]', 'tab_switch', 0) r`, (r) => r[0].r.tab_switch_count === 1);

s = await session("Hacker");
await ok("nieznany powód → completed (nie ufamy przeglądarce)",
  `select submit_attempt('${s}', '[]', 'wymyslony_powod', 5) r`, (r) => r[0].r.ended_reason === "completed");

s = await session("Ujemny");
await ok("ujemny licznik → 0",
  `select submit_attempt('${s}', '[]', 'completed', -7) r`, (r) => r[0].r.tab_switch_count === 0);

s = await session("Duzy");
await ok("absurdalny licznik → przycięty do 1000",
  `select submit_attempt('${s}', '[]', 'completed', 999999) r`, (r) => r[0].r.tab_switch_count === 1000);

console.log("\n== stare wywołanie z 2 argumentami ==");
s = await session("Stare");
await ok("dalej działa (wartości domyślne)",
  `select submit_attempt('${s}', '["<h1>","color","alt","#menu","flex"]') r`, (r) => r[0].r.ended_reason === "completed");
await err("nie ma już przeciążenia 3-argumentowego bez powodu",
  `select submit_attempt('${s}', '[]'::jsonb, 5)`, "does not exist");

console.log("\n== admin widzi powody ==");
await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
await ok("tabela wyników zawiera powody i liczniki",
  `select ended_reason, count(*)::int n from attempts group by 1 order by 1`,
  (r) => r.some((x) => x.ended_reason === "tab_switch" && x.n === 2) && r.some((x) => x.ended_reason === "time_up"));
await db.exec(`reset role`);
await err("bezpośredni insert ze złym powodem (CHECK, z pominięciem RLS)",
  `insert into attempts(test_title,student_name,score,total,duration_sec,ended_reason)
   values ('t','x',1,1,1,'wymyslone')`, "check constraint");
await err("ujemny licznik w bazie (CHECK)",
  `insert into attempts(test_title,student_name,score,total,duration_sec,tab_switch_count)
   values ('t','x',1,1,1,-1)`, "check constraint");

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
