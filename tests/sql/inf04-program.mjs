// Migracje 023 i 024 — mapa INF.04 doprowadzona do programu nauczania
// (wersja 2022, wariant ze sztuczną inteligencją).
//
// 023 domyka braki w istniejących działach, 024 dokłada przedmiot
// specjalizacyjny. Testujemy to, co przy danych może pójść źle: kolizje
// pozycji, zgubione działy, ponowne uruchomienie — plus kilka asercji
// na samą treść, żeby braki wypisane w analizie faktycznie zniknęły.
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
const WCZESNIEJ = ["schema.sql", "002_test_pin.sql", "seed.sql", "003_subtopic_links.sql",
  "004_matching_questions.sql", "005_tab_switch.sql", "006_practical.sql",
  "007_practical_seed.sql", "008_security_hardening.sql", "009_server_clock.sql",
  "010_inf04.sql", "011_inf04_seed.sql", "012_progress_author.sql",
  "013_progress_author_fix.sql", "014_progress_log.sql", "015_admin_invites.sql",
  "016_cpp_grafika_java.sql", "017_praktyka_todo_kalkulator.sql",
  "018_attempt_answers.sql", "019_klasy_1a_3a.sql", "020_gaps_questions.sql",
  "021_inf03_program_nauczania.sql", "022_przedmioty_nauczyciele.sql"];
for (const f of WCZESNIEJ) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const wiersze = async (sql, params = []) => (await db.query(sql, params)).rows;
const jeden = async (sql, params = []) => (await wiersze(sql, params))[0];
const ile = async (cat) => (await jeden(`select count(*)::int n from subtopics where category_id = $1`, [cat])).n;

// stan sprzed migracji + dane, które nauczyciel mógł dorobić sam
const przedKategorie = (await jeden(`select count(*)::int n from categories where qualification = 'inf04'`)).n;
const przedPodtematy = (await jeden(`select count(*)::int n from subtopics`)).n;
const przedOop = await ile("inf04-oop");
const przedTest = await ile("inf04-testowanie");
await db.exec(`
  insert into subtopics (id, category_id, position, title)
  values ('wlasny-inf04', 'inf04-oop', 50, 'Wlasny temat nauczyciela');
  insert into progress (class_name, subtopic_id) values ('4a', 'wlasny-inf04');
`);

await db.exec(read("023_inf04_braki.sql"));
await db.exec(read("024_inf04_ai.sql"));

console.log("== BRAKI Z PODSTAWY DOMKNIĘTE (023) ==");
{
  const tytul = async (id) => (await jeden(`select title, category_id from subtopics where id = $1`, [id]));

  ok("wyjątki trafiły do ścieżki C#, nie tylko do C++ i Javy",
    (await tytul("inf04-wyjatki"))?.category_id === "inf04-oop");
  ok("metody wirtualne i klasy abstrakcyjne w dziale obiektowym",
    (await tytul("inf04-wirtualne"))?.category_id === "inf04-oop");
  ok("szablony klas i składniki statyczne są",
    (await tytul("inf04-szablony")) !== undefined && (await tytul("inf04-statyczne")) !== undefined);

  ok("wzorce projektowe w projektowaniu oprogramowania",
    (await tytul("inf04-wzorce"))?.category_id === "inf04-projektowanie");
  ok("narzędzia zarządzania projektem (Jira, Trello, Gantt)",
    /Jira|Trello|Gantt/.test((await tytul("inf04-narzedzia"))?.title ?? ""));
  ok("prawo autorskie i licencje po stronie INF.04",
    /autorski|licencj/i.test((await tytul("inf04-prawo"))?.title ?? ""));
  ok("architektura klient-serwer", (await tytul("inf04-klient-serwer")) !== undefined);

  const mobilne = (await wiersze(
    `select id from subtopics where id = any($1)`,
    [["inf04-mob-dane", "inf04-mob-siec", "inf04-mob-baza", "inf04-mob-publikacja"]],
  )).map((r) => r.id);
  ok("aplikacje mobilne: dane, sieć, baza i publikacja",
    mobilne.length === 4 && (await ile("inf04-mobile")) === 6 + 4,
    mobilne.join(",") + " / " + (await ile("inf04-mobile")));
  ok("web: sesje, logowanie, jQuery i funkcje serwisu",
    (await ile("inf04-web")) === 7 + 4, String(await ile("inf04-web")));
  ok("testowanie urosło o osiem pozycji z podstawy",
    (await ile("inf04-testowanie")) === przedTest + 8, `${przedTest} → ${await ile("inf04-testowanie")}`);
  ok("testy niefunkcjonalne wymienione z nazwy",
    /wydajno|obciąż|użyteczno/i.test((await tytul("inf04-test-niefunkcjonalne"))?.title ?? ""));
}

console.log("\n== DZIAŁ SZTUCZNA INTELIGENCJA (024) ==");
const ai = await jeden(`select id, position, title, description, qualification from categories where id = 'inf04-ai'`);
{
  ok("dział istnieje i należy do INF.04", ai !== undefined && ai.qualification === "inf04");
  ok("stoi na końcu listy INF.04", ai.position === 15, String(ai.position));
  ok("opis mówi, których klas dotyczy", /3a/.test(ai.description) && /4a/.test(ai.description), ai.description);
  ok("ma siedemnaście tematów", (await ile("inf04-ai")) === 17, String(await ile("inf04-ai")));

  const tytuly = (await wiersze(`select title from subtopics where category_id = 'inf04-ai' order by position`))
    .map((t) => t.title).join(" | ");
  for (const slowo of ["Python", "NumPy", "Pandas", "matplotlib", "scikit-learn", "OpenCV", "OpenVINO", "NLP", "Teachable"]) {
    ok(`program wymienia ${slowo} — jest w mapie`, tytuly.includes(slowo));
  }
  ok("pozycje tematów są kolejne bez dziur",
    (await wiersze(`select position from subtopics where category_id = 'inf04-ai' order by position`))
      .every((r, i) => r.position === i + 1));
}

console.log("\n== NIC SIĘ NIE NADPISAŁO ==");
{
  const kolizje = await wiersze(
    `select category_id, position, count(*)::int n from subtopics group by 1, 2 having count(*) > 1`);
  ok("pozycje podtematów nie dublują się w żadnym dziale", kolizje.length === 0, JSON.stringify(kolizje));

  const wlasny = await jeden(`select position from subtopics where id = 'wlasny-inf04'`);
  ok("podtemat dodany ręcznie został na swoim miejscu", wlasny?.position === 50, JSON.stringify(wlasny));
  ok("postęp klasy przetrwał", (await jeden(`select count(*)::int n from progress`)).n === 1);

  ok("INF.03 nietknięte",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n === 15,
    String((await jeden(`select count(*)::int n from categories where qualification = 'inf03'`)).n));
  ok("INF.04 ma o jeden dział więcej",
    (await jeden(`select count(*)::int n from categories where qualification = 'inf04'`)).n === przedKategorie + 1);
  ok("łącznie 48 nowych podtematów (31 z 023 + 17 z 024)",
    (await jeden(`select count(*)::int n from subtopics`)).n === przedPodtematy + 1 + 48,
    `${przedPodtematy} → ${(await jeden(`select count(*)::int n from subtopics`)).n}`);
  ok("dział obiektowy urósł, ale stare tematy zostały",
    (await ile("inf04-oop")) === przedOop + 1 + 7, String(await ile("inf04-oop")));
}

console.log("\n== MATERIAŁY ==");
{
  const linki = await wiersze(
    `select l.url from subtopic_links l join subtopics s on s.id = l.subtopic_id
     where s.category_id in ('inf04-ai','inf04-oop','inf04-projektowanie','inf04-mobile','inf04-web','inf04-testowanie')`);
  ok("nowe tematy mają materiały", linki.length >= 20, String(linki.length));
  ok("wszystkie odnośniki po https", linki.every((l) => l.url.startsWith("https://")));
}

console.log("\n== UCZEŃ WIDZI NOWY DZIAŁ ==");
{
  await db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false); set role anon;`);
  const widoczne = await jeden(`select count(*)::int n from subtopics where category_id = 'inf04-ai'`);
  ok("publiczny odczyt obejmuje dział AI", widoczne.n === 17, String(widoczne.n));
  await db.exec("reset role;");
}

console.log("\n== IDEMPOTENCJA ==");
{
  const przed = (await jeden(`select count(*)::int n from subtopics`)).n;
  const linkiPrzed = (await jeden(`select count(*)::int n from subtopic_links`)).n;
  await db.exec(read("023_inf04_braki.sql"));
  await db.exec(read("024_inf04_ai.sql"));
  ok("ponowne uruchomienie nie dubluje podtematów",
    (await jeden(`select count(*)::int n from subtopics`)).n === przed);
  ok("ponowne uruchomienie nie dubluje materiałów",
    (await jeden(`select count(*)::int n from subtopic_links`)).n === linkiPrzed);
  ok("dział AI nie zmienia pozycji",
    (await jeden(`select position from categories where id = 'inf04-ai'`)).position === 15);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
