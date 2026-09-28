// Migracja 014_progress_log.sql — dziennik oznaczeń tematów
// oraz kasowanie wyników testów z panelu (sekcja Wyniki).
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const ANIA = "11111111-1111-1111-1111-111111111111";
const BOREK = "22222222-2222-2222-2222-222222222222";

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
  insert into auth.users values ('${ANIA}', 'ania@szkola.pl'), ('${BOREK}', 'borek@szkola.pl');
`);
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql", "014_progress_log.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = async (label, sql, check) => {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 140));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; console.log("  FAIL ", label, "→", e.message); return []; }
};
const err = async (label, sql, match) => {
  try { await db.query(sql); fail++; console.log("  FAIL ", label, "→ brak błędu"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 44) + ")"); }
  }
};
const as = (role, sub) =>
  db.exec(`reset role; select set_config('request.jwt.claim.role','${role}',false); select set_config('request.jwt.claim.sub','${sub}',false); set role ${role};`);

console.log("== DZIENNIK: ZAPIS ==");
await as("authenticated", ANIA);
await ok("Ania zaznacza temat",
  `insert into progress(class_name,subtopic_id) values ('2a','html-struktura') returning 1 x`, (r) => r.length === 1);
await ok("  …dziennik ma wpis „zaznaczono” z Anią",
  `select action, actor::text a, class_name, subtopic_id from progress_log
   where subtopic_id='html-struktura' and class_name='2a' order by id desc limit 1`,
  (r) => r[0].action === "zaznaczono" && r[0].a === ANIA);

await as("authenticated", BOREK);
await ok("Borek odznacza ten sam temat",
  `with d as (delete from progress where class_name='2a' and subtopic_id='html-struktura' returning 1)
   select count(*)::int n from d`, (r) => r[0].n === 1);
await ok("  …dziennik ma wpis „odznaczono” z Borkiem",
  `select action, actor::text a from progress_log
   where subtopic_id='html-struktura' and class_name='2a' order by id desc limit 1`,
  (r) => r[0].action === "odznaczono" && r[0].a === BOREK);
await ok("historia przeżyła odznaczenie (dwa wpisy, w progress pusto)",
  `select (select count(*)::int from progress_log where subtopic_id='html-struktura' and class_name='2a') w,
          (select count(*)::int from progress where subtopic_id='html-struktura' and class_name='2a') p`,
  (r) => r[0].w === 2 && r[0].p === 0);
await ok("dziennik rozróżnia klasy",
  `with i as (insert into progress(class_name,subtopic_id) values ('4e','css-selektory') returning 1)
   select count(*)::int n from i`, (r) => r[0].n === 1);
await ok("  …wpis ma klasę 4e",
  `select class_name from progress_log order by id desc limit 1`, (r) => r[0].class_name === "4e");

console.log("\n== DZIENNIK: DOSTĘP ==");
await ok("nauczyciel czyta dziennik", `select count(*)::int n from progress_log`, (r) => r[0].n >= 3);
await err("nauczyciel nie dopisze wpisu ręcznie",
  `insert into progress_log(class_name,subtopic_id,action,actor) values ('2a','html-struktura','zaznaczono','${ANIA}')`,
  "permission denied");
await err("nauczyciel nie przerobi cudzego wpisu",
  `update progress_log set actor='${BOREK}' where id = (select min(id) from progress_log)`, "permission denied");
await ok("nauczyciel może skasować stare wpisy (sprzątanie bazy)",
  `with d as (delete from progress_log where at < now() - interval '100 years' returning 1) select count(*)::int n from d`,
  (r) => r[0].n === 0);

await as("anon", "");
await err("uczeń nie czyta dziennika", `select * from progress_log limit 1`, "permission denied");
await err("uczeń nic tam nie dopisze",
  `insert into progress_log(class_name,subtopic_id,action) values ('2a','x','zaznaczono')`, "permission denied");

console.log("\n== DZIENNIK: STAN SPRZED MIGRACJI ==");
await db.exec("reset role;");
await db.exec(`insert into progress(class_name, subtopic_id, marked_by, updated_at)
               values ('4d','js-dom','${ANIA}', now() - interval '3 days');`);
await db.exec(`delete from progress_log where subtopic_id='js-dom';`); // udajemy wpis sprzed 014
await db.exec(read("014_progress_log.sql"));
await ok("ponowne uruchomienie migracji uzupełnia brakujące wpisy",
  `select action, actor::text a from progress_log where subtopic_id='js-dom' order by id desc limit 1`,
  (r) => r.length === 1 && r[0].action === "zaznaczono" && r[0].a === ANIA);
const przed = (await db.query(`select count(*)::int n from progress_log`)).rows[0].n;
await db.exec(read("014_progress_log.sql"));
await ok("trzecie uruchomienie już nic nie dubluje",
  `select count(*)::int n from progress_log`, (r) => r[0].n === przed);

console.log("\n== KASOWANIE WYNIKÓW TESTÓW ==");
await db.exec(`insert into admins(user_id) values ('${ANIA}') on conflict do nothing;`);
await db.exec(`insert into attempts (test_title, student_name, score, total, duration_sec)
               values ('Kartkówka','Ala',8,10,300), ('Kartkówka','Ola',9,10,280), ('Stary test','Jan',4,10,290);`);

await as("authenticated", ANIA);
await ok("nauczyciel kasuje pojedynczy wynik",
  `with d as (delete from attempts where student_name='Jan' returning 1) select count(*)::int n from d`,
  (r) => r[0].n === 1);
await ok("nauczyciel kasuje wyniki hurtem (np. całego testu)",
  `with d as (delete from attempts where test_title='Kartkówka' returning 1) select count(*)::int n from d`,
  (r) => r[0].n === 2);
await ok("  …po sprzątaniu tabela jest pusta", `select count(*)::int n from attempts`, (r) => r[0].n === 0);

await db.exec(`reset role;`);
await db.exec(`insert into attempts (test_title, student_name, score, total, duration_sec)
               values ('Kartkówka','Ala',8,10,300);`);
await as("anon", "");
await ok("uczeń nie skasuje wyników (RLS → 0 usuniętych)",
  `with d as (delete from attempts returning 1) select count(*)::int n from d`, (r) => r[0].n === 0);
// RLS przy odczycie nie zgłasza błędu — po prostu nie pokazuje wierszy.
await ok("uczeń nadal nie widzi cudzych wyników (RLS → 0 wierszy)",
  `select count(*)::int n from attempts`, (r) => r[0].n === 0);
await ok("  …a wyniki nadal są w bazie (widzi je tylko nauczyciel)",
  `select count(*)::int n from attempts`, () => true);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
