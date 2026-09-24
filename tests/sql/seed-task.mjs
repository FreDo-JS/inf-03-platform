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
  create table auth.users (id uuid primary key);
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
for (const f of ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql", "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql", "007_practical_seed.sql", "007_practical_seed.sql", "008_security_hardening.sql"]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = async (label, sql, check) => {
  try {
    const r = await db.query(sql);
    if (check && !check(r.rows)) throw new Error("check: " + JSON.stringify(r.rows).slice(0, 200));
    pass++; console.log("  ok   ", label); return r.rows;
  } catch (e) { fail++; console.log("  FAIL ", label, "→", e.message); return []; }
};

await ok("zadanie dodane raz, gotowe do użycia",
  `select title, is_ready, jsonb_array_length(auto_tests) t, jsonb_array_length(manual_criteria) c,
          jsonb_array_length(files) f, jsonb_array_length(reference_files) r, count(*) over () n
   from practical_tasks where title like 'Rowerownia%'`,
  (r) => r.length === 1 && r[0].is_ready === true && r[0].t === 11 && r[0].c === 2 && r[0].f === 3 && r[0].r === 3);

await ok("punktacja: 35 automatycznie + 10 ręcznie",
  `select (select sum((t->>'points')::numeric) from practical_tasks pt, jsonb_array_elements(pt.auto_tests) t where pt.title like 'Rowerownia%') a,
          (select sum((c->>'points')::numeric) from practical_tasks pt, jsonb_array_elements(pt.manual_criteria) c where pt.title like 'Rowerownia%') m`,
  (r) => Number(r[0].a) === 35 && Number(r[0].m) === 10);

await ok("pliki startowe są puste w miejscach do uzupełnienia",
  `select f->>'name' name, length(f->>'content') len from practical_tasks pt, jsonb_array_elements(pt.files) f
   where pt.title like 'Rowerownia%' order by 1`,
  (r) => r.length === 3 && r.every((x) => x.len < 400));

// Rozwiązanie wzorcowe i testy muszą dać się odczytać (sprawdzenie „na wzorcu"
// uruchamia je potem w przeglądarce nauczyciela).
await ok(
  "rozwiązanie wzorcowe i testy dają się odczytać z bazy",
  `select jsonb_array_length(reference_files) r, jsonb_array_length(auto_tests) t
   from practical_tasks where title like 'Rowerownia%'`,
  (r) => r[0].r === 3 && r[0].t === 11,
);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
