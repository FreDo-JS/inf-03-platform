# INF.03 — mapa nauki i testy

Aplikacja dla klas **2a / 4e / 4d**: mapa tematów kwalifikacji INF.03 z postępem
aktualizowanym na żywo, testy w stylu Kahoot oraz panel administratora.

Stack: Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Supabase (Postgres + Auth + Realtime).

## Uruchomienie

1. **Supabase** — utwórz projekt, potem w *SQL Editor* uruchom kolejno:
   - `supabase/schema.sql` — tabele, RLS, CHECK-i, funkcje, realtime
   - `supabase/002_test_pin.sql` — PIN-y testów, sesje, ocenianie po stronie serwera
   - `supabase/seed.sql` — kategorie, podtematy i 3 przykładowe testy (PIN-y są losowane — zobaczysz je w panelu)

   Masz już bazę z poprzedniej wersji? Uruchom tylko `002_test_pin.sql` — istniejące testy dostaną losowe PIN-y.
2. **Auth** (Authentication → Sign In / Providers):
   - ⚠️ **wyłącz „Allow new users to sign up”**. Każdy zalogowany użytkownik jest adminem,
     więc otwarta rejestracja = każdy może zostać adminem przez API.
   - załóż konta adminów ręcznie: Authentication → Users → *Add user* (e-mail + hasło).
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
| **`submit_attempt(session)`** (RPC) | ocena i pomiar czasu po stronie serwera, jeden zapis na sesję, sesja wygasa po limicie + 5 min |
| **`create_test()`** (RPC) | atomowy zapis testu + klucza, ponowna walidacja wszystkich pól w bazie |
| `lib/validation.ts` | ta sama walidacja w UI i przed każdym wywołaniem Supabase |
| React JSX | cały tekst użytkownika renderowany jako tekst; brak `dangerouslySetInnerHTML` (reguła ESLint `react/no-danger`) |
| Linki do teorii/zadań | tylko `https://` (CHECK w bazie + `safeHttpsUrl` w UI) |
| `next.config.ts` | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`; `connect-src` tylko https/wss do Supabase |
| `middleware.ts` | sesja weryfikowana przez `getUser()`; `/admin` bez sesji → `/admin/login` |

**Odstępstwo od specyfikacji:** migracja 002 usuwa politykę `"anyone can submit attempt"`.
Pozwalała ona wstawić dowolny wynik bezpośrednio przez API, z pominięciem PIN-u i oceniania.

**Możliwy kolejny krok:** Supabase Edge Function z rate limitingiem per IP dla całego API
(obecnie limit dotyczy prób PIN-u, a zapis wyniku jest możliwy raz na sesję).

## Edycja treści mapy

Kategorie i podtematy są w tabelach `categories` / `subtopics` (edycja w Supabase Table Editor).
Linki `theory_url` / `tasks_url` muszą zaczynać się od `https://` albo być puste.
