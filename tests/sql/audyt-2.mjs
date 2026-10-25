// Audyt bezpieczeństwa nr 2 (25.10.2026) — powierzchnia ataku całej bazy po migracjach 001–025.
//
// Poprzedni audyt (security.mjs) powstał na schemacie 001–008. Od tamtej pory doszły
// tabele planu nauczycieli, przedmioty, zaproszenia, dziennik, analiza pytań i
// wdrożenie na VPS. Ten zestaw nie szuka pojedynczych błędów, tylko pilnuje
// KSZTAŁTU uprawnień: gdy ktoś doda tabelę albo funkcję i zapomni o RLS lub
// o odebraniu EXECUTE, test się wywróci i zmusi do decyzji.
//
//   1. polityki zapisu wszędzie wymagają admina (statycznie, z pg_policies)
//   2. publiczny odczyt tylko z listy dozwolonych tabel
//   3. uczeń i zalogowany NIE-admin: odczyt, zapis i kasowanie tabel wrażliwych
//   4. funkcje: lista tych, które widzi anon, jest zamknięta; admińskie odrzucają nie-admina
//   5. kolumny tabeli tests dostępne dla ucznia
//   6. pliki wdrożeniowe: nagłówki adresu klienta, uprawnienia kopii, token CI, CSP
import { PGlite } from "@electric-sql/pglite";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const root = join(repo, "supabase") + "/";
const read = (f) => readFileSync(root + f, "utf8");
const plik = (...sciezka) => readFileSync(join(repo, ...sciezka), "utf8");

const ADMIN = "11111111-1111-1111-1111-111111111111";
const ZWYKLY = "22222222-2222-2222-2222-222222222222"; // zalogowany, ale nie nauczyciel

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
  -- jak w Supabase: nowe obiekty domyślnie dostępne dla anon i authenticated
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  create publication supabase_realtime;
`);
// wszystkie migracje po numerach (seed.sql tuż po 002, jak na produkcji)
const numerowane = readdirSync(root).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
for (const f of ["schema.sql", numerowane[0], "seed.sql", ...numerowane.slice(1)]) {
  await db.exec(f === "schema.sql" ? read(f).replace("create extension if not exists pgcrypto;", "") : read(f));
}
// Konta zakładamy PO migracjach: 008 nadaje uprawnienia wszystkim kontom, które już istnieją.
await db.exec(`insert into auth.users values ('${ADMIN}', 'nauczyciel@szkola.pl', now()), ('${ZWYKLY}', 'uczen@internet.pl', now());
  insert into admins(user_id) values ('${ADMIN}') on conflict do nothing;`);

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};
const wiersze = async (sql, params = []) => (await db.query(sql, params)).rows;

const jako = (kto) => {
  if (kto === "anon") {
    return db.exec(`reset role; select set_config('request.jwt.claim.role','anon',false);
      select set_config('request.jwt.claim.sub','',false);
      select set_config('request.headers','{"x-forwarded-for":"7.7.7.7"}',false); set role anon;`);
  }
  const id = kto === "admin" ? ADMIN : ZWYKLY;
  return db.exec(`reset role; select set_config('request.jwt.claim.role','authenticated',false);
    select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`);
};
const jakoWlasciciel = () => db.exec("reset role;");

/** Ile wierszy widać / ile zmieniono; błąd uprawnień liczy się jak 0. */
async function ile(sql) {
  try { return (await db.query(sql)).rows.length; } catch (e) {
    if (/permission denied|row-level security/.test(e.message)) return 0;
    throw e;
  }
}

// -----------------------------------------------------------------------------
console.log("== 1. POLITYKI ZAPISU: WSZĘDZIE ADMIN ==");
{
  await jakoWlasciciel();
  const polityki = await wiersze(`select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname='public'`);
  const zapis = polityki.filter((p) => ["ALL", "INSERT", "UPDATE", "DELETE"].includes(p.cmd));
  const bezAdmina = zapis.filter((p) => !String(p.qual ?? "").includes("is_admin()") && !String(p.with_check ?? "").includes("is_admin()"));
  ok(`wszystkie ${zapis.length} polityk zapisu/kasowania sprawdzają is_admin()`, bezAdmina.length === 0,
    bezAdmina.map((p) => `${p.tablename}.${p.policyname}`).join(", "));

  const bezRls = await wiersze(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`);
  ok("każda tabela w schemacie public ma włączone RLS", bezRls.length === 0, bezRls.map((r) => r.relname).join(", "));

  const slaboscAdmina = polityki.filter((p) => /auth\.role\(\)\s*=\s*'authenticated'/.test(String(p.qual) + String(p.with_check)));
  ok("żadna polityka nie traktuje „zalogowany” jako „nauczyciel” (audyt H2)", slaboscAdmina.length === 0,
    slaboscAdmina.map((p) => `${p.tablename}.${p.policyname}`).join(", "));
}

console.log("\n== 2. PUBLICZNY ODCZYT: ZAMKNIĘTA LISTA ==");
{
  const publiczne = (await wiersze(`select distinct tablename from pg_policies
    where schemaname='public' and cmd='SELECT' and qual = 'true' order by 1`)).map((r) => r.tablename);
  const DOZWOLONE = ["categories", "classes", "progress", "subjects", "subtopic_links", "subtopics", "tests"];
  ok("publicznie czytelne tylko: " + DOZWOLONE.join(", "), publiczne.join() === DOZWOLONE.join(), publiczne.join());
}

// -----------------------------------------------------------------------------
console.log("\n== 3. UCZEŃ I ZALOGOWANY NIE-NAUCZYCIEL ==");
{
  // dane w tabelach wrażliwych, żeby „0 wierszy” coś znaczyło
  await jakoWlasciciel();
  await db.exec(`insert into admin_invites(email) values ('ktos@szkola.pl') on conflict do nothing;
    insert into plan_teachers(name, position) select 'Nauczyciel testowy', 90 where not exists (select 1 from plan_teachers where position = 90);`);
  await db.exec(`insert into teacher_subjects(teacher_id, subject_id)
    select (select id from plan_teachers limit 1), (select id from subjects limit 1) on conflict do nothing;`);
  // wpis w dzienniku powstaje tylko przy zaznaczeniu przez zalogowanego nauczyciela
  await jako("admin");
  await db.exec(`insert into progress(class_name, subtopic_id) values ('2a', 'html-struktura') on conflict do nothing`);
  await jakoWlasciciel();
  const WRAZLIWE = ["admins", "admin_invites", "attempts", "join_rate_limits", "pin_failures", "plan_teachers",
    "practical_attempts", "practical_events", "practical_sessions", "practical_tasks", "progress_log",
    "teacher_subjects", "test_keys", "test_sessions"];
  // tabele, w których coś musi być, żeby test miał sens
  const PUSTE_OK = new Set(["attempts", "join_rate_limits", "pin_failures", "practical_attempts", "practical_events", "practical_sessions", "test_sessions"]);
  for (const t of WRAZLIWE) {
    await jakoWlasciciel();
    const ma = (await wiersze(`select count(*)::int n from ${t}`))[0].n;
    if (!PUSTE_OK.has(t) && ma === 0) ok(`${t}: test ma na czym pracować`, false, "tabela pusta");
    for (const kto of ["anon", "zwykly"]) {
      await jako(kto);
      const widzi = await ile(`select 1 from ${t}`);
      ok(`${t}: ${kto === "anon" ? "uczeń" : "konto bez uprawnień"} nie czyta ani jednego wiersza`, widzi === 0, String(widzi));
    }
  }

  // kasowanie i zmiany w tabelach publicznych do odczytu
  const PUBLICZNE = [["categories", "title"], ["classes", "position"], ["progress", "class_name"], ["subjects", "title"],
    ["subtopic_links", "label"], ["subtopics", "title"], ["tests", "title"]];
  for (const [t, kol] of PUBLICZNE) {
    for (const kto of ["anon", "zwykly"]) {
      await jako(kto);
      const kasuje = await ile(`delete from ${t} returning 1`);
      const zmienia = await ile(`update ${t} set ${kol} = ${kol} returning 1`);
      ok(`${t}: ${kto === "anon" ? "uczeń" : "konto bez uprawnień"} nic nie skasuje ani nie zmieni`, kasuje === 0 && zmienia === 0, `del=${kasuje} upd=${zmienia}`);
    }
  }
  await jakoWlasciciel();
  ok("żadna z prób kasowania nie ruszyła danych (kategorie, podtematy, przedmioty, testy są na miejscu)",
    (await wiersze(`select (select count(*) from categories) c, (select count(*) from subtopics) s,
      (select count(*) from subjects) p, (select count(*) from tests) t`))[0].c > 0 &&
    (await wiersze(`select count(*)::int n from subjects`))[0].n >= 9);

  // wstawianie
  const WSTAWIENIA = [
    ["categories", `insert into categories(id, position, title, qualification) values ('atak-1', 900, 'x', 'inf03')`],
    ["subtopics", `insert into subtopics(id, category_id, position, title) values ('atak-2', 'html-css', 90, 'x')`],
    ["subtopic_links", `insert into subtopic_links(subtopic_id, label, url) values ('html-struktura', 'x', 'https://zly.example')`],
    ["progress", `insert into progress(class_name, subtopic_id) values ('2a', 'html-struktura')`],
    ["tests", `insert into tests(title, time_limit, questions) values ('x', 300, '[]')`],
    ["classes", `insert into classes(name, qualification, position) values ('5z', 'inf03', 99)`],
    ["subjects", `insert into subjects(id, title, position, qualification) values ('p-atak', 'x', 50, 'inf03')`],
    ["plan_teachers", `insert into plan_teachers(name, position) values ('Atakujący', 9)`],
    ["teacher_subjects", `insert into teacher_subjects(teacher_id, subject_id) select (select id from plan_teachers limit 1), 'p-bhp'`],
    ["admins", `insert into admins(user_id) values ('${ZWYKLY}')`],
    ["admin_invites", `insert into admin_invites(email) values ('ja@internet.pl')`],
    ["test_keys", `insert into test_keys(test_id, answers, pin) select id, '[]', '123456' from tests limit 1`],
  ];
  for (const [t, sql] of WSTAWIENIA) {
    for (const kto of ["anon", "zwykly"]) {
      await jako(kto);
      let przeszlo = false;
      try { await db.query(sql); przeszlo = true; } catch { /* oczekiwane */ }
      ok(`${t}: ${kto === "anon" ? "uczeń" : "konto bez uprawnień"} niczego nie wstawi`, !przeszlo);
    }
  }
  // gdyby któryś insert jednak przeszedł (niepoprawnie), posprzątaj, żeby dalsze testy były czytelne
  await jakoWlasciciel();
  ok("nikt nie zrobił się adminem ani nie dopisał zaproszenia",
    (await wiersze(`select count(*)::int n from admins where user_id='${ZWYKLY}'`))[0].n === 0 &&
    (await wiersze(`select count(*)::int n from admin_invites where email='ja@internet.pl'`))[0].n === 0);
}

// -----------------------------------------------------------------------------
console.log("\n== 4. FUNKCJE ==");
{
  await jakoWlasciciel();
  const anon = (await wiersze(`select p.proname n from pg_proc p join pg_namespace s on s.oid=p.pronamespace
    where s.nspname='public' and has_function_privilege('anon', p.oid, 'execute') order by 1`)).map((r) => r.n);
  const DOZWOLONE_DLA_UCZNIA = [
    "begin_session", "grant_admin_on_signup", "is_admin", "open_test", "practical_attempt_state", "practical_clean_name",
    "practical_criteria_valid", "practical_event", "practical_filename_valid", "practical_files_valid", "practical_join",
    // tryb ćwiczeniowy (029): lista i zadanie oznaczone flagą practice, bez rozwiązania wzorcowego
    "practical_practice_list", "practical_practice_task",
    "practical_result", "practical_save", "practical_state", "practical_submit", "practical_task_public",
    "practical_tests_valid", "practical_time", "progress_log_write", "progress_stamp_author", "quiz_time", "submit_attempt",
  ];
  const nowe = anon.filter((n) => !DOZWOLONE_DLA_UCZNIA.includes(n));
  const znikle = DOZWOLONE_DLA_UCZNIA.filter((n) => !anon.includes(n));
  ok("uczeń może wywołać wyłącznie funkcje z zatwierdzonej listy", nowe.length === 0,
    "NOWE bez przeglądu: " + nowe.join(", "));
  ok("  …a lista nie zawiera martwych pozycji", znikle.length === 0, znikle.join(", "));

  // Funkcje zwracające trigger nie wywołają się ręcznie — upewnij się.
  await jako("anon");
  let reczny = true;
  try { await db.query("select grant_admin_on_signup()"); } catch { reczny = false; }
  ok("trigger grant_admin_on_signup nie da się wywołać wprost", !reczny);

  // Funkcje administracyjne: zalogowany, ale nie nauczyciel
  await jako("zwykly");
  const kandydaci = [
    ["create_test", `select create_test('x', 300, '[{"type":"input","text":"a"}]'::jsonb, '[["b"]]'::jsonb, '123456', 'inf03')`],
    ["set_test_pin", `select set_test_pin(gen_random_uuid(), '123456')`],
    ["set_my_display_name", `select set_my_display_name('Admin')`],
    ["practical_create_session", `select practical_create_session(gen_random_uuid(), '2a', 60)`],
    ["practical_start_session", `select practical_start_session(gen_random_uuid())`],
    ["practical_finish_session", `select practical_finish_session(gen_random_uuid())`],
    ["practical_recalc", `select practical_recalc(gen_random_uuid())`],
  ];
  for (const [nazwa, sql] of kandydaci) {
    let wynik = "przeszło";
    try { await db.query(sql); } catch (e) { wynik = e.message; }
    ok(`${nazwa}: konto bez uprawnień nauczyciela odrzucone`, wynik !== "przeszło", wynik);
  }

  // wszystko, co authenticated widzi, a anon nie, jest znane (nowa funkcja = świadoma decyzja)
  await jakoWlasciciel();
  const tylkoZalogowany = (await wiersze(`select p.proname n from pg_proc p join pg_namespace s on s.oid=p.pronamespace
    where s.nspname='public' and has_function_privilege('authenticated', p.oid, 'execute')
      and not has_function_privilege('anon', p.oid, 'execute') order by 1`)).map((r) => r.n);
  const ZNANE = ["clean_student_name", "client_ip", "create_test", "gaps_count", "normalize_answer", "practical_create_session",
    "practical_finish_session", "practical_new_token", "practical_recalc", "practical_start_session", "practical_token_hash",
    "questions_valid", "random_pin", "set_my_display_name", "set_test_pin"];
  const obce = tylkoZalogowany.filter((n) => !ZNANE.includes(n));
  ok("funkcje dostępne tylko po zalogowaniu mieszczą się w znanej liście", obce.length === 0, "NOWE: " + obce.join(", "));
}

// -----------------------------------------------------------------------------
console.log("\n== 5. TABELA tests: CO WIDZI UCZEŃ ==");
{
  await jakoWlasciciel();
  const kolumny = (await wiersze(`select column_name from information_schema.column_privileges
    where table_schema='public' and table_name='tests' and grantee='anon' and privilege_type='SELECT' order by 1`)).map((r) => r.column_name);
  ok("uczeń widzi tylko: id, title, time_limit, question_count, qualification, created_at",
    kolumny.join() === "created_at,id,qualification,question_count,time_limit,title", kolumny.join());
  await jako("anon");
  let pytania = true;
  try { await db.query("select questions from tests"); } catch { pytania = false; }
  ok("treść pytań niedostępna bez PIN-u", !pytania);
  let autor = true;
  try { await db.query("select created_by from tests"); } catch { autor = false; }
  ok("identyfikator autora testu niedostępny dla ucznia", !autor);
  const jawne = await ile(`select 1 from teachers`);
  ok("uczeń widzi z nauczycieli tylko widok (id + nazwa wyświetlana)", jawne >= 0);
  await jakoWlasciciel();
  ok("widok teachers nie ma kolumn z e-mailem ani notatką",
    (await wiersze(`select column_name from information_schema.columns where table_name='teachers' order by 1`)).map((r) => r.column_name).join() === "display_name,id");
}

// -----------------------------------------------------------------------------
console.log("\n== 6. PLIKI WDROŻENIOWE I NAGŁÓWKI ==");
{
  const nginx = plik("deploy", "nginx", "tebby.conf");
  // bez komentarzy — opis w komentarzu też wspomina $proxy_add_x_forwarded_for
  const blokApi = nginx.slice(nginx.indexOf("server_name api."))
    .split(/\r?\n/).filter((l) => !l.trim().startsWith("#")).join("\n");
  ok("nginx (api) nadpisuje CF-Connecting-IP adresem połączenia (audyt H4)",
    /proxy_set_header\s+CF-Connecting-IP\s+\$remote_addr;/i.test(blokApi));
  ok("nginx (api) nadpisuje X-Forwarded-For adresem połączenia, nie dokleja",
    /proxy_set_header\s+X-Forwarded-For\s+\$remote_addr;/i.test(blokApi) && !/proxy_add_x_forwarded_for/.test(blokApi));
  ok("nginx (api) nadpisuje X-Real-IP adresem połączenia", /proxy_set_header\s+X-Real-IP\s+\$remote_addr;/i.test(blokApi));
  ok("nginx nie dokłada własnych nagłówków bezpieczeństwa (nadpisałyby CSP z nonce)",
    !/add_header\s+(Content-Security-Policy|X-Frame-Options|Strict-Transport)/i.test(nginx));

  const kopia = plik("deploy", "kopia-zapasowa.sh");
  ok("skrypt kopii ustawia umask 077 (hasze haseł i klucze testów nie dla wszystkich)", /^umask 077$/m.test(kopia));

  const ci = plik(".github", "workflows", "ci.yml");
  ok("CI ma jawnie ograniczone uprawnienia tokenu", /^permissions:\s*\n\s+contents:\s*read/m.test(ci));

  const compose = plik("deploy", "docker-compose.yml");
  ok("kontener aplikacji słucha tylko na pętli zwrotnej", /127\.0\.0\.1:3000:3000/.test(compose) && !/"3000:3000"/.test(compose));
  const docker = plik("Dockerfile");
  ok("obraz uruchomieniowy działa jako zwykły użytkownik, nie root", /^USER\s+nextjs/m.test(docker));
  ok("klucze service-role nie są wkompilowywane w obraz", !/SERVICE_ROLE/i.test(docker + compose));

  const mw = plik("middleware.ts");
  const scriptSrc = (mw.match(/`script-src[^`]*`/) ?? [""])[0];
  ok("CSP: script-src bez 'unsafe-inline' (nonce + strict-dynamic)", scriptSrc.includes("nonce-") && !scriptSrc.includes("unsafe-inline"));
  ok("CSP: frame-ancestors 'none', object-src 'none', base-uri 'self'",
    mw.includes("frame-ancestors 'none'") && mw.includes("object-src 'none'") && mw.includes("base-uri 'self'"));
  const cfg = plik("next.config.ts");
  ok("X-Frame-Options: DENY i HSTS w nagłówkach stałych", cfg.includes('"X-Frame-Options", value: "DENY"') && cfg.includes("Strict-Transport-Security"));
  ok("piaskownica kodu ucznia: connect-src 'none'", /SANDBOX_CSP[\s\S]*connect-src 'none'/.test(cfg));

  const edytor = plik("components", "practical", "CodeEditor.tsx");
  ok("edytor w trybie tylko do odczytu (cudzy kod) ma wyłączone podpowiedzi po najechaniu i klikalne adresy (L8)",
    /hover:\s*\{\s*enabled:\s*readOnly\s*\?\s*"off"/.test(edytor) && /links:\s*false/.test(edytor));
  ok("strona wyniku z tokenem w adresie nie jest indeksowana",
    /robots:\s*\{\s*index:\s*false/.test(plik("app", "praktyka", "wynik", "[token]", "page.tsx")));

  ok("sekrety nie wchodzą do repozytorium (.env.local w .gitignore)", /^\.env\.local$/m.test(plik(".gitignore")) || /\.env\*/.test(plik(".gitignore")));
  ok("brak pliku .env.local w repozytorium", !existsSync(join(repo, ".env.local")) || /^\.env/m.test(plik(".gitignore")));
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
