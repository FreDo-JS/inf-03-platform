// Migracja 012_progress_author.sql — kto oznaczył podtemat.
// Najważniejsze pytanie: czy da się podpisać cudzym nazwiskiem albo wyciągnąć
// e-mail nauczyciela przez widok teachers.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const ANIA = "11111111-1111-1111-1111-111111111111";
const BOREK = "22222222-2222-2222-2222-222222222222";
const OBCY = "33333333-3333-3333-3333-333333333333";

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
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
  insert into auth.users values ('${ANIA}', 'ania@szkola.pl'), ('${BOREK}', 'borek@szkola.pl'), ('${OBCY}', 'obcy@internet.pl');
`);

for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql", "013_progress_author_fix.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}
// 008 dopisuje wszystkie istniejące konta do admins — obcy nim nie jest
await db.exec(`delete from admins where user_id = '${OBCY}';`);

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
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 46) + ")"); }
  }
};
const as = (role, sub) =>
  db.exec(`reset role; select set_config('request.jwt.claim.role','${role}',false); select set_config('request.jwt.claim.sub','${sub}',false); set role ${role};`);
const asAnon = () => as("anon", "");

console.log("== STEMPEL AUTORA ==");
await as("authenticated", ANIA);
await ok("Ania oznacza podtemat",
  `insert into progress(class_name,subtopic_id) values ('2a','html-struktura') returning class_name`, (r) => r.length === 1);
await ok("  …autorem jest Ania",
  `select marked_by::text a from progress where class_name='2a' and subtopic_id='html-struktura'`, (r) => r[0].a === ANIA);

await as("authenticated", BOREK);
await ok("Borek oznacza inny podtemat",
  `insert into progress(class_name,subtopic_id) values ('2a','css-selektory') returning class_name`, (r) => r.length === 1);
await ok("  …autorem jest Borek",
  `select marked_by::text a from progress where class_name='2a' and subtopic_id='css-selektory'`, (r) => r[0].a === BOREK);

await ok("Borek NIE podpisze wpisu nazwiskiem Ani (trigger nadpisuje)",
  `insert into progress(class_name,subtopic_id,marked_by) values ('4e','html-struktura','${ANIA}')
   returning marked_by::text a`, (r) => r[0].a === BOREK);
await ok("Borek NIE przerobi cudzego wpisu na Anię",
  `update progress set marked_by='${ANIA}' where class_name='2a' and subtopic_id='html-struktura'
   returning marked_by::text a`, (r) => r[0].a === BOREK);
await ok("updated_at odświeża się przy zmianie",
  `select (updated_at > now() - interval '1 minute') swieze from progress where class_name='2a' and subtopic_id='html-struktura'`,
  (r) => r[0].swieze === true);

console.log("\n== NAZWA NAUCZYCIELA ==");
await as("authenticated", ANIA);
await ok("Ania ustawia swój podpis", `select set_my_display_name('p. Kowalska') n`, (r) => r[0].n === "p. Kowalska");
await ok("  …zapisał się w admins",
  `select display_name d from admins where user_id='${ANIA}'`, (r) => r[0].d === "p. Kowalska");
await ok("podpis jest przycinany ze spacji", `select set_my_display_name('   p. Kowalska   ') n`, (r) => r[0].n === "p. Kowalska");
await err("podpis dłuższy niż 40 znaków odrzucony", `select set_my_display_name(repeat('a',41))`, "invalid_name");
await err("podpis ze znakiem sterującym odrzucony", `select set_my_display_name(E'p.\\nKowalska')`, "invalid_name");
await ok("pusty podpis kasuje oznaczenie", `select set_my_display_name('') n`, (r) => r[0].n === "");
await ok("  …i znika z widoku teachers",
  `select count(*)::int n from teachers where id='${ANIA}'`, (r) => r[0].n === 0);
await ok("Ania przywraca podpis", `select set_my_display_name('p. Kowalska') n`, (r) => r[0].n === "p. Kowalska");

await as("authenticated", BOREK);
await ok("Borek ustawia własny podpis", `select set_my_display_name('p. Borek') n`, (r) => r[0].n === "p. Borek");
await ok("  …nie ruszył podpisu Ani",
  `select display_name d from admins where user_id='${ANIA}'`, (r) => r[0].d === "p. Kowalska");
await err("nie zmieni podpisu bezpośrednio w tabeli (008 odebrało UPDATE)",
  `update admins set display_name='włamywacz' where user_id='${ANIA}'`, "permission denied");

await as("authenticated", OBCY);
await err("zalogowany spoza listy adminów nie ustawi podpisu",
  `select set_my_display_name('podszywacz')`, "not_authorized");
await err("  …ani nie oznaczy podtematu (RLS odrzuca insert)",
  `insert into progress(class_name,subtopic_id) values ('4d','html-struktura')`, "row-level security");

console.log("\n== UCZEŃ (anon) ==");
await asAnon();
await ok("widzi, kto oznaczył podtemat",
  `select count(*)::int n from progress where marked_by is not null`, (r) => r[0].n >= 2);
await ok("widzi nazwy nauczycieli", `select count(*)::int n from teachers`, (r) => r[0].n === 2);
await ok("widok teachers ma tylko id i nazwę",
  `select count(*)::int n from information_schema.columns where table_name='teachers'`, (r) => r[0].n === 2);
await err("nie dosięgnie e-maili przez tabelę admins", `select * from admins limit 1`, "permission denied");
await err("nie ustawi cudzego podpisu", `select set_my_display_name('haker')`, "permission denied");
await err("nie oznaczy podtematu (RLS odrzuca insert)",
  `insert into progress(class_name,subtopic_id) values ('4g','inf04-csharp-klasy')`, "row-level security");
await ok("nie zmieni autora cudzego wpisu (RLS → 0 zmian)",
  `with u as (update progress set marked_by=null returning 1) select count(*)::int n from u`, (r) => r[0].n === 0);

console.log("\n== IDEMPOTENCJA ==");
await db.exec("reset role;");
await db.exec(read("012_progress_author.sql"));
await ok("druga migracja nie gubi autorów",
  `select count(*)::int n from progress where marked_by is not null`, (r) => r[0].n >= 2);
await ok("druga migracja nie gubi podpisów",
  `select count(*)::int n from teachers`, (r) => r[0].n === 2);

console.log("\n== UZUPEŁNIENIE STARYCH WPISÓW (SQL Editor) ==");
// 012 stemplował marked_by zawsze, więc ręczna poprawka z SQL Editora (gdzie
// auth.uid() jest puste) kończyła się wyzerowaniem autora. 013 to naprawia.
await db.exec("reset role; select set_config('request.jwt.claim.sub','',false);");
await ok("wpis bez autora, jak sprzed migracji",
  `insert into progress(class_name,subtopic_id,marked_by) values ('4e','css-selektory',null) returning 1 x`,
  (r) => r.length === 1);
await ok("właściciel bazy może uzupełnić autora",
  `update progress set marked_by='${ANIA}' where marked_by is null returning marked_by::text a`,
  (r) => r.length > 0 && r.every((x) => x.a === ANIA));
await ok("  …i nie został już żaden wpis bez autora",
  `select count(*)::int n from progress where marked_by is null`, (r) => r[0].n === 0);

console.log("\n== PODSZYWANIE SIĘ NADAL NIEMOŻLIWE ==");
await as("authenticated", BOREK);
await ok("Borek dalej nie podpisze się Anią (jest zalogowany)",
  `insert into progress(class_name,subtopic_id,marked_by) values ('4d','css-uklad','${ANIA}')
   returning marked_by::text a`, (r) => r[0].a === BOREK);
await ok("Borek dalej nie przerobi cudzego wpisu",
  `update progress set marked_by='${ANIA}' where class_name='4d' and subtopic_id='css-uklad'
   returning marked_by::text a`, (r) => r[0].a === BOREK);
console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
