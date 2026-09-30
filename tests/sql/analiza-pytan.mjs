// Migracja 018 — odpowiedzi ucznia zapisane przy wyniku (analiza pytań).
//
// Sprawdzamy trzy rzeczy: że ocena liczy się dokładnie tak jak wcześniej,
// że zapis odpowiedzi trzyma indeksy pytań (bez tego analiza pokazywałaby
// cudze odpowiedzi pod cudzymi pytaniami) i że odpowiedzi nie wyciekają
// do ucznia — to dane, które w panelu są zestawiane z kluczem.
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
                 "018_attempt_answers.sql"]) {
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

const admin = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
const uczen = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
  select set_config('request.jwt.claim.sub','',false); set role anon;
  select set_config('request.headers','{"x-forwarded-for":"5.5.5.5"}',false);`);

// --------------------------------------------------------------------------
// Test z trzema typami pytań — każdy typ zapisuje się inaczej
// --------------------------------------------------------------------------
const PYTANIA = [
  { type: "closed", text: "Który selektor wybiera element o klasie box?", options: [".box", "#box", "box", "*box"] },
  { type: "input", text: "Która właściwość CSS ustawia odstęp wewnętrzny?" },
  {
    type: "matching",
    text: "Dopasuj deklarację do efektu",
    left: ["display: flex", "position: absolute"],
    right: ["kontener elastyczny", "wyjęcie z układu"],
  },
];
const KLUCZ = [[".box"], ["padding"], ["kontener elastyczny", "wyjęcie z układu"]];

await admin();
const nowy = (
  await db.query(`select create_test($1, 600, $2::jsonb, $3::jsonb) as t`, [
    "Analiza — trzy typy pytań",
    JSON.stringify(PYTANIA),
    JSON.stringify(KLUCZ),
  ])
).rows[0].t;
const testId = nowy.id;
const pin = nowy.pin;

const podejscie = async (imie, odpowiedzi) => {
  await uczen();
  const otwarty = (await db.query(`select open_test($1::uuid, $2) as r`, [testId, pin])).rows[0].r;
  await db.query(`select begin_session($1::uuid, $2)`, [otwarty.session_id, imie]);
  return (await db.query(`select submit_attempt($1::uuid, $2::jsonb) as r`, [
    otwarty.session_id,
    JSON.stringify(odpowiedzi),
  ])).rows[0].r;
};
const wynik = async (imie) => {
  await db.exec("reset role;");
  return (
    await db.query(`select score, total, answers, results from attempts where student_name = $1`, [imie])
  ).rows[0];
};

console.log("== KOLUMNY ==");
await db.exec("reset role;");
{
  const kol = (
    await db.query(`select column_name, is_nullable, data_type from information_schema.columns
                    where table_name = 'attempts' and column_name in ('answers','results') order by 1`)
  ).rows;
  ok("attempts ma kolumny answers i results", kol.length === 2);
  ok("obie są jsonb i mogą być puste (stare podejścia)",
    kol.every((k) => k.data_type === "jsonb" && k.is_nullable === "YES"));
}

console.log("\n== KOMPLET POPRAWNYCH ==");
{
  const r = await podejscie("Ala", [".box", "  PADDING  ", ["kontener elastyczny", "wyjęcie z układu"]]);
  ok("ocena bez zmian: 3/3", r.score === 3 && r.total === 3);
  const a = await wynik("Ala");
  ok("results ma wpis na każde pytanie", Array.isArray(a.results) && a.results.length === 3);
  ok("wszystkie pytania zaliczone", a.results.every((x) => x === true));
  ok("liczba trafień zgadza się z punktacją", a.results.filter(Boolean).length === a.score);
  ok("answers ma wpis na każde pytanie", Array.isArray(a.answers) && a.answers.length === 3);
  ok("odpowiedź zamknięta zapisana dosłownie", a.answers[0] === ".box");
  ok("odpowiedź otwarta zapisana tak, jak ją wpisano (bez normalizacji)",
    a.answers[1] === "  PADDING  ", JSON.stringify(a.answers[1]));
  ok("dopasowanie zapisane jako tablica w kolejności lewej kolumny",
    Array.isArray(a.answers[2]) && a.answers[2][0] === "kontener elastyczny" && a.answers[2][1] === "wyjęcie z układu");
}

console.log("\n== BŁĘDY I BRAKI ==");
{
  const r = await podejscie("Bartek", ["#box", null, ["wyjęcie z układu", "kontener elastyczny"]]);
  ok("zła odpowiedź i zła permutacja → 0/3", r.score === 0);
  const a = await wynik("Bartek");
  ok("błędna odpowiedź zapisana (widać, w co uczeń wpadł)", a.answers[0] === "#box");
  ok("brak odpowiedzi zapisany jako null", a.answers[1] === null);
  ok("zła permutacja zapisana w całości", Array.isArray(a.answers[2]) && a.answers[2].length === 2);
  ok("results to same false", a.results.every((x) => x === false));
}

console.log("\n== KRÓTSZA TABLICA NIŻ LICZBA PYTAŃ ==");
{
  // uczeń oddaje test, nie dotknąwszy ostatniego pytania — przeglądarka
  // przysyła krótszą tablicę, a indeksy w bazie muszą i tak zostać równe
  const r = await podejscie("Celina", [".box", "margin"]);
  ok("brakujące pytanie liczy się jako błędne: 1/3", r.score === 1);
  const a = await wynik("Celina");
  ok("answers dopełnione do liczby pytań", a.answers.length === 3 && a.answers[2] === null);
  ok("results dopełnione do liczby pytań", a.results.length === 3 && a.results[2] === false);
  ok("indeksy się nie przesunęły", a.answers[0] === ".box" && a.answers[1] === "margin");
}

console.log("\n== PRZYCINANIE ==");
{
  const dlugie = "x".repeat(900);
  await podejscie("Damian", [".box", dlugie, null]);
  const a = await wynik("Damian");
  ok("odpowiedź otwarta przycięta do 500 znaków", a.answers[1].length === 500);
  ok("brak dopasowania zapisany jako null", a.answers[2] === null);
}

console.log("\n== DANE NADAJĄ SIĘ DO ANALIZY ==");
{
  await admin();
  const rozklad = (
    await db.query(
      `select (answers ->> 0) as odp, count(*)::int n
       from attempts where test_id = $1::uuid and answers is not null
       group by 1 order by n desc, 1`,
      [testId],
    )
  ).rows;
  ok("rozkład odpowiedzi na pytanie 1 daje się policzyć jednym zapytaniem",
    rozklad.length === 2 && rozklad[0].odp === ".box" && rozklad[0].n === 3);
  const trudnosc = (
    await db.query(
      `select count(*) filter (where (results -> 1)::boolean)::int trafione, count(*)::int wszystkie
       from attempts where test_id = $1::uuid and results is not null`,
      [testId],
    )
  ).rows[0];
  ok("da się wskazać najtrudniejsze pytanie", trudnosc.wszystkie === 4 && trudnosc.trafione === 1,
    JSON.stringify(trudnosc));
}

console.log("\n== ODPOWIEDZI NIE WYCIEKAJĄ DO UCZNIA ==");
{
  await uczen();
  const widzi = (await db.query(`select count(*)::int n from attempts`)).rows[0].n;
  ok("uczeń nie czyta tabeli wyników (a więc i cudzych odpowiedzi)", widzi === 0);
  await err("uczeń nie czyta klucza odpowiedzi", () => db.query(`select answers from test_keys`), "permission denied");
  await admin();
  const adminWidzi = (await db.query(`select count(*)::int n from attempts where answers is not null`)).rows[0].n;
  ok("nauczyciel czyta odpowiedzi", adminWidzi === 4);
}

console.log("\n== CHECK-I NA KSZTAŁT ==");
await db.exec("reset role;");
await err("answers krótsze niż liczba pytań", () => db.query(
  `insert into attempts(test_title,student_name,score,total,duration_sec,answers)
   values ('t','x',1,3,10,'["a"]'::jsonb)`), "check constraint");
await err("results dłuższe niż liczba pytań", () => db.query(
  `insert into attempts(test_title,student_name,score,total,duration_sec,results)
   values ('t','x',1,2,10,'[true,false,true]'::jsonb)`), "check constraint");
await err("answers jako obiekt zamiast tablicy", () => db.query(
  `insert into attempts(test_title,student_name,score,total,duration_sec,answers)
   values ('t','x',1,1,10,'{"a":1}'::jsonb)`), "check constraint");
await err("answers większe niż limit rozmiaru", () => db.query(
  `insert into attempts(test_title,student_name,score,total,duration_sec,answers)
   values ('t','x',1,1,10, jsonb_build_array(repeat('x', 70000)))`), "check constraint");
{
  await db.query(
    `insert into attempts(test_title,student_name,score,total,duration_sec) values ('stary','Sprzed migracji',2,3,60)`,
  );
  const stary = (await db.query(`select answers, results from attempts where student_name = 'Sprzed migracji'`)).rows[0];
  ok("wynik bez odpowiedzi nadal wolno zapisać (podejścia sprzed 018)",
    stary.answers === null && stary.results === null);
}

console.log("\n== IDEMPOTENCJA ==");
{
  await db.exec("reset role;");
  await db.exec(read("018_attempt_answers.sql"));
  const ile = (await db.query(
    `select count(*)::int n from pg_constraint where conname in ('attempts_answers_shape','attempts_results_shape')`,
  )).rows[0].n;
  ok("ponowne uruchomienie nie dubluje CHECK-ów", ile === 2, String(ile));
  const r = await podejscie("Ewa", [".box", "padding", ["kontener elastyczny", "wyjęcie z układu"]]);
  ok("po ponownym uruchomieniu oddanie testu dalej działa", r.score === 3);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
