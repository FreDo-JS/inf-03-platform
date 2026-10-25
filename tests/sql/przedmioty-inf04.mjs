// Migracja 025 — trzy przedmioty INF.04 w tabeli Nauczyciele: są w subjects,
// mają przypisane działy mapy i nie ruszają działów INF.03 ani tych, które
// nauczyciel przestawił w panelu.
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
                 "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
                 "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql",
                 "021_inf03_program_nauczania.sql", "022_przedmioty_nauczyciele.sql",
                 "023_inf04_braki.sql", "024_inf04_ai.sql", "025_przedmioty_inf04.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const wiersze = async (sql, params = []) => (await db.query(sql, params)).rows;

const NOWE = {
  "p-tworzenie-stron": ["Tworzenie stron i aplikacji internetowych", ["inf04-web"]],
  "p-desktop-mobile": ["Aplikacje desktopowe i mobilne", ["inf04-desktop", "inf04-mobile"]],
  "p-strukturalne-obiektowe": ["Programowanie strukturalne i obiektowe",
    ["inf04-projektowanie", "inf04-oop", "inf04-cpp", "inf04-java"]],
};

console.log("== PRZEDMIOTY ==");
{
  const przedmioty = await wiersze(`select id, title, qualification, position from subjects order by position`);
  for (const [id, [tytul]] of Object.entries(NOWE)) {
    const p = przedmioty.find((x) => x.id === id);
    ok(`${tytul} jest w subjects jako INF.04`, p?.title === tytul && p.qualification === "inf04", JSON.stringify(p));
  }
  ok("są po sześciu przedmiotach INF.03 (kolejność w panelu)",
    przedmioty.slice(-3).map((p) => p.id).join() === Object.keys(NOWE).join(), przedmioty.map((p) => p.id).join());
  ok("przedmioty INF.03 zostały nietknięte",
    (await wiersze(`select count(*)::int n from subjects where qualification='inf03'`))[0].n === 6);
}

console.log("\n== DZIAŁY MAPY ==");
for (const [id, [, dzialy]] of Object.entries(NOWE)) {
  const przypisane = (await wiersze(`select id from categories where subject_id=$1 order by position`, [id])).map((r) => r.id);
  ok(`${id}: ${dzialy.join(", ")}`, dzialy.every((d) => przypisane.includes(d)) && przypisane.length === dzialy.length, przypisane.join());
}
ok("żaden dział INF.03 nie zmienił przedmiotu",
  (await wiersze(`select count(*)::int n from categories where qualification='inf03' and subject_id like 'p-%'
                  and subject_id in ('p-tworzenie-stron','p-desktop-mobile','p-strukturalne-obiektowe')`))[0].n === 0);
ok("nic nie zostało skopiowane: liczba kategorii bez zmian względem 024",
  (await wiersze(`select count(*)::int n from categories where id like 'p-%' or id ~ '^(tsai|adm|psio)-'`))[0].n === 0);
ok("działy bez pasującego przedmiotu zostają bez przedmiotu",
  (await wiersze(`select count(*)::int n from categories where id in ('inf04-bhp','inf04-egzamin','inf04-ai','inf04-zespol') and subject_id is not null`))[0].n === 0);

console.log("\n== PONOWNE URUCHOMIENIE ==");
{
  await db.exec(`update categories set subject_id = 'p-bazy' where id = 'inf04-oop'`);
  await db.exec(read("025_przedmioty_inf04.sql"));
  ok("nie dubluje przedmiotów", (await wiersze(`select count(*)::int n from subjects`))[0].n === 9);
  ok("nie cofa ręcznego przestawienia działu",
    (await wiersze(`select subject_id from categories where id='inf04-oop'`))[0].subject_id === "p-bazy");
}

console.log("\n== UCZEŃ ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;`);
  ok("uczeń czyta listę przedmiotów", (await wiersze(`select 1 from subjects`)).length === 9);
  await db.exec("reset role;");
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
