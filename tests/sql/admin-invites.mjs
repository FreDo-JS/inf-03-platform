// Migracja 015_admin_invites.sql — zaproszenia dla nauczycieli.
// Najważniejsze pytanie: czy uprawnienia dostaje WYŁĄCZNIE osoba z listy
// zaproszonych i czy potrafi potem realnie odznaczyć lekcję.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const SZEF = "11111111-1111-1111-1111-111111111111";
const ZAPROSZONY = "22222222-2222-2222-2222-222222222222";
const OBCY = "33333333-3333-3333-3333-333333333333";
const SPOZNIONY = "44444444-4444-4444-4444-444444444444";

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
  insert into auth.users values ('${SZEF}', 'szef@szkola.pl');
`);
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql"]) {
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

console.log("== ZAPROSZENIE ==");
await db.exec(`insert into admin_invites (email, note) values ('Nowa.Nauczycielka@Szkola.pl', 'informatyka');`);
await ok("zaproszenie czeka na liście", `select count(*)::int n from admin_invites`, (r) => r[0].n === 1);

// rejestracja z zaproszonego adresu — pisownia inną wielkością liter
await db.exec(`insert into auth.users values ('${ZAPROSZONY}', 'nowa.nauczycielka@szkola.pl');`);
await ok("zaproszona osoba dostaje uprawnienia przy zakładaniu konta",
  `select count(*)::int n from admins where user_id = '${ZAPROSZONY}'`, (r) => r[0].n === 1);
await ok("  …wielkość liter w adresie nie ma znaczenia",
  `select note from admins where user_id = '${ZAPROSZONY}'`, (r) => r[0].note === "konto z zaproszenia");
await ok("  …zaproszenie zostało zużyte", `select count(*)::int n from admin_invites`, (r) => r[0].n === 0);

console.log("\n== KONTO BEZ ZAPROSZENIA ==");
await db.exec(`insert into auth.users values ('${OBCY}', 'ktos@internet.pl');`);
await ok("konto spoza listy nie dostaje uprawnień",
  `select count(*)::int n from admins where user_id = '${OBCY}'`, (r) => r[0].n === 0);
await as("authenticated", OBCY);
await err("  …i nie odznaczy lekcji (RLS odrzuca zapis)",
  `insert into progress(class_name,subtopic_id) values ('2a','css-uklad')`, "row-level security");

console.log("\n== ZAPROSZONY REALNIE PRACUJE ==");
await as("authenticated", ZAPROSZONY);
await ok("zaproszona nauczycielka odznacza lekcję",
  `insert into progress(class_name,subtopic_id) values ('2a','html-struktura') returning 1 x`, (r) => r.length === 1);
await ok("  …wpis jest podpisany jej kontem",
  `select marked_by::text a from progress where class_name='2a' and subtopic_id='html-struktura'`,
  (r) => r[0].a === ZAPROSZONY);
await ok("  …i trafił do dziennika",
  `select action, actor::text a from progress_log where subtopic_id='html-struktura' order by id desc limit 1`,
  (r) => r[0].action === "zaznaczono" && r[0].a === ZAPROSZONY);
await ok("ustawia sobie podpis", `select set_my_display_name('p. Nowa') n`, (r) => r[0].n === "p. Nowa");

console.log("\n== KTO MOŻE ZAPRASZAĆ ==");
await err("nauczyciel nie dopisze zaproszenia przez API",
  `insert into admin_invites (email) values ('kolega@internet.pl')`, "permission denied");
await err("nauczyciel nie skasuje zaproszenia przez API",
  `delete from admin_invites where email = 'x@y.pl'`, "permission denied");
await ok("nauczyciel widzi listę oczekujących zaproszeń",
  `select count(*)::int n from admin_invites`, (r) => r[0].n === 0);

await as("anon", "");
await err("uczeń nie czyta listy zaproszeń", `select * from admin_invites limit 1`, "permission denied");
await err("uczeń nie dopisze zaproszenia", `insert into admin_invites (email) values ('x@y.pl')`, "permission denied");

console.log("\n== ZAPROSZENIE PO ZAŁOŻENIU KONTA ==");
await db.exec("reset role;");
await db.exec(`insert into auth.users values ('${SPOZNIONY}', 'spozniony@szkola.pl');`);
await ok("konto założone przed zaproszeniem nie ma uprawnień",
  `select count(*)::int n from admins where user_id='${SPOZNIONY}'`, (r) => r[0].n === 0);
await db.exec(`insert into admin_invites (email) values ('spozniony@szkola.pl');`);
await db.exec(read("015_admin_invites.sql"));
await ok("ponowne uruchomienie migracji nadrabia zaległość",
  `select count(*)::int n from admins where user_id='${SPOZNIONY}'`, (r) => r[0].n === 1);
await ok("  …i sprząta wykorzystane zaproszenie",
  `select count(*)::int n from admin_invites where email='spozniony@szkola.pl'`, (r) => r[0].n === 0);

console.log("\n== IDEMPOTENCJA ==");
const ilu = (await db.query(`select count(*)::int n from admins`)).rows[0].n;
await db.exec(read("015_admin_invites.sql"));
await ok("kolejne uruchomienie nie zmienia listy adminów",
  `select count(*)::int n from admins`, (r) => r[0].n === ilu);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
