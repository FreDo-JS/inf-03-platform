// Migracja 021 — przedmioty tsai / adm / psio jako kolejne kwalifikacje.
//
// Sprawdzamy: nowe wartości przechodzą CHECK-i, create_test przyjmuje je (a
// nieznane odrzuca nadal), kopie kategorii/podtematów/materiałów są kompletne
// i niezależne od oryginałów, migracja jest powtarzalna, a lista kwalifikacji
// w types/db.ts zgadza się z tym, co dopuszcza baza.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "supabase") + "/";
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
const MIGRACJE = ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
  "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
  "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
  "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
  "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
  "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
  "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql",
  "021_przedmioty.sql"];
for (const f of MIGRACJE) {
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

const PRZEDMIOTY = ["tsai", "adm", "psio"];
// Oczekiwane źródła kopii — to samo, co plan w migracji.
const PLAN = {
  tsai: ["html-css", "javascript", "php", "sql", "serwer", "cms", "bezpieczenstwo", "dokumentacja", "inf04-web", "inf04-zespol"],
  adm: ["inf04-oop", "inf04-desktop", "inf04-mobile", "inf04-java", "inf04-testowanie", "inf04-zespol"],
  psio: ["inf04-projektowanie", "inf04-oop", "cpp", "inf04-cpp", "inf04-java", "inf04-testowanie"],
};
const PREFIKS = { tsai: "tsai-", adm: "adm-", psio: "psio-" };

console.log("== KOPIE KATEGORII ==");
for (const q of PRZEDMIOTY) {
  const kat = await wiersze(`select id, position, title from categories where qualification=$1 order by position`, [q]);
  ok(`${q}: ${PLAN[q].length} kategorii`, kat.length === PLAN[q].length, String(kat.length));
  ok(`${q}: pozycje 1..n bez dziur`, kat.every((k, i) => k.position === i + 1));
  ok(`${q}: identyfikatory = prefiks + źródło, w kolejności planu`,
    kat.map((k) => k.id).join(",") === PLAN[q].map((s) => PREFIKS[q] + s).join(","), kat.map((k) => k.id).join(","));
  for (const k of kat) {
    const zrodlo = (await wiersze(`select title from categories where id=$1`, [k.id.slice(PREFIKS[q].length)]))[0];
    if (!zrodlo || zrodlo.title !== k.title) ok(`${q}: tytuł ${k.id} zgadza się ze źródłem`, false);
  }
  ok(`${q}: tytuły zgodne ze źródłami`, true);
}
ok("opis kopii nie niesie numeru jednostki INF.04.x",
  (await wiersze(`select count(*)::int n from categories where qualification in ('tsai','adm','psio') and description ~ '\\(INF\\.04\\.'`))[0].n === 0);
ok("oryginały nietknięte: 8 kategorii INF.03 + 2 z C++/grafiki i 14 INF.04",
  (await wiersze(`select count(*)::int n from categories where qualification='inf03'`))[0].n === 10 &&
  (await wiersze(`select count(*)::int n from categories where qualification='inf04'`))[0].n === 14);

console.log("\n== KOPIE PODTEMATÓW I MATERIAŁÓW ==");
for (const q of PRZEDMIOTY) {
  const zrodel = (await wiersze(
    `select count(*)::int n from subtopics where category_id = any($1)`, [PLAN[q]]))[0].n;
  const kopii = (await wiersze(
    `select count(*)::int n from subtopics s join categories c on c.id=s.category_id where c.qualification=$1`, [q]))[0].n;
  ok(`${q}: tyle podtematów co w źródłach (${zrodel})`, zrodel > 0 && kopii === zrodel, `${kopii} vs ${zrodel}`);

  const zrodelLinkow = (await wiersze(
    `select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id where s.category_id = any($1)`, [PLAN[q]]))[0].n;
  const kopiiLinkow = (await wiersze(
    `select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id
     join categories c on c.id=s.category_id where c.qualification=$1`, [q]))[0].n;
  ok(`${q}: materiały skopiowane (${zrodelLinkow})`, zrodelLinkow > 0 && kopiiLinkow === zrodelLinkow, `${kopiiLinkow} vs ${zrodelLinkow}`);
}
ok("żaden podtemat kopii nie wisi bez kategorii z tego samego przedmiotu",
  (await wiersze(`select count(*)::int n from subtopics s join categories c on c.id=s.category_id
                  where s.id ~ '^(tsai|adm|psio)-' and c.qualification not in ('tsai','adm','psio')`))[0].n === 0);

console.log("\n== KOPIA JEST NIEZALEŻNA OD ORYGINAŁU ==");
{
  await db.exec(`update subtopics set title='ZMIENIONY' where id='tsai-html-struktura'`);
  ok("zmiana kopii nie rusza oryginału",
    (await wiersze(`select title from subtopics where id='html-struktura'`))[0].title !== "ZMIENIONY");
  await db.exec(`delete from categories where id='psio-cpp'`);
  ok("skasowanie kopii nie kasuje oryginału",
    (await wiersze(`select count(*)::int n from subtopics where category_id='cpp'`))[0].n === 10);
}

console.log("\n== WARTOŚCI KWALIFIKACJI W BAZIE ==");
{
  await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
  await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
  for (const q of PRZEDMIOTY) {
    const r = (await wiersze(
      `select create_test($1, 300, '[{"type":"input","text":"Co to funkcja?"}]'::jsonb, '[["blok kodu"]]'::jsonb, null, $2) as r`,
      [`Test ${q}`, q]))[0].r;
    ok(`create_test przyjmuje ${q}`, Boolean(r.pin));
    ok(`  …test zapisany z kwalifikacją ${q}`,
      (await wiersze(`select count(*)::int n from tests where title=$1 and qualification=$2`, [`Test ${q}`, q]))[0].n === 1);
  }
  await err("nieznana kwalifikacja nadal odrzucana",
    () => db.query(`select create_test('Zły', 300, '[{"type":"input","text":"x"}]'::jsonb, '[["y"]]'::jsonb, null, 'inf99')`),
    "invalid_qualification");
  await db.exec("reset role;");
  await err("CHECK na categories odrzuca nieznaną wartość",
    () => db.query(`insert into categories(id, position, title, qualification) values ('x-1', 1, 'X', 'inf99')`), "check constraint");
  await err("CHECK na tests odrzuca nieznaną wartość",
    () => db.query(`update tests set qualification='inf99' where title='Test tsai'`), "check constraint");
  await err("CHECK na classes odrzuca nieznaną wartość",
    () => db.query(`insert into classes(name, qualification, position) values ('5z', 'inf99', 99)`), "check constraint");
  await db.query(`insert into classes(name, qualification, position) values ('5z', 'psio', 99)`);
  ok("klasa może mieć kwalifikację psio", true);
  await db.query(`delete from classes where name='5z'`);

  // Postęp jest per klasa i podtemat — klasa INF.03 może przerabiać cudzy przedmiot.
  await db.query(`insert into progress(class_name, subtopic_id) values ('2a', 'adm-inf04-desktop-ide')`);
  ok("klasa INF.03 oznacza podtemat z przedmiotu adm",
    (await wiersze(`select count(*)::int n from progress where class_name='2a' and subtopic_id='adm-inf04-desktop-ide'`))[0].n === 1);
}

console.log("\n== IDEMPOTENCJA ==");
{
  const przed = (await wiersze(`select
    (select count(*) from categories)::int c, (select count(*) from subtopics)::int s,
    (select count(*) from subtopic_links)::int l`))[0];
  // psio-cpp skasowaliśmy wyżej, więc drugi przebieg ma co odtworzyć, ale reszty nie wolno zdublować.
  await db.exec(read("021_przedmioty.sql"));
  const po = (await wiersze(`select
    (select count(*) from categories)::int c, (select count(*) from subtopics)::int s,
    (select count(*) from subtopic_links)::int l`))[0];
  ok("ponowne uruchomienie odtwarza tylko brakującą kategorię", po.c === przed.c + 1, JSON.stringify({ przed, po }));
  const dubl = (await wiersze(`select count(*)::int n from (
      select subtopic_id, url from subtopic_links group by 1, 2 having count(*) > 1) d`))[0].n;
  ok("materiały nie zostały zdublowane", dubl === 0, String(dubl));
}

console.log("\n== LUSTRO W TYPESCRIPCIE ==");
{
  const ts = readFileSync(join(here, "..", "..", "types", "db.ts"), "utf8");
  const lista = ts.match(/QUALIFICATIONS = \[([\s\S]*?)\] as const;/);
  const zTs = [...(lista?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  ok("znaleziono QUALIFICATIONS w types/db.ts", lista !== null);
  ok("QUALIFICATIONS = dokładnie to, co dopuszcza CHECK w bazie",
    zTs.slice().sort().join(",") === ["adm", "inf03", "inf04", "psio", "tsai"].join(","), zTs.join(","));
  const def = (await wiersze(`select pg_get_constraintdef(oid) d from pg_constraint where conname='categories_qualification_check'`))[0].d;
  ok("każda wartość z TypeScriptu występuje w CHECK-u categories", zTs.every((q) => def.includes(`'${q}'`)), def);
  ok("etykiety i pełne nazwy są dla wszystkich kwalifikacji",
    zTs.every((q) => new RegExp(`\\b${q}:\\s*"`).test(ts.slice(ts.indexOf("QUALIFICATION_LABEL"), ts.indexOf("CLASS_NAMES")))));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
