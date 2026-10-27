// Migracja 031 — pytania wielokrotnego wyboru (checkboxy).
//
// Najwazniejsza asercja w tym pliku to „komplet poprawnych plus jedna
// nadmiarowa = zero". Pierwsza wersja porownania zbiorow w submit_attempt
// nie miala nawiasow wokol EXCEPT, przez co nadmiarowe zaznaczenie wychodzilo
// na poprawne — kolejnosc wiazania EXCEPT i UNION jest w SQL-u taka sama.
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
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
                 "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
                 "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql",
                 "031_multi_questions.sql"]) {
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
const jeden = async (sql, p = []) => (await db.query(sql, p)).rows[0];

const OPCJE = [".box", "#box", "div.box", "box"];
const PYTANIE = { type: "multi", text: "Ktore selektory wybieraja element o klasie box?", options: OPCJE };
const KLUCZ = [".box", "div.box"];

console.log("== WALIDACJA PYTANIA ==");
{
  const v = async (q) => (await jeden(`select questions_valid($1::jsonb) v`, [JSON.stringify([q])])).v;
  ok("poprawne pytanie przechodzi", (await v(PYTANIE)) === true);
  ok("brak opcji odrzucony", (await v({ type: "multi", text: "x" })) === false);
  ok("jedna opcja odrzucona", (await v({ type: "multi", text: "x", options: ["a"] })) === false);
  ok("powtorzone opcje odrzucone",
    (await v({ type: "multi", text: "x", options: ["a", "a"] })) === false);
  ok("stare typy nadal dzialaja", (await v({ type: "input", text: "Podaj atrybut." })) === true);
}

console.log("\n== WALIDACJA KLUCZA ==");
await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
{
  const stworz = (klucz, tytul) =>
    db.query(`select create_test($1, 600, $2::jsonb, $3::jsonb) as t`, [
      tytul, JSON.stringify([PYTANIE]), JSON.stringify([klucz]),
    ]);

  await err("pusty klucz odrzucony", () => stworz([], "Multi zly 1"), "invalid_keys");
  await err("odpowiedz spoza listy opcji odrzucona",
    () => stworz([".box", "wymyslona"], "Multi zly 2"), "invalid_keys");
  await err("powtorzona odpowiedz w kluczu odrzucona",
    () => stworz([".box", ".box"], "Multi zly 3"), "invalid_keys");
  await err("wszystkie opcje poprawne = pytanie bez sensu, odrzucone",
    () => stworz(OPCJE, "Multi zly 4"), "invalid_keys");
  ok("zaden odrzucony test nie trafil do bazy",
    (await jeden(`select count(*)::int n from tests where title like 'Multi zly%'`)).n === 0);
}

const nowy = (await jeden(`select create_test($1, 600, $2::jsonb, $3::jsonb) as t`,
  ["Wielokrotny wybor — CSS", JSON.stringify([PYTANIE]), JSON.stringify([KLUCZ])])).t;
ok("poprawny test zapisany", Boolean(nowy.id) && /^[0-9]{6}$/.test(nowy.pin));

console.log("\n== UCZEN NIE WIDZI, KTORE SA POPRAWNE ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"9.9.9.9"}',false);`);
  const otwarty = (await jeden(`select open_test($1::uuid, $2) as r`, [nowy.id, nowy.pin])).r;
  const p = otwarty.questions[0];
  ok("po PIN-ie przychodza same opcje", JSON.stringify(p.options) === JSON.stringify(OPCJE));
  ok("obraz pytania nie zdradza klucza", p.key === undefined && p.answers === undefined);
  await err("klucz pozostaje niedostepny",
    () => db.query(`select answers from test_keys where test_id = $1::uuid`, [nowy.id]), "permission denied");
}

console.log("\n== OCENA ==");
const podejscie = async (imie, odpowiedz) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"9.9.9.9"}',false);`);
  const otwarty = (await jeden(`select open_test($1::uuid, $2) as r`, [nowy.id, nowy.pin])).r;
  await db.query(`select begin_session($1::uuid, $2)`, [otwarty.session_id, imie]);
  return (await jeden(`select submit_attempt($1::uuid, $2::jsonb) as r`, [
    otwarty.session_id, JSON.stringify([odpowiedz]),
  ])).r;
};
{
  ok("komplet poprawnych → punkt", (await podejscie("Ala", [".box", "div.box"])).score === 1);
  ok("kolejnosc zaznaczen bez znaczenia", (await podejscie("Bartek", ["div.box", ".box"])).score === 1);
  ok("wielkosc liter i spacje bez znaczenia",
    (await podejscie("Celina", ["  .BOX ", "Div.Box"])).score === 1);
  ok("powtorzone zaznaczenie tej samej opcji nie szkodzi",
    (await podejscie("Dawid", [".box", ".box", "div.box"])).score === 1);

  // To jest ta asercja, dla ktorej powstal ten plik.
  ok("komplet poprawnych + jedna nadmiarowa → zero",
    (await podejscie("Ewa", [".box", "div.box", "#box"])).score === 0);
  ok("wszystkie opcje zaznaczone → zero",
    (await podejscie("Filip", OPCJE)).score === 0);

  ok("tylko czesc poprawnych → zero", (await podejscie("Gaja", [".box"])).score === 0);
  ok("sama bledna → zero", (await podejscie("Hania", ["#box"])).score === 0);
  ok("pusta tablica → zero", (await podejscie("Igor", [])).score === 0);
  ok("brak odpowiedzi → zero", (await podejscie("Jan", null)).score === 0);
  ok("napis zamiast tablicy → zero", (await podejscie("Kinga", ".box")).score === 0);
}

console.log("\n== ZAPIS DO ANALIZY PYTAN ==");
{
  await db.exec("reset role;");
  const ala = await jeden(`select answers, results from attempts where student_name = 'Ala'`);
  ok("zaznaczenia zapisane jako tablica",
    Array.isArray(ala.answers?.[0]) && ala.answers[0].length === 2, JSON.stringify(ala.answers));
  ok("results opisuje pytanie", ala.results?.[0] === true);

  const kinga = await jeden(`select answers from attempts where student_name = 'Kinga'`);
  ok("napis zamiast tablicy zapisany jako null", kinga.answers?.[0] === null, JSON.stringify(kinga.answers));

  const rozklad = await jeden(
    `select count(*) filter (where answers -> 0 @> '["#box"]')::int bledna,
            count(*)::int wszystkie
     from attempts where test_id = $1::uuid and answers is not null`, [nowy.id]);
  ok("da sie policzyc, jak czesto zaznaczano dana opcje",
    rozklad.wszystkie === 11 && rozklad.bledna === 3, JSON.stringify(rozklad));
}

console.log("\n== POZOSTALE TYPY DZIALAJA DALEJ ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
  const mix = (await jeden(`select create_test($1, 600, $2::jsonb, $3::jsonb) as t`, [
    "Mieszany z wielokrotnym",
    JSON.stringify([
      { type: "closed", text: "Jeden wybor?", options: ["tak", "nie"] },
      { type: "input", text: "Wpisz cos." },
      { type: "gaps", text: "Uzupelnij", code: "div { display: [[1]]; }" },
      PYTANIE,
    ]),
    JSON.stringify([["tak"], ["cos"], [["flex"]], KLUCZ]),
  ])).t;
  ok("test z czterema typami zapisany", Boolean(mix.id));

  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"9.9.9.8"}',false);`);
  const otwarty = (await jeden(`select open_test($1::uuid, $2) as r`, [mix.id, mix.pin])).r;
  await db.query(`select begin_session($1::uuid, $2)`, [otwarty.session_id, "Komplet"]);
  const wynik = (await jeden(`select submit_attempt($1::uuid, $2::jsonb) as r`, [
    otwarty.session_id, JSON.stringify(["tak", "cos", ["flex"], [".box", "div.box"]]),
  ])).r;
  ok("komplet poprawnych to maksimum", wynik.score === 4 && wynik.total === 4, JSON.stringify(wynik));
}

console.log("\n== IDEMPOTENCJA ==");
{
  await db.exec("reset role;");
  await db.exec(read("031_multi_questions.sql"));
  ok("ponowne uruchomienie nic nie psuje",
    (await jeden(`select questions_valid($1::jsonb) v`, [JSON.stringify([PYTANIE])])).v === true);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
