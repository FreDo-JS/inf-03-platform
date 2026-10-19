# Przeniesienie Tebby z Vercela i Supabase na własny VPS

Instrukcja dla VPS-a **u hostingodawcy** (publiczny internet, własna domena).
Zakłada Ubuntu/Debiana, Dockera z pluginem Compose i dostęp po SSH.

Rzecz, od której wszystko zależy: aplikacja nie używa „jakiegoś Postgresa",
tylko **API Supabase** — PostgREST (26 plików z klientem, 17 funkcji RPC),
GoTrue (logowanie i zaproszenia), Realtime (lista testów, monitoring sesji)
oraz 41 polityk RLS opartych na `auth.uid()` i `auth.role()`. Dlatego
przenosimy **cały stos Supabase**, a nie samą bazę. Przepisywanie tego na
gołego Postgresa oznaczałoby przeniesienie autoryzacji z bazy do kodu —
czyli wyrzucenie modelu bezpieczeństwa, który przeszedł audyt.

Z Vercelem jest odwrotnie: w kodzie **nie ma ani jednej zależności od tej
platformy**, więc ten kawałek to zwykłe uruchomienie Next.js.

---

## Plan w trzech etapach

Każdy etap da się cofnąć, a produkcja działa przez cały czas.

| Etap | Co się zmienia | Jak cofnąć |
|---|---|---|
| 1 | Aplikacja chodzi na VPS, baza nadal w chmurze Supabase | zmiana DNS z powrotem na Vercela |
| 2 | Obok staje własny Supabase, pusty, do testów | nic nie ruszasz, produkcja nietknięta |
| 3 | Dane przeniesione, aplikacja przełączona na własny Supabase | stary projekt Supabase zostaje przez miesiąc |

**Etapu 3 nie rób w środku semestru.** Ferie albo wakacje.

---

## Etap 1 — aplikacja na VPS

### 1.1 DNS

Dwa rekordy A na adres VPS-a:

```
tebby.przyklad.pl      → 203.0.113.10
api.tebby.przyklad.pl  → 203.0.113.10
```

Drugi przyda się dopiero w etapie 2, ale certyfikat wygodniej wystawić od razu
na oba.

### 1.2 Kod i zmienne

```bash
sudo mkdir -p /opt/tebby && sudo chown $USER /opt/tebby
git clone <adres-repozytorium> /opt/tebby
cd /opt/tebby
```

`deploy/.env` (ten plik **nie** trafia do repozytorium):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

```bash
chmod 600 deploy/.env
```

Na tym etapie wpisujesz **dane obecnego, chmurowego** Supabase.

### 1.3 Uruchomienie

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
curl -I http://127.0.0.1:3000/admin/login     # ma być 200
```

> **Uwaga na przyszłość:** `NEXT_PUBLIC_*` są **wkompilowywane w kod
> przeglądarki**. Zmiana adresu Supabase wymaga przebudowania obrazu
> (`up -d --build`), samo podmienienie zmiennej środowiskowej nie wystarczy.

### 1.4 nginx i certyfikat

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo cp deploy/nginx/tebby.conf /etc/nginx/sites-available/tebby
sudo ln -s /etc/nginx/sites-available/tebby /etc/nginx/sites-enabled/
sudo sed -i 's/tebby.przyklad.pl/twoja-domena.pl/g' /etc/nginx/sites-available/tebby
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d twoja-domena.pl -d api.twoja-domena.pl
```

Certbot sam dopisze bloki `ssl_*` i założy odnawianie w systemd.

### 1.5 Zapora

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Nic więcej. **Port 5432 ma zostać zamknięty** — do bazy wchodzisz tunelem SSH.

### 1.6 Sprawdzenie

Zaloguj się do panelu, otwórz mapę nauki, odpal test na PIN z telefonu,
uruchom sesję praktyczną. Vercel niech działa dalej jako zapas — przełączasz
się samym DNS-em.

---

## Etap 2 — własny Supabase, na pusto

### 2.1 Stos

Compose bierzesz **z oficjalnego repozytorium** (`supabase/docker`), nie
z tego projektu. Powód jest prosty: plik zmienia się z wersji na wersję, a
przepisany z pamięci byłby fałszywką. My opisujemy tylko to, co dotyczy
Tebby.

```bash
git clone --depth 1 https://github.com/supabase/supabase /opt/supabase-src
cp -r /opt/supabase-src/docker /opt/supabase && cd /opt/supabase
cp .env.example .env
```

### 2.2 Czego ten projekt potrzebuje

| Usługa | Potrzebna? | Po co |
|---|---|---|
| `db` (Postgres) | tak | wszystko |
| `rest` (PostgREST) | tak | 26 plików klienta, 17 funkcji RPC |
| `auth` (GoTrue) | tak | logowanie, zaproszenia, `/admin/haslo` |
| `realtime` | tak | lista testów i monitoring sesji na żywo |
| `kong` | tak | brama, pod którą stoi reszta |
| `studio` + `meta` | wygodne | panel do SQL-a; **nie wystawiaj na świat** |
| `storage`, `imgproxy`, `functions`, `analytics`, `vector` | nie | projekt ich nie używa |

Zbędne usługi możesz zakomentować — mniej rzeczy do aktualizowania i mniej
pamięci. Realnie potrzebujesz **4 GB RAM**, wygodnie 8 GB.

### 2.3 Co ustawić w `.env` Supabase

- `POSTGRES_PASSWORD`, `JWT_SECRET` — nowe, losowe. Z `JWT_SECRET`
  wyprowadzasz `ANON_KEY` i `SERVICE_ROLE_KEY` (generator jest w dokumentacji
  Supabase). **`SERVICE_ROLE_KEY` nie ma prawa pojawić się w aplikacji** —
  w tym projekcie nie jest używany i tak ma zostać.
- `SITE_URL=https://twoja-domena.pl`
- `ADDITIONAL_REDIRECT_URLS=https://twoja-domena.pl/admin/haslo` — bez tego
  link z zaproszenia nie dowiezie tokenu tam, gdzie go odbiera
  `InviteCatcher` (patrz CLAUDE.md, sekcja o zaproszeniach).
- `DISABLE_SIGNUP=true` — projekt **nie ma rejestracji** i mieć nie powinien.
- SMTP (`SMTP_HOST`, `SMTP_USER`, …) — własny serwer poczty znosi limit
  „email rate limit exceeded", na który trafiłeś w chmurze.
- `STUDIO_DEFAULT_ORGANIZATION` / hasło do Studia — i tak zostaw je za
  tunelem SSH.

### 2.4 Studio tylko przez tunel

W compose zostaw Studio na `127.0.0.1:3001` i wchodź z własnego komputera:

```bash
ssh -L 3001:127.0.0.1:3001 user@203.0.113.10
# potem http://localhost:3001 w przeglądarce
```

Wystawienie Studia publicznie to najprostszy sposób, żeby oddać komuś bazę.

### 2.5 Migracje

W Studiu (przez tunel) wklej po kolei **003 → 024**. Kolejność ma znaczenie,
a każda migracja zaczyna się od sprawdzenia, czy poprzednie są na miejscu, i
mówi wprost, czego brakuje.

### 2.6 Test na pustej bazie

Zbuduj drugi, testowy obraz aplikacji wskazujący na nowy Supabase
(`NEXT_PUBLIC_SUPABASE_URL=https://api.twoja-domena.pl`) i sprawdź:

- [ ] logowanie do panelu i wylogowanie,
- [ ] zaproszenie nowego konta → mail → `/admin/haslo` → ustawienie hasła,
- [ ] oznaczenie tematu na mapie (podpis nauczyciela i wpis w *Logach*),
- [ ] test teoretyczny na PIN od wejścia do wyniku w panelu,
- [ ] **lista testów odświeża się na żywo** (to sprawdza Realtime),
- [ ] sesja praktyczna: PIN, IDE, autozapis, oddanie, sprawdzenie testami,
- [ ] monitoring sesji odświeża się bez przeładowania strony.

---

## Etap 3 — dane i przełączenie

### 3.1 Zrzut ze starego projektu

W panelu chmurowego Supabase (Database → Connection string) weź dane
połączenia i zrób zrzut **razem ze schematem `auth`** — tam siedzą konta:

```bash
pg_dump "postgresql://postgres:HASLO@db.twoj-projekt.supabase.co:5432/postgres" \
  --format=custom --schema=public --schema=auth \
  --file=tebby-przenosiny.dump
```

### 3.2 Wgranie

```bash
docker cp tebby-przenosiny.dump supabase-db:/tmp/
docker exec -i supabase-db pg_restore \
  --username=postgres --dbname=postgres --clean --if-exists /tmp/tebby-przenosiny.dump
```

Co się stanie z kontami: **hasła działają dalej** (w `auth.users` są skróty
bcrypt, nie zależą od `JWT_SECRET`), ale **wszystkie sesje wygasną** — bo
tokeny podpisano starym sekretem. Wszyscy po prostu logują się ponownie.

### 3.3 Przełączenie

```bash
# deploy/.env — nowy adres i nowy anon key
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

Przebudowa jest konieczna: adres Supabase siedzi w kodzie przeglądarki.
CSP dostosuje się sam — `middleware.ts` buduje `connect-src` z tego adresu
(`supabaseOriginsFor`), więc nie ma czego poprawiać ręcznie.

Na koniec zaktualizuj `.env.local` na swoim komputerze, żeby `npm run dev`
celował w nowy Supabase.

**Stary projekt w chmurze zostaw przez miesiąc.** To Twoje wyjście awaryjne.

---

## Kopie zapasowe

```bash
sudo cp deploy/kopia-zapasowa.sh /opt/tebby/deploy/
sudo chmod +x /opt/tebby/deploy/kopia-zapasowa.sh
crontab -e
# 30 2 * * * /opt/tebby/deploy/kopia-zapasowa.sh >> /var/log/tebby-kopia.log 2>&1
```

Skrypt zrzuca `public` i `auth`, trzyma 14 dni wstecz i **przerywa, zanim
skasuje stare kopie**, jeśli nowa wyszła podejrzanie mała.

### Próbne odtworzenie — raz w miesiącu

```bash
docker exec supabase-db createdb -U postgres proba
docker exec -i supabase-db pg_restore -U postgres -d proba /tmp/ostatnia.dump
docker exec supabase-db psql -U postgres -d proba -c \
  "select count(*) from subtopics; select count(*) from attempts;"
docker exec supabase-db dropdb -U postgres proba
```

Kopia, której nigdy nie odtworzyłeś, nie jest kopią.

---

## Utrzymanie

**Aktualizacja aplikacji:**

```bash
cd /opt/tebby && git pull
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
docker image prune -f
```

Nowe migracje SQL wklejasz osobno, w Studiu. Ten rozdział jest celowy:
aplikacja i baza wdrażają się niezależnie, a `lib/supabase/compat.ts`
przeżywa stan pośredni (patrz CLAUDE.md).

**Higiena serwera:** `unattended-upgrades` na poprawki bezpieczeństwa,
`fail2ban` na SSH, logowanie kluczem zamiast hasła, `PermitRootLogin no`.

---

## Czego ta instrukcja nie sprawdziła

Uczciwie, żeby nie było niespodzianek:

- **Obraz dockerowy nie został zbudowany** — na maszynie, gdzie powstawał
  `Dockerfile`, nie działał demon Dockera. Zweryfikowane jest natomiast to,
  co w nim najbardziej zawodne: build w trybie `standalone` przechodzi, a
  serwer uruchomiony z takiego wyniku (z dołożonym `public/` i
  `.next/static`, dokładnie jak robi to `Dockerfile`) odpowiada `200` na
  `/admin/login`, `/sandbox.html`, `/monaco/vs/loader.js` i `/tebby.png`,
  z poprawnym CSP i nonce.
- **Konfiguracja nginxa i skrypt kopii nie były uruchomione** na żywym
  serwerze — powstały na podstawie tego, czego ten projekt wymaga
  (WebSocket dla Realtime, brak własnych nagłówków bezpieczeństwa, limity
  rozmiaru żądania), ale pierwsze `nginx -t` wykonasz u siebie.
- **Compose Supabase pochodzi z projektu Supabase**, nie stąd. Opisane są
  tylko ustawienia istotne dla Tebby.
