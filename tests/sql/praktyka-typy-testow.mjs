// Migracja 026 — nowe typy testów automatycznych modułu Praktyka.
//
// Baza zna listę typów, a aplikacja ma własną (AUTO_TEST_TYPES w types/practical.ts).
// Gdy się rozjadą, nauczyciel dostaje błąd dopiero przy zapisie zadania — dlatego
// ten zestaw porównuje obie listy i próbuje zapisać zadanie z każdym typem.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "supabase") + "/";
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
const poprawny = async (tests) =>
  (await db.query(`select public.practical_tests_valid($1::jsonb) v`, [JSON.stringify(tests)])).rows[0].v;

console.log("== LISTA TYPÓW ==");
const ts = readFileSync(join(here, "..", "..", "types", "practical.ts"), "utf8");
const lista = ts.match(/AUTO_TEST_TYPES = \[([\s\S]*?)\] as const;/);
const typy = [...(lista?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
ok("znaleziono AUTO_TEST_TYPES w types/practical.ts", typy.length >= 14, typy.join());
for (const t of typy) {
  ok(`baza przyjmuje typ ${t}`, await poprawny([{ id: "t1", name: "x", points: 1, type: t }]));
}
ok("baza nie przyjmuje nieznanego typu", !(await poprawny([{ id: "t1", name: "x", points: 1, type: "rm_rf" }])));
ok("  …ani typów z etapu PHP/SQL", !(await poprawny([{ id: "t1", name: "x", points: 1, type: "php_output" }])));
ok("nadal odrzuca powtórzone identyfikatory",
  !(await poprawny([{ id: "a", name: "x", points: 1, type: "images_alt" }, { id: "a", name: "y", points: 1, type: "css_media" }])));
ok("nadal odrzuca punkty spoza 0–100", !(await poprawny([{ id: "a", name: "x", points: 101, type: "images_alt" }])));

console.log("\n== ZAPIS ZADANIA ==");
{
  await db.exec(`insert into admins(user_id) select id from auth.users on conflict do nothing`);
  const testy = typy.map((t, i) => ({ id: `t${i}`, name: `Test ${t}`, points: 1, type: t }));
  await db.query(
    `insert into practical_tasks (title, files, auto_tests) values ('Wszystkie typy', '[]'::jsonb, $1::jsonb)`,
    [JSON.stringify(testy)],
  );
  ok("zadanie z każdym typem testu zapisuje się do bazy",
    (await db.query(`select count(*)::int n from practical_tasks where title='Wszystkie typy'`)).rows[0].n === 1);
  let odrzucone = false;
  try {
    await db.query(`insert into practical_tasks (title, auto_tests) values ('Zły', '[{"id":"a","name":"x","points":1,"type":"zly"}]'::jsonb)`);
  } catch { odrzucone = true; }
  ok("zadanie z nieznanym typem odrzuca CHECK", odrzucone);
}

console.log("\n== IDEMPOTENCJA ==");
await db.exec(read("026_praktyka_typy_testow.sql"));
ok("ponowne uruchomienie nie psuje istniejących zadań",
  (await db.query(`select count(*)::int n from practical_tasks where title='Wszystkie typy'`)).rows[0].n === 1);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
