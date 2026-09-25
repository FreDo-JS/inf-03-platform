# INF.03 i INF.04 — mapa nauki i testy

Aplikacja dla dwóch kwalifikacji w jednej bazie i jednym wdrożeniu:

| Kwalifikacja | Klasy | Zakres |
|---|---|---|
| **INF.03** | 2a, 4e, 4d | Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych |
| **INF.04** | 4a, 4g | Projektowanie, programowanie i testowanie aplikacji (C# i React) |

Mapa tematów z postępem aktualizowanym na żywo, testy w stylu Kahoot i panel
nauczyciela. Klasa decyduje, którą kwalifikację widzi uczeń — jedna poprawka
bezpieczeństwa chroni obie, zamiast żyć w dwóch kopiach repozytorium.

Stack: Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Supabase (Postgres + Auth + Realtime).

## Uruchomienie

1. **Supabase** — utwórz projekt, potem w *SQL Editor* uruchom kolejno:
   - `supabase/schema.sql` — tabele, RLS, CHECK-i, funkcje, realtime
   - `supabase/002_test_pin.sql` — PIN-y testów, sesje, ocenianie po stronie serwera
   - `supabase/seed.sql` — kategorie, podtematy i 3 przykładowe testy (PIN-y są losowane — zobaczysz je w panelu)
   - `supabase/003_subtopic_links.sql` — materiały (linki) przy podtematach, zarządzane w panelu
   - `supabase/004_matching_questions.sql` — czwarty typ pytania: dopasowywanie par
   - `supabase/005_tab_switch.sql` — powód zakończenia testu i licznik zmian karty
   - `supabase/006_practical.sql` — moduł Praktyka (zadania, sesje, prace)
   - `supabase/007_practical_seed.sql` — przykładowe zadanie praktyczne „Rowerownia”
   - `supabase/008_security_hardening.sql` — **lista adminów** i poprawki po audycie bezpieczeństwa
   - `supabase/009_server_clock.sql` — zegar po stronie serwera i rejestrowanie utraty fokusa okna
   - `supabase/010_inf04.sql` — druga kwalifikacja: tabela `classes`, kolumna `qualification`
   - `supabase/011_inf04_seed.sql` — mapa nauki INF.04 (12 kategorii, ponad 50 podtematów, materiały)
   - `supabase/012_progress_author.sql` — podpis nauczyciela przy oznaczonym podtemacie
   - `supabase/013_progress_author_fix.sql` — poprawka: ręczne uzupełnienie autorów z SQL Editora

   Masz już bazę z poprzedniej wersji? Uruchom brakujące migracje (`002…`, `003…`) — nic nie nadpisują,
   a ponowne uruchomienie niczego nie duplikuje.
2. **Auth** (Authentication → Sign In / Providers):
   - załóż konta nauczycieli ręcznie: Authentication → Users → *Add user* (e-mail + hasło).
   - **nadaj im uprawnienia** — od migracji 008 samo zalogowanie nie wystarczy, konto musi być
     na liście w tabeli `admins`:

     ```sql
     insert into admins (user_id, note)
     select id, 'nauczyciel' from auth.users where email = 'adres@szkola.pl'
     on conflict (user_id) do nothing;
     ```

     Migracja 008 automatycznie dopisała konta, które istniały w chwili jej uruchomienia.
     Odebranie dostępu: `delete from admins where user_id = '…';`
   - zalecane mimo to: wyłącz „Allow new users to sign up”, żeby nie powstawały niepotrzebne konta.
3. **Zmienne środowiskowe** — skopiuj `.env.example` do `.env.local` i wpisz URL oraz
   **anon key** (Project Settings → API). Service role key nie jest potrzebny i nie może
   trafić do aplikacji.
4. `npm install` → `npm run dev` → http://localhost:3000

**Vercel:** zaimportuj repo, ustaw te same dwie zmienne w *Environment Variables*, deploy.

## PIN testu (jak w Kahoot)

1. **Nauczyciel:** Admin → *Testy i PIN-y* → „📺 Pokaż PIN klasie” (pełny ekran na rzutnik)
   albo „🔄 Nowy PIN” przed lekcją. Stary PIN przestaje działać, a rozpoczęte testy kończą się normalnie.
2. **Uczeń:** wybiera test → wpisuje 6-cyfrowy PIN → imię → test.
3. Bez poprawnego PIN-u uczeń **nie zobaczy pytań** i **nie zapisze wyniku**. Sprawdza to baza, nie
   przeglądarka: `open_test` → `begin_session` → `submit_attempt` (jednorazowa sesja).
4. Limit prób: 20 błędnych PIN-ów / 5 min z jednego IP na test (300 łącznie). Zmiana PIN-u zeruje licznik.
   W szkole cała klasa często ma jedno publiczne IP, dlatego limit ma zapas.

## Wygląd i układ

Stała kolumna nawigacji po lewej, treść po prawej — jak w panelu CRM. W pasku bocznym
są: nawigacja, wybór klasy (mapa nauki i postęp w panelu) oraz sekcje panelu
nauczyciela. Sekcja panelu jest w adresie, więc `/admin?sekcja=wyniki` otwiera się
od razu we właściwym miejscu, a przycisk „wstecz” działa.

Na telefonie kolumna chowa się za przyciskiem i wysuwa jako panel. Interfejs jest
płaski — bez gradientów i poświat — a zamiast emotek używamy ikon `lucide-react`.

## Struktura

```
app/roadmap        mapa nauki (Server Component + hook realtime)
app/testy          lista testów (live) i przebieg quizu /testy/[id]
app/admin          panel (chroniony przez middleware.ts) + /admin/login
components/        UI: roadmap/, tests/, admin/
lib/supabase/      klienci Supabase (przeglądarka, serwer) + walidacja env (tylko https)
lib/validation.ts  walidacja/sanityzacja — w formularzach i tuż przed zapytaniami
lib/hooks/         useRealtimeProgress, useSelectedClass
types/db.ts        typy tabel i funkcji RPC
supabase/          schema.sql, seed.sql
```

## Bezpieczeństwo — jak to działa

| Warstwa | Co chroni |
|---|---|
| **RLS** na wszystkich 6 tabelach | anon: tylko odczyt mapy i testów; zapis wyłącznie przez zalogowanych |
| **CHECK constraints** | długości tekstów, klasa musi istnieć w tabeli `classes` (FK), `score ≤ total`, limit 60–7200 s, poprawna struktura JSON pytań |
| **`test_keys`** (tylko admin) | poprawne odpowiedzi **nie** są w publicznej tabeli `tests` — nie da się ich podejrzeć w DevTools |
| **PIN + sesja** (`open_test`, `begin_session`) | pytania dostępne dopiero po PIN-ie; kolumna `tests.questions` zablokowana dla anon (uprawnienia kolumnowe); limit prób PIN |
| **`submit_attempt(session)`** (RPC) | ocena i pomiar czasu po stronie serwera, jeden zapis na sesję, sesja wygasa po limicie + 5 min; powód zakończenia spoza listy → `completed`, licznik zmian karty przycięty do 0–1000 |
| **`create_test()`** (RPC) | atomowy zapis testu + klucza, ponowna walidacja wszystkich pól w bazie |
| `lib/validation.ts` | ta sama walidacja w UI i przed każdym wywołaniem Supabase |
| React JSX | cały tekst użytkownika renderowany jako tekst; brak `dangerouslySetInnerHTML` (reguła ESLint `react/no-danger`) |
| Materiały (`subtopic_links`) | RLS: odczyt publiczny, zapis tylko dla zalogowanych; `href` tylko dla http(s) (CHECK w bazie + `safeLinkUrl` w UI) |
| Nagłówki (`middleware.ts` + `next.config.ts`) | **CSP z nonce na każde żądanie** (`strict-dynamic`, bez `unsafe-inline`), HSTS, `X-Frame-Options: DENY`, `nosniff`; `connect-src` tylko https/wss do Supabase |
| Kod ucznia (`public/sandbox.html`) | osobny dokument z własną, luźną CSP i `connect-src 'none'`; praca ucznia w zagnieżdżonej ramce `sandbox` (origin null) |
| `middleware.ts` | sesja weryfikowana przez `getUser()`; `/admin` bez sesji → `/admin/login` |
| Moduł Praktyka (RLS) | anon **nie ma** dostępu do żadnej tabeli modułu — tylko funkcje `SECURITY DEFINER` z tokenem podejścia (hash SHA-256 w bazie, token w `sessionStorage`) |
| Praktyka: limity | 10 prób PIN-u na minutę z IP, nazwy plików z listy zadania, 200 KB na plik i 1 MB na projekt, limit zdarzeń na podejście |
| Uruchamianie kodu ucznia | iframe `sandbox` bez `allow-same-origin`, komunikacja tylko przez `postMessage` ze sprawdzaniem źródła; w panelu kod pokazujemy w Monaco (read-only) |
| Eksport CSV | wartości zaczynające się od `=`, `+`, `-`, `@` poprzedzone apostrofem (formula injection) |
| **Lista adminów** (008) | uprawnienia ma tylko konto wpisane do `admins`; samo zalogowanie nie wystarcza, dopisać się przez API nie można |
| **Ocena bez JS ucznia** (008) | testy strukturalne biegną z wyłączonymi skryptami ucznia; przy teście interakcyjnym dwa zgłoszenia wyniku = wykryta manipulacja i 0 pkt |
| Realtime na `tests` | publikowane tylko kolumny publiczne — treść pytań nie wychodzi w zdarzeniu realtime |
| **Zegar egzaminu** (009) | termin liczy baza (`quiz_time`, `practical_time`), klient synchronizuje się co 15–20 s; przestawienie zegara w systemie nic nie daje |
| **Nadzór** (`useProctorGuard`) | karta, **fokus okna** i pełny ekran — wspólnie dla części teoretycznej i praktycznej; obie wymagają pełnego ekranu |
| **Jedna karta** (`useSingleTabLock`) | egzamin otwarty w drugiej karcie tej przeglądarki jest blokowany (pracuje pierwsza) |

### Audyt bezpieczeństwa

Pełny audyt (230 automatycznych sprawdzeń: RLS, wstrzyknięcia, podszywanie się, limity, nagłówki,
izolacja piaskownicy) opisuje [docs/audyt-bezpieczenstwa.md](docs/audyt-bezpieczenstwa.md).

**Odstępstwo od specyfikacji:** migracja 002 usuwa politykę `"anyone can submit attempt"`.
Pozwalała ona wstawić dowolny wynik bezpośrednio przez API, z pominięciem PIN-u i oceniania.

**Możliwy kolejny krok:** Supabase Edge Function z rate limitingiem per IP dla całego API
(obecnie limit dotyczy prób PIN-u, a zapis wyniku jest możliwy raz na sesję).

## Testy — zasady podejścia

- **Cztery typy pytań:** jednokrotny wybór, lista rozwijana, pole tekstowe oraz
  **dopasowywanie par** (przeciąganie myszą albo dwa dotknięcia: element → pole).
  Pytanie z parami zalicza się tylko w komplecie, bez punktów częściowych.
- **Losowa kolejność pytań** przy każdym podejściu (Fisher–Yates, tylko w pamięci przeglądarki).
  Kolumna z odpowiedziami w pytaniach z parami też jest tasowana. Dane w `tests.questions` zostają bez zmian.
- **Bez cofania:** nie ma przycisku „Wstecz", a po przejściu dalej odpowiedzi nie da się zmienić.
  Cały quiz działa na jednym adresie, więc Wstecz w przeglądarce wychodzi z testu, a nie cofa pytanie.
  Wyjście lub odświeżenie przerywa podejście — stanu w połowie nie zapisujemy.
- **Pełny ekran:** test otwiera się na pełnym ekranie (jak część praktyczna) i musi w nim pozostać.
  Bez zgody przeglądarki na pełny ekran nie da się zacząć.
- **Nadzór:** przełączenie karty, **przejście do innego okna** (nawet gdy karta pozostaje widoczna)
  i wyjście z pełnego ekranu. Pierwsze zdarzenie to ostrzeżenie blokujące odpowiadanie (zegar nie stoi),
  drugie kończy test natychmiast — także gdy uczeń nie wróci. Pytania bez odpowiedzi liczą się jako błędne.
  W panelu widać kolumnę „Zakończenie" i licznik opuszczeń.
- **Jedna karta:** otwarcie tego samego testu w drugiej karcie tej przeglądarki jest zablokowane —
  druga karta dostaje komunikat, pierwsza pracuje dalej.
- **Czas liczy serwer:** odliczanie startuje od terminu podanego przez bazę i jest z nią synchronizowane
  co 15 s (`quiz_time`). Przestawienie zegara w systemie nic nie daje.

  ⚠️ To wykrywa zachowanie tej przeglądarki. Nie wykryje telefonu obok ani drugiego komputera —
  traktuj to jako sygnał do sprawdzenia, nie jako dowód ściągania.

## Praktyka — symulator części praktycznej (HTML/CSS/JS)

Osobny moduł: nauczyciel uruchamia sesję z zadaniem, uczeń pracuje w webowym IDE, a ocena
powstaje w dwóch krokach — testy automatyczne, potem weryfikacja nauczyciela.

**Nauczyciel (Admin):**
1. *Zadania praktyczne* — kreator: treść arkusza w Markdown, pliki startowe, rozwiązanie wzorcowe,
   kryteria oceniane ręcznie i **deklaratywne testy automatyczne** (formularz, nie kod).
   Przycisk „Sprawdź na wzorcu" musi dać komplet zaliczonych testów, zanim zadanie da się oznaczyć jako gotowe.
2. *Sesje* — wybór zadania, klasy, czasu (domyślnie 150 min), progu zaliczenia i wklejania.
   Sesja dostaje 6-cyfrowy PIN i przechodzi: poczekalnia → trwa → zakończona. Czas startuje jednym
   kliknięciem dla całej klasy (zegar serwera). Tabela na żywo: kto dołączył, kiedy ostatnio zapisał,
   ile zmian karty i dużych wklejeń, czy oddał.
3. *Prace* — podgląd plików (Monaco tylko do odczytu) i działającej strony, uruchomienie testów,
   korekta wyniku testu (z wymaganym uzasadnieniem; oryginał automatu zostaje), punkty za kryteria
   ręczne, komentarz, publikacja i eksport CSV.

**Uczeń:** `/praktyka` → PIN i imię → poczekalnia → tryb pełnoekranowy → IDE (arkusz | edytor | podgląd).
Kod zapisuje się sam (3 s po przerwie w pisaniu i co 30 s), odświeżenie strony wraca do pracy.
W pasku IDE odlicza zegar serwera (h:mm:ss) i stoi przycisk **Zakończ podejście** — uczeń może
oddać pracę przed czasem; potwierdzenie pokazuje, ile czasu jeszcze zostawało.
Kończy przyciskiem **Zakończ i oddaj**; po oddaniu ekran sam wraca do wpisywania PIN-u (po 20 s lub
od razu przyciskiem), więc przy tym komputerze może usiąść kolejny uczeń. Uczeń **nie dostaje linku do
wyniku** — praca leży w bazie, a ocenę ogłasza nauczyciel (w zakładce *Prace* jest przycisk kopiujący
link do wyniku, gdyby chciał go komuś przekazać).

**Jak to jest uruchamiane i oceniane**
- Podgląd i testy działają w `<iframe sandbox="allow-scripts allow-forms">` **bez** `allow-same-origin`,
  z treścią w `srcdoc`. Odwołania do `styl.css`, `skrypt.js` i linki do innych stron projektu
  podmieniamy na treść inline, bo w iframe nie ma serwera plików.
- Testy automatyczne uruchamia **przeglądarka nauczyciela** (nie uczeń — mógłby podmienić wynik;
  i nie serwer — po co uruchamiać cudzy kod na serwerze). Każdy test dostaje świeży iframe i 5 s limitu.
- Typy testów w tej wersji: `file_not_empty`, `selector_count`, `selector_text`, `selector_attribute`,
  `css_computed`, `html_lang_doctype`, `interaction`. Typy `sql_*` i `php_output` dojdą z etapem PHP.
- Procent liczy baza (`practical_recalc`): punkty automatyczne po korektach + ręczne / maksimum.
- **Żadnej oceny przez AI.**

**Nadzór nad uczniem** — ten sam hook co w module Testy (`useProctorGuard`): przełączenie karty,
przejście do innego okna i wyjście z pełnego ekranu. Pierwsze zdarzenie daje ostrzeżenie, drugie oddaje
pracę (`ended_reason = 'tab_switch'`). Każde zdarzenie trafia do dziennika z rodzajem (`tab_hidden`,
`focus_lost`, `fullscreen_exit`), a licznik prowadzi serwer. Duże wklejenia (≥200 znaków) zapisujemy
z długością, nazwą pliku i czasem — **bez treści**. Zegar nie zatrzymuje się na czas ostrzeżenia,
a termin końca jest odpytywany z serwera co 20 s (`practical_time`). Praca może być otwarta tylko
w jednej karcie.

⚠️ To wszystko są sygnały dla nauczyciela, nie blokada ściągania: nie wykryjemy telefonu obok ani
drugiego komputera. Pełną kontrolę daje Safe Exam Browser (tu nieintegrowany).

## Materiały przy podtematach

Każdy podtemat może mieć dowolną liczbę linków (teoria, zadania, film, arkusz…). Zarządza nimi
**Admin → Materiały**: wybierasz podtemat, dodajesz, edytujesz, usuwasz i przestawiasz kolejność
strzałkami. Zmiany widać u uczniów na żywo (Realtime na `subtopic_links`), bez redeployu.

Etykieta: 1–120 znaków. Adres: musi zaczynać się od `http://` lub `https://` — sprawdza to
formularz i `CHECK` w bazie, a `href` w widoku ucznia ustawiamy tylko dla adresów http(s),
więc `javascript:` nie ma jak trafić do DOM.

Migracja 003 przeniosła dotychczasowe `theory_url` / `tasks_url` do `subtopic_links` jako
„Teoria” i „Zadania”. Stare kolumny zostały w bazie, ale aplikacja ich już nie używa.

## Kto oznaczył podtemat

Przy każdym ukończonym podtemacie — na mapie i w panelu — po prawej stronie kafelka
widnieje podpis nauczyciela, który go odhaczył.

- **Autora wpisuje trigger** z `auth.uid()`, nie przeglądarka. Cokolwiek klient przyśle
  w kolumnie `marked_by`, baza to nadpisze — nie da się podpisać cudzym nazwiskiem.
- Pokazujemy **nazwę własną**, którą nauczyciel ustawia w panelu (pole „Twój podpis przy
  tematach”, maks. 40 znaków). **E-mail ani identyfikator konta nigdy nie trafiają na stronę.**
- **Każdy odhaczony podtemat ma znacznik.** Z nazwiskiem, gdy autor jest znany i ustawił
  podpis; w pozostałych przypadkach neutralne „✓ oznaczone”. Wpisy sprzed migracji nie mają
  autora i nie zgadujemy, kto je zrobił — jeśli wiesz, że wszystkie są Twoje, na końcu
  `013_progress_author_fix.sql` jest gotowe zapytanie, które je uzupełni.
- W panelu przy własnych wpisach bez ustawionego podpisu widnieje „Ty”.
- Podpis widzą też uczniowie, bo mapa jest publiczna. Nie chcesz tego? Zostaw pole puste,
  wtedy nie pokaże się nic.

## Dwie kwalifikacje — jak to jest poukładane

Kwalifikacja jest kolumną, nie osobną instalacją:

- `classes` — lista klas i ich kwalifikacja. **Dopisanie kolejnej klasy to jeden
  insert** plus wpis w `CLASS_QUALIFICATION` w [types/db.ts](types/db.ts); nie trzeba już zmieniać CHECK-ów.
- `categories.qualification` — mapa nauki. Uczeń widzi kategorie swojej klasy.
- `tests.qualification` — nauczyciel wybiera kwalifikację przy tworzeniu testu,
  uczeń przełącza listę na `/testy`. Stare testy mają `inf03` z domyślnej wartości kolumny.
- Pozycje kategorii są unikalne **w obrębie kwalifikacji**, więc obie mogą mieć swoją „jedynkę”.

**Czego to nie obejmuje:** moduł Praktyka to nadal symulator HTML/CSS/JS. Egzamin
praktyczny INF.04 (aplikacja konsolowa w C#, aplikacja desktopowa/mobilna, dokumentacja)
wymaga kompilacji i uruchomienia kodu poza przeglądarką, czego ten IDE nie robi i nie
udaje, że robi. Sesje praktyczne można założyć dla 4a i 4g, ale sensownie wykorzystasz
je tylko do zadań webowych bez kroku budowania.

## Edycja treści mapy

Kategorie i podtematy są w tabelach `categories` / `subtopics` (edycja w Supabase Table Editor).
