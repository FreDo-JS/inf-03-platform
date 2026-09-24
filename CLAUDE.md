# CLAUDE.md — INF.03: mapa nauki, testy i egzamin praktyczny

Notatka dla przyszłych sesji Claude Code. Opisuje stan projektu, zasady, których
trzymamy się w tym repo, i pułapki, na które już raz wdepnęliśmy.

## Czym to jest

Aplikacja dla nauczyciela INF.03 i klas **2a / 4e / 4d**, trzy moduły:

1. **Mapa nauki** (`/roadmap`) — kategorie → podtematy, postęp per klasa, realtime,
   materiały (linki) dodawane przez nauczyciela bez limitu.
2. **Testy teoretyczne** (`/testy`) — bez logowania, uczeń podaje imię, wchodzi na
   **PIN**, pytania typu `closed` / `select` / `input` / `matching`, timer, pełny ekran,
   wyniki widoczne **tylko** w panelu.
3. **Egzamin praktyczny** (`/praktyka`) — sesja z PIN-em, IDE w przeglądarce
   (arkusz | Monaco | podgląd na żywo), autozapis, oddanie pracy, testy automatyczne
   uruchamiane w przeglądarce **nauczyciela**, kryteria ręczne, korekty, publikacja, CSV.
   **Zakres: HTML/CSS/JavaScript.** Bez SQL i PHP — tak zdecydował użytkownik.
   Typy testów `sql_*` / `php_output` dojdą dopiero z etapem PHP.

**Żadnego oceniania przez AI.** Ocena jest deklaratywna (testy) + ręczna (nauczyciel).

Panel nauczyciela: `/admin`, Supabase Auth, wiele równorzędnych kont.

## Stack i polecenia

Next.js 15.5 (App Router) · React 19 · TypeScript strict + `noUncheckedIndexedAccess` ·
Tailwind 3.4 · Supabase (Postgres + Auth + Realtime) · Vercel.

```bash
npm run dev         # predev kopiuje Monaco do public/monaco
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run test:sql    # 8 zestawów (~230 asercji) na PGlite, offline, bez Supabase
npm run build
```

`npm run test:sql` odpala migracje w PGlite (Postgres w pamięci) i sprawdza RLS,
CHECK-i i funkcje. **Każda zmiana w `supabase/*.sql` musi mieć pokrycie w `tests/sql/`.**

## Warstwa bazy (kolejność migracji ma znaczenie)

| Plik | Co wnosi |
|---|---|
| `schema.sql` | progress / tests / attempts / categories / subtopics, `create_test`, `submit_attempt` |
| `002_test_pin.sql` | PIN-y (`test_keys`), `test_sessions`, `pin_failures`, `open_test`, `begin_session` |
| `003_subtopic_links.sql` | materiały per podtemat + migracja starych `theory_url`/`tasks_url` |
| `004_matching_questions.sql` | typ `matching` (klucz jako permutacja, ocena zero-jedynkowa) |
| `005_tab_switch.sql` | `tab_switch_count`, `ended_reason` (`completed｜time_up｜tab_switch`) |
| `006_practical.sql` | `practical_tasks/sessions/attempts/events`, funkcje ucznia i nauczyciela |
| `007_practical_seed.sql` | zadanie „Rowerownia": 11 testów auto (35 pkt) + 2 kryteria ręczne (10 pkt) |
| `008_security_hardening.sql` | tabela `admins` + `is_admin()`, whitelist `practical_events.details`, throttle zapisu |
| `009_server_clock.sql` | `quiz_time()` / `practical_time()` — zegar z serwera, zdarzenie `focus_lost` |
| `010_inf04.sql` | druga kwalifikacja: tabela `classes` (FK zamiast list w CHECK-ach), `qualification` w `categories` i `tests`, `create_test` z szóstym argumentem |
| `011_inf04_seed.sql` | mapa INF.04: 12 kategorii, ponad 50 podtematów, materiały do C# i Reacta |

### Nienaruszalne zasady bezpieczeństwa

- **Serwer liczy wszystko**: ocenę, czas, procenty, liczniki. Klient tylko wyświetla.
- **RLS na każdej tabeli**, CHECK-i na każdej kolumnie, która ma ograniczony zbiór wartości.
- **Anon nie ma dostępu do tabel** modułu praktycznego — wyłącznie przez funkcje
  `SECURITY DEFINER` autoryzowane hashem tokenu (`sha256`).
- **Nigdy service-role key** w kodzie ani w przeglądarce. Sekretów nie commitujemy.
- Nauczyciel = wiersz w tabeli `admins`. Samo „zalogowany" **nie** znaczy admin
  (to była dziura H2 z audytu). `is_admin()` ma `grant execute` dla `anon`
  **i** `authenticated` — inaczej publiczne polityki wywalają się na „permission denied".
- Uczeń nie może sfałszować wyniku testu auto: przy testach strukturalnych skrypty ucznia
  są wyłączone, a wynik przed `run-test` albo drugi wynik tego samego testu = wykryta manipulacja.
- Walidacja **po obu stronach**, komunikaty błędów po polsku i bez szczegółów technicznych.

Raport z pełnego audytu: `docs/audyt-bezpieczenstwa.md`.

## Dwie kwalifikacje

INF.03 (klasy 2a, 4e, 4d) i INF.04 (4a, 4g) dzielą kod i bazę. Kwalifikacja jest
kolumną w `categories` i `tests`, a klasa wskazuje kwalifikację przez tabelę `classes`
(w TypeScripcie lustrzane `CLASS_QUALIFICATION` w `types/db.ts`). Dopisanie klasy = insert
do `classes` + wpis w tej mapie; CHECK-i z listą klas już nie istnieją, jest FK.

Moduł Praktyka celowo **nie** został rozciągnięty na INF.04 — jego IDE uruchamia
HTML/CSS/JS w iframe, a egzamin INF.04 wymaga kompilacji C#. Nie udawaj, że da się
to ocenić w przeglądarce; to byłaby ściema, nie funkcja.

## Rzeczy, które łatwo zepsuć

**PGlite ≠ Postgres.** Testy SQL chodzą na PGlite i ono przyjmuje rzeczy, które
Supabase odrzuca — np. kolumnę **generowaną na liście kolumn publikacji**
(`question_count` w 008 wywracało migrację na produkcji: „cannot use generated
column … in publication column list”). Po każdej zmianie w publikacjach albo
w rzadszych konstrukcjach DDL dopisz asercję sprawdzającą sam katalog systemowy
(w `security.mjs` jest taka na `pg_publication_rel`), bo samo „migracja się wykonała”
niczego nie dowodzi.

**CSP z nonce.** `middleware.ts` generuje nonce per request (`script-src 'self' 'nonce-…'
'strict-dynamic'`). Dlatego `app/layout.tsx` ma `export const dynamic = "force-dynamic"` —
bez tego strony statyczne trafiają do produkcji bez nonce i hydracja pada. Nie usuwaj tego.

**Monaco jest self-hostowane** z `public/monaco` (CDN blokuje CSP, a pracownia bywa bez
internetu). Kopiuje je `scripts/copy-monaco.mjs` na `predev`/`prebuild`; katalog jest w `.gitignore`.

**Kod ucznia biegnie w zagnieżdżonych iframe'ach**: aplikacja → `/sandbox.html` (własne,
luźne CSP, `connect-src 'none'`, wyłączone z `X-Frame-Options`) → wewnętrzny `srcdoc`
z `sandbox="allow-scripts allow-forms"` (bez `allow-same-origin`). Most na `postMessage`
waliduje `source` i `frameId`. Wbudowana przeglądarka **nie renderuje** sandboxowanego
iframe'a z `src` — stąd ta konstrukcja, nie upraszczaj jej „z powrotem".

**Realtime**: każdy hook musi mieć unikalną nazwę kanału (`useId()`), inaczej leci
„cannot add postgres_changes callbacks after subscribe()".

**Moduły `"use client"` nie eksportują stałych** używanych przez Server Components —
tak powstał błąd `.split is not a function` na `/roadmap`. Wspólne dane trzymaj
w czystym module (np. `lib/links.ts`).

**Pełny ekran przed `await`.** `requestFullscreen()` musi pójść w tym samym geście
użytkownika, **przed** wywołaniem `begin_session`. Odwrotna kolejność = gest wygasa,
fullscreen odrzucony, sesja już spalona, uczeń w pętli PIN-u. Zegar ma lokalny fallback,
gdyby `quiz_time` nie odpowiedział.

**Nadzór**: `useProctorGuard` (visibilitychange + blur z filtrem na iframe + fullscreenchange,
dedupe 1 s, limit 2 przewinień) i `useSingleTabLock` (heartbeat w localStorage co 2 s).

**Praktyka — pasek IDE**: panel ma `z-40`, bo `SiteNav` jest `sticky z-30` i zasłaniał zegar
oraz przycisk oddania. Dodatkowo `body.ide-open` chowa nawigację, żeby nie dało się do niej dojść
Tabem i wyjść z egzaminu. Czas pokazuje `formatClock` (h:mm:ss) — `formatDuration` zrobiłby z
150 minut „150:00”. Gdy serwer nie poda `ends_at`, `startWork` ustawia termin lokalnie z
`session.minutes`, żeby zegar nie stał na 0:00.

**Praktyka — koniec pracy**: uczeń **nie dostaje linku do wyniku**. Po „Zakończ i oddaj"
ekran wraca do wpisywania PIN-u (20 s albo od razu przyciskiem), czyszcząc token, pliki
i zegar, żeby usiadł kolejny uczeń. Link do wyniku kopiuje nauczyciel w zakładce *Prace*.

## Zasady pracy w tym repo (ustalone z użytkownikiem)

- **Nie dotykaj `.env.local`.** Dwa razy nadpisałem ten plik i skasowałem anon key
  użytkownika — nie do odzyskania. Własnym serwerom dev podawaj zmienne inline
  i na osobnym porcie.
- **Nie uruchamiaj `next build` przy działającym serwerze użytkownika** — wspólny katalog
  `.next` ubija jego `npm run dev` na porcie 3000.
- **Pliki twórz narzędziami Write/Edit albo skryptem w Node**, nie heredokiem w bashu:
  cudzysłowy i backticki gubiły `\s+` i wypłukiwały template literale.
- Interfejs, komunikaty, komentarze i commity — **po polsku**. Commity bez polskich znaków.
- Zadania z kilku specyfikacji robimy **po kolei**, nie równolegle.

## Po stronie użytkownika (wciąż otwarte)

1. Wkleić `NEXT_PUBLIC_SUPABASE_ANON_KEY` do `.env.local` (przeze mnie skasowany).
2. Wykonać migracje **003–011** w Supabase SQL Editor — nic z nich nie było testowane
   na prawdziwej bazie, tylko na PGlite.
3. Dopisać konta nauczycieli do tabeli `admins` i wyłączyć publiczną rejestrację.

Drobiazg: w korzeniu repo leży pusty, przypadkowo zacommitowany plik `0` (commit b6b2337).
