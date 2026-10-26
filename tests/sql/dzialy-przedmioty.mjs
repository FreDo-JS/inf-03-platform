// Migracja 030 — dział mapy może należeć do wielu przedmiotów.
//
// 025 kopiowało działy, żeby trzy nowe przedmioty miały „własne" treści —
// mapa INF.03 urosła z 15 działów do 33, z sześcioma tytułami powtórzonymi
// po cztery razy. 030 zastępuje kopie tabelą łączącą i kasuje duplikaty.
//
// Sprawdzamy oba scenariusze, bo migracja ma działać niezależnie od tego,
// czy 025 zdążyło pójść na bazę: ze sprzątaniem i bez.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const DO_024 = ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
  "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
  "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
  "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
  "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
  "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
  "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql",
  "021_inf03_program_nauczania.sql", "022_przedmioty_nauczyciele.sql",
  "023_inf04_braki.sql", "024_inf04_ai.sql"];

/** Świeża baza z migracjami do 024 włącznie. */
async function baza() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
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
    insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'szef@szkola.pl', now());
  `);
  for (const f of DO_024) {
    await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
  }
  return db;
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

const PRZEDMIOTY = ["p-tworzenie-stron", "p-desktop-mobile", "p-strukturalne-obiektowe"];
const ZRODLA = ["algorytmy", "javascript", "php", "serwer", "bezpieczenstwo", "cpp"];

// ===========================================================================
console.log("== SCENARIUSZ A: 025 bylo uruchomione (sa kopie) ==");
// ===========================================================================
{
  const db = await baza();
  const jeden = async (sql, p = []) => (await db.query(sql, p)).rows[0];
  const wiersze = async (sql, p = []) => (await db.query(sql, p)).rows;

  await db.exec(read("025_przedmioty_inf03.sql"));

  const przedKat = (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n;
  ok("po 025 mapa faktycznie jest zdublowana (33 dzialy)", przedKat === 33, String(przedKat));

  // Nauczyciel zdążył odhaczyć temat w kopii — to nie może przepaść.
  await db.exec(`
    insert into progress (class_name, subtopic_id) values ('2a', 'i3-tsai-js-devtools');
    insert into progress (class_name, subtopic_id) values ('4e', 'alg-schematy');
  `);

  await db.exec(read("030_dzial_w_wielu_przedmiotach.sql"));

  const poKat = (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n;
  ok("mapa wraca do 15 dzialow", poKat === 15, String(poKat));
  ok("zadne kopie nie zostaly",
    (await jeden(`select count(*)::int n from categories where id ~ '^i3-'`)).n === 0);
  ok("zadne skopiowane podtematy nie zostaly",
    (await jeden(`select count(*)::int n from subtopics where id ~ '^i3-'`)).n === 0);

  const duble = await wiersze(
    `select title from categories where qualification = 'inf03' group by title having count(*) > 1`);
  ok("zaden tytul sie nie powtarza", duble.length === 0, JSON.stringify(duble));

  for (const p of PRZEDMIOTY) {
    const dzialy = (await wiersze(
      `select category_id from category_subjects where subject_id = $1 order by category_id`, [p]))
      .map((r) => r.category_id);
    ok(`${p}: szesc dzialow, same oryginaly`,
      dzialy.length === 6 && dzialy.every((d) => ZRODLA.includes(d)), dzialy.join(","));
  }
  ok("p-aplikacje tez jest w tabeli laczacej",
    (await jeden(`select count(*)::int n from category_subjects where subject_id = 'p-aplikacje'`)).n === 6);
  ok("jeden dzial nalezy teraz do czterech przedmiotow",
    (await jeden(`select count(*)::int n from category_subjects where category_id = 'javascript'`)).n === 4);

  ok("oznaczenie z kopii przeniesione na oryginal",
    (await jeden(`select count(*)::int n from progress where class_name = '2a' and subtopic_id = 'js-devtools'`)).n === 1);
  ok("oznaczenie na oryginale nietkniete",
    (await jeden(`select count(*)::int n from progress where class_name = '4e' and subtopic_id = 'alg-schematy'`)).n === 1);
  ok("po kopiach nie zostal zaden postep",
    (await jeden(`select count(*)::int n from progress where subtopic_id ~ '^i3-'`)).n === 0);

  console.log("\n-- idempotencja i odpornosc na ponowne 025 --");
  await db.exec(read("030_dzial_w_wielu_przedmiotach.sql"));
  ok("ponowne 030 nic nie psuje",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n === 15);

  await db.exec(read("025_przedmioty_inf03.sql"));
  ok("ponowne 025 znowu robi kopie (dlatego 030 trzeba puscic po nim)",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n === 33);
  await db.exec(read("030_dzial_w_wielu_przedmiotach.sql"));
  ok("030 sprzata je ponownie",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n === 15);

  console.log("\n-- uprawnienia --");
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); set role anon;`);
  ok("uczen widzi 15 dzialow INF.03, bez duplikatow",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n === 15);
  ok("uczen nie czyta powiazan dzialow z przedmiotami",
    (await jeden(`select count(*)::int n from category_subjects`)).n === 0);
  const zapis = await jeden(
    `with w as (insert into category_subjects (category_id, subject_id)
                values ('javascript','p-bhp') returning 1) select count(*)::int n from w`)
    .catch(() => ({ n: "blad" }));
  ok("uczen nie dopisze powiazania", zapis.n === 0 || zapis.n === "blad", String(zapis.n));
  await db.exec("reset role;");

  await err("powiazanie z nieistniejacym przedmiotem odrzucone", () => db.query(
    `insert into category_subjects (category_id, subject_id) values ('javascript', 'p-wymyslony')`),
    "foreign key");
  await err("to samo powiazanie drugi raz odrzucone", () => db.query(
    `insert into category_subjects (category_id, subject_id) values ('javascript', 'p-aplikacje')`),
    "duplicate key");

  await db.query(`delete from subjects where id = 'p-desktop-mobile'`);
  ok("skasowanie przedmiotu zabiera tylko powiazania, nie dzialy",
    (await jeden(`select count(*)::int n from category_subjects where subject_id = 'p-desktop-mobile'`)).n === 0
    && (await jeden(`select count(*)::int n from categories where id = 'javascript'`)).n === 1);
}

// ===========================================================================
console.log("\n== SCENARIUSZ B: 025 nigdy nie poszlo ==");
// ===========================================================================
{
  const db = await baza();
  const jeden = async (sql, p = []) => (await db.query(sql, p)).rows[0];

  await db.exec(read("030_dzial_w_wielu_przedmiotach.sql"));

  ok("mapa nadal ma 15 dzialow",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n === 15);
  ok("trzy przedmioty zostaly zalozone",
    (await jeden(`select count(*)::int n from subjects where id = any($1)`, [PRZEDMIOTY])).n === 3);
  for (const p of PRZEDMIOTY) {
    ok(`${p}: szesc dzialow`,
      (await jeden(`select count(*)::int n from category_subjects where subject_id = $1`, [p])).n === 6);
  }
  ok("przypisania z 022 przepisane do tabeli laczacej",
    (await jeden(`select count(*)::int n from category_subjects where subject_id = 'p-bhp'`)).n === 1);
  ok("dzialy INF.04 dalej bez przedmiotu",
    (await jeden(
      `select count(*)::int n from category_subjects cs
       join categories c on c.id = cs.category_id where c.qualification = 'inf04'`)).n === 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
