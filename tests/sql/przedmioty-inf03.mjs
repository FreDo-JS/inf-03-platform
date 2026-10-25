// Migracja 025 — trzy przedmioty INF.03 w tabeli Nauczyciele, zrobione jak
// „Programowanie aplikacji internetowych": własne kopie jego działów, podtematów
// i materiałów. Sprawdzamy kompletność kopii, niezależność od oryginału,
// powtarzalność oraz sprzątanie po dawnej wersji migracji (przedmioty jako INF.04).
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
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
                 "023_inf04_braki.sql", "024_inf04_ai.sql", "025_przedmioty_inf03.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const wiersze = async (sql, params = []) => (await db.query(sql, params)).rows;

const NOWE = {
  "p-tworzenie-stron": ["Tworzenie stron i aplikacji internetowych", "i3-tsai-"],
  "p-desktop-mobile": ["Aplikacje desktopowe i mobilne", "i3-adm-"],
  "p-strukturalne-obiektowe": ["Programowanie strukturalne i obiektowe", "i3-psio-"],
};
const ZRODLA = (await wiersze(`select id from categories where subject_id='p-aplikacje' order by position`)).map((r) => r.id);

console.log("== PRZEDMIOTY ==");
{
  const przedmioty = await wiersze(`select id, title, qualification, position from subjects order by qualification, position`);
  for (const [id, [tytul]] of Object.entries(NOWE)) {
    const p = przedmioty.find((x) => x.id === id);
    ok(`${tytul}: INF.03`, p?.title === tytul && p.qualification === "inf03", JSON.stringify(p));
  }
  const inf03 = przedmioty.filter((p) => p.qualification === "inf03");
  ok("INF.03 ma dziewięć przedmiotów, nowe na końcu",
    inf03.length === 9 && inf03.slice(-3).map((p) => p.id).join() === Object.keys(NOWE).join(), inf03.map((p) => p.id).join());
  ok("źródło to sześć działów przedmiotu p-aplikacje", ZRODLA.length === 6, ZRODLA.join());
}

console.log("\n== KOPIE DZIAŁÓW ==");
for (const [id, [tytul, prefiks]] of Object.entries(NOWE)) {
  const kopie = await wiersze(`select id, title, qualification, position from categories where subject_id=$1 order by position`, [id]);
  ok(`${tytul}: kopie wszystkich działów źródła, w kolejności`,
    kopie.map((k) => k.id).join() === ZRODLA.map((z) => prefiks + z).join(), kopie.map((k) => k.id).join());
  ok(`  …w mapie INF.03`, kopie.every((k) => k.qualification === "inf03"));
  for (const z of ZRODLA) {
    const [zr] = await wiersze(`select title from categories where id=$1`, [z]);
    const [kp] = await wiersze(`select title from categories where id=$1`, [prefiks + z]);
    const sz = (await wiersze(`select count(*)::int n from subtopics where category_id=$1`, [z]))[0].n;
    const sk = (await wiersze(`select count(*)::int n from subtopics where category_id=$1`, [prefiks + z]))[0].n;
    const lz = (await wiersze(`select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id where s.category_id=$1`, [z]))[0].n;
    const lk = (await wiersze(`select count(*)::int n from subtopic_links l join subtopics s on s.id=l.subtopic_id where s.category_id=$1`, [prefiks + z]))[0].n;
    if (!(zr.title === kp.title && sz === sk && lz === lk && sz > 0)) {
      ok(`  ${z}: tytuł, podtematy (${sz}/${sk}) i materiały (${lz}/${lk})`, false);
    }
  }
  ok(`  …tytuły, podtematy i materiały zgodne ze źródłem`, true);
}
{
  const poz = await wiersze(`select position from categories where qualification='inf03'`);
  ok("pozycje działów INF.03 są unikalne i za oryginałami",
    new Set(poz.map((p) => p.position)).size === poz.length && poz.length === 15 + 18, String(poz.length));
  ok("źródło nadal należy do p-aplikacje i się nie zmieniło",
    (await wiersze(`select count(*)::int n from categories where subject_id='p-aplikacje'`))[0].n === 6);
  ok("mapa INF.04 nietknięta",
    (await wiersze(`select count(*)::int n from categories where qualification='inf04' and subject_id is not null`))[0].n === 0);
}

console.log("\n== KOPIA JEST NIEZALEŻNA ==");
{
  await db.exec(`update categories set title='ZMIENIONY' where id='i3-adm-php'`);
  ok("zmiana kopii nie rusza oryginału", (await wiersze(`select title from categories where id='php'`))[0].title !== "ZMIENIONY");
}

console.log("\n== PONOWNE URUCHOMIENIE ==");
{
  const przed = (await wiersze(`select (select count(*) from categories)::int c, (select count(*) from subtopics)::int s,
    (select count(*) from subtopic_links)::int l, (select count(*) from subjects)::int p`))[0];
  await db.exec(read("025_przedmioty_inf03.sql"));
  const po = (await wiersze(`select (select count(*) from categories)::int c, (select count(*) from subtopics)::int s,
    (select count(*) from subtopic_links)::int l, (select count(*) from subjects)::int p`))[0];
  ok("nic się nie dubluje", JSON.stringify(przed) === JSON.stringify(po), JSON.stringify({ przed, po }));
  ok("ręczna zmiana kopii przetrwała",
    (await wiersze(`select title from categories where id='i3-adm-php'`))[0].title === "ZMIENIONY");
}

console.log("\n== SPRZĄTANIE PO DAWNEJ WERSJI ==");
{
  // Stan bazy po starej migracji 025: przedmioty jako INF.04 z przypisanymi działami INF.04.
  await db.exec(`update subjects set qualification='inf04', position=position-6 where id in ('p-tworzenie-stron','p-desktop-mobile','p-strukturalne-obiektowe');
    delete from categories where id like 'i3-%';
    update categories set subject_id='p-desktop-mobile' where id in ('inf04-desktop','inf04-mobile');
    update categories set subject_id='p-tworzenie-stron' where id='inf04-web';`);
  await db.exec(read("025_przedmioty_inf03.sql"));
  ok("przedmioty wróciły do INF.03",
    (await wiersze(`select count(*)::int n from subjects where qualification='inf04'`))[0].n === 0);
  ok("działy INF.04 odpięte od tych przedmiotów",
    (await wiersze(`select count(*)::int n from categories where qualification='inf04' and subject_id is not null`))[0].n === 0);
  ok("kopie odtworzone po usunięciu",
    (await wiersze(`select count(*)::int n from categories where id like 'i3-%'`))[0].n === 18);
}

console.log("\n== UCZEŃ ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;`);
  ok("uczeń czyta kopie działów w mapie INF.03",
    (await wiersze(`select 1 from categories where id like 'i3-%'`)).length === 18);
  await db.exec("reset role;");
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
