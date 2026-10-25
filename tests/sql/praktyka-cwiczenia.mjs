// Migracja 029 — tryb ćwiczeniowy: uczeń czyta wyłącznie zadania oznaczone do ćwiczeń
// i nigdy nie dostaje rozwiązania wzorcowego.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
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
`);
const numerowane = readdirSync(root).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
for (const f of ["schema.sql", numerowane[0], "seed.sql", ...numerowane.slice(1)]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const jakoUczen = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
  select set_config('request.jwt.claim.sub','',false); set role anon;`);
const jakoWlasciciel = () => db.exec("reset role;");

console.log("== DOMYŚLNIE NIC NIE JEST PUBLICZNE ==");
{
  const [{ n }] = await q(`select count(*)::int n from practical_tasks where practice`);
  ok("po migracji żadne zadanie nie jest oznaczone do ćwiczeń", n === 0, String(n));
  await jakoUczen();
  const [{ l }] = await q(`select practical_practice_list() l`);
  ok("lista ćwiczeń jest pusta", Array.isArray(l) && l.length === 0, JSON.stringify(l));
}

console.log("\n== ZADANIE OZNACZONE DO ĆWICZEŃ ==");
await jakoWlasciciel();
const wzor = JSON.stringify([{ name: "index.html", content: "<!-- ROZWIAZANIE WZORCOWE-TAJNE -->" }]);
const [{ id: gotowe }] = await q(
  `insert into practical_tasks (title, summary, content_md, files, reference_files, auto_tests, manual_criteria, is_ready, practice)
   values ('Do ćwiczeń', 'opis', '## arkusz', '[{"name":"index.html","content":"<h1></h1>"}]', $1::jsonb,
           '[{"id":"t1","name":"Nagłówek","points":2,"type":"selector_count","page":"index.html","selector":"h1","min":1}]',
           '[{"id":"k1","name":"Wygląd","description":"ocena nauczyciela","points":5}]', true, true) returning id`, [wzor]);
const [{ id: szkic }] = await q(
  `insert into practical_tasks (title, reference_files, is_ready, practice) values ('Szkic', $1::jsonb, false, true) returning id`, [wzor]);
const [{ id: egzamin }] = await q(
  `insert into practical_tasks (title, reference_files, is_ready, practice) values ('Tylko egzamin', $1::jsonb, true, false) returning id`, [wzor]);

await jakoUczen();
{
  const [{ l }] = await q(`select practical_practice_list() l`);
  ok("lista zawiera tylko gotowe zadanie z flagą ćwiczeń", l.length === 1 && l[0].id === gotowe, JSON.stringify(l));
  ok("lista podaje liczbę testów i punkty", l[0].tests === 1 && Number(l[0].points) === 2);

  const [{ t }] = await q(`select practical_practice_task($1) t`, [gotowe]);
  ok("uczeń dostaje arkusz, pliki startowe i definicje testów",
    t.content_md === "## arkusz" && t.files.length === 1 && t.auto_tests[0].selector === "h1");
  ok("uczeń dostaje nazwy i punkty kryteriów ręcznych", t.criteria.length === 1 && t.criteria[0].name === "Wygląd" && Number(t.criteria[0].points) === 5);
  ok("rozwiązanie wzorcowe NIGDY nie wychodzi do ucznia",
    t.reference_files === undefined && !JSON.stringify(t).includes("TAJNE"), JSON.stringify(Object.keys(t)));
  ok("odpowiedź nie zawiera pól wewnętrznych (autor, daty, sesje)",
    t.created_by === undefined && t.created_at === undefined && t.is_ready === undefined);

  for (const [opis, id] of [["szkic", szkic], ["zadanie bez flagi ćwiczeń", egzamin], ["nieistniejące", "00000000-0000-0000-0000-000000000000"]]) {
    let blad = "";
    try { await q(`select practical_practice_task($1)`, [id]); } catch (e) { blad = e.message; }
    ok(`${opis}: odmowa task_not_found`, blad.includes("task_not_found"), blad);
  }
}

console.log("\n== TABELA NADAL ZAMKNIĘTA ==");
{
  let czyta = true;
  try { czyta = (await q(`select 1 from practical_tasks`)).length > 0; } catch { czyta = false; }
  ok("uczeń nie czyta tabeli practical_tasks bezpośrednio", czyta === false);
  let zmienia = true; void zmienia;
  try { await q(`update practical_tasks set practice = true`); zmienia = (await q(`select 1`)).length > 0; } catch { zmienia = false; }
  await jakoWlasciciel();
  ok("uczeń nie włączy ćwiczeń przez API", (await q(`select count(*)::int n from practical_tasks where title='Tylko egzamin' and practice`))[0].n === 0);
}

console.log("\n== NAUCZYCIEL I POWTARZALNOŚĆ ==");
{
  await db.exec(`insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'szef@szkola.pl', now()) on conflict do nothing;
    insert into admins(user_id) values ('11111111-1111-1111-1111-111111111111') on conflict do nothing;`);
  await db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false); set role authenticated;`);
  const zmieniono = await q(`update practical_tasks set practice = true where title = 'Tylko egzamin' returning 1`);
  ok("nauczyciel włącza ćwiczenia przy zadaniu", zmieniono.length === 1);
  await jakoWlasciciel();
  await db.exec(read("029_praktyka_cwiczenia.sql"));
  ok("ponowne uruchomienie nie zeruje flag", (await q(`select count(*)::int n from practical_tasks where practice`))[0].n === 3);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
