// Audyt bezpieczeństwa: scenariusze atakujące wykonane na pełnym schemacie.
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
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql", "007_practical_seed.sql", "008_security_hardening.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const findings = [];
const ok = async (label, sql, check) => {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 180));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; findings.push(label); console.log("  FAIL ", label, "→", e.message.slice(0, 140)); return []; }
};
const blocked = async (label, sql) => {
  try { await db.query(sql); fail++; findings.push(label); console.log("  FAIL ", label, "→ operacja PRZESZŁA (powinna być zablokowana)"); }
  catch (e) { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 50) + ")"); }
};
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
const asAnon = (headers = '{"x-forwarded-for":"7.7.7.7"}') =>
  db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); select set_config('request.headers','${headers}',false); set role anon;`);

// --- przygotowanie danych --------------------------------------------------
await asAdmin();
const [{ id: taskId }] = (await db.query(`select id from practical_tasks where title like 'Rowerownia%'`)).rows;
const [{ r: psession }] = (await db.query(`select practical_create_session('${taskId}','4e',150,true,75) r`)).rows;
await db.query(`select practical_start_session('${psession.id}')`);
const [{ id: quizId, pin: quizPin }] = (await db.query(
  `select t.id, k.pin from tests t join test_keys k on k.test_id=t.id where title like 'HTML%'`)).rows;

await asAnon();
const [{ r: joined }] = (await db.query(`select practical_join('${psession.pin}','Ofiara Atakowana') r`)).rows;
const victimToken = joined.attempt_token;
const victimResultToken = joined.state.result_token;

console.log("\n=== A. Anonim kontra tabele (RLS) ===");
await asAnon();
for (const t of ["practical_tasks", "practical_sessions", "practical_attempts", "practical_events", "join_rate_limits", "test_keys"]) {
  await blocked(`anon nie czyta ${t}`, `select * from ${t} limit 1`);
}
await ok("anon nie widzi wynikow quizu (0 wierszy)", `select count(*)::int n from attempts`, (r) => r[0].n === 0);
await blocked("anon nie wstawia postepu", `insert into progress(class_name,subtopic_id) values ('2a','css-rwd')`);
await blocked("anon nie wstawia wyniku quizu", `insert into attempts(test_title,student_name,score,total,duration_sec) values ('x','y',5,5,1)`);
await blocked("anon nie wstawia materialu", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','x','https://a.pl')`);
await ok("anon nie usuwa testow (0 usunietych)",
  `with d as (delete from tests returning 1) select count(*)::int n from d`, (r) => r[0].n === 0);
await ok("anon nie zmienia kategorii (0 zmian)",
  `with u as (update categories set title='HACKED' returning 1) select count(*)::int n from u`, (r) => r[0].n === 0);
await blocked("anon nie czyta pytan testu (kolumna questions)", `select questions from tests limit 1`);
await blocked("anon nie czyta select * z tests", `select * from tests limit 1`);

console.log("\n=== B. Anonim kontra funkcje administratora ===");
await blocked("create_test", `select create_test('x',300,'[{"type":"input","text":"q"}]','[["a"]]')`);
await blocked("set_test_pin", `select set_test_pin('${quizId}','123456')`);
await blocked("practical_create_session", `select practical_create_session('${taskId}','4e',60)`);
await blocked("practical_start_session", `select practical_start_session('${psession.id}')`);
await blocked("practical_finish_session", `select practical_finish_session('${psession.id}')`);
await blocked("practical_recalc", `select practical_recalc('${joined.state.attempt_id}')`);
await blocked("practical_token_hash (funkcja wewnetrzna)", `select practical_token_hash('x')`);
await blocked("practical_new_token (funkcja wewnetrzna)", `select practical_new_token()`);
await blocked("random_pin (generator PIN-ow)", `select random_pin()`);

console.log("\n=== C. Podszywanie sie pod cudze podejscie ===");
await blocked("praca po zgadnietym tokenie", `select practical_state('${"a".repeat(64)}')`);
await blocked("zapis cudzej pracy po pustym tokenie", `select practical_save('', '[]'::jsonb)`);
await blocked("zapis po NULL tokenie", `select practical_save(null, '[]'::jsonb)`);
await ok("token wyniku innego ucznia nie ujawnia wyniku przed publikacja",
  `select practical_result('${victimResultToken}') r`, (r) => r[0].r.published === false && !("final_percent" in r[0].r));
await blocked("nieistniejacy token wyniku", `select practical_result('${"f".repeat(64)}')`);

console.log("\n=== D. Wstrzykiwanie i ladunki XSS w danych ucznia ===");
const XSS = `<img src=x onerror=alert(1)>`;
const SQLI = `Robert'); DROP TABLE attempts; --`;
await blocked("imie z ladunkiem XSS odrzucone (walidacja imienia)", `select practical_join('${psession.pin}', '${XSS.replace(/'/g, "''")}')`);
await blocked("imie z SQL injection odrzucone", `select practical_join('${psession.pin}', '${SQLI.replace(/'/g, "''")}')`);
await ok("tabele nadal istnieja po probie SQLi", `select count(*)::int n from attempts`, (r) => Number.isInteger(r[0].n));
const [{ r: quizOpen }] = (await db.query(`select open_test('${quizId}','${quizPin}') r`)).rows;
await db.query(`select begin_session('${quizOpen.session_id}', 'Jan Kowalski')`);
await ok("odpowiedz z kodem HTML zapisuje sie jako zwykly tekst",
  `select submit_attempt('${quizOpen.session_id}', jsonb_build_array('${XSS.replace(/'/g, "''")}','x','y','z','q')) r`,
  (r) => r[0].r.score === 0);
await asAdmin();
await ok("w bazie ladunek jest danymi, nie kodem",
  `select count(*)::int n from attempts where student_name = 'Jan Kowalski'`, (r) => r[0].n === 1);
await asAnon();

console.log("\n=== E. Manipulacja plikami pracy ===");
const badNames = ["../../../etc/passwd", "index.php", "shell.html.php", "a".repeat(41) + ".html", "plik z spacja.html", "index.html/../x.html", ".htaccess"];
for (const name of badNames) {
  await blocked(`nazwa pliku odrzucona: ${name.slice(0, 28)}`,
    `select practical_save('${victimToken}', jsonb_build_array(jsonb_build_object('name','${name}','content','x')))`);
}
await blocked("plik spoza listy zadania",
  `select practical_save('${victimToken}', '[{"name":"obcy.html","content":"x"}]'::jsonb)`);
await blocked("16 plikow (limit 15)",
  `select practical_save('${victimToken}', (select jsonb_agg(jsonb_build_object('name','p'||i||'.html','content','x')) from generate_series(1,16) i))`);
await blocked("plik 201 KB",
  `select practical_save('${victimToken}', jsonb_build_array(jsonb_build_object('name','index.html','content',repeat('a',200001))))`);
await blocked("projekt > 1 MB",
  `select practical_save('${victimToken}', (select jsonb_agg(jsonb_build_object('name','p'||i||'.html','content',repeat('b',150000))) from generate_series(1,8) i))`);

console.log("\n=== F. Zdarzenia nadzoru — naduzycia ===");
await blocked("nieznany typ zdarzenia", `select practical_event('${victimToken}','rm -rf')`);
await db.exec(`do $$ begin for i in 1..520 loop perform practical_event('${victimToken}', 'large_paste', '{}'::jsonb); end loop; end $$;`);
pass++; console.log("  ok    520 zdarzen wyslanych (proba przepelnienia dziennika)");
await asAdmin();
await ok("liczba zdarzen w bazie zatrzymana na limicie",
  `select count(*)::int n from practical_events where attempt_id='${joined.state.attempt_id}'`, (r) => r[0].n <= 501);
const [{ n: pasteCount }] = (await db.query(`select large_paste_count n from practical_attempts where id='${joined.state.attempt_id}'`)).rows;
console.log(`        (licznik wklejen po ataku: ${pasteCount})`);
await asAnon();
const BIG = "z".repeat(300000);
await ok("PROBA: ogromny details w zdarzeniu",
  `select practical_event('${victimToken}','large_paste', jsonb_build_object('x','${BIG}')) r`, () => true);
await asAdmin();
const [{ maxlen }] = (await db.query(
  `select coalesce(max(length(details::text)),0) maxlen from practical_events where attempt_id='${joined.state.attempt_id}'`)).rows;
if (Number(maxlen) > 5000) {
  fail++; findings.push(`details zdarzenia bez limitu rozmiaru (zapisano ${maxlen} znakow)`);
  console.log(`  FAIL  details zdarzenia bez limitu rozmiaru → zapisano ${maxlen} znakow`);
} else {
  pass++; console.log("  ok    details zdarzenia ograniczone rozmiarem");
}

console.log("\n=== G. Oszukiwanie czasu i wyniku ===");
await asAnon();
await ok("uczen nie moze przedluzyc sobie czasu (ends_at z serwera)",
  `select (practical_state('${victimToken}')->'session'->>'ends_at') is not null b`, (r) => r[0].b === true);
await asAdmin();
await db.query(`update practical_sessions set ends_at = now() - interval '2 minutes' where id='${psession.id}'`);
await asAnon();
await blocked("zapis po uplywie czasu odrzucony", `select practical_save('${victimToken}', '[]'::jsonb)`);
await ok("oddanie po czasie zapisuje sie jako time_up",
  `select practical_submit('${victimToken}', '[{"name":"index.html","content":"podmienione po czasie"}]'::jsonb, 'completed') r`,
  (r) => r[0].r.ended_reason === "time_up");
await asAdmin();
await ok("praca po czasie NIE zostala nadpisana",
  `select files::text f from practical_attempts where id='${joined.state.attempt_id}'`,
  (r) => !r[0].f.includes("podmienione po czasie"));
await db.exec(`update practical_attempts set auto_results='[]'::jsonb,
    overrides = (select jsonb_agg(jsonb_build_object('id', t->>'id', 'passed', true, 'points', 9999, 'reason','x'))
                 from practical_tasks pt, jsonb_array_elements(pt.auto_tests) t where pt.id='${taskId}'),
    manual_scores = '[{"id":"c-estetyka","points":9999},{"id":"c-kod","points":9999}]'
  where id='${joined.state.attempt_id}'`);
await ok("korekta powyzej maksimum jest przycinana", `select practical_recalc('${joined.state.attempt_id}') p`, (r) => Number(r[0].p) === 100);
await db.exec(`update practical_attempts set overrides='[]'::jsonb, manual_scores='[{"id":"c-estetyka","points":-500}]' where id='${joined.state.attempt_id}'`);
await ok("ujemne punkty nie obnizaja wyniku ponizej 0", `select practical_recalc('${joined.state.attempt_id}') p`, (r) => Number(r[0].p) === 0);

console.log("\n=== H. Limity prob i podszywanie sie pod IP ===");
await asAnon('{"x-forwarded-for":"8.8.8.8"}');
for (let i = 0; i < 10; i++) await db.query(`select practical_join('000000','Ktos Testowy')`);
await ok("limit prob PIN-u zadziałał", `select practical_join('${psession.pin}','Nowy Ktos') r`, (r) => r[0].r.reason === "rate_limited");
await asAnon('{"x-forwarded-for":"1.1.1.1, 8.8.8.8","cf-connecting-ip":"8.8.8.8"}');
await ok("PROBA obejscia limitu przez naglowek x-forwarded-for",
  `select practical_join('${psession.pin}','Obejscie Limitu') r`, (r) => {
    if (r[0].r.reason === "rate_limited") { console.log("        (cf-connecting-ip ma pierwszenstwo — obejscie nieskuteczne)"); return true; }
    findings.push("limit prob PIN-u da sie obejsc podmieniajac naglowek IP");
    console.log("        UWAGA: obejscie skuteczne — licznik liczony po naglowku od klienta");
    return true;
  });

console.log("\n=== J. Lista adminow (migracja 008) ===");
await db.exec("reset role; insert into auth.users values ('22222222-2222-2222-2222-222222222222')");
await db.exec("select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false); set role authenticated;");
await ok("zalogowany spoza listy nie jest adminem", "select is_admin() a", (r) => r[0].a === false);
await blocked("zalogowany spoza listy nie tworzy testu", "select create_test('x',300,'[{\"type\":\"input\",\"text\":\"q\"}]','[[\"a\"]]')");
await blocked("zalogowany spoza listy nie tworzy sesji praktycznej", `select practical_create_session('${taskId}','4e',60)`);
await ok("zalogowany spoza listy nie czyta wynikow quizu", "select count(*)::int n from attempts", (r) => r[0].n === 0);
await ok("zalogowany spoza listy nie czyta prac praktycznych", "select count(*)::int n from practical_attempts", (r) => r[0].n === 0);
await ok("zalogowany spoza listy nie zmienia postepu (0 zmian)",
  "with u as (update progress set updated_at=now() returning 1) select count(*)::int n from u", (r) => r[0].n === 0);
await blocked("zalogowany nie dopisze sie do listy adminow",
  "insert into admins(user_id) values ('22222222-2222-2222-2222-222222222222')");
await asAdmin();
await ok("nauczyciel z listy nadal jest adminem", "select is_admin() a", (r) => r[0].a === true);

console.log("\n=== I. Spojnosc danych (CHECK) ===");
await db.exec("reset role");
await blocked("wynik quizu wiekszy niz liczba pytan",
  `insert into attempts(test_title,student_name,score,total,duration_sec) values ('t','x',9,5,1)`);
await blocked("procent > 100 w pracy praktycznej",
  `update practical_attempts set final_percent=150 where id='${joined.state.attempt_id}'`);
await blocked("status pracy spoza listy",
  `update practical_attempts set status='super_admin' where id='${joined.state.attempt_id}'`);
await blocked("PIN sesji z liter",
  `update practical_sessions set pin='abcdef' where id='${psession.id}'`);
await blocked("klasa spoza listy w sesji",
  `update practical_sessions set class_name='5x' where id='${psession.id}'`);

console.log("\n== PUBLIKACJE REALTIME ==");
// PGlite przyjmuje kolumnę generowaną na liście kolumn publikacji, a prawdziwy
// Postgres nie ("cannot use generated column ... in publication column list").
// Migracja 008 wywracała się przez to na Supabase — tu pilnujemy, żeby nie wróciło.
await ok("żadna publikowana kolumna nie jest generowana",
  `select count(*)::int n
   from pg_publication_rel pr
   join unnest(pr.prattrs::int2[]) as att(attnum) on true
   join pg_attribute a on a.attrelid = pr.prrelid and a.attnum = att.attnum
   where a.attgenerated <> ''`,
  (r) => r[0].n === 0);
await ok("publikacja tests nie wypuszcza kolumny questions",
  `select count(*)::int n
   from pg_publication_rel pr
   join pg_class c on c.oid = pr.prrelid
   join unnest(pr.prattrs::int2[]) as att(attnum) on true
   join pg_attribute a on a.attrelid = pr.prrelid and a.attnum = att.attnum
   where c.relname = 'tests' and a.attname = 'questions'`,
  (r) => r[0].n === 0);
await ok("publikacja tests ma listę kolumn (nie całą tabelę)",
  `select count(*)::int n from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid
   where c.relname = 'tests' and pr.prattrs is not null`,
  (r) => r[0].n === 1);

console.log(`\n${pass} ok, ${fail} uwag`);
if (findings.length) console.log("Do poprawy:\n- " + findings.join("\n- "));
process.exit(0);
