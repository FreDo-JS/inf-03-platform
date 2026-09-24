# INF.03 — mapa nauki i testy

Aplikacja dla klas **2a / 4e / 4d**: mapa tematów kwalifikacji INF.03 z postępem
aktualizowanym na żywo, testy w stylu Kahoot oraz panel administratora.

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
| **CHECK constraints** | długości tekstów, klasa ∈ {2a,4e,4d}, `score ≤ total`, limit 60–7200 s, poprawna struktura JSON pytań |
| **`test_keys`** (tylko admin) | poprawne odpowiedzi **nie** są w publicznej tabeli `tests` — nie da się ich podejrzeć w DevTools |
| **PIN + sesja** (`open_test`, `begin_session`) | pytania dostępne dopiero po PIN-ie; kolumna `tests.questions` zablokowana dla anon (uprawnienia kolumnowe); limit prób PIN |
| **`submit_attempt(session)`** (RPC) | ocena i pomiar czasu po stronie serwera, jeden zapis na sesję, sesja wygasa po limicie + 5 min; powód zakończenia spoza listy → `completed`, licznik zmian karty przycięty do 0–1000 |
| **`create_test()`** (RPC) | atomowy zapis testu + klucza, ponowna walidacja wszystkich pól w bazie |
| `lib/validation.ts` | ta sama walidacja w UI i przed każdym wywołaniem Supabase |
| React JSX | cały tekst użytkownika renderowany jako tekst; brak `dangerouslySetInnerHTML` (reguła ESLint `react/no-danger`) |
| Materiały (`subtopic_links`) | RLS: odczyt publiczny, zapis tylko dla zalogowanych; `href` tylko dla http(s) (CHECK w bazie + `safeLinkUrl` w UI) |
| `next.config.ts` | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`; `connect-src` tylko https/wss do Supabase |
| `middleware.ts` | sesja weryfikowana przez `getUser()`; `/admin` bez sesji → `/admin/login` |
| Moduł Praktyka (RLS) | anon **nie ma** dostępu do żadnej tabeli modułu — tylko funkcje `SECURITY DEFINER` z tokenem podejścia (hash SHA-256 w bazie, token w `sessionStorage`) |
| Praktyka: limity | 10 prób PIN-u na minutę z IP, nazwy plików z listy zadania, 200 KB na plik i 1 MB na projekt, limit zdarzeń na podejście |
| Uruchamianie kodu ucznia | iframe `sandbox` bez `allow-same-origin`, komunikacja tylko przez `postMessage` ze sprawdzaniem źródła; w panelu kod pokazujemy w Monaco (read-only) |
| Eksport CSV | wartości zaczynające się od `=`, `+`, `-`, `@` poprzedzone apostrofem (formula injection) |
| **Lista adminów** (008) | uprawnienia ma tylko konto wpisane do `admins`; samo zalogowanie nie wystarcza, dopisać się przez API nie można |
| **Ocena bez JS ucznia** (008) | testy strukturalne biegną z wyłączonymi skryptami ucznia; przy teście interakcyjnym dwa zgłoszenia wyniku = wykryta manipulacja i 0 pkt |
| Realtime na `tests` | publikowane tylko kolumny publiczne — treść pytań nie wychodzi w zdarzeniu realtime |

### Audyt bezpieczeństwa

Pełny audyt (216 automatycznych sprawdzeń: RLS, wstrzyknięcia, podszywanie się, limity, nagłówki,
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
- **Zmiana karty:** pierwsze opuszczenie karty pokazuje po powrocie ostrzeżenie blokujące odpowiadanie
  (zegar nie jest zatrzymywany). Drugie kończy test natychmiast, także gdy uczeń nie wróci; pytania bez
  odpowiedzi liczą się jako błędne. W panelu widać kolumnę „Zakończenie" (ukończony / koniec czasu /
  **zmiana karty**) i licznik opuszczeń karty.

  ⚠️ To wykrywa tylko przełączenie karty lub okna w tej samej przeglądarce. Nie wykryje telefonu obok,
  drugiego monitora ani okna ustawionego w trybie podzielonego ekranu — traktuj to jako sygnał do
  sprawdzenia, nie jako dowód ściągania.

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
Po oddaniu dostaje link z tokenem — wynik pojawia się tam dopiero po publikacji przez nauczyciela.

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

**Nadzór nad uczniem** — ten sam hook co w module Testy, rozszerzony o pełny ekran: pierwsza zmiana
karty lub wyjście z pełnego ekranu daje ostrzeżenie, druga oddaje pracę (`ended_reason = 'tab_switch'`).
Duże wklejenia (≥200 znaków) trafiają do dziennika: długość, plik i czas — **bez treści**.
Zegar nie zatrzymuje się na czas ostrzeżenia.

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

## Edycja treści mapy

Kategorie i podtematy są w tabelach `categories` / `subtopics` (edycja w Supabase Table Editor).
