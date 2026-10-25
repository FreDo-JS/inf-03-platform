// Migracja 022 — RLS per przedmiot nauczyciela (admins.subjects).
//
// Cztery konta:
//   pelny  — subjects IS NULL (wszystko, tak jak przed migracją)
//   tsai   — tylko Tworzenie stron i aplikacji internetowych
//   podglad— subjects = '{}' (nic nie może zmieniać)
//   adm    — Aplikacje desktopowe i mobilne oraz Programowanie strukturalne i obiektowe
//
// Pilnujemy dwóch rzeczy: że nauczyciel nie ruszy cudzego przedmiotu (treści,
// materiały, postęp, testy, klucze, wyniki) i że nie da się samemu przyznać
// sobie przedmiotu przez API.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const POPRZEDNIE = ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
  "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
  "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
  "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
  "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
  "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
  "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql"];

const U = {
  pelny: "11111111-1111-1111-1111-111111111111",
  tsai: "22222222-2222-2222-2222-222222222222",
  podglad: "33333333-3333-3333-3333-333333333333",
  adm: "44444444-4444-4444-4444-444444444444",
};

async function nowaBaza(migracje) {
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
  `);
  for (const f of migracje) {
    await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
  }
  return db;
}

const db = await nowaBaza([...POPRZEDNIE, "021_przedmioty.sql", "022_przedmioty_nauczycieli.sql"]);

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
/** Zapytanie ma się nie udać (błąd RLS / uprawnień); `match` zawęża komunikat. */
const err = async (label, sql, params = [], match) => {
  try { await db.query(sql, params); fail++; console.log("  FAIL ", label, "→ operacja PRZESZŁA"); }
  catch (e) {
    if (match && !e.message.includes(match)) { fail++; console.log("  FAIL ", label, "→", e.message); }
    else { pass++; console.log("  ok   ", label, "(" + e.message.slice(0, 50) + ")"); }
  }
};
/** UPDATE/DELETE przez RLS nie rzuca błędu — po prostu nie trafia w wiersze. */
const wierszy = async (sql, params = []) => (await db.query(sql, params)).rows.length;
const q = async (sql, params = []) => (await db.query(sql, params)).rows;

const jako = (kto) => db.exec(`reset role;
  select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','${U[kto]}',false); set role authenticated;`);
const jakoAnon = () => db.exec(`reset role;
  select set_config('request.jwt.claim.role','anon',false);
  select set_config('request.jwt.claim.sub','',false); set role anon;`);
const jakoWlasciciel = () => db.exec("reset role;");

// --- dane wyjściowe (jako właściciel bazy) -----------------------------------
await jakoWlasciciel();
for (const [k, id] of Object.entries(U)) {
  await db.query(`insert into auth.users(id, email) values ($1, $2) on conflict do nothing`, [id, `${k}@szkola.pl`]);
}
await db.exec(`
  insert into admins(user_id, subjects) values
    ('${U.pelny}', null), ('${U.tsai}', '{tsai}'), ('${U.podglad}', '{}'), ('${U.adm}', '{adm,psio}')
  on conflict (user_id) do update set subjects = excluded.subjects;
`);

console.log("== KOLUMNA I FUNKCJE ==");
await err("lista przedmiotów z nieznaną wartością odrzucona przez CHECK",
  `update admins set subjects='{tsai,xyz}' where user_id=$1`, [U.tsai], "check constraint");
ok("domyślnie (bez listy) konto ma wszystkie przedmioty",
  (await q(`select subjects from admins where user_id=$1`, [U.pelny]))[0].subjects === null);

await jako("pelny");
ok("my_subjects: konto bez ograniczeń widzi wszystkie pięć", (await q(`select my_subjects() s`))[0].s.length === 5);
await jako("tsai");
ok("my_subjects: konto tsai widzi tylko tsai", (await q(`select my_subjects() s`))[0].s.join() === "tsai");
await jako("podglad");
ok("my_subjects: konto podglądowe nie ma przedmiotów", (await q(`select my_subjects() s`))[0].s.length === 0);
await jakoAnon();
await err("my_subjects niedostępne dla ucznia", `select my_subjects()`, [], "permission denied");
ok("can_manage dla ucznia = false", (await q(`select can_manage('tsai') c`))[0].c === false);

console.log("\n== NIE DA SIĘ NADAĆ SOBIE PRZEDMIOTU ==");
await jako("tsai");
await err("nauczyciel nie zmieni własnej listy przedmiotów",
  `update admins set subjects = null where user_id = $1`, [U.tsai], "permission denied");
await err("nauczyciel nie dopisze nowego admina",
  `insert into admins(user_id, subjects) values ($1, null)`, [U.podglad], "permission denied");

console.log("\n== MAPA NAUKI: KATEGORIE ==");
await jako("tsai");
await q(`insert into categories(id, position, title, qualification) values ('tsai-nowa', 50, 'Nowa', 'tsai')`);
ok("tsai dodaje kategorię w swoim przedmiocie", true);
await err("tsai nie doda kategorii w cudzym przedmiocie (adm)",
  `insert into categories(id, position, title, qualification) values ('adm-nowa', 50, 'Cudza', 'adm')`, [], "row-level security");
await err("tsai nie doda kategorii INF.03",
  `insert into categories(id, position, title, qualification) values ('inf03-nowa', 50, 'Cudza', 'inf03')`, [], "row-level security");
ok("tsai nie zmieni kategorii adm (0 wierszy)",
  (await wierszy(`update categories set title='Zhakowana' where id='adm-inf04-desktop' returning 1`)) === 0);
ok("tsai nie skasuje kategorii adm (0 wierszy)",
  (await wierszy(`delete from categories where id='adm-inf04-desktop' returning 1`)) === 0);
await err("tsai nie przeniesie swojej kategorii do cudzego przedmiotu",
  `update categories set qualification='adm' where id='tsai-nowa'`, [], "row-level security");
ok("tsai zmienia tytuł własnej kategorii",
  (await wierszy(`update categories set title='Zmieniona' where id='tsai-nowa' returning 1`)) === 1);

await jako("podglad");
await err("konto podglądowe niczego nie doda",
  `insert into categories(id, position, title, qualification) values ('tsai-x', 60, 'X', 'tsai')`, [], "row-level security");
ok("konto podglądowe nic nie zmieni",
  (await wierszy(`update categories set title='X' where id='tsai-html-css' returning 1`)) === 0);
ok("konto podglądowe nadal czyta mapę", (await wierszy(`select 1 from categories where qualification='tsai'`)) > 0);

await jako("adm");
await q(`insert into categories(id, position, title, qualification) values ('psio-nowa', 50, 'Nowa', 'psio')`);
ok("konto adm+psio dodaje kategorię w psio", true);
ok("konto adm+psio nie zmieni tsai",
  (await wierszy(`update categories set title='X' where id='tsai-html-css' returning 1`)) === 0);

await jako("pelny");
ok("konto bez ograniczeń zmienia dowolny przedmiot",
  (await wierszy(`update categories set title=title where qualification in ('tsai','adm','psio','inf03','inf04') returning 1`)) > 20);

console.log("\n== PODTEMATY I MATERIAŁY ==");
await jako("tsai");
await q(`insert into subtopics(id, category_id, position, title) values ('tsai-nowa-1', 'tsai-nowa', 1, 'Własny')`);
ok("tsai dodaje podtemat do swojej kategorii", true);
await err("tsai nie doda podtematu do kategorii adm",
  `insert into subtopics(id, category_id, position, title) values ('adm-obcy', 'adm-inf04-desktop', 9, 'Obcy')`, [], "row-level security");
ok("tsai nie zmieni podtematu adm",
  (await wierszy(`update subtopics set title='X' where id='adm-inf04-desktop-ide' returning 1`)) === 0);
await err("tsai nie przeniesie podtematu do kategorii adm",
  `update subtopics set category_id='adm-inf04-desktop' where id='tsai-nowa-1'`, [], "row-level security");

await q(`insert into subtopic_links(subtopic_id, label, url) values ('tsai-nowa-1', 'Własny', 'https://example.com')`);
ok("tsai dodaje materiał do swojego podtematu", true);
await err("tsai nie doda materiału do podtematu adm",
  `insert into subtopic_links(subtopic_id, label, url) values ('adm-inf04-desktop-ide', 'Obcy', 'https://example.com')`, [], "row-level security");
await jakoWlasciciel();
const idLinkuAdm = (await q(`select l.id from subtopic_links l where l.subtopic_id like 'adm-%' limit 1`))[0]?.id;
await jako("tsai");
ok("tsai nie skasuje materiału adm (0 wierszy)",
  idLinkuAdm !== undefined && (await wierszy(`delete from subtopic_links where id=$1 returning 1`, [idLinkuAdm])) === 0);

console.log("\n== POSTĘP KLASY ==");
await jako("tsai");
await q(`insert into progress(class_name, subtopic_id) values ('2a', 'tsai-html-struktura')`);
ok("tsai oznacza podtemat swojego przedmiotu", true);
await err("tsai nie oznaczy podtematu cudzego przedmiotu",
  `insert into progress(class_name, subtopic_id) values ('2a', 'adm-inf04-desktop-ide')`, [], "row-level security");
await jako("adm");
ok("adm nie odznaczy cudzego wpisu tsai (0 wierszy)",
  (await wierszy(`delete from progress where subtopic_id='tsai-html-struktura' returning 1`)) === 0);
await jakoAnon();
ok("uczeń widzi postęp bez zmian", (await wierszy(`select 1 from progress where subtopic_id='tsai-html-struktura'`)) === 1);

console.log("\n== TESTY, KLUCZE, WYNIKI ==");
const pytanie = `'[{"type":"input","text":"Co to funkcja?"}]'::jsonb`;
await jako("tsai");
await q(`select create_test('Test tsai', 300, ${pytanie}, '[["blok kodu"]]'::jsonb, '111111', 'tsai')`);
ok("tsai tworzy test w swoim przedmiocie", true);
await err("tsai nie utworzy testu w cudzym przedmiocie",
  `select create_test('Test obcy', 300, ${pytanie}, '[["x"]]'::jsonb, '222222', 'adm')`, [], "row-level security");
await jako("adm");
await q(`select create_test('Test adm', 300, ${pytanie}, '[["okno"]]'::jsonb, '333333', 'adm')`);
ok("adm tworzy test w swoim przedmiocie", true);

await jako("tsai");
ok("tsai widzi klucz własnego testu",
  (await wierszy(`select 1 from test_keys k join tests t on t.id=k.test_id where t.title='Test tsai'`)) === 1);
ok("tsai NIE widzi klucza ani PIN-u testu adm",
  (await wierszy(`select 1 from test_keys k join tests t on t.id=k.test_id where t.title='Test adm'`)) === 0);
ok("tsai nie skasuje testu adm (0 wierszy)",
  (await wierszy(`delete from tests where title='Test adm' returning 1`)) === 0);
ok("tsai nie zmieni testu adm (0 wierszy)",
  (await wierszy(`update tests set title='X' where title='Test adm' returning 1`)) === 0);
await err("tsai nie przepisze własnego testu na cudzy przedmiot",
  `update tests set qualification='adm' where title='Test tsai'`, [], "row-level security");
await err("tsai nie podmieni PIN-u cudzego testu",
  `select set_test_pin((select id from tests where title='Test adm'), '999999')`, [], "not_authorized");
ok("tsai zmienia PIN własnego testu",
  (await q(`select set_test_pin((select id from tests where title='Test tsai'), '444444') p`))[0].p === "444444");

// Podejścia: własny test, cudzy test i podejście osierocone (test skasowany).
await jakoWlasciciel();
const idTsai = (await q(`select id from tests where title='Test tsai'`))[0].id;
const idAdm = (await q(`select id from tests where title='Test adm'`))[0].id;
await db.query(`insert into attempts(test_id, test_title, student_name, score, total, duration_sec)
  values ($1,'Test tsai','Ala',1,1,10), ($2,'Test adm','Ola',1,1,10), (null,'Skasowany','Ela',1,1,10)`, [idTsai, idAdm]);

await jako("tsai");
ok("tsai czyta wyniki tylko własnego testu",
  (await q(`select student_name from attempts order by student_name`)).map((r) => r.student_name).join() === "Ala");
ok("tsai nie skasuje wyniku cudzego testu (0 wierszy)",
  (await wierszy(`delete from attempts where student_name='Ola' returning 1`)) === 0);
await jako("pelny");
ok("konto bez ograniczeń widzi wszystkie wyniki, także osierocone",
  (await wierszy(`select 1 from attempts`)) === 3);
await jako("podglad");
ok("konto podglądowe nie widzi wyników żadnego testu", (await wierszy(`select 1 from attempts`)) === 0);

await jakoAnon();
ok("uczeń nadal widzi listę testów", (await wierszy(`select id from tests`)) >= 2);
ok("uczeń nie zobaczy kluczy ani PIN-ów", (await wierszy(`select 1 from test_keys`).catch(() => 0)) === 0);

console.log("\n== KLASY ==");
await jako("tsai");
await err("ograniczony nauczyciel nie dopisze klasy",
  `insert into classes(name, qualification, position) values ('5z', 'tsai', 99)`, [], "row-level security");
await jako("pelny");
await q(`insert into classes(name, qualification, position) values ('5z', 'tsai', 99)`);
ok("konto bez ograniczeń dopisuje klasę", true);

console.log("\n== UCZEŃ ==");
await jakoAnon();
await err("uczeń nie doda kategorii",
  `insert into categories(id, position, title, qualification) values ('x-1', 70, 'X', 'tsai')`, [], "");
ok("uczeń czyta mapę wszystkich przedmiotów",
  (await wierszy(`select 1 from categories where qualification in ('tsai','adm','psio')`)) >= 22);
ok("uczeń czyta podtematy i materiały",
  (await wierszy(`select 1 from subtopics`)) > 100 && (await wierszy(`select 1 from subtopic_links`)) > 0);

console.log("\n== IDEMPOTENCJA I KOLEJNOŚĆ ==");
await jakoWlasciciel();
await db.exec(read("022_przedmioty_nauczycieli.sql"));
ok("ponowne uruchomienie zachowuje listy przedmiotów",
  (await q(`select subjects from admins where user_id=$1`, [U.adm]))[0].subjects.join() === "adm,psio");
{
  const stara = await nowaBaza(POPRZEDNIE);
  try { await stara.exec(read("022_przedmioty_nauczycieli.sql")); ok("022 bez 021 mówi, której migracji brakuje", false); }
  catch (e) { ok("022 bez 021 mówi, której migracji brakuje", e.message.includes("021_przedmioty")); }
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
