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
for (const f of ["schema.sql","002_test_pin.sql","seed.sql","003_subtopic_links.sql","004_matching_questions.sql","005_tab_switch.sql","006_practical.sql","007_practical_seed.sql","008_security_hardening.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}
await db.exec(read("007_practical_seed.sql"));
await db.exec(read("006_practical.sql")); // idempotencja
await db.exec(read("007_practical_seed.sql")); // idempotencja seeda
await db.exec(read("008_security_hardening.sql"));

let pass = 0, fail = 0;
const ok = async (label, sql, check) => {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 200));
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
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
const asAnon = (ip = "9.9.9.9") => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); select set_config('request.headers','{"x-forwarded-for":"${ip}"}',false); set role anon;`);

const FILES = `[{"name":"index.html","content":"<!DOCTYPE html><html lang=\\"pl\\"><body><h1>Start</h1></body></html>"},
                {"name":"styl.css","content":""},{"name":"skrypt.js","content":""}]`;
const TESTS = `[{"id":"t1","name":"Strona ma nagłówek","type":"selector_count","points":5,"page":"index.html","selector":"h1","min":1},
                {"id":"t2","name":"Plik CSS niepusty","type":"file_not_empty","points":5,"file":"styl.css"}]`;
const CRIT = `[{"id":"c1","name":"Estetyka","description":"zgodność z makietą","points":10}]`;

console.log("== ADMIN: zadanie i sesja ==");
await asAdmin();
const [{ id: taskId }] = await ok("tworzy zadanie",
  `insert into practical_tasks (title, summary, content_md, files, auto_tests, manual_criteria, created_by)
   values ('Sklep', 'Strona sklepu', '# Zadanie', '${FILES}'::jsonb, '${TESTS}'::jsonb, '${CRIT}'::jsonb, auth.uid())
   returning id`);
await err("zła nazwa pliku odrzucona (CHECK)",
  `insert into practical_tasks (title, files) values ('X', '[{"name":"../etc/passwd","content":"x"}]')`, "check constraint");
await err("nieznany typ testu odrzucony (CHECK)",
  `insert into practical_tasks (title, auto_tests) values ('X', '[{"id":"a","name":"n","type":"php_output","points":1}]')`, "check constraint");
await err("plik > 200 KB odrzucony (CHECK)",
  `insert into practical_tasks (title, files) values ('X', jsonb_build_array(jsonb_build_object('name','index.html','content',repeat('a',200001))))`, "check constraint");
await err("sesja z niegotowego zadania",
  `select practical_create_session('${taskId}', '4e', 150)`, "task_not_ready");
await ok("oznaczenie zadania jako gotowe", `update practical_tasks set is_ready = true where id = '${taskId}'`);
const [{ r: session }] = await ok("tworzy sesję z PIN-em",
  `select practical_create_session('${taskId}', '4e', 150, true, 75) r`, (r) => /^\d{6}$/.test(r[0].r.pin));
await err("zła klasa", `select practical_create_session('${taskId}', '3z', 150)`, "invalid_class");
await err("absurdalny czas", `select practical_create_session('${taskId}', '4e', 9000)`, "invalid_minutes");

console.log("\n== UCZEŃ: brak dostępu do tabel ==");
await asAnon();
await err("nie czyta zadań", `select * from practical_tasks`, "permission denied");
await err("nie czyta sesji", `select * from practical_sessions`, "permission denied");
await err("nie czyta podejść", `select * from practical_attempts`, "permission denied");
await err("nie czyta liczników prób", `select * from join_rate_limits`, "permission denied");

console.log("\n== UCZEŃ: dołączanie ==");
await ok("zły PIN", `select practical_join('000000','Ala') r`, (r) => r[0].r.reason === "bad_pin");
await err("imię z cyframi odrzucone", `select practical_join('${session.pin}','Ala123')`, "invalid_name");
await err("imię 1-znakowe odrzucone", `select practical_join('${session.pin}','A')`, "invalid_name");
const [{ r: joined }] = await ok("dołącza z PIN-em i imieniem",
  `select practical_join('${session.pin}','Ala Kowalska') r`,
  (r) => r[0].r.ok && r[0].r.attempt_token.length >= 32 && r[0].r.state.session.status === "lobby");
const token = joined.attempt_token;
await ok("polskie znaki w imieniu", `select practical_join('${session.pin}','Zażółć Gęślą') r`, (r) => r[0].r.ok);
await ok("duplikat imienia odrzucony", `select practical_join('${session.pin}','ala kowalska') r`, (r) => r[0].r.reason === "name_taken");
await ok("startowe pliki skopiowane z zadania", `select practical_state('${token}') r`,
  (r) => r[0].r.files.length === 3 && r[0].r.task.files.length === 3);
await ok("uczeń nie widzi testów ani wzorca", `select practical_state('${token}') r`,
  (r) => r[0].r.task.test_names.length === 0 && !('reference_files' in r[0].r.task) && !('auto_tests' in r[0].r.task));
await err("zły token", `select practical_state('zly-token')`, "attempt_invalid");

console.log("\n== limit prób PIN-u ==");
await asAnon("13.13.13.13");
for (let i = 0; i < 10; i++) await db.query(`select practical_join('000000','Ktos Nowy')`);
await ok("11. próba w minucie → rate_limited", `select practical_join('${session.pin}','Nowy Uczen') r`, (r) => r[0].r.reason === "rate_limited");
await asAnon("14.14.14.14");
await ok("inne IP nadal może dołączyć", `select practical_join('${session.pin}','Inny Uczen') r`, (r) => r[0].r.ok === true);

console.log("\n== zapis pracy ==");
await asAnon();
const SAVE = `[{"name":"index.html","content":"<h1>Moja strona</h1>"},{"name":"styl.css","content":"h1{color:red}"},{"name":"skrypt.js","content":""}]`;
await err("zapis w poczekalni odrzucony", `select practical_save('${token}', '${SAVE}'::jsonb)`, "session_not_active");
await asAdmin();
await ok("nauczyciel startuje sesję", `select practical_start_session('${session.id}') r`, (r) => r[0].r.ends_at);
await asAnon();
await ok("autozapis działa", `select practical_save('${token}', '${SAVE}'::jsonb) r`, (r) => r[0].r.ok);
await ok("stan po odświeżeniu zwraca zapisane pliki", `select practical_state('${token}') r`,
  (r) => r[0].r.files.find((f) => f.name === "styl.css").content === "h1{color:red}");
await db.exec("select pg_sleep(1.1)");
await err("plik spoza zadania odrzucony",
  `select practical_save('${token}', '[{"name":"obcy.html","content":"x"}]'::jsonb)`, "unexpected_file");
await err("za duży plik odrzucony",
  `select practical_save('${token}', jsonb_build_array(jsonb_build_object('name','index.html','content',repeat('a',200001))))`, "invalid_files");

console.log("\n== zdarzenia nadzoru ==");
await ok("1. zmiana karty → licznik 1, bez kończenia",
  `select practical_event('${token}','tab_hidden') r`, (r) => r[0].r.tab_switch_count === 1 && r[0].r.should_end === false);
await ok("wyjście z pełnego ekranu liczy się tak samo → should_end",
  `select practical_event('${token}','fullscreen_exit') r`, (r) => r[0].r.tab_switch_count === 2 && r[0].r.should_end === true);
await ok("duże wklejenie liczone osobno",
  `select practical_event('${token}','large_paste','{"length":900,"file":"index.html"}') r`,
  (r) => r[0].r.large_paste_count === 1 && r[0].r.tab_switch_count === 2);
await err("nieznany typ zdarzenia", `select practical_event('${token}','cokolwiek')`, "invalid_event");

console.log("\n== oddanie pracy ==");
const [{ r: submitted }] = await ok("oddaje pracę",
  `select practical_submit('${token}', '${SAVE}'::jsonb, 'tab_switch') r`,
  (r) => r[0].r.ok && r[0].r.result_token && r[0].r.ended_reason === "tab_switch");
await ok("drugie oddanie nie nadpisuje", `select practical_submit('${token}', '[]'::jsonb, 'completed') r`,
  (r) => r[0].r.already === true);
await err("zapis po oddaniu odrzucony", `select practical_save('${token}', '${SAVE}'::jsonb)`, "already_submitted");
await ok("wynik przed publikacją", `select practical_result('${submitted.result_token}') r`,
  (r) => r[0].r.published === false && !('final_percent' in r[0].r));

console.log("\n== ocena i publikacja ==");
await asAdmin();
await ok("zapis wyników automatycznych",
  `update practical_attempts set auto_results = '[{"id":"t1","passed":true,"points":5,"message":"OK"},{"id":"t2","passed":false,"points":0,"message":"Plik pusty"}]',
       status = 'auto_checked', auto_checked_at = now()
   where result_token = '${submitted.result_token}'`);
await ok("procent: 5/20 = 25%",
  `select practical_recalc(id) p from practical_attempts where result_token='${submitted.result_token}'`,
  (r) => Number(r[0].p) === 25);
await ok("korekta nauczyciela + punkty ręczne",
  `update practical_attempts set overrides = '[{"id":"t2","passed":true,"points":5,"reason":"plik był poprawny"}]',
       manual_scores = '[{"id":"c1","points":8}]', teacher_comment = 'Dobra robota', status = 'reviewed'
   where result_token = '${submitted.result_token}'`);
await ok("procent po korekcie: 18/20 = 90%",
  `select practical_recalc(id) p from practical_attempts where result_token='${submitted.result_token}'`,
  (r) => Number(r[0].p) === 90);
await ok("punkty ponad maksimum są przycinane",
  `with u as (update practical_attempts set manual_scores='[{"id":"c1","points":999}]'
              where result_token='${submitted.result_token}' returning id)
   select practical_recalc(id) p from u`, (r) => Number(r[0].p) === 100);
await ok("publikacja",
  `update practical_attempts set published_at = now(), status='published' where result_token='${submitted.result_token}'`);

console.log("\n== wynik dla ucznia po publikacji ==");
await asAnon();
await ok("widzi procent, testy i kryteria", `select practical_result('${submitted.result_token}') r`, (r) => {
  const x = r[0].r;
  return x.published === true && Number(x.final_percent) === 100 && x.passed === true
    && x.tests.length === 2 && x.tests.find((t) => t.id === "t2").points === 5
    && x.criteria.length === 1 && x.teacher_comment === "Dobra robota";
});
await ok("wynik nie zawiera rozwiązania wzorcowego ani parametrów testów",
  `select practical_result('${submitted.result_token}')::text t`,
  (r) => !r[0].t.includes("reference") && !r[0].t.includes("selector"));
await err("nieznany token wyniku", `select practical_result('nie-ma-takiego')`, "result_not_found");

console.log("\n== zakończenie sesji przez nauczyciela ==");
await asAdmin();
const [{ r: s2 }] = await ok("nowa sesja", `select practical_create_session('${taskId}', '2a', 60) r`);
await ok("start", `select practical_start_session('${s2.id}')`);
await asAnon("20.20.20.20");
await ok("uczeń dołącza", `select practical_join('${s2.pin}','Bartek Nowak') r`, (r) => r[0].r.ok);
await asAdmin();
await ok("nauczyciel kończy sesję → wymusza oddanie",
  `select practical_finish_session('${s2.id}') r`, (r) => r[0].r.forced === 1);
await ok("prace mają ended_reason teacher_ended",
  `select ended_reason from practical_attempts where session_id='${s2.id}'`, (r) => r[0].ended_reason === "teacher_ended");
await ok("PIN zwolniony po zakończeniu sesji (można użyć ponownie)",
  `select count(*)::int n from practical_sessions where pin='${s2.pin}'`, (r) => r[0].n === 1);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
