// Gotowe testy z katalogu supabase/testy/ — sprawdzenie treści, nie schematu.
//
// Pliki te wstawiają wiersze wprost do tests i test_keys (create_test odmawia
// w SQL Editorze, bo tam nie ma zalogowanego admina). Omijają więc walidację
// kluczy, którą robi create_test — dlatego powtarzamy ją tutaj, a na koniec
// przechodzimy każdy test jako uczeń i sprawdzamy, czy komplet poprawnych
// odpowiedzi daje maksimum punktów. Literówka w kluczu wyjdzie od razu.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key);
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
  insert into auth.users values ('11111111-1111-1111-1111-111111111111');
`);
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
                 "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
                 "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
                 "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
                 "013_progress_author_fix.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};

const files = readdirSync(root + "testy").filter((f) => f.endsWith(".sql")).sort();
if (files.length === 0) {
  console.log("Brak plików w supabase/testy — nie ma czego sprawdzać.");
  process.exit(0);
}

for (const file of files) {
  console.log(`\n== ${file} ==`);
  try {
    await db.exec(readFileSync(join(root, "testy", file), "utf8"));
  } catch (e) {
    fail++; console.log("  FAIL  plik nie wykonał się →", e.message.slice(0, 160));
    continue;
  }

  const row = (
    await db.query(
      `select t.id, t.title, t.question_count, t.time_limit, t.qualification, t.questions, k.answers, k.pin
       from tests t join test_keys k on k.test_id = t.id
       order by t.created_at desc limit 1`,
    )
  ).rows[0];

  const questions = row.questions;
  const keys = row.answers;
  ok(`wstawiony: „${row.title}” (${row.question_count} pyt., ${row.time_limit / 60} min)`, row.question_count > 0);
  ok("liczba kluczy zgadza się z liczbą pytań", keys.length === questions.length, `${keys.length} vs ${questions.length}`);
  ok("PIN ma sześć cyfr", /^[0-9]{6}$/.test(row.pin), row.pin);

  // reguły kluczy przepisane z create_test
  let bledy = [];
  questions.forEach((q, i) => {
    const k = keys[i];
    const gdzie = `pyt. ${i + 1}`;
    if (!Array.isArray(k)) return bledy.push(`${gdzie}: klucz nie jest tablicą`);
    if (q.type === "matching") {
      if (k.length !== q.left.length) bledy.push(`${gdzie}: klucz ma ${k.length} pozycji, lewa kolumna ${q.left.length}`);
      const pozostale = [...q.right];
      for (const v of k) {
        const idx = pozostale.findIndex((r) => r.trim() === String(v).trim());
        if (idx === -1) bledy.push(`${gdzie}: „${v}” nie występuje w prawej kolumnie`);
        else pozostale.splice(idx, 1);
      }
    } else if (q.type === "closed" || q.type === "select") {
      if (k.length !== 1) bledy.push(`${gdzie}: pytanie zamknięte musi mieć dokładnie jeden klucz`);
      else if (!q.options.includes(k[0])) bledy.push(`${gdzie}: „${k[0]}” nie jest żadną z opcji`);
    } else {
      if (k.length < 1 || k.length > 10) bledy.push(`${gdzie}: input musi mieć 1–10 akceptowanych odpowiedzi`);
    }
  });
  ok("klucze spełniają reguły create_test", bledy.length === 0, bledy.slice(0, 3).join(" | "));

  // Rozkład poprawnych odpowiedzi. Pierwsza wersja testów miała 107 na 107
  // poprawnych odpowiedzi na pozycji A — uczeń zauważa taki wzorzec po trzech
  // pytaniach i dalej zgaduje. Pilnujemy, żeby żadna pozycja nie dominowała.
  {
    const pozycje = [];
    questions.forEach((q, i) => {
      if (q.type !== "closed" && q.type !== "select") return;
      pozycje.push(q.options.indexOf(keys[i][0]));
    });
    const licznik = pozycje.reduce((m, x) => ({ ...m, [x]: (m[x] ?? 0) + 1 }), {});
    const najczestsza = Math.max(...Object.values(licznik));
    const udzial = najczestsza / pozycje.length;
    const opis = Object.entries(licznik)
      .sort()
      .map(([i, n]) => `${"ABCDEFGH"[i]}:${n}`)
      .join(" ");
    ok(`rozkład poprawnych odpowiedzi jest wyrównany (${opis})`, udzial <= 0.4,
      `${Math.round(udzial * 100)}% odpowiedzi stoi na jednej pozycji`);
    ok("odpowiedzi nie stoją wszystkie w tym samym miejscu", Object.keys(licznik).length >= 3);
  }

  const typy = questions.reduce((m, q) => ({ ...m, [q.type]: (m[q.type] ?? 0) + 1 }), {});
  console.log("        typy pytań:", JSON.stringify(typy));
  ok("są co najmniej trzy typy pytań", Object.keys(typy).length >= 3, JSON.stringify(typy));

  // przejście ucznia: PIN → pytania → komplet poprawnych odpowiedzi
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
    select set_config('request.jwt.claim.sub','',false);
    select set_config('request.headers','{"x-real-ip":"10.0.0.9"}',false); set role anon;`);

  const opened = (await db.query(`select open_test($1::uuid, $2) r`, [row.id, row.pin])).rows[0].r;
  ok("uczeń otwiera test PIN-em", opened.ok === true, JSON.stringify(opened).slice(0, 80));
  if (opened.ok) {
    ok("uczeń nie dostaje kluczy w pytaniach",
      !JSON.stringify(opened.questions).includes('"answers"') &&
        opened.questions.every((q) => !("key" in q)));

    await db.query(`select begin_session($1::uuid, 'Kontrola')`, [opened.session_id]);
    const odpowiedzi = questions.map((q, i) => (q.type === "matching" ? keys[i] : keys[i][0]));
    const wynik = (
      await db.query(`select submit_attempt($1::uuid, $2::jsonb) r`, [opened.session_id, JSON.stringify(odpowiedzi)])
    ).rows[0].r;
    ok(`komplet poprawnych odpowiedzi daje maksimum (${wynik.score}/${wynik.total})`, wynik.score === wynik.total,
      (wynik.results ?? []).map((v, i) => (v ? null : `pyt. ${i + 1}`)).filter(Boolean).join(", "));
  }
  await db.exec("reset role;");
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
