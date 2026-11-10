// Generator migracji z teorią do podtematów mapy nauki.
//
// Źródło: scripts/teoria/<dział>/<id-podtematu>.md — jeden plik Markdown na podtemat,
// nazwa pliku = identyfikator podtematu z tabeli subtopics.
//
//   node scripts/teoria/generuj.mjs podstawy 034
//     → supabase/034_teoria_podstawy.sql
//
// Wstawiamy z `on conflict do nothing`: jeśli nauczyciel poprawił notatkę w panelu,
// ponowne uruchomienie migracji jej nie nadpisze. Podtemat, którego nie ma w bazie,
// jest pomijany (nie wywraca migracji).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const [dzial, numer] = process.argv.slice(2);
if (!dzial || !/^\d{3}$/.test(numer ?? "")) {
  console.error("Użycie: node scripts/teoria/generuj.mjs <dział> <numer migracji, np. 034>");
  process.exit(1);
}

const katalog = join(here, dzial);
const pliki = readdirSync(katalog).filter((f) => f.endsWith(".md")).sort();
if (pliki.length === 0) throw new Error(`Brak plików .md w ${katalog}`);

/** Cudzysłów dolarowy z etykietą, której nie ma w treści. */
function dq(tekst) {
  let n = 0;
  let tag;
  do tag = `$t${n++}$`;
  while (tekst.includes(tag));
  return `${tag}${tekst}${tag}`;
}

const wiersze = pliki.map((f) => {
  const id = f.replace(/\.md$/, "");
  if (!/^[a-z0-9-]{1,64}$/.test(id)) throw new Error(`Zła nazwa pliku (id podtematu): ${f}`);
  const tresc = readFileSync(join(katalog, f), "utf8").replace(/\r\n/g, "\n").trim();
  if (tresc.length === 0 || tresc.length > 20000) throw new Error(`${f}: treść musi mieć 1–20000 znaków (ma ${tresc.length})`);
  return { id, tresc };
});

const sql = `-- =============================================================================
-- ${numer}_teoria_${dzial}.sql — teoria do podtematów działu „${dzial}"
--
-- Uruchom po 033_subtopic_notes.sql.
--
-- PLIK GENEROWANY: źródła w scripts/teoria/${dzial}/*.md, generator
-- scripts/teoria/generuj.mjs. Poprawiasz treść w pliku .md i generujesz od nowa.
-- Istniejących notatek nie nadpisuje (on conflict do nothing).
--
${wiersze.map((w) => `--   ${w.id}`).join("\n")}
-- =============================================================================

do $$
begin
  if to_regclass('public.subtopic_notes') is null then
    raise exception 'Brakuje migracji 033_subtopic_notes.sql — uruchom ją przed ${numer}.';
  end if;
end $$;

insert into subtopic_notes (subtopic_id, content_md)
select n.id, n.tresc
from (values
${wiersze.map((w) => `  (${dq(w.id)}, ${dq(w.tresc)})`).join(",\n")}
) as n(id, tresc)
join subtopics s on s.id = n.id
on conflict (subtopic_id) do nothing;
`;

const cel = join(repo, "supabase", `${numer}_teoria_${dzial}.sql`);
writeFileSync(cel, sql, "utf8");
console.log(`${numer}_teoria_${dzial}.sql: ${wiersze.length} notatek`);
