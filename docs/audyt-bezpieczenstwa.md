# Audyt bezpieczeństwa — INF.03 (mapa nauki, testy, praktyka)

Data: 24.09.2026 (audyt nr 2: 25.10.2026 — na końcu dokumentu) · Zakres: cała aplikacja (Next.js + Supabase) wraz z modułem Praktyka.

## 1. Metoda

Audyt składał się z czterech części (po nim doszły jeszcze zmiany opisane w sekcji 4a):

1. **Przegląd kodu** — wyszukiwanie niebezpiecznych wzorców (`dangerouslySetInnerHTML`, `innerHTML`,
   `eval`, ręcznie sklejany SQL), przegląd polityk RLS, funkcji bazodanowych i przepływu tokenów.
2. **Testy atakujące bazę** — 230 automatycznych sprawdzeń na Postgresie uruchomionym z migracji
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

## 4a. Wzmocnienie nadzoru (migracja 009)

Po audycie doszły trzy rzeczy, o które prosił nauczyciel:

1. **Wykrywanie utraty fokusa okna.** Samo `visibilitychange` nie łapie sytuacji, w której uczeń
   pracuje w oknie obok albo na drugim monitorze — karta pozostaje wtedy widoczna. Hook
   `useProctorGuard` nasłuchuje dodatkowo `blur` okna i odróżnia go od kliknięcia w ramkę podglądu
   (sprawdza `document.hasFocus()` i `document.activeElement`). Zdarzenia z tej samej sekundy
   (blur + visibilitychange przy jednym przełączeniu) liczą się jako jedno naruszenie.
   W module praktycznym trafiają do dziennika jako osobny typ `focus_lost`.
2. **Zegar z serwera.** Funkcje `quiz_time` i `practical_time` zwracają czas serwera i termin końca;
   klient synchronizuje się co 15–20 s i odlicza względem serwera, a nie zegara systemowego.
   Zweryfikowane: gdy serwer zmienia termin ze 180 s na 40 s, odliczanie przeskakuje przy najbliższej
   synchronizacji. (Samej podmiany zegara systemowego nie dało się zasymulować w narzędziu
   automatyzującym — jego JavaScript działa w osobnym świecie i nie podmienia `Date` strony.)
3. **Pełny ekran w części teoretycznej** (wcześniej tylko w praktycznej) oraz **blokada drugiej karty**
   (`useSingleTabLock`): karta pracująca odświeża wpis w `localStorage` co 2 s, a nowa karta z tym samym
   egzaminem dostaje ekran z informacją. Działa w obrębie jednej przeglądarki i profilu — okna incognito
   to nie obejmuje, tam pozostaje wykrywanie fokusa i blokada zajętego imienia po stronie serwera.

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

---

# Audyt nr 2 — 25.10.2026

Zakres: stan repozytorium po migracjach 001–025 (nowe tabele planu nauczycieli i przedmiotów, zaproszenia,
dziennik, analiza pytań, pytania z lukami) oraz wdrożenie na własny serwer (Dockerfile, nginx, kopie
zapasowe, CI). Poprzedni audyt dotyczył schematu 001–009.

**Metoda.** Przegląd kodu i plików wdrożeniowych; `npm audit`; wyliczenie z katalogu systemowego
Postgresa wszystkich tabel, polityk RLS, uprawnień i funkcji dostępnych dla ucznia (`anon`) oraz dla
zalogowanego konta bez uprawnień nauczyciela; odtworzenie ataków na bazie z PGlite. Wyniki wchodzą do
repozytorium jako zestaw `tests/sql/audyt-2.mjs` (103 sprawdzenia) i rozszerzony `admin-invites.mjs`
— dzięki temu kolejna zmiana, która otworzy coś, czego nie powinna, wywróci test.

Nie zostało sprawdzone: działanie nginxa i kopii zapasowych na żywym serwerze (pliki sprawdzone
statycznie), prawdziwy Supabase (testy chodzą na PGlite), testy w przeglądarce (przeglądarkowa część
audytu nr 1 — piaskownica, XSS w arkuszu — nie została powtórzona; kod tych elementów nie zmienił się).

## Znaleziska

| # | Waga | Znalezisko | Status |
|---|---|---|---|
| H3 | **Wysoka** (warunkowa) | Zaproszenie nauczyciela dawało uprawnienia po samym założeniu konta — przy otwartej rejestracji bez potwierdzania mejli obcy mógł zarejestrować się na zaproszony adres i zostać adminem | **Naprawione** (015: uprawnienia dopiero po potwierdzeniu adresu) |
| H4 | **Wysoka** (przy wdrożeniu na VPS) | nginx przekazywał nagłówki adresu klienta bez nadpisania; baza ufa `cf-connecting-ip`, więc uczeń podając własny nagłówek omijał limity prób PIN-u (6 cyfr = 10⁶ możliwości) | **Naprawione** (`deploy/nginx/tebby.conf` + test statyczny) |
| H5 | **Wysoka** | Zależności produkcyjne z lukami: Next.js ≤ 15.5.27 (m.in. RCE w optymalizatorze obrazów dla SVG, zatruwanie cache, DoS), DOMPurify ≤ 3.4.16 (przez Monaco; DOM XSS), sharp, source-map-js | **Naprawione** poza kopią DOMPurify wbudowaną w Monaco — patrz L8 (`npm audit fix`: Next 15.5.28, sharp 0.35.5; `npm audit --omit=dev`: 0 podatności) |
| M4 | Średnia | Kopie zapasowe zapisywały się z domyślnym `umask 022` — hasze haseł nauczycieli, klucze testów i prace uczniów czytelne dla każdego konta na serwerze | **Naprawione** (`umask 077`, katalog 700) |
| L5 | Niska | Token CI bez jawnie ograniczonych uprawnień | **Naprawione** (`permissions: contents: read`) |
| L6 | Niska | `progress.marked_by` (czytelne publicznie) ujawnia identyfikatory kont nauczycieli; widok `teachers` łączy je z nazwami wyświetlanymi | Zaakceptowane — nazwy są celowo jawne (podpis przy tematach), identyfikator sam w sobie niczego nie daje |
| L7 | Niska | Każdy, kto zna identyfikator testu (lista testów jest publiczna), może wysłać 300 błędnych PIN-ów w 5 minut i zablokować wejście całej klasie na czas egzaminu | Zaakceptowane — to cena globalnego limitu (obrona przed zgadywaniem z wielu adresów); doraźnie pomaga zmiana PIN-u przez nauczyciela, która zeruje licznik |
| L8 | Niska | Monaco serwowany z `public/monaco` ma wbudowaną własną kopię DOMPurify 3.4.8 (starszą niż poprawki z 3.4.17). `npm audit` jej nie widzi, bo siedzi w spakowanym pliku, a nie w `node_modules`; najnowszy Monaco (0.57.0) wciąż zależy od 3.4.15 | Złagodzone — hover i klikalne adresy wyłączone w edytorze tylko do odczytu (cudzy kod); CSP z nonce blokuje wykonanie wstrzykniętych skryptów i obsługi zdarzeń; zgłoszone luki dotyczą opcji, których Monaco prawdopodobnie nie używa (niezweryfikowane) |
| L9 | Niska | `/admin/haslo` przyjmuje `access_token`/`refresh_token` z adresu, więc spreparowany link zaloguje nauczyciela na konto napastnika; formularz „ustaw hasło” trafi wtedy na konto napastnika (ryzyko: nauczyciel wpisze swoje zwykłe hasło) | Zaakceptowane — strona pokazuje adres e-mail konta, którego dotyczy zmiana; wymaga zwabienia nauczyciela na obcy link |
| L10 | Informacyjna | Strona wyniku pracy (`/praktyka/wynik/[token]`) nie miała `noindex` | **Naprawione** |

### H3. Przejęcie zaproszenia nauczyciela

Trigger z migracji 015 uruchamiał się przy `INSERT` do `auth.users` i nadawał rolę każdemu, kto miał adres
z listy zaproszeń. Przy włączonej publicznej rejestracji i wyłączonym potwierdzaniu adresów wystarczyło
zarejestrować się na adres nauczyciela, zanim zrobi to on sam. Odtworzone w teście: konto z niepotwierdzonym
adresem dostawało wiersz w `admins`. Teraz trigger wymaga `email_confirmed_at`, a nasłuchuje także
na `UPDATE` tej kolumny (zaproszenie z panelu Supabase potwierdza adres dopiero przy ustawianiu hasła).
Zmiana adresu na zaproszony bez potwierdzenia też nie daje uprawnień. **Do zrobienia po stronie bazy:
uruchom ponownie `015_admin_invites.sql`** — jest powtarzalna. Niezależnie od tej poprawki
`DISABLE_SIGNUP=true` (wdrożenie na VPS) i wyłączona rejestracja w Supabase zamykają ten wektor całkowicie.

### H4. Limity PIN-ów za nginxem

Baza liczy próby per adres IP i bierze go z nagłówków w kolejności `cf-connecting-ip`, `x-real-ip`,
`x-forwarded-for`. Na hostowanym Supabase pierwszy ustawia Cloudflare, więc klient nie może go podrobić.
Na własnym serwerze przed bazą stoi tylko nginx, a konfiguracja *doklejała* adres do `X-Forwarded-For`
i nie ruszała `CF-Connecting-IP`: uczeń wysyłający `CF-Connecting-IP: 10.0.0.N` z kolejnym N dostawał
za każdym razem świeży licznik. Limit 10 prób na minutę (praktyka) znikał, a w quizach został tylko
globalny limit 300 / 5 min na test. Teraz nginx przy domenie API nadpisuje wszystkie trzy nagłówki adresem
połączenia, a `docs/wdrozenie-vps.md` zawiera polecenie sprawdzające to po wdrożeniu.

### H5. Zależności

Poprzedni audyt miał 0 podatności w produkcji; od tego czasu pojawiły się nowe zgłoszenia. Najpoważniejsze
dotyczy Next.js: aplikacja używa `next/image` (logo), więc optymalizator obrazów jest uruchomiony, a na
własnym serwerze nie chroni go platforma. Po aktualizacji `npm audit --omit=dev` zgłasza 0 podatności,
build produkcyjny i wszystkie testy przechodzą. Zostają 3 uwagi poziomu *moderate* w narzędziach
deweloperskich (`tailwindcss` → `postcss-selector-parser`), które działają wyłącznie podczas budowania
i nie trafiają do obrazu; poprawka wymaga zmiany wersji głównej Tailwinda, więc została odłożona.

**Uwaga (L8): to nie obejmuje DOMPurify w Monaco.** Edytor kodu jest serwowany z `public/monaco`, a jego
paczka zawiera własną kopię DOMPurify 3.4.8 — aktualizacja pakietu w `node_modules` jej nie zmienia, a
`npm audit` jej nie widzi. Zgłoszone luki dotyczą m.in. trybu `IN_PLACE`, `SAFE_FOR_TEMPLATES` i
`PARSER_MEDIA_TYPE`; nie sprawdzałem, czy Monaco z nich korzysta. Ryzyko jest niewielkie, bo Monaco używa
DOMPurify do treści podpowiedzi (np. komentarzy JSDoc z cudzego kodu), a CSP aplikacji (nonce, bez
`unsafe-inline`) uniemożliwia wykonanie wstrzykniętego skryptu lub `onerror=`. Dodatkowo edytor w trybie
„tylko do odczytu” (nauczyciel czyta kod ucznia) ma wyłączone podpowiedzi po najechaniu i klikalne adresy.
Warto zajrzeć do nowszych wydań Monaco; wersja 0.57.0 jeszcze nie wnosi poprawionej kopii.

## Co sprawdzono i wypadło dobrze

**Przegląd kodu aplikacji (dodatkowy, po właściwym audycie).** Aplikacja nie ma własnego kodu serwerowego
poza Next.js i funkcjami w bazie: nie ma plików PHP, `fs`, `child_process` ani `fetch` po stronie serwera,
więc nie ma powierzchni dla wstrzyknięcia poleceń, SSRF ani przechodzenia po ścieżkach. Przejrzano: piaskownicę
kodu ucznia (`sandbox.html`, `preview.ts`, `runner.ts`), filtrowanie adresów (`safeLinkUrl`), renderowanie
Markdownu, logowanie i ustawianie hasła, middleware, komunikaty błędów, przechowywanie w przeglądarce
i łańcuch dostaw (wszystkie 531 pakietów z `registry.npmjs.org` z sumami kontrolnymi; skrypty instalacyjne
tylko `fsevents` i `unrs-resolver`). Nie znaleziono wstrzyknięć, XSS-a ani omijania autoryzacji; zgłoszone
uwagi to L8–L10.

- **RLS:** wszystkie tabele mają włączone RLS; wszystkie polityki zapisu i kasowania wymagają `is_admin()`;
  żadna polityka nie traktuje „zalogowany” jako „nauczyciel”.
- **Publiczny odczyt:** tylko `categories`, `classes`, `progress`, `subjects`, `subtopic_links`, `subtopics`,
  `tests` (z ograniczeniem kolumn: bez `questions` i `created_by`). Zamknięta lista pilnowana testem.
- **Nowe tabele** (`subjects`, `plan_teachers`, `teacher_subjects`, `admin_invites`, `progress_log`): uczeń
  i zalogowane konto bez uprawnień nie czytają, nie wstawiają, nie zmieniają ani nie kasują; nikt nie nada
  sobie roli ani nie dopisze zaproszenia.
- **Funkcje:** uczeń widzi dokładnie 22 funkcje z zatwierdzonej listy (nowa funkcja bez przeglądu wywraca test);
  funkcje administracyjne (`create_test`, `set_test_pin`, `practical_*`, `set_my_display_name`) odrzucają konto
  bez uprawnień nauczyciela; funkcje wyzwalaczy nie wywołają się ręcznie.
- **Losowość:** PIN-y z `gen_random_uuid()`, tokeny podejść i wyników to dwa UUID v4 (≈244 bity), w bazie
  tylko skrót SHA-256.
- **Aplikacja:** brak `dangerouslySetInnerHTML`, `eval`, sklejanego SQL-a i klucza service-role w kodzie;
  Markdown arkusza bez `rehype-raw` i z filtrowaniem adresów; CSP z nonce i `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, HSTS; kontener działa jako zwykły użytkownik i słucha tylko na pętli zwrotnej.
- **Pozostałe punkty audytu nr 1** (sekcje 3–4a) pozostają w mocy; `security.mjs` nadal przechodzi w całości.

## Zalecenia (poza kodem)

1. Uruchom ponownie **015_admin_invites.sql** w Supabase (naprawa H3).
2. Po wdrożeniu na VPS wykonaj próbę z `docs/wdrozenie-vps.md` (sekcja 1.4) — upewnij się, że limit PIN-ów
   działa mimo fałszywego nagłówka (H4).
3. Zainstaluj zaktualizowane zależności (`npm ci`) i przebuduj obraz (H5).
4. Skontroluj prawa istniejących kopii zapasowych: `chmod -R go-rwx /var/backups/tebby` (M4).
5. Pozostają zalecenia z sekcji 5 (wyłączona rejestracja, lista `admins`, Safe Exam Browser na egzaminie).
6. Po każdej zmianie w bazie: `npm run test:sql` — `audyt-2.mjs` zatrzyma nową tabelę bez RLS, nową
   funkcję dostępną dla ucznia i poluzowanie nginxa.
