// Migracje 010_inf04.sql i 011_inf04_seed.sql: druga kwalifikacja w tej samej bazie.
// Sprawdzamy, że INF.04 dochodzi bez ruszania danych INF.03 i że nowe klasy
// nie otwierają żadnej furtki (uczeń nadal nie widzi pytań ani cudzych wyników).
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

const MIGRATIONS = [
  "schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
  "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
  "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
  "010_inf04.sql", "011_inf04_seed.sql",
];
for (const f of MIGRATIONS) {
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
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 48) + ")"); }
  }
};
// Czyścimy też sub: bez tego anon nosiłby jeszcze identyfikator admina z poprzedniej
// sekcji i is_admin() zwracałoby true, co ukryłoby każdy błąd w politykach.
const asAnon = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); set role anon;`);
const asAdmin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);

await db.exec("insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;");

console.log("== KLASY ==");
await ok("jest pięć klas", `select count(*)::int n from classes`, (r) => r[0].n === 5);
await ok("4a i 4g należą do INF.04",
  `select count(*)::int n from classes where name in ('4a','4g') and qualification='inf04'`, (r) => r[0].n === 2);
await ok("stare klasy zostały przy INF.03",
  `select count(*)::int n from classes where name in ('2a','4e','4d') and qualification='inf03'`, (r) => r[0].n === 3);
await err("nieznana kwalifikacja odrzucona",
  `insert into classes(name,qualification,position) values ('5z','inf99',9)`, "check constraint");
await err("nazwa klasy poza wzorcem odrzucona",
  `insert into classes(name,qualification,position) values ('klasa','inf03',9)`, "check constraint");

console.log("\n== POSTĘP DLA NOWYCH KLAS ==");
await ok("4a może mieć postęp",
  `insert into progress(class_name,subtopic_id) values ('4a','inf04-csharp-klasy') returning class_name`, (r) => r.length === 1);
await err("klasa spoza tabeli classes odrzucona (FK)",
  `insert into progress(class_name,subtopic_id) values ('9z','inf04-csharp-klasy')`, "foreign key");
await err("podtemat spoza bazy nadal odrzucony przez aplikację (FK nie ma, zostaje CHECK długości)",
  `insert into progress(class_name,subtopic_id) values ('4a',repeat('x',65))`, "check constraint");

console.log("\n== TREŚCI INF.04 ==");
await ok("12 kategorii INF.04",
  `select count(*)::int n from categories where qualification='inf04'`, (r) => r[0].n === 12);
await ok("kategorie INF.03 nietknięte i nadal oznaczone",
  `select count(*)::int n from categories where qualification='inf03'`, (r) => r[0].n === 8);
await ok("wszystkie 11 jednostek INF.04.1–11 ma pokrycie",
  `select count(*)::int n from categories
   where qualification='inf04' and (description like '%(INF.04.%' or id='inf04-egzamin')`, (r) => r[0].n === 12);
await ok("każda kategoria INF.04 ma podtematy",
  `select count(*)::int n from categories c
   where c.qualification='inf04' and not exists (select 1 from subtopics s where s.category_id=c.id)`,
  (r) => r[0].n === 0);
await ok("ponad 50 podtematów INF.04",
  `select count(*)::int n from subtopics s join categories c on c.id=s.category_id where c.qualification='inf04'`,
  (r) => r[0].n >= 50);
await ok("materiały są tylko po https",
  `select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id
   join categories c on c.id=s.category_id where c.qualification='inf04' and l.url not like 'https://%'`,
  (r) => r[0].n === 0);
await ok("są materiały do C#",
  `select count(*)::int n from subtopic_links where url like '%learn.microsoft.com/en-us/dotnet/csharp%'`,
  (r) => r[0].n >= 3);
await ok("są materiały do Reacta",
  `select count(*)::int n from subtopic_links where url like 'https://react.dev/%'`, (r) => r[0].n >= 3);
await ok("pozycje kategorii unikalne w obrębie kwalifikacji",
  `select count(*)::int n from (select qualification, position from categories group by 1,2 having count(*)>1) d`,
  (r) => r[0].n === 0);
await ok("obie kwalifikacje mogą mieć kategorię na pozycji 1",
  `select count(*)::int n from categories where position=1`, (r) => r[0].n === 2);

console.log("\n== IDEMPOTENCJA ==");
await db.exec(read("010_inf04.sql"));
await db.exec(read("011_inf04_seed.sql"));
await ok("drugie uruchomienie nie zdublowało kategorii",
  `select count(*)::int n from categories where qualification='inf04'`, (r) => r[0].n === 12);
await ok("drugie uruchomienie nie zdublowało materiałów",
  `select count(*)::int n from (select subtopic_id, url from subtopic_links group by 1,2 having count(*)>1) d`,
  (r) => r[0].n === 0);
await ok("drugie uruchomienie nie zdublowało klas",
  `select count(*)::int n from classes`, (r) => r[0].n === 5);

console.log("\n== TESTY Z KWALIFIKACJĄ ==");
await asAdmin();
await ok("admin tworzy test INF.04",
  `select create_test('Algorytmy w C#', 600,
     '[{"type":"closed","text":"Złożoność sortowania bąbelkowego?","options":["O(n)","O(n log n)","O(n^2)"]}]'::jsonb,
     '[["O(n^2)"]]'::jsonb, '123456', 'inf04') as r`);
await ok("  …test ma kwalifikację inf04",
  `select count(*)::int n from tests where title='Algorytmy w C#' and qualification='inf04'`, (r) => r[0].n === 1);
await ok("test bez podanej kwalifikacji trafia do INF.03",
  `select create_test('Stary test', 300,
     '[{"type":"input","text":"Co to DOM?"}]'::jsonb, '[["model dokumentu"]]'::jsonb, '654321') as r`);
await ok("  …i faktycznie jest inf03",
  `select count(*)::int n from tests where title='Stary test' and qualification='inf03'`, (r) => r[0].n === 1);
await err("nieznana kwalifikacja odrzucona przez create_test",
  `select create_test('Zły', 300, '[{"type":"input","text":"x"}]'::jsonb, '[["y"]]'::jsonb, '111111', 'inf99')`,
  "invalid_qualification");
await ok("stare testy dostały inf03 z defaultu kolumny",
  `select count(*)::int n from tests where qualification not in ('inf03','inf04')`, (r) => r[0].n === 0);

console.log("\n== UCZEŃ (anon) ==");
await asAnon();
await ok("widzi kwalifikację testu (potrzebna do filtra)",
  `select count(*)::int n from tests where qualification='inf04'`, (r) => r[0].n >= 1);
await err("nadal nie widzi pytań", `select questions from tests limit 1`, "permission denied");
await ok("widzi listę klas", `select count(*)::int n from classes`, (r) => r[0].n === 5);
await ok("nie zmienia przypisania klasy do kwalifikacji (RLS → 0 zmian)",
  `with u as (update classes set qualification='inf03' where name='4a' returning 1) select count(*)::int n from u`,
  (r) => r[0].n === 0);
await ok("nie zmienia kwalifikacji testu (RLS → 0 zmian)",
  `with u as (update tests set qualification='inf03' where qualification='inf04' returning 1) select count(*)::int n from u`,
  (r) => r[0].n === 0);
await err("nie dopisze sobie klasy (RLS odrzuca insert)",
  `insert into classes(name,qualification,position) values ('3z','inf04',9)`,
  "row-level security");

console.log("\n== SESJE PRAKTYCZNE ==");
await asAdmin();
const task = await db.query(`select id from practical_tasks limit 1`);
const taskId = task.rows[0]?.id;
await ok("sesja dla nowej klasy 4a przechodzi",
  `select practical_create_session('${taskId}'::uuid, '4a', 60) as r`);
await err("sesja dla nieistniejącej klasy odrzucona",
  `select practical_create_session('${taskId}'::uuid, '9z', 60)`, "invalid_class");

console.log("\n== KOLEJNOŚĆ MIGRACJI ==");
// Uruchomienie 010 na bazie bez 008 dawało gołe „function public.is_admin()
// does not exist”. Teraz ma powiedzieć wprost, której migracji brakuje.
{
  const fresh = new PGlite();
  await fresh.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.role() returns text language sql stable as $$ select 'anon' $$;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on all functions in schema auth to anon, authenticated;
    grant usage on schema public to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
    create publication supabase_realtime;`);
  for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                   "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                   "007_practical_seed.sql"]) {
    await fresh.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
  }
  const guard = async (label, file, expect) => {
    try {
      await fresh.exec(read(file));
      fail++; console.log("  FAIL ", label, "→ migracja przeszła mimo braku zależności");
    } catch (e) {
      if (e.message.includes(expect)) { pass++; console.log("  ok   ", label); }
      else { fail++; console.log("  FAIL ", label, "→ niejasny komunikat:", e.message.slice(0, 90)); }
    }
  };
  await guard("010 bez 008 mówi, której migracji brakuje", "010_inf04.sql", "008_security_hardening");
  await guard("011 bez 010 mówi, której migracji brakuje", "011_inf04_seed.sql", "010_inf04");
}
console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
