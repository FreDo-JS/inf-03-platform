// Migracja 022 — przedmioty z programu nauczania i przydział nauczycieli.
//
// Najważniejsze: plan jest informacją organizacyjną szkoły, więc uczeń nie może
// go ani czytać, ani zmieniać. Poza tym sprawdzamy, czy każdy dział mapy INF.03
// ma przedmiot (inaczej okno po kliknięciu w nagłówek byłoby puste), czy
// kasowanie sprząta po sobie i czy ponowne uruchomienie nie nadpisuje zmian
// wprowadzonych w panelu.
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
                 "021_inf03_program_nauczania.sql", "022_przedmioty_nauczyciele.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const err = async (label, fn, match) => {
  try { await fn(); fail++; console.log("  FAIL ", label, "→ brak błędu"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 45) + ")"); }
  }
};
const wiersze = async (sql, params = []) => (await db.query(sql, params)).rows;
const jeden = async (sql, params = []) => (await wiersze(sql, params))[0];

const admin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
const uczen = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
  select set_config('request.jwt.claim.sub','',false); set role anon;`);

await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);

console.log("== PRZEDMIOTY Z PROGRAMU ==");
const przedmioty = await wiersze(`select id, title, position from subjects where qualification = 'inf03' order by position`);
{
  ok("jest sześć przedmiotów INF.03", przedmioty.length === 6, String(przedmioty.length));
  ok("kolejność jak w programie: najpierw teoretyczne",
    przedmioty.map((p) => p.id).join(",") === "p-bhp,p-angielski,p-przygotowanie,p-bazy,p-strony,p-aplikacje",
    przedmioty.map((p) => p.id).join(","));
  ok("pozycje są unikalne", new Set(przedmioty.map((p) => p.position)).size === przedmioty.length);
  await err("dwa przedmioty na tej samej pozycji odrzucone", () => db.query(
    `insert into subjects (id, title, position) values ('p-duplikat', 'Duplikat', 1)`), "duplicate key");
  await err("pusta nazwa przedmiotu odrzucona", () => db.query(
    `insert into subjects (id, title, position) values ('p-pusty', '   ', 90)`), "check constraint");
}

console.log("\n== KAŻDY DZIAŁ MA PRZEDMIOT ==");
{
  const bez = await wiersze(
    `select id, title from categories where qualification = 'inf03' and subject_id is null`);
  ok("żaden dział INF.03 nie został bez przedmiotu", bez.length === 0,
    bez.map((k) => k.id).join(","));

  const inf04 = await jeden(
    `select count(*)::int n from categories where qualification = 'inf04' and subject_id is not null`);
  ok("działy INF.04 celowo bez przedmiotu (program INF.04 to inna sprawa)", inf04.n === 0, String(inf04.n));

  const rozklad = await wiersze(
    `select s.id, count(c.id)::int n from subjects s
     left join categories c on c.subject_id = s.id
     where s.qualification = 'inf03' group by s.id order by s.id`);
  ok("każdy przedmiot ma co najmniej jeden dział", rozklad.every((r) => r.n > 0), JSON.stringify(rozklad));
  ok("projektowanie stron zbiera pięć działów",
    rozklad.find((r) => r.id === "p-strony")?.n === 5, JSON.stringify(rozklad.find((r) => r.id === "p-strony")));
}

console.log("\n== LISTA NAUCZYCIELI ==");
await admin();
{
  const lista = await wiersze(`select id, name, position from plan_teachers order by position`);
  ok("cztery wiersze na start, jak na kartce", lista.length === 4, String(lista.length));
  ok("domyślne nazwy to Nauczyciel 1–4",
    lista.map((t) => t.name).join(",") === "Nauczyciel 1,Nauczyciel 2,Nauczyciel 3,Nauczyciel 4");

  await db.query(`update plan_teachers set name = 'Kowalska' where position = 1`);
  ok("nauczyciel zmienia nazwisko",
    (await jeden(`select name from plan_teachers where position = 1`)).name === "Kowalska");

  await err("puste nazwisko odrzucone", () => db.query(
    `insert into plan_teachers (name, position) values ('  ', 9)`), "check constraint");
}

console.log("\n== KRZYŻYKI ==");
{
  const kowalska = (await jeden(`select id from plan_teachers where name = 'Kowalska'`)).id;
  await db.query(`insert into teacher_subjects (teacher_id, subject_id) values ($1::uuid, 'p-strony')`, [kowalska]);
  await db.query(`insert into teacher_subjects (teacher_id, subject_id) values ($1::uuid, 'p-bazy')`, [kowalska]);
  ok("nauczyciel prowadzi dwa przedmioty",
    (await jeden(`select count(*)::int n from teacher_subjects where teacher_id = $1::uuid`, [kowalska])).n === 2);

  await err("ten sam krzyżyk drugi raz odrzucony", () => db.query(
    `insert into teacher_subjects (teacher_id, subject_id) values ($1::uuid, 'p-strony')`, [kowalska]),
    "duplicate key");
  await err("krzyżyk przy nieistniejącym przedmiocie odrzucony", () => db.query(
    `insert into teacher_subjects (teacher_id, subject_id) values ($1::uuid, 'p-wymyslony')`, [kowalska]),
    "foreign key");

  await db.query(`delete from teacher_subjects where teacher_id = $1::uuid and subject_id = 'p-bazy'`, [kowalska]);
  ok("zdjęcie krzyżyka działa",
    (await jeden(`select count(*)::int n from teacher_subjects where teacher_id = $1::uuid`, [kowalska])).n === 1);

  await db.query(`delete from plan_teachers where id = $1::uuid`, [kowalska]);
  ok("usunięcie nauczyciela zabiera jego krzyżyki (kaskada)",
    (await jeden(`select count(*)::int n from teacher_subjects where teacher_id = $1::uuid`, [kowalska])).n === 0);
}

console.log("\n== SKASOWANIE PRZEDMIOTU NIE RUSZA MAPY ==");
{
  await db.query(`insert into subjects (id, title, position) values ('p-tymczasowy', 'Tymczasowy', 20)`);
  await db.query(`update categories set subject_id = 'p-tymczasowy' where id = 'cms'`);
  await db.query(`delete from subjects where id = 'p-tymczasowy'`);
  const cms = await jeden(`select id, subject_id from categories where id = 'cms'`);
  ok("dział zostaje w mapie, tylko bez przedmiotu", cms !== undefined && cms.subject_id === null,
    JSON.stringify(cms));
  await db.query(`update categories set subject_id = 'p-strony' where id = 'cms'`);
}

console.log("\n== UCZEŃ NIE WIDZI PLANU ==");
{
  await uczen();
  const nauczyciele = await jeden(`select count(*)::int n from plan_teachers`);
  ok("uczeń nie czyta listy nauczycieli", nauczyciele.n === 0, String(nauczyciele.n));
  const krzyzyki = await jeden(`select count(*)::int n from teacher_subjects`);
  ok("uczeń nie czyta przydziału przedmiotów", krzyzyki.n === 0, String(krzyzyki.n));

  const dopisal = await jeden(
    `with d as (insert into plan_teachers (name, position) values ('Haker', 40) returning 1)
     select count(*)::int n from d`).catch(() => ({ n: "blad" }));
  ok("uczeń nie dopisze się do planu", dopisal.n === 0 || dopisal.n === "blad", String(dopisal.n));

  // same przedmioty są jawne — nazwa przedmiotu to nie tajemnica, a widok
  // mapy może z nich kiedyś skorzystać
  const widoczne = await jeden(`select count(*)::int n from subjects`);
  ok("nazwy przedmiotów są publiczne", widoczne.n === 6, String(widoczne.n));

  const zmiana = await jeden(
    `with u as (update subjects set title = 'Zmienione' where id = 'p-bazy' returning 1)
     select count(*)::int n from u`).catch(() => ({ n: "blad" }));
  ok("ale uczeń ich nie zmieni", zmiana.n === 0 || zmiana.n === "blad", String(zmiana.n));
  await db.exec("reset role;");
}

console.log("\n== IDEMPOTENCJA ==");
{
  await admin();
  await db.query(`update plan_teachers set name = 'Nowak' where position = 2`);
  await db.query(`update categories set subject_id = 'p-przygotowanie' where id = 'grafika'`);
  const przedNauczyciele = (await jeden(`select count(*)::int n from plan_teachers`)).n;

  await db.exec("reset role;");
  await db.exec(read("022_przedmioty_nauczyciele.sql"));

  ok("ponowne uruchomienie nie dubluje przedmiotów",
    (await jeden(`select count(*)::int n from subjects`)).n === 6);
  ok("nie wskrzesza usuniętych nauczycieli ani nie dodaje nowych",
    (await jeden(`select count(*)::int n from plan_teachers`)).n === przedNauczyciele, String(przedNauczyciele));
  ok("nie nadpisuje zmienionych nazwisk",
    (await jeden(`select name from plan_teachers where position = 2`)).name === "Nowak");
  ok("nie cofa ręcznie przestawionego przedmiotu działu",
    (await jeden(`select subject_id from categories where id = 'grafika'`)).subject_id === "p-przygotowanie");
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
