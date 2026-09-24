// Zegar po stronie serwera: quiz_time i practical_time.
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
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "009_server_clock.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = async (label, sql, check) => {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 180));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; console.log("  FAIL ", label, "→", e.message.slice(0, 120)); return []; }
};
const blocked = async (label, sql) => {
  try { await db.query(sql); fail++; console.log("  FAIL ", label, "→ przeszło, a nie powinno"); }
  catch (e) { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 45) + ")"); }
};
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
const asAnon = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); select set_config('request.headers','{"x-forwarded-for":"3.3.3.3"}',false); set role anon;`);

console.log("== quiz_time (część teoretyczna) ==");
await asAdmin();
const [{ id: testId, pin, time_limit }] = (await db.query(
  `select t.id, k.pin, t.time_limit from tests t join test_keys k on k.test_id=t.id where title like 'HTML%'`)).rows;
await asAnon();
const [{ r: opened }] = (await db.query(`select open_test('${testId}','${pin}') r`)).rows;
const sid = opened.session_id;

await ok("przed startem: brak terminu, czas serwera jest",
  `select quiz_time('${sid}') r`, (r) => r[0].r.ends_at === null && typeof r[0].r.server_now === "string");
await db.query(`select begin_session('${sid}', 'Ala Czasowa')`);
await ok("po starcie: termin = start + limit testu",
  `select (quiz_time('${sid}')->>'ends_at')::timestamptz - (quiz_time('${sid}')->>'started_at')::timestamptz d`,
  (r) => Math.round(Number(String(r[0].d).split(":")[1] ?? 0) * 60 + Number(String(r[0].d).split(":")[2] ?? 0)) === time_limit);
await ok("pozostały czas liczony przez serwer maleje, nie rośnie", `
  select ((quiz_time('${sid}')->>'ends_at')::timestamptz - (quiz_time('${sid}')->>'server_now')::timestamptz) < make_interval(secs => ${time_limit} + 1) b`,
  (r) => r[0].b === true);
await ok("przestawienie zegara u ucznia niczego nie zmienia (serwer podaje swój czas)",
  `select (quiz_time('${sid}')->>'server_now')::timestamptz <= now() + interval '1 second' b`, (r) => r[0].b === true);
await blocked("nieistniejąca sesja", `select quiz_time(gen_random_uuid())`);
await ok("po oddaniu pracy widać, że sesja jest zamknięta", `
  with s as (select submit_attempt('${sid}', '[]'::jsonb) x)
  select (quiz_time('${sid}')->>'submitted')::boolean b from s`, (r) => r[0].b === true);

console.log("\n== practical_time (część praktyczna) ==");
await asAdmin();
const [{ id: taskId }] = (await db.query(`select id from practical_tasks where title like 'Rowerownia%'`)).rows;
const [{ r: sess }] = (await db.query(`select practical_create_session('${taskId}','4e',150,true,75) r`)).rows;
await asAnon();
const [{ r: joined }] = (await db.query(`select practical_join('${sess.pin}','Bartek Czasowy') r`)).rows;
const token = joined.attempt_token;

await ok("w poczekalni: brak terminu, status lobby",
  `select practical_time('${token}') r`, (r) => r[0].r.ends_at === null && r[0].r.session_status === "lobby");
await asAdmin();
await db.query(`select practical_start_session('${sess.id}')`);
await asAnon();
await ok("po starcie: termin z serwera, status active",
  `select practical_time('${token}') r`, (r) => r[0].r.ends_at !== null && r[0].r.session_status === "active");
await ok("odpowiedź nie zawiera plików pracy (lekkie zapytanie)",
  `select practical_time('${token}')::text t`, (r) => !r[0].t.includes("files"));
await ok("licznik zmian karty widoczny dla ucznia",
  `select (practical_time('${token}')->>'tab_switch_count')::int n`, (r) => r[0].n === 0);
await blocked("zły token", `select practical_time('nie-ma-takiego-tokenu')`);

console.log("\n== nowy typ zdarzenia: utrata fokusa okna ==");
await ok("focus_lost zwiększa licznik opuszczeń",
  `select practical_event('${token}','focus_lost') r`, (r) => r[0].r.tab_switch_count === 1 && r[0].r.should_end === false);
await ok("drugie opuszczenie (inny rodzaj) kończy pracę",
  `select practical_event('${token}','fullscreen_exit') r`, (r) => r[0].r.tab_switch_count === 2 && r[0].r.should_end === true);
await blocked("nieznany typ zdarzenia nadal odrzucany", `select practical_event('${token}','cokolwiek')`);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
