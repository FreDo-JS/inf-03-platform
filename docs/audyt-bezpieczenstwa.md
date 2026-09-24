# Audyt bezpieczeństwa — INF.03 (mapa nauki, testy, praktyka)

Data: 24.09.2026 · Zakres: cała aplikacja (Next.js + Supabase) wraz z modułem Praktyka.

## 1. Metoda

Audyt składał się z czterech części:

1. **Przegląd kodu** — wyszukiwanie niebezpiecznych wzorców (`dangerouslySetInnerHTML`, `innerHTML`,
   `eval`, ręcznie sklejany SQL), przegląd polityk RLS, funkcji bazodanowych i przepływu tokenów.
2. **Testy atakujące bazę** — 216 automatycznych sprawdzeń na Postgresie uruchomionym z migracji
   (PGlite), w rolach `anon` / `authenticated` / właściciela. `npm run test:sql`.
3. **Testy w przeglądarce** — izolacja piaskownicy z kodem ucznia, XSS w arkuszu i danych ucznia,
   próby sfałszowania wyników testów automatycznych, nagłówki odpowiedzi w wersji produkcyjnej.
4. **Zależności i sekrety** — `npm audit`, przegląd całej historii gita pod kątem kluczy.

## 2. Podsumowanie znalezisk

| # | Waga | Znalezisko | Status |
|---|---|---|---|
| H1 | **Wysoka** | Uczeń mógł sfałszować wynik testu automatycznego, podszywając się pod wiadomość z piaskownicy | **Naprawione** (008 + zmiany w silniku) |
| H2 | **Wysoka** | Każde konto zalogowane w Supabase Auth miało pełne uprawnienia nauczyciela | **Naprawione** (lista `admins`) |
| M1 | Średnia | Brak limitu rozmiaru pola `details` w zdarzeniach nadzoru — 300 KB na zdarzenie przechodziło | **Naprawione** |
| M2 | Średnia | Treść pytań mogła wyciec w zdarzeniu Realtime tabeli `tests` (obok ochrony PIN-em) | **Naprawione** |
| M3 | Średnia | Brak ograniczenia częstotliwości autozapisu pracy praktycznej | **Naprawione** |
| L1 | Niska | Regresja wykryta w trakcie audytu: anonim dostawał błąd zamiast pustego wyniku | **Naprawione** |
| L2 | Niska | Komunikat „to imię jest zajęte" potwierdza obecność danej osoby w sesji | Zaakceptowane |
| L3 | Niska | CSP dopuszczała `script-src 'unsafe-inline'` (wymóg hydratacji Next.js) | **Naprawione** (nonce + strict-dynamic) |
| L4 | Niska | `attempt_token` w `sessionStorage` — XSS w aplikacji pozwoliłby go przejąć | Ryzyko szczątkowe |

## 3. Szczegóły

### H1. Fałszowanie wyników testów automatycznych — naprawione

**Na czym polegało.** Testy automatyczne wykonują się w iframe razem z kodem ucznia, a wynik wraca
do panelu nauczyciela przez `postMessage`. Skrypt ucznia mógł odczytać identyfikator ramki z treści
strony i wysłać własny „wynik" — panel przyjmował pierwszą wiadomość, więc zaliczał test.

**Dowód (przed poprawką).** Skrypt ucznia wysyłający fałszywki od chwili załadowania strony:
pierwszym przyjętym wynikiem było `SFALSZOWANE (spam od startu)`.

**Poprawka.**
- Testy strukturalne (`file_not_empty`, `selector_count`, `selector_text`, `selector_attribute`,
  `css_computed`, `html_lang_doctype`) uruchamiają się z **usuniętymi skryptami ucznia** — jego kod
  w ogóle nie działa, więc nie podmieni DOM ani nie wyśle wiadomości.
- W teście `interaction` skrypt ucznia musi działać, więc panel: odrzuca wynik, który przyszedł
  **przed** wysłaniem zlecenia, a gdy dostanie **dwa** wyniki tego samego testu, oznacza go jako
  próbę manipulacji i przyznaje 0 punktów.

**Weryfikacja po poprawce.** Rozwiązanie wzorcowe: 11/11 zaliczonych. Ta sama praca z dopisanym
skryptem fałszującym: testy strukturalne policzone uczciwie, test interakcyjny odrzucony z komunikatem
„Wykryto dwa różne wyniki tego samego testu (próba manipulacji)".

**Ryzyko szczątkowe.** Test interakcyjny jest *wykrywalny*, nie *niemożliwy* do zmanipulowania —
kod ucznia działa w tym samym kontekście co sprawdzacz. Ostatnie słowo ma nauczyciel.

### H2. Każdy zalogowany był administratorem — naprawione

**Na czym polegało.** Wszystkie polityki i funkcje sprawdzały `auth.role() = 'authenticated'`.
Gdyby w Supabase włączono publiczną rejestrację (domyślnie jest włączona!), dowolna osoba mogłaby
założyć konto i zyskać dostęp do wyników, prac i PIN-ów.

**Poprawka.** Tabela `admins` + funkcja `is_admin()`. Wszystkie polityki i funkcje administracyjne
sprawdzają teraz obecność na liście. Dopisanie siebie przez API jest niemożliwe (brak polityki
INSERT, odebrane uprawnienia) — uprawnienia nadaje się w SQL Editorze. Migracja przepisuje na listę
konta istniejące w chwili jej uruchomienia, więc obecni nauczyciele nie tracą dostępu.

**Weryfikacja.** Konto zalogowane spoza listy: nie tworzy testów ani sesji, nie widzi wyników i prac,
nie zmienia postępu, nie dopisze się do `admins`.

### M1. Nielimitowane `details` w zdarzeniach nadzoru — naprawione

Uczeń mógł wysłać zdarzenie z dowolnie dużym JSON-em (test zapisał 300 KB w jednym wierszu) i zapychać
bazę. Teraz funkcja przepisuje wyłącznie znane pola (`length`, `file` skrócone do 40 znaków), a kolumna
ma `CHECK` na 2000 znaków. Limit 500 zdarzeń na podejście działał wcześniej i działa nadal.

### M2. Treść pytań w zdarzeniu Realtime — naprawione

Uczniowie nasłuchują zmian w tabeli `tests`, żeby nowy test pojawiał się od razu. Ładunek zdarzenia
zawiera wiersz, czyli także kolumnę `questions` — chronioną PIN-em. Nie udało mi się potwierdzić, czy
Supabase odfiltrowuje kolumny bez uprawnień, więc zamiast polegać na domyśle publikacja obejmuje teraz
wyłącznie kolumny publiczne: `alter publication supabase_realtime add table tests (id, title, time_limit, question_count, created_at)`.

### M3. Brak ograniczenia częstotliwości autozapisu — naprawione

`practical_save` przyjmuje do 1 MB danych. Bez ograniczeń uczeń mógł wysyłać setki zapisów na sekundę.
Teraz zapisy częstsze niż raz na sekundę są pomijane (aplikacja zapisuje co ~3 s, więc nic nie traci).
Walidacja plików wykonuje się **przed** tym ograniczeniem, żeby błędne dane zawsze dawały błąd.

### L1. Regresja wykryta w trakcie audytu — naprawione

Po wprowadzeniu `is_admin()` anonimowi użytkownicy dostawali `permission denied for function is_admin`
zamiast pustego wyniku — polityki tabel z publicznym odczytem (mapa, lista testów) są sprawdzane także
dla nich. To złamałoby widok ucznia. Funkcja dostała uprawnienie `execute` dla `anon`; zwraca wtedy
`false`, więc nic nie ujawnia.

### L3. CSP bez `unsafe-inline` — naprawione

**Na czym polegało.** `script-src` dopuszczał `'unsafe-inline'`, bo Next.js wstrzykuje skrypty startowe
do HTML-a. Taka polityka nie zatrzymałaby skryptu wstrzykniętego przez ewentualny XSS.

**Poprawka.** `middleware.ts` losuje **nonce na każde żądanie** i wysyła go w nagłówku CSP oraz w
nagłówku żądania do Next.js, który dokleja go do swoich skryptów. Polityka:
`script-src 'self' 'nonce-…' 'strict-dynamic'` — bez `unsafe-inline`. `strict-dynamic` pozwala działać
skryptom doładowanym przez zaufany kod (loader Monaco), a blokuje wstrzyknięte `<script>` bez nonce.

**Konsekwencja architektoniczna.** Kod ucznia musi wykonywać własne skrypty inline, a dokument w
`srcdoc` dziedziczy politykę rodzica — pod nową CSP podgląd przestałby działać. Dlatego praca ucznia
uruchamia się teraz w `public/sandbox.html`: osobnym dokumencie z własną, celowo luźną CSP
(`script-src 'unsafe-inline' 'unsafe-eval'`, ale też `default-src 'none'` i **`connect-src 'none'`** —
kod ucznia nie wyśle niczego w świat). Układ: aplikacja → `sandbox.html` → wewnętrzna ramka
`sandbox="allow-scripts allow-forms"` (origin `null`) z pracą ucznia. Izolacja jest ta sama co wcześniej,
a luźna polityka obowiązuje wyłącznie w tym jednym dokumencie.

Wymuszone jest też renderowanie stron na żądanie (`force-dynamic` w `app/layout.tsx`) — strona zapisana
na etapie budowania nie mogłaby zawierać nonce z bieżącego żądania, więc jej skrypty zostałyby zablokowane.

**Weryfikacja.** W wersji produkcyjnej wszystkie trasy zawierają nonce w HTML, `script-src` nie ma już
`unsafe-inline`, strony się hydratują, Monaco ładuje 21 modułów przez `strict-dynamic`, podgląd i testy
automatyczne działają (wzorzec 11/11, praca ze skryptem fałszującym → wykryta manipulacja).

### L2, L4. Ryzyka zaakceptowane

- **L2:** komunikat „ktoś ma już takie imię" jest potrzebny w klasie (uczeń musi wiedzieć, że ma dopisać
  inicjał). Ujawnia obecność imienia komuś, kto zna PIN sesji — czyli i tak uczestnikowi lekcji.
- **L4:** token podejścia leży w `sessionStorage` (ginie po zamknięciu karty). Przejęcie wymagałoby
  XSS-a w naszej aplikacji, a tych nie znalazłem; token nie daje dostępu do niczego poza własną pracą.

## 4. Co przetestowano i wypadło dobrze

**Baza i uprawnienia**
- RLS na wszystkich tabelach; anonim nie odczytuje `practical_tasks`, `practical_sessions`,
  `practical_attempts`, `practical_events`, `join_rate_limits`, `test_keys` ani kolumny `tests.questions`.
- Anonim nie wstawia postępu, wyników, materiałów; nie usuwa testów; nie zmienia kategorii.
- Wszystkie funkcje administracyjne odrzucają wywołania spoza listy adminów.
- Poprawne odpowiedzi quizów i rozwiązania wzorcowe nigdy nie trafiają do odpowiedzi dla ucznia.

**Podszywanie się i tokeny**
- Tokeny podejścia (256 bitów) trzymane w bazie jako skrót SHA-256; zgadywanie odrzucane.
- Token wyniku nie ujawnia oceny przed publikacją.
- Sesja quizu jest jednorazowa; drugie oddanie odrzucone.

**Wstrzyknięcia i XSS**
- `Robert'); DROP TABLE attempts; --` w imieniu → odrzucone przez walidację; baza nietknięta.
- `<img src=x onerror=...>` w imieniu i odpowiedziach → zapisane jako zwykły tekst.
- Arkusz w Markdownie: `<script>`, `<img onerror>`, `[link](javascript:…)`, surowy HTML — nic się nie wykonało,
  żaden `href="javascript:"` nie trafił do DOM.
- Cały dostęp do danych przez `@supabase/supabase-js` i funkcje z parametrami; nigdzie nie ma sklejanego SQL-a.

**Izolacja kodu ucznia**
- Piaskownica bez `allow-same-origin`: próba odczytu `parent.document` i `parent.localStorage` kończy się
  `SecurityError`, `origin` ramki to `null` — kod ucznia nie sięgnie sesji nauczyciela.

**Pliki i limity**
- Odrzucone: `../../../etc/passwd`, `index.php`, `shell.html.php`, `.htaccess`, nazwy ze spacją,
  nazwy > 40 znaków, plik > 200 KB, projekt > 1 MB, więcej niż 15 plików, pliki spoza zadania.
- Limit 10 prób PIN-u na minutę z IP (praktyka) i 20 na 5 minut (quizy); nagłówek `cf-connecting-ip`
  ma pierwszeństwo, więc podmiana `x-forwarded-for` nie obeszła licznika.

**Czas i punktacja**
- Czas liczy serwer: zapis po terminie odrzucony, oddanie po terminie zapisuje ostatni autozapis
  i oznacza `time_up` (praca nie została nadpisana po czasie).
- Punkty przycinane do zakresu: korekta 9999 pkt → 100%, korekta −500 pkt → 0%.
- `CHECK`-i odrzucają wynik większy niż liczba pytań, procent > 100, nieznany status, PIN z liter, obcą klasę.

**Konfiguracja aplikacji**
- Nagłówki w wersji produkcyjnej: CSP z nonce (bez `unsafe-inline` dla skryptów), HSTS (2 lata, `preload`),
  `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; brak `X-Powered-By`.
  Wyjątkiem jest `/sandbox.html` — własna, luźna CSP dla kodu ucznia i `frame-ancestors 'self'`
  zamiast `X-Frame-Options` (ten nagłówek blokuje ramkę osadzoną z atrybutem sandbox).
- `/admin` bez sesji → przekierowanie na `/admin/login` (307).
- `npm audit` (produkcja): 0 podatności. Monaco serwowane z własnego origin, bez CDN.
- Brak sekretów w kodzie i w całej historii gita; `.env.local` w `.gitignore`.

## 5. Zalecenia operacyjne (poza kodem)

1. **Dopisz nauczycieli do `admins`** po utworzeniu kont — patrz README. Sprawdź, kto jest na liście:
   `select u.email, a.note from admins a join auth.users u on u.id = a.user_id;`
2. **Wyłącz publiczną rejestrację** w Supabase Auth. Po zmianie H2 nie daje już uprawnień, ale nie ma
   powodu, żeby ktokolwiek zakładał konta.
3. **Włącz kopie zapasowe** projektu Supabase (darmowy plan ma ograniczone; przy egzaminach warto mieć eksport).
4. **Rozważ Safe Exam Browser** na właściwy egzamin — wykrywanie zmiany karty i pełnego ekranu to sygnały,
   nie blokada.
5. **Nie udostępniaj linku do wyniku** na wspólnym ekranie — token w adresie daje dostęp do pracy ucznia.
6. Po większych zmianach uruchom `npm run test:sql` — 216 sprawdzeń, w tym cały zestaw atakujący.

## 6. Jak powtórzyć audyt

```bash
npm run test:sql
```

Każdy zestaw stawia własną bazę z plików `supabase/*.sql` (PGlite, Postgres w pamięci) i niczego nie
robi na prawdziwym Supabase. Zestaw `security.mjs` to część atakująca: RLS, podszywanie się,
wstrzyknięcia, limity, spójność danych i lista adminów.

Testy wykonywane w przeglądarce (izolacja piaskownicy, XSS w arkuszu, fałszowanie wyników) były
jednorazowe i nie są częścią repozytorium — opis przebiegu i wyniki znajdują się w sekcjach 3 i 4.
