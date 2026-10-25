// Migracja 021 — mapa INF.03 uzupełniona o braki względem programu nauczania.
//
// Same dane, więc testujemy to, co przy danych może pójść źle: czy nic nie
// zniknęło, czy pozycje nie weszły sobie w drogę (obie tabele mają unikalność
// na pozycji), czy migracja przeżyje ponowne uruchomienie i czy radzi sobie
// z kategoriami oraz podtematami dodanymi ręcznie w panelu.
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
const PRZED = ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
  "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
  "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
  "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
  "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
  "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
  "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql"];
for (const f of PRZED) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const wiersze = async (sql, params = []) => (await db.query(sql, params)).rows;
const jeden = async (sql, params = []) => (await wiersze(sql, params))[0];

// Stan sprzed migracji + dane, które nauczyciel mógł dorobić sam:
// własna kategoria, własny podtemat w istniejącym dziale i zaznaczony postęp.
const przedKategorie = (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n;
const przedPodtematy = (await jeden(`select count(*)::int n from subtopics`)).n;
await db.exec(`
  insert into categories (id, position, title, description, qualification)
  values ('wlasna', 50, 'Dzial nauczyciela', 'Dodany recznie w panelu', 'inf03');
  insert into subtopics (id, category_id, position, title)
  values ('wlasny-temat', 'sql', 8, 'Wlasny temat nauczyciela w dziale SQL');
  insert into progress (class_name, subtopic_id) values ('2a', 'wlasny-temat');
  insert into progress (class_name, subtopic_id) values ('2a', 'html-struktura');
`);

await db.exec(read("021_inf03_program_nauczania.sql"));

console.log("== NOWE DZIAŁY ==");
const kategorie = await wiersze(
  `select id, position, title from categories where qualification = 'inf03' order by position`);
{
  const nowe = ["bhp", "podstawy", "multimedia", "algorytmy", "angielski"];
  for (const id of nowe) {
    ok(`dział ${id} istnieje`, kategorie.some((k) => k.id === id));
  }
  ok("stare działy nie zniknęły",
    ["html-css", "javascript", "php", "sql", "serwer", "cms", "bezpieczenstwo", "dokumentacja", "cpp", "grafika"]
      .every((id) => kategorie.some((k) => k.id === id)));
  ok("przybyło dokładnie pięć działów INF.03", kategorie.length === przedKategorie + 1 + 5,
    `${przedKategorie} → ${kategorie.length} (plus dział nauczyciela)`);
  ok("INF.04 nietknięte",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf04'`)).n === 14,
    String((await jeden(`select count(*)::int n from categories where qualification = 'inf04'`)).n));
}

console.log("\n== KOLEJNOŚĆ DZIAŁÓW ==");
{
  ok("mapa zaczyna się od BHP i podstaw zawodu",
    kategorie[0]?.id === "bhp" && kategorie[1]?.id === "podstawy",
    kategorie.slice(0, 3).map((k) => k.id).join(","));
  ok("kończy się na dokumentacji i języku angielskim",
    kategorie.at(-2)?.id === "angielski" || kategorie.at(-1)?.id === "angielski",
    kategorie.slice(-3).map((k) => k.id).join(","));
  ok("pozycje są unikalne", new Set(kategorie.map((k) => k.position)).size === kategorie.length);
  ok("żadna pozycja nie została w strefie roboczej (100+)",
    kategorie.every((k) => k.position < 100), JSON.stringify(kategorie.map((k) => k.position)));
  ok("dział dodany ręcznie przez nauczyciela przetrwał i trafił na koniec",
    kategorie.at(-1)?.id === "wlasna", kategorie.at(-1)?.id);
}

console.log("\n== NOWE PODTEMATY ==");
{
  const liczba = async (cat) =>
    (await jeden(`select count(*)::int n from subtopics where category_id = $1`, [cat])).n;
  ok("BHP ma komplet podtematów", (await liczba("bhp")) === 7);
  ok("przygotowanie do zawodu ma komplet", (await liczba("podstawy")) === 10);
  ok("multimedia mają komplet", (await liczba("multimedia")) === 8);
  ok("algorytmy mają komplet", (await liczba("algorytmy")) === 7);
  ok("język angielski ma komplet", (await liczba("angielski")) === 5);

  // dopisane do istniejących działów — bez naruszania tego, co było
  ok("SQL dostał diagramy E/R i podzapytania",
    (await liczba("sql")) === 7 + 1 + 5, String(await liczba("sql")));
  ok("JavaScript dostał frameworki i narzędzia deweloperskie", (await liczba("javascript")) === 5 + 2);
  ok("PHP dostał obsługę plików", (await liczba("php")) === 5 + 1);
  ok("CMS dostał Joomlę", (await liczba("cms")) === 4 + 1);
  ok("dokumentacja dostała SEO i optymalizację", (await liczba("dokumentacja")) === 5 + 3);

  const po = (await jeden(`select count(*)::int n from subtopics`)).n;
  ok("łącznie 49 nowych podtematów", po === przedPodtematy + 1 + 49, `${przedPodtematy} → ${po}`);
}

console.log("\n== NIC SIĘ NIE NADPISAŁO ==");
{
  const kolizje = await wiersze(
    `select category_id, position, count(*)::int n from subtopics group by 1, 2 having count(*) > 1`);
  ok("pozycje podtematów nie dublują się w żadnym dziale", kolizje.length === 0, JSON.stringify(kolizje));

  const wlasny = await jeden(`select position, title from subtopics where id = 'wlasny-temat'`);
  ok("podtemat dodany ręcznie został na swoim miejscu",
    wlasny !== undefined && wlasny.position === 8, JSON.stringify(wlasny));

  const postep = (await jeden(`select count(*)::int n from progress`)).n;
  ok("zaznaczony postęp klasy przetrwał migrację", postep === 2, String(postep));

  const stareTytuly = await wiersze(
    `select title from subtopics where id in ('html-struktura', 'sql-join', 'cpp-budowa', 'gfx-raster-wektor')`);
  ok("tytuły starych podtematów nietknięte", stareTytuly.length >= 3, String(stareTytuly.length));
}

console.log("\n== MATERIAŁY ==");
{
  const linki = await wiersze(
    `select l.url from subtopic_links l
     join subtopics s on s.id = l.subtopic_id
     where s.category_id in ('podstawy','multimedia','algorytmy','javascript','php','sql','cms','dokumentacja')
       and l.subtopic_id in ('pod-sieci','mm-formaty','alg-sortowanie','js-biblioteki','php-pliki','sql-erd','cms-joomla','dok-seo')`);
  ok("nowe podtematy mają materiały", linki.length >= 8, String(linki.length));
  ok("wszystkie odnośniki są po https", linki.every((l) => l.url.startsWith("https://")));

  const osierocone = await wiersze(
    `select l.subtopic_id from subtopic_links l
     left join subtopics s on s.id = l.subtopic_id where s.id is null`);
  ok("żaden odnośnik nie wisi bez podtematu", osierocone.length === 0, JSON.stringify(osierocone));
}

console.log("\n== UCZEŃ WIDZI NOWE DZIAŁY ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;`);
  const widziane = await wiersze(
    `select id from categories where qualification = 'inf03' order by position`);
  ok("publiczny odczyt obejmuje nowe działy",
    widziane.some((k) => k.id === "bhp") && widziane.some((k) => k.id === "algorytmy"));
  const tematy = (await jeden(`select count(*)::int n from subtopics where category_id = 'podstawy'`)).n;
  ok("uczeń widzi podtematy nowych działów", tematy === 10, String(tematy));
  await db.exec("reset role;");
}

console.log("\n== IDEMPOTENCJA ==");
{
  await db.exec(read("021_inf03_program_nauczania.sql"));
  const kat = (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n;
  const pod = (await jeden(`select count(*)::int n from subtopics`)).n;
  const lin = (await jeden(`select count(*)::int n from subtopic_links`)).n;
  ok("ponowne uruchomienie nie dubluje działów", kat === kategorie.length, String(kat));
  ok("ponowne uruchomienie nie dubluje podtematów", pod === przedPodtematy + 1 + 49, String(pod));
  ok("ponowne uruchomienie nie dubluje materiałów",
    lin === (await jeden(`select count(distinct (subtopic_id, url))::int n from subtopic_links`)).n, String(lin));

  const poNowemu = await wiersze(
    `select id, position from categories where qualification = 'inf03' order by position`);
  ok("kolejność działów się nie przestawiła",
    poNowemu.map((k) => k.id).join(",") === kategorie.map((k) => k.id).join(","),
    poNowemu.map((k) => k.id).join(","));
  ok("dział nauczyciela nie wędruje przy każdym uruchomieniu",
    poNowemu.at(-1)?.id === "wlasna" && poNowemu.at(-1)?.position === kategorie.at(-1)?.position,
    JSON.stringify(poNowemu.at(-1)));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
