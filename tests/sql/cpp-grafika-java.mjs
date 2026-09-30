// Migracja 016_cpp_grafika_java.sql — działy C++, grafika (GIMP) i Java.
// Sprawdzamy, czy trafiły do właściwych kwalifikacji, nie zderzyły się
// pozycjami z istniejącymi kategoriami i czy uczeń widzi je na mapie.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

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
  insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'szef@szkola.pl');
`);
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
                 "016_cpp_grafika_java.sql"]) {
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
const asAnon = () =>
  db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); set role anon;`);

console.log("== NOWE DZIAŁY ==");
await ok("C++ i grafika trafiły do INF.03",
  `select count(*)::int n from categories where id in ('cpp','grafika') and qualification='inf03'`,
  (r) => r[0].n === 2);
await ok("C++ i Java trafiły do INF.04",
  `select count(*)::int n from categories where id in ('inf04-cpp','inf04-java') and qualification='inf04'`,
  (r) => r[0].n === 2);
await ok("INF.03 ma teraz 10 działów", `select count(*)::int n from categories where qualification='inf03'`,
  (r) => r[0].n === 10);
await ok("INF.04 ma teraz 14 działów", `select count(*)::int n from categories where qualification='inf04'`,
  (r) => r[0].n === 14);
await ok("pozycje kategorii nadal unikalne w obrębie kwalifikacji",
  `select count(*)::int n from (select qualification, position from categories group by 1,2 having count(*)>1) d`,
  (r) => r[0].n === 0);

console.log("\n== PODTEMATY ==");
for (const [kat, ile] of [["cpp", 10], ["grafika", 10], ["inf04-cpp", 8], ["inf04-java", 8]]) {
  await ok(`dział ${kat} ma ${ile} podtematów`,
    `select count(*)::int n from subtopics where category_id='${kat}'`, (r) => r[0].n === ile);
}
await ok("pozycje podtematów unikalne w obrębie działu",
  `select count(*)::int n from (select category_id, position from subtopics
   where category_id in ('cpp','grafika','inf04-cpp','inf04-java') group by 1,2 having count(*)>1) d`,
  (r) => r[0].n === 0);
await ok("każdy nowy podtemat ma co najmniej jeden materiał",
  `select count(*)::int n from subtopics s
   where s.category_id in ('cpp','grafika','inf04-cpp','inf04-java')
     and not exists (select 1 from subtopic_links l where l.subtopic_id = s.id)`,
  (r) => r[0].n === 0);
await ok("materiały są tylko po https",
  `select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id
   where s.category_id in ('cpp','grafika','inf04-cpp','inf04-java') and l.url not like 'https://%'`,
  (r) => r[0].n === 0);

console.log("\n== TEMATY W TREŚCI ==");
await ok("grafika obejmuje rastry, barwy, formaty i warstwy",
  `select count(*)::int n from subtopics where category_id='grafika'
     and (title ilike '%rastrow%' or title ilike '%barw%' or title ilike '%format%' or title ilike '%warstw%')`,
  (r) => r[0].n >= 4);
await ok("C++ obejmuje wskaźniki i obiektowość",
  `select count(*)::int n from subtopics where category_id in ('cpp','inf04-cpp')
     and (title ilike '%wskaźnik%' or title ilike '%obiekt%' or title ilike '%klas%')`,
  (r) => r[0].n >= 3);
await ok("Java obejmuje JVM, kolekcje i wyjątki",
  `select count(*)::int n from subtopics where category_id='inf04-java'
     and (title ilike '%JVM%' or title ilike '%kolekcj%' or title ilike '%wyjątk%')`,
  (r) => r[0].n >= 3);

console.log("\n== WIDOK UCZNIA ==");
await asAnon();
await ok("uczeń INF.03 widzi nowe działy",
  `select count(*)::int n from categories where qualification='inf03' and id in ('cpp','grafika')`,
  (r) => r[0].n === 2);
await ok("uczeń widzi materiały do grafiki",
  `select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id where s.category_id='grafika'`,
  (r) => r[0].n >= 10);
// RLS odrzuca zapis wyjątkiem, nie cichym zerem wierszy.
await ok("uczeń nie dopisze sobie podtematu",
  `select count(*)::int n from subtopics where id='x'`, (r) => r[0].n === 0);
try {
  await db.query(`insert into subtopics(id,category_id,position,title) values ('x','cpp',99,'x')`);
  fail++; console.log("  FAIL  zapis przeszedł");
} catch (e) {
  if (e.message.includes("row-level security")) { pass++; console.log("  ok    …a próba zapisu kończy się odmową RLS"); }
  else { fail++; console.log("  FAIL  inny błąd →", e.message.slice(0, 70)); }
}

console.log("\n== IDEMPOTENCJA ==");
await db.exec("reset role;");
const przedK = (await db.query(`select count(*)::int n from categories`)).rows[0].n;
const przedL = (await db.query(`select count(*)::int n from subtopic_links`)).rows[0].n;
await db.exec(read("016_cpp_grafika_java.sql"));
await ok("ponowne uruchomienie nie dubluje kategorii",
  `select count(*)::int n from categories`, (r) => r[0].n === przedK);
await ok("ponowne uruchomienie nie dubluje materiałów",
  `select count(*)::int n from subtopic_links`, (r) => r[0].n === przedL);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
