// Migracja 019 — klasy 1a (INF.03) i 3a (INF.04).
//
// Poza samym dopisaniem wierszy sprawdzamy dwie rzeczy, które łatwo przeoczyć:
// czy nowe klasy faktycznie działają tam, gdzie klasa jest kluczem obcym
// (postęp na mapie, sesja egzaminu praktycznego), i czy tabela `classes`
// zgadza się z lustrzaną mapą `CLASS_QUALIFICATION` w types/db.ts. To drugie
// nie jest testem bazy, ale rozjazd tych dwóch miejsc to dokładnie ten rodzaj
// błędu, który wychodzi dopiero u nauczyciela na lekcji.
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
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
                 "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
                 "018_attempt_answers.sql", "019_klasy_1a_3a.sql"]) {
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

console.log("== NOWE KLASY ==");
const klasy = await wiersze(`select name, qualification, position from classes order by position`);
{
  ok("1a jest w INF.03", klasy.some((k) => k.name === "1a" && k.qualification === "inf03"));
  ok("3a jest w INF.04", klasy.some((k) => k.name === "3a" && k.qualification === "inf04"));
  ok("stare klasy zostały nietknięte",
    ["2a", "4e", "4d", "4a", "4g"].every((n) => klasy.some((k) => k.name === n)));
  ok("razem siedem klas", klasy.length === 7, String(klasy.length));
  ok("kolejność: INF.03 od najmłodszego rocznika, potem INF.04",
    klasy.map((k) => k.name).join(",") === "1a,2a,4e,4d,3a,4a,4g", klasy.map((k) => k.name).join(","));
  ok("pozycje są unikalne", new Set(klasy.map((k) => k.position)).size === klasy.length);
  ok("nazwy przechodzą wzorzec z tabeli (cyfra + litera)", klasy.every((k) => /^[1-5][a-z]$/.test(k.name)));
}

console.log("\n== KLASA DZIAŁA TAM, GDZIE JEST KLUCZEM OBCYM ==");
{
  await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
  await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);

  const temat = (await wiersze(`select id from subtopics limit 1`))[0].id;
  await db.query(`insert into progress (class_name, subtopic_id) values ('1a', $1)`, [temat]);
  const zapisane = await wiersze(`select class_name from progress where class_name = '1a'`);
  ok("nauczyciel oznacza temat dla klasy 1a", zapisane.length === 1);

  const zadanie = (await wiersze(`select id from practical_tasks where is_ready limit 1`))[0].id;
  const sesja = (await wiersze(`select practical_create_session($1::uuid, '1a', 60) as s`, [zadanie]))[0].s;
  ok("da się otworzyć sesję praktyczną dla 1a", Boolean(sesja.pin));

  // 3a to INF.04, a Praktyka celowo obsługuje tylko HTML/CSS/JS — sesję da się
  // założyć (walidacja patrzy na tabelę classes), ale to decyzja nauczyciela.
  const sesja3a = (await wiersze(`select practical_create_session($1::uuid, '3a', 60) as s`, [zadanie]))[0].s;
  ok("sesja praktyczna dla 3a też przechodzi walidację klasy", Boolean(sesja3a.pin));

  await err("klasa spoza tabeli dalej odrzucona",
    () => db.query(`select practical_create_session($1::uuid, '9z', 60)`, [zadanie]), "invalid_class");
  await db.exec("reset role;");
  await err("postęp dla nieistniejącej klasy odrzucony przez klucz obcy",
    () => db.query(`insert into progress (class_name, subtopic_id) values ('9z', $1)`, [temat]),
    "foreign key");
}

console.log("\n== DZIENNIK I WIDOK UCZNIA ==");
{
  const log = await wiersze(`select class_name from progress_log where class_name = '1a'`);
  ok("oznaczenie dla 1a trafiło do dziennika", log.length === 1, String(log.length));

  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;`);
  const widziane = await wiersze(`select name from classes order by position`);
  ok("uczeń widzi listę klas razem z nowymi", widziane.length === 7);
  await db.exec("reset role;");
}

console.log("\n== LUSTRO W TYPESCRIPCIE ==");
{
  // types/db.ts musi opisywać dokładnie te same klasy co tabela — inaczej
  // interfejs pokaże klasę, której baza nie zna (albo odwrotnie).
  const ts = readFileSync(join(here, "..", "..", "types", "db.ts"), "utf8");
  const mapa = ts.match(/CLASS_QUALIFICATION: Record<ClassName, Qualification> = \{([\s\S]*?)\};/);
  const lista = ts.match(/CLASS_NAMES = \[([\s\S]*?)\] as const;/);
  ok("znaleziono CLASS_QUALIFICATION i CLASS_NAMES w types/db.ts", mapa !== null && lista !== null);

  const zTs = [...(mapa?.[1] ?? "").matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((m) => ({ name: m[1], qualification: m[2] }));
  const nazwyZTs = [...(lista?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  ok("CLASS_NAMES ma te same klasy co tabela",
    nazwyZTs.slice().sort().join(",") === klasy.map((k) => k.name).sort().join(","),
    nazwyZTs.join(","));
  ok("CLASS_NAMES ma tę samą kolejność co kolumna position",
    nazwyZTs.join(",") === klasy.map((k) => k.name).join(","), nazwyZTs.join(","));
  ok("każda klasa ma w TypeScripcie tę samą kwalifikację co w bazie",
    klasy.every((k) => zTs.some((t) => t.name === k.name && t.qualification === k.qualification)),
    JSON.stringify(zTs));
  ok("w TypeScripcie nie ma klasy spoza tabeli",
    zTs.every((t) => klasy.some((k) => k.name === t.name)));
}

console.log("\n== IDEMPOTENCJA ==");
{
  await db.exec(read("019_klasy_1a_3a.sql"));
  const po = await wiersze(`select name, position from classes order by position`);
  ok("ponowne uruchomienie nie dubluje klas ani nie miesza kolejności",
    po.length === 7 && po.map((k) => k.name).join(",") === "1a,2a,4e,4d,3a,4a,4g");
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
