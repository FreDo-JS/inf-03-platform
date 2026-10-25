// Migracja 028 — komentarz do kryterium widoczny na stronie wyniku.
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

// zadanie z dwoma kryteriami, sesja i dwie prace: jedna opublikowana, druga nie
const [{ id: taskId }] = await q(
  `insert into practical_tasks (title, files, manual_criteria, is_ready)
   values ('Z komentarzami', '[]', '[{"id":"k1","name":"Układ","description":"d","points":5},{"id":"k2","name":"Kod","points":5}]', true) returning id`);
const [{ id: sessionId }] = await q(
  `insert into practical_sessions (task_id, class_name, pin, minutes, status) values ($1, '2a', '123456', 60, 'finished') returning id`, [taskId]);
const scores = JSON.stringify([{ id: "k1", points: 4, comment: "Ładny układ, ale brak odstępów w stopce." }, { id: "k2", points: 3 }]);
await q(`insert into practical_attempts (session_id, student_name, attempt_token_hash, result_token, manual_scores, published_at, final_percent)
         values ($1, 'Ola', 'h1', 'tok-opublikowana', $2::jsonb, now(), 70)`, [sessionId, scores]);
await q(`insert into practical_attempts (session_id, student_name, attempt_token_hash, result_token, manual_scores)
         values ($1, 'Jan', 'h2', 'tok-szkic', $2::jsonb)`, [sessionId, scores]);

const jakoUczen = () => db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
  select set_config('request.jwt.claim.sub','',false); set role anon;`);

console.log("== WYNIK UCZNIA ==");
await jakoUczen();
{
  const [{ r }] = await q(`select practical_result('tok-opublikowana') r`);
  const k1 = r.criteria.find((c) => c.id === "k1");
  const k2 = r.criteria.find((c) => c.id === "k2");
  ok("uczeń widzi komentarz do kryterium po publikacji", k1.comment === "Ładny układ, ale brak odstępów w stopce.", JSON.stringify(k1));
  ok("kryterium bez komentarza dostaje pusty napis", k2.comment === "");
  ok("punkty kryteriów działają jak dotąd", k1.points === 4 && k2.points === 3 && k1.max_points === 5);
  ok("pozostałe pola wyniku są na miejscu", r.published === true && r.final_percent === 70 && Array.isArray(r.tests) && Array.isArray(r.files));
}
{
  const [{ r }] = await q(`select practical_result('tok-szkic') r`);
  ok("praca nieopublikowana nie ujawnia komentarzy ani kryteriów", r.published === false && r.criteria === undefined && !JSON.stringify(r).includes("Ładny"));
}
{
  let blad = "";
  try { await q(`select practical_result('nie-ma-takiego')`); } catch (e) { blad = e.message; }
  ok("nieznany token nadal daje result_not_found", blad.includes("result_not_found"), blad);
}
{
  let odmowa = false;
  try { await q(`select 1 from practical_attempts`); } catch { odmowa = true; }
  const widzi = odmowa ? 0 : (await q(`select 1 from practical_attempts`)).length;
  ok("uczeń nadal nie czyta tabeli prac bezpośrednio", widzi === 0);
}

console.log("\n== POWTARZALNOŚĆ ==");
await db.exec("reset role;");
await db.exec(read("028_praktyka_komentarze.sql"));
await jakoUczen();
{
  const [{ r }] = await q(`select practical_result('tok-opublikowana') r`);
  ok("po ponownym uruchomieniu migracji wynik jest taki sam", r.criteria[0].comment.startsWith("Ładny"));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
