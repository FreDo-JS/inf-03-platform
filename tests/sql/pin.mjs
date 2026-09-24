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
async function ok(label, sql, check) {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check failed: " + JSON.stringify(r.rows));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; console.log("  FAIL ", label, "→", e.message); return []; }
}
async function err(label, sql, match) {
  try { await db.query(sql); fail++; console.log("  FAIL ", label, "→ brak błędu"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 55) + ")"); }
  }
}
const setIp = (ip) => db.exec(`select set_config('request.headers', '{"x-forwarded-for":"${ip}, 10.0.0.1"}', false)`);
const asAnon = async () => { await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); set role anon;`); };
const asAdmin = async () => { await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`); };

const [{ id: htmlId, pin: htmlPin }] = (await db.query(`select t.id, k.pin from tests t join test_keys k on k.test_id=t.id where title like 'HTML%'`)).rows;
const [{ id: sqlId, pin: sqlPin }] = (await db.query(`select t.id, k.pin from tests t join test_keys k on k.test_id=t.id where title like 'SQL%'`)).rows;
console.log("PIN-y z seeda:", htmlPin, sqlPin);
await ok("seed dostał losowe 6-cyfrowe PIN-y", `select bool_and(pin ~ '^[0-9]{6}$') b, count(distinct pin)::int n from test_keys`, (r) => r[0].b && r[0].n === 3);

console.log("\n== ANON ==");
await asAnon(); await setIp("1.1.1.1");
await ok("lista testów (bez questions)", `select id, title, time_limit, question_count from tests`, (r) => r.length === 3 && r.every((x) => x.question_count === 5));
await err("NIE czyta tests.questions", `select questions from tests`, "permission denied");
await err("NIE czyta select *", `select * from tests`, "permission denied");
await err("NIE czyta test_sessions", `select * from test_sessions`, "permission denied");
await err("NIE czyta pin_failures", `select * from pin_failures`, "permission denied");
await err("NIE wstawia attempts bezpośrednio (polityka usunięta)", `insert into attempts(test_title, student_name, score, total, duration_sec) values ('t','x',5,5,1)`, "row-level security");
await err("stara submit_attempt(imię) nie istnieje", `select submit_attempt('${htmlId}'::uuid, 'Ania'::text, '[]'::jsonb, 10)`, "does not exist");
await ok("zły PIN → bad_pin, bez pytań", `select open_test('${htmlId}', '000000') r`, (r) => r[0].r.ok === false && r[0].r.reason === "bad_pin" && !r[0].r.questions);
await ok("PIN nie-cyfrowy → bad_pin", `select open_test('${htmlId}', 'abc') r`, (r) => r[0].r.reason === "bad_pin");
await ok("nieistniejący test → not_found", `select open_test(gen_random_uuid(), '123456') r`, (r) => r[0].r.reason === "not_found");
const [{ r: opened }] = await ok("dobry PIN → sesja + pytania", `select open_test('${htmlId}', '${htmlPin}') r`, (r) => r[0].r.ok && r[0].r.questions.length === 5 && r[0].r.session_id);
const sid = opened.session_id;
await err("submit przed begin_session", `select submit_attempt('${sid}', '[]')`, "session_invalid");
await err("begin_session: puste imię", `select begin_session('${sid}', E' \\t ')`, "invalid_name");
await ok("begin_session: imię oczyszczone", `select begin_session('${sid}', E'  Ania\\u0007  Nowak ') r`, (r) => r[0].r.student_name === "Ania Nowak");
await err("begin_session drugi raz", `select begin_session('${sid}', 'Ktoś')`, "session_used");
await ok("submit_attempt: 5/5", `select submit_attempt('${sid}', '["<h1>","color"," ALT ","#menu","flex"]') r`, (r) => r[0].r.score === 5 && r[0].r.duration_sec >= 0);
await err("drugi submit tej sesji", `select submit_attempt('${sid}', '[]')`, "duplicate_attempt");
await err("losowy session_id", `select submit_attempt(gen_random_uuid(), '[]')`, "session_invalid");

console.log("\n== limit prób PIN ==");
await setIp("6.6.6.6");
for (let i = 0; i < 20; i++) await db.query(`select open_test('${sqlId}', '000000')`);
await ok("21. próba z tego IP → rate_limited (nawet z dobrym PIN)", `select open_test('${sqlId}', '${sqlPin}') r`, (r) => r[0].r.reason === "rate_limited");
await setIp("7.7.7.7");
await ok("inne IP nadal może wejść", `select open_test('${sqlId}', '${sqlPin}') r`, (r) => r[0].r.ok === true);

console.log("\n== sesja wygasła ==");
const [{ r: o2 }] = await ok("otwarcie", `select open_test('${sqlId}', '${sqlPin}') r`);
await ok("start", `select begin_session('${o2.session_id}', 'Spóźniony')`);
await db.exec(`reset role; update test_sessions set started_at = now() - interval '1 hour' where id='${o2.session_id}';`);
await asAnon();
await err("submit po limicie + 5 min", `select submit_attempt('${o2.session_id}', '[]')`, "session_expired");

console.log("\n== ADMIN ==");
await asAdmin();
await ok("widzi wynik z imieniem z sesji", `select student_name, score from attempts`, (r) => r.length === 1 && r[0].student_name === "Ania Nowak");
await ok("widzi PIN-y", `select pin from test_keys`, (r) => r.length === 3);
await ok("create_test z własnym PIN", `select create_test('Nowy', 300, '[{"type":"input","text":"Q"}]', '[["a"]]', '123456') r`, (r) => r[0].r.pin === "123456" && r[0].r.id);
await ok("create_test bez PIN → losowy", `select create_test('Nowy2', 300, '[{"type":"input","text":"Q"}]', '[["a"]]') r`, (r) => /^\d{6}$/.test(r[0].r.pin));
await err("create_test: PIN 4 cyfry", `select create_test('N', 300, '[{"type":"input","text":"Q"}]', '[["a"]]', '1234')`, "invalid_pin");
await ok("set_test_pin → nowy PIN, reset licznika", `select set_test_pin('${sqlId}') p`, (r) => /^\d{6}$/.test(r[0].p));
await asAnon(); await setIp("6.6.6.6");
const [{ p: newPin }] = (await (async () => { await asAdmin(); const r = await db.query(`select pin p from test_keys where test_id='${sqlId}'`); await asAnon(); return r; })()).rows;
await ok("po zmianie PIN zablokowane IP znów wchodzi", `select open_test('${sqlId}', '${newPin}') r`, (r) => r[0].r.ok === true);
await ok("stary PIN już nie działa", `select open_test('${sqlId}', '${sqlPin}') r`, (r) => sqlPin === newPin || r[0].r.reason === "bad_pin");
await err("anon nie zmieni PIN", `select set_test_pin('${sqlId}', '111111')`, "permission denied");

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
