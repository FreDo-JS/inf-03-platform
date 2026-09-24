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
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 120));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; console.log("  FAIL ", label, "→", e.message); return []; }
};
const err = async (label, sql, match) => {
  try { await db.query(sql); fail++; console.log("  FAIL ", label, "→ brak błędu"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 50) + ")"); }
  }
};
const asAnon = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); set role anon;`);
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);

console.log("== MIGRACJA ==");
await ok("przeniosła linki z theory_url/tasks_url", `select count(*)::int n from subtopic_links`, (r) => r[0].n > 40);
await ok("dwukrotne uruchomienie nie zduplikowało",
  `select count(*)::int n from (select subtopic_id, url from subtopic_links group by 1,2 having count(*) > 1) d`,
  (r) => r[0].n === 0);
await ok("etykiety Teoria/Zadania z kolejnością",
  `select label, sort_order from subtopic_links where subtopic_id='html-struktura' order by sort_order`,
  (r) => r.length === 2 && r[0].label === "Teoria" && r[1].label === "Zadania" && r[1].sort_order === 1);
await ok("tabela jest w publikacji realtime",
  `select count(*)::int n from pg_publication_tables where pubname='supabase_realtime' and tablename='subtopic_links'`,
  (r) => r[0].n === 1);

console.log("\n== ANON (uczeń) ==");
await asAnon();
await ok("czyta linki", `select count(*)::int n from subtopic_links`, (r) => r[0].n > 40);
await err("nie dodaje linku", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','X','https://a.pl')`, "row-level security");
await ok("nie usuwa linków (RLS → 0 usuniętych)",
  `with d as (delete from subtopic_links returning 1) select count(*)::int del from d`, (r) => r[0].del === 0);
await ok("  …linki nadal są", `select count(*)::int n from subtopic_links`, (r) => r[0].n > 40);
await ok("nie zmienia linków (RLS → 0 zmienionych)",
  `with u as (update subtopic_links set url='https://zly.example' returning 1) select count(*)::int n from u`,
  (r) => r[0].n === 0);

console.log("\n== ADMIN ==");
await asAdmin();
await ok("dodaje link", `insert into subtopic_links(subtopic_id,label,url,sort_order) values ('js-dom','Film','https://www.youtube.com/watch?v=1',2) returning id`);
await ok("edytuje link", `update subtopic_links set label='Film YouTube' where subtopic_id='js-dom' and label='Film' returning label`, (r) => r.length === 1);
await ok("zmienia kolejność", `update subtopic_links set sort_order=0 where subtopic_id='js-dom' and label='Film YouTube' returning sort_order`, (r) => r[0].sort_order === 0);
await ok("usuwa link", `with d as (delete from subtopic_links where subtopic_id='js-dom' and label='Film YouTube' returning 1) select count(*)::int n from d`, (r) => r[0].n === 1);
await err("javascript: odrzucone (CHECK)", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','Zły','javascript:alert(1)')`, "check constraint");
await err("data: odrzucone (CHECK)", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','Zły','data:text/html,<script>')`, "check constraint");
await err("//evil.example odrzucone (CHECK)", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','Zły','//evil.example')`, "check constraint");
await err("etykieta z samych spacji odrzucona", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','   ','https://a.pl')`, "check constraint");
await err("etykieta 121 znaków odrzucona", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom',repeat('a',121),'https://a.pl')`, "check constraint");
await err("URL > 500 znaków odrzucony", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','X','https://a.pl/'||repeat('b',500))`, "check constraint");
await err("sort_order 1000 odrzucony", `insert into subtopic_links(subtopic_id,label,url,sort_order) values ('js-dom','X','https://a.pl',1000)`, "check constraint");
await err("nieistniejący podtemat (FK)", `insert into subtopic_links(subtopic_id,label,url) values ('nie-ma','X','https://a.pl')`, "foreign key");
await ok("http:// dozwolone", `insert into subtopic_links(subtopic_id,label,url) values ('js-dom','Stara strona','http://old.example.com') returning id`);
await ok("usunięcie podtematu (przygotowanie)", `delete from subtopics where id='js-dom'`);
await ok("  …kaskada skasowała jego linki", `select count(*)::int n from subtopic_links where subtopic_id='js-dom'`, (r) => r[0].n === 0);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
