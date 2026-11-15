// Migracje 033 i kolejne *_teoria_*.sql — teoria przy podtematach mapy nauki.
import { PGlite } from "@electric-sql/pglite";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const root = join(repo, "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");
const ADMIN = "11111111-1111-1111-1111-111111111111";
const OBCY = "22222222-2222-2222-2222-222222222222";

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};

// Pliki z teorią i działy, z których powstały (pierwsza linia: „-- generuj: <działy> <numer>”)
const plikiTeorii = readdirSync(root).filter((f) => /^\d{3}_teoria_.*\.sql$/.test(f)).sort();
const zrodla = plikiTeorii.map((f) => {
  const m = read(f).match(/^-- generuj: (\S+) (\d{3})/);
  return { plik: f, dzialy: m ? m[1].split(",") : [], numer: m?.[2] };
});

console.log("== PLIKI SQL SĄ ŚWIEŻE ==");
{
  const norm = (s) => s.replace(/\r\n/g, "\n");
  ok("są pliki z teorią i każdy pamięta, z czego powstał", zrodla.length >= 2 && zrodla.every((z) => z.numer && z.dzialy.length > 0),
    JSON.stringify(zrodla.map((z) => z.plik)));
  for (const z of zrodla) {
    const przed = norm(read(z.plik));
    execFileSync(process.execPath, [join(repo, "scripts", "teoria", "generuj.mjs"), z.dzialy.join(","), z.numer], { stdio: "pipe" });
    ok(`${z.plik} odpowiada scripts/teoria/{${z.dzialy.join(",")}}`, przed === norm(read(z.plik)));
  }
}

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
await db.exec(`insert into auth.users values ('${ADMIN}', 'n@szkola.pl', now()), ('${OBCY}', 'x@internet.pl', now());
  insert into admins(user_id) values ('${ADMIN}') on conflict do nothing;`);
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const jako = (kto) => db.exec(kto === "anon"
  ? `reset role; select set_config('request.jwt.claim.role','anon',false); select set_config('request.jwt.claim.sub','',false); set role anon;`
  : `reset role; select set_config('request.jwt.claim.role','authenticated',false); select set_config('request.jwt.claim.sub','${kto}',false); set role authenticated;`);

console.log("\n== TREŚĆ DZIAŁÓW ==");
// kod w blokach i w `…` jest wyświetlany jako tekst — surowego HTML-a szukamy tylko poza nim
const bezKodu = (md) => md.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
for (const dzial of [...new Set(zrodla.flatMap((z) => z.dzialy))]) {
  const podt = await q(`select s.id, n.content_md from subtopics s left join subtopic_notes n on n.subtopic_id = s.id
                        where s.category_id = $1 order by s.position`, [dzial]);
  ok(`${dzial}: każdy z ${podt.length} podtematów ma teorię`, podt.length > 0 && podt.every((p) => p.content_md),
    podt.filter((p) => !p.content_md).map((p) => p.id).join());
  ok(`${dzial}: układ „W skrócie” … „Sprawdź się” z odpowiedziami`,
    podt.every((p) => p.content_md?.startsWith("**W skrócie:**") && p.content_md.includes("## Na egzaminie")
      && p.content_md.includes("## Sprawdź się") && p.content_md.includes("**Odpowiedzi:**")),
    podt.filter((p) => !p.content_md?.includes("## Na egzaminie")).map((p) => p.id).join());
  ok(`${dzial}: bez surowego HTML-a poza blokami kodu`,
    podt.every((p) => !/<\/?[a-z][a-z0-9]*[\s>\/]/i.test(bezKodu(p.content_md ?? ""))),
    podt.filter((p) => /<\/?[a-z][a-z0-9]*[\s>\/]/i.test(bezKodu(p.content_md ?? ""))).map((p) => p.id).join());
}
{
  const [{ n }] = await q(`select count(*)::int n from subtopic_notes n left join subtopics s on s.id = n.subtopic_id where s.id is null`);
  ok("każda notatka należy do istniejącego podtematu", n === 0);
}

console.log("\n== UPRAWNIENIA ==");
await jako("anon");
ok("uczeń czyta teorię", (await q(`select 1 from subtopic_notes where subtopic_id = 'pod-liczby'`)).length === 1);
for (const [opis, sql] of [
  ["dopisać", `insert into subtopic_notes (subtopic_id, content_md) values ('html-struktura', 'x')`],
  ["zmienić", `update subtopic_notes set content_md = 'zhakowane' returning 1`],
  ["skasować", `delete from subtopic_notes returning 1`],
]) {
  let ile = 0;
  try { ile = (await q(sql)).length; } catch { ile = 0; }
  ok(`uczeń nie może ${opis} teorii`, ile === 0);
}
await jako(OBCY);
{
  let ile = 0;
  try { ile = (await q(`update subtopic_notes set content_md = 'x' returning 1`)).length; } catch { ile = 0; }
  ok("zalogowany bez uprawnień nauczyciela nie zmieni teorii", ile === 0);
}
await jako(ADMIN);
ok("nauczyciel poprawia teorię", (await q(`update subtopic_notes set content_md = 'Poprawione przez nauczyciela' where subtopic_id = 'pod-sprzet' returning 1`)).length === 1);
ok("nauczyciel dopisuje teorię do innego podtematu",
  (await q(`insert into subtopic_notes (subtopic_id, content_md) values ('html-struktura', '**W skrócie:** HTML…') returning 1`)).length === 1);
let pusta = false;
try { await q(`insert into subtopic_notes (subtopic_id, content_md) values ('css-uklad', '   ')`); } catch { pusta = true; }
ok("pusta notatka odrzucona", pusta);

console.log("\n== POWTARZALNOŚĆ I KASKADA ==");
await db.exec("reset role;");
await db.exec(read("033_subtopic_notes.sql"));
for (const z of zrodla) await db.exec(read(z.plik));
ok("ponowne uruchomienie nie nadpisuje poprawki nauczyciela",
  (await q(`select content_md from subtopic_notes where subtopic_id = 'pod-sprzet'`))[0].content_md === "Poprawione przez nauczyciela");
await db.exec(`delete from subtopics where id = 'pod-normy'`);
ok("usunięcie podtematu usuwa jego teorię", (await q(`select 1 from subtopic_notes where subtopic_id = 'pod-normy'`)).length === 0);
await db.exec(read("034_teoria_podstawy.sql"));
ok("teoria do nieistniejącego podtematu jest pomijana, migracja nie pada", (await q(`select 1 from subtopic_notes where subtopic_id = 'pod-normy'`)).length === 0);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
