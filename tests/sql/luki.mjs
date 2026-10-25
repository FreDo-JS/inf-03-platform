// Migracja 020 — pytania z lukami w kodzie („fill in the blanks").
//
// Najważniejsze są tu dwie rzeczy: walidacja (żeby nie dało się zapisać pytania
// z rozjechaną numeracją luk albo klucza o złym kształcie) i ocena po stronie
// serwera — razem z zapisem odpowiedzi do analizy pytań. Dlatego test przechodzi
// całą drogę ucznia: create_test → PIN → sesja → submit_attempt.
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
                 "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql"]) {
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
const jeden = async (sql, params = []) => (await db.query(sql, params)).rows[0];

const KOD = "div {\n  display: [[1]];\n  flex-direction: [[2]];\n}";
const PYTANIE = { type: "gaps", text: "Uzupelnij regule tak, aby elementy ustawily sie w kolumnie.", code: KOD };
const KLUCZ = [["flex"], ["column", "kolumna"]];

console.log("== LICZENIE LUK ==");
{
  const w = await jeden(`select
    gaps_count('a [[1]] b [[2]]') dwie,
    gaps_count('nic') zero,
    gaps_count('[[1]] i znowu [[1]]') duplikat,
    gaps_count('[[1]] [[3]]') dziura,
    gaps_count('[[2]] [[1]]') odwrotnie,
    gaps_count('[[0]] [[1]]') zero_numer,
    gaps_count(null) pusty,
    gaps_count('[[1]][[2]][[3]][[4]][[5]][[6]][[7]][[8]][[9]][[10]]') dziesiec,
    gaps_count('[[1]][[2]][[3]][[4]][[5]][[6]][[7]][[8]][[9]][[10]][[11]]') jedenascie`);
  ok("dwie luki", w.dwie === 2);
  ok("brak markerów to zero", w.zero === 0);
  ok("powtórzony numer odrzucony", w.duplikat === 0);
  ok("dziura w numeracji odrzucona", w.dziura === 0);
  ok("kolejność markerów w kodzie nie ma znaczenia", w.odwrotnie === 2);
  ok("numer 0 odrzucony", w.zero_numer === 0);
  ok("null to zero", w.pusty === 0);
  ok("dziesięć luk wolno", w.dziesiec === 10);
  ok("jedenaście luk już nie", w.jedenascie === 0);
}

console.log("\n== WALIDACJA PYTANIA ==");
{
  const v = async (q) => (await jeden(`select questions_valid($1::jsonb) v`, [JSON.stringify([q])])).v;
  ok("poprawne pytanie z lukami przechodzi", (await v(PYTANIE)) === true);
  ok("brak pola code odrzucony", (await v({ type: "gaps", text: "x" })) === false);
  ok("code bez markerów odrzucony", (await v({ type: "gaps", text: "x", code: "div {}" })) === false);
  ok("rozjechana numeracja odrzucona",
    (await v({ type: "gaps", text: "x", code: "[[1]] [[3]]" })) === false);
  ok("code jako liczba odrzucony", (await v({ type: "gaps", text: "x", code: 7 })) === false);
  ok("options przy lukach odrzucone",
    (await v({ type: "gaps", text: "x", code: "[[1]]", options: ["a", "b"] })) === false);
  ok("stare typy pytań dalej przechodzą",
    (await v({ type: "input", text: "Podaj atrybut." })) === true);
  ok("wymyślony typ dalej odrzucany", (await v({ type: "coderunner", text: "x" })) === false);
}

console.log("\n== WALIDACJA KLUCZA W create_test ==");
await db.exec(`insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
{
  const stworz = (pytania, klucze, tytul) =>
    db.query(`select create_test($1, 600, $2::jsonb, $3::jsonb) as t`, [
      tytul, JSON.stringify(pytania), JSON.stringify(klucze),
    ]);

  await err("klucz płaski (bez podziału na luki) odrzucony",
    () => stworz([PYTANIE], [["flex", "column"]], "Luki — zly klucz 1"), "invalid_keys");
  await err("mniej pozycji klucza niż luk odrzucone",
    () => stworz([PYTANIE], [[["flex"]]], "Luki — zly klucz 2"), "invalid_keys");
  await err("więcej pozycji klucza niż luk odrzucone",
    () => stworz([PYTANIE], [[["flex"], ["column"], ["extra"]]], "Luki — zly klucz 3"), "invalid_keys");
  await err("pusta lista wariantów dla luki odrzucona",
    () => stworz([PYTANIE], [[["flex"], []]], "Luki — zly klucz 4"), "invalid_keys");
  await err("więcej niż pięć wariantów odrzucone",
    () => stworz([PYTANIE], [[["flex"], ["a", "b", "c", "d", "e", "f"]]], "Luki — zly klucz 5"), "invalid_keys");
  await err("wariant dłuższy niż 100 znaków odrzucony",
    () => stworz([PYTANIE], [[["flex"], ["x".repeat(101)]]], "Luki — zly klucz 6"), "invalid_keys");
  await err("pusty wariant odrzucony",
    () => stworz([PYTANIE], [[["flex"], ["  "]]], "Luki — zly klucz 7"), "invalid_keys");

  const zero = (await jeden(`select count(*)::int n from tests where title like 'Luki — zly klucz%'`)).n;
  ok("żaden z odrzuconych testów nie wylądował w bazie", zero === 0, String(zero));
}

const nowy = (await jeden(
  `select create_test($1, 600, $2::jsonb, $3::jsonb) as t`,
  ["Luki w kodzie — CSS", JSON.stringify([PYTANIE]), JSON.stringify([KLUCZ])],
)).t;
ok("poprawny test z lukami zapisany", Boolean(nowy.id) && /^[0-9]{6}$/.test(nowy.pin));

console.log("\n== UCZEŃ NIE WIDZI KLUCZA ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"8.8.8.8"}',false);`);
  const otwarty = (await jeden(`select open_test($1::uuid, $2) as r`, [nowy.id, nowy.pin])).r;
  const pytanie = otwarty.questions[0];
  ok("po PIN-ie uczeń dostaje kod z markerami", pytanie.code === KOD);
  ok("obraz pytania nie zawiera odpowiedzi",
    JSON.stringify(pytanie).includes("[[1]]") && !JSON.stringify(pytanie).toLowerCase().includes("kolumna"));
  await err("klucz pozostaje niedostępny dla ucznia",
    () => db.query(`select answers from test_keys where test_id = $1::uuid`, [nowy.id]), "permission denied");
}

console.log("\n== OCENA ==");
const podejscie = async (imie, odpowiedz) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"8.8.8.8"}',false);`);
  const otwarty = (await jeden(`select open_test($1::uuid, $2) as r`, [nowy.id, nowy.pin])).r;
  await db.query(`select begin_session($1::uuid, $2)`, [otwarty.session_id, imie]);
  return (await jeden(`select submit_attempt($1::uuid, $2::jsonb) as r`, [
    otwarty.session_id, JSON.stringify([odpowiedz]),
  ])).r;
};
{
  ok("komplet poprawnych luk → punkt", (await podejscie("Ala", ["flex", "column"])).score === 1);
  ok("wariant z klucza też zalicza", (await podejscie("Bartek", ["flex", "kolumna"])).score === 1);
  ok("wielkość liter i spacje nie mają znaczenia",
    (await podejscie("Celina", ["  FLEX ", "Column"])).score === 1);
  ok("jedna luka źle → brak punktu (ocena zero-jedynkowa)",
    (await podejscie("Damian", ["flex", "row"])).score === 0);
  ok("brak odpowiedzi w luce → brak punktu",
    (await podejscie("Ewa", ["flex", null])).score === 0);
  ok("puste napisy → brak punktu", (await podejscie("Filip", ["", ""])).score === 0);
  ok("za krótka tablica odpowiedzi → brak punktu", (await podejscie("Gaja", ["flex"])).score === 0);
  ok("napis zamiast tablicy → brak punktu", (await podejscie("Hania", "flex")).score === 0);
  ok("zamienione luki nie zaliczają", (await podejscie("Igor", ["column", "flex"])).score === 0);
}

console.log("\n== ZAPIS DO ANALIZY PYTAŃ ==");
{
  await db.exec("reset role;");
  const ala = await jeden(`select answers, results from attempts where student_name = 'Ala'`);
  ok("odpowiedź zapisana jako tablica luk",
    Array.isArray(ala.answers?.[0]) && ala.answers[0][0] === "flex" && ala.answers[0][1] === "column",
    JSON.stringify(ala.answers));
  ok("results ma wpis dla pytania", Array.isArray(ala.results) && ala.results[0] === true);

  const ewa = await jeden(`select answers from attempts where student_name = 'Ewa'`);
  ok("brak odpowiedzi w luce zapisany jako null w tablicy",
    Array.isArray(ewa.answers?.[0]) && ewa.answers[0][1] === null, JSON.stringify(ewa.answers));

  const hania = await jeden(`select answers from attempts where student_name = 'Hania'`);
  ok("napis zamiast tablicy zapisany jako null", hania.answers?.[0] === null, JSON.stringify(hania.answers));

  // skuteczność pojedynczej luki — to właśnie pokazuje panel
  const luka1 = await jeden(
    `select count(*) filter (where lower(btrim(answers -> 0 ->> 0)) = 'flex')::int n, count(*)::int wszystkie
     from attempts where test_id = $1::uuid and answers is not null`,
    [nowy.id],
  );
  ok("da się policzyć skuteczność pierwszej luki", luka1.wszystkie === 9 && luka1.n === 6,
    JSON.stringify(luka1));
}

console.log("\n== STARE TYPY PYTAŃ DZIAŁAJĄ DALEJ ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
  const mix = (await jeden(`select create_test($1, 600, $2::jsonb, $3::jsonb) as t`, [
    "Mieszany z lukami",
    JSON.stringify([
      { type: "closed", text: "Ktory selektor wybiera klase?", options: [".box", "#box"] },
      { type: "input", text: "Podaj wlasciwosc odstepu wewnetrznego." },
      { type: "matching", text: "Dopasuj", left: ["display: flex", "position: absolute"], right: ["wyjecie", "kontener"] },
      PYTANIE,
    ]),
    JSON.stringify([[".box"], ["padding"], ["kontener", "wyjecie"], KLUCZ]),
  ])).t;
  ok("test z czterema typami pytań zapisany", Boolean(mix.id));

  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false); set role anon;
    select set_config('request.headers','{"x-forwarded-for":"8.8.8.9"}',false);`);
  const otwarty = (await jeden(`select open_test($1::uuid, $2) as r`, [mix.id, mix.pin])).r;
  await db.query(`select begin_session($1::uuid, $2)`, [otwarty.session_id, "Komplet"]);
  const wynik = (await jeden(`select submit_attempt($1::uuid, $2::jsonb) as r`, [
    otwarty.session_id,
    JSON.stringify([".box", "padding", ["kontener", "wyjecie"], ["flex", "column"]]),
  ])).r;
  ok("komplet poprawnych odpowiedzi to maksimum", wynik.score === 4 && wynik.total === 4,
    JSON.stringify(wynik));
  ok("results opisuje każde pytanie", wynik.results.length === 4 && wynik.results.every((r) => r === true));
}

console.log("\n== IDEMPOTENCJA ==");
{
  await db.exec("reset role;");
  const przed = (await jeden(`select count(*)::int n from tests`)).n;
  await db.exec(read("020_gaps_questions.sql"));
  const po = (await jeden(`select count(*)::int n from tests`)).n;
  ok("ponowne uruchomienie nie rusza danych", przed === po);
  ok("funkcja gaps_count dalej działa",
    (await jeden(`select gaps_count('[[1]] [[2]]') n`)).n === 2);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
