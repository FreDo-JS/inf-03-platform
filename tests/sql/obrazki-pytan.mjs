// Migracja 032 — obrazek jako ilustracja pytania (closed i input).
//
// Sprawdzamy, że baza przyjmuje tylko osadzony obraz rastrowy we właściwych
// typach pytań, trzyma limity, nie zdradza obrazka przed PIN-em i nie wpływa
// na ocenę. Pozostałe typy (w tym multi z 031) mają działać jak dotąd.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");
const ADMIN = "11111111-1111-1111-1111-111111111111";

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
await db.exec(`insert into auth.users values ('${ADMIN}', 'n@szkola.pl', now());
  insert into admins(user_id) values ('${ADMIN}') on conflict do nothing;`);

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const jakoNauczyciel = () => db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
  select set_config('request.jwt.claim.sub','${ADMIN}',false); set role authenticated;`);
const jakoUczen = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
  select set_config('request.jwt.claim.sub','',false); select set_config('request.headers','{"x-forwarded-for":"5.5.5.5"}',false); set role anon;`);

// mały prawdziwy PNG 1×1
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const valid = async (questions) => (await q(`select public.questions_valid($1::jsonb) v`, [JSON.stringify(questions)]))[0].v;
const closed = (extra) => ({ type: "closed", text: "Co widać?", options: ["A", "B"], ...extra });

console.log("== WALIDACJA OBRAZKA ==");
ok("pytanie jednokrotnego wyboru z obrazkiem i opisem", await valid([closed({ image: PNG, alt: "Kwadrat" })]));
ok("pytanie z polem tekstowym z obrazkiem", await valid([{ type: "input", text: "Jaki kolor?", image: PNG }]));
ok("pytanie bez obrazka jak dotąd", await valid([closed({})]));
ok("image: null traktowane jak brak", await valid([closed({ image: null })]));
for (const t of ["jpeg", "webp", "gif"]) {
  ok(`format ${t} przyjęty`, await valid([closed({ image: PNG.replace("image/png", `image/${t}`) })]));
}
ok("SVG odrzucone (dokument, może mieć skrypty)", !(await valid([closed({ image: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" })])));
ok("adres zewnętrzny odrzucony", !(await valid([closed({ image: "https://zly.example/obraz.png" })])));
ok("javascript: odrzucone", !(await valid([closed({ image: "javascript:alert(1)" })])));
ok("data URI z wstrzyknięciem po base64 odrzucone", !(await valid([closed({ image: PNG + '"><script>' })])));
ok("obrazek nie-napis odrzucony", !(await valid([closed({ image: 123 })])));
ok("obrazek przy wielokrotnym wyborze odrzucony (tylko closed i input)",
  !(await valid([{ type: "multi", text: "x", options: ["a", "b", "c"], image: PNG }])));
ok("obrazek przy dopasowywaniu odrzucony",
  !(await valid([{ type: "matching", text: "x", left: ["a", "b"], right: ["c", "d"], image: PNG }])));
ok("za długi opis odrzucony", !(await valid([closed({ image: PNG, alt: "x".repeat(201) })])));
const duzy = "data:image/png;base64," + "A".repeat(600001);
ok("obrazek ponad 600 tys. znaków odrzucony", !(await valid([closed({ image: duzy })])));
const sredni = "data:image/png;base64," + "A".repeat(590000);
ok("cały test ponad ~4 MB odrzucony",
  !(await valid(Array.from({ length: 8 }, () => closed({ image: sredni })))));
ok("kilka obrazków w limicie przechodzi", await valid(Array.from({ length: 5 }, () => closed({ image: sredni }))));

console.log("\n== TEST Z OBRAZKAMI: ZAPIS, PIN, OCENA ==");
await jakoNauczyciel();
const pytania = [
  closed({ image: PNG, alt: "Kwadrat" }),
  { type: "input", text: "Jaki kolor?", image: PNG },
  { type: "multi", text: "Które?", options: ["a", "b", "c"] },
];
const [{ r }] = await q(`select create_test('Z obrazkami', 300, $1::jsonb, $2::jsonb, '246810') r`,
  [JSON.stringify(pytania), JSON.stringify([["A"], ["czerwony"], ["a", "c"]])]);
ok("create_test zapisuje test z obrazkami", typeof r.id === "string");

await jakoUczen();
let widziPrzedPinem = true;
try { widziPrzedPinem = JSON.stringify(await q(`select questions from tests where id = $1`, [r.id])).includes("base64"); }
catch { widziPrzedPinem = false; }
ok("przed PIN-em uczeń nie dostaje obrazka (kolumna questions zamknięta)", !widziPrzedPinem);

const [{ o }] = await q(`select open_test($1, '246810') o`, [r.id]);
ok("po PIN-ie obrazek i opis przychodzą z pytaniem", o.ok === true && o.questions[0].image === PNG && o.questions[0].alt === "Kwadrat");
await q(`select begin_session($1, 'Ola')`, [o.session_id]);
const [{ s }] = await q(`select submit_attempt($1, $2::jsonb, 'completed', 0) s`,
  [o.session_id, JSON.stringify(["A", "Czerwony", ["c", "a"]])]);
ok("obrazek nie wpływa na ocenę — komplet poprawnych to 3/3", s.score === 3 && s.total === 3, JSON.stringify(s));

console.log("\n== POWTARZALNOŚĆ I KOLEJNOŚĆ ==");
await db.exec("reset role;");
await db.exec(read("032_question_images.sql"));
ok("ponowne uruchomienie nic nie psuje", await valid([closed({ image: PNG })]));
{
  const stara = new PGlite();
  await stara.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.role() returns text language sql stable as $$ select 'anon' $$;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create publication supabase_realtime;
  `);
  const bez = numerowane.filter((f) => f < "031");
  for (const f of ["schema.sql", bez[0], "seed.sql", ...bez.slice(1)]) {
    await stara.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
  }
  let komunikat = "";
  try { await stara.exec(read("032_question_images.sql")); } catch (e) { komunikat = e.message; }
  ok("032 bez 031 mówi, której migracji brakuje", komunikat.includes("031_multi_questions"), komunikat);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
