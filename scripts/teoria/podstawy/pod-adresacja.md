**W skrócie:** każde urządzenie w sieci ma **adres IP**. **Maska** mówi, która część adresu oznacza sieć, a która urządzenie. **DNS** zamienia nazwy, które pamięta człowiek (`szkola.pl`), na adresy IP, których potrzebują komputery.

## Adres IPv4

Cztery liczby od 0 do 255 oddzielone kropkami, np. `192.168.1.10`. Każda liczba to **oktet** (8 bitów), razem 32 bity.

**Maska** zapisana dziesiętnie (`255.255.255.0`) albo skrótem CIDR (`/24` — 24 bity jedynek):

| Adres | Maska | Adres sieci | Rozgłoszeniowy (broadcast) | Hosty |
|---|---|---|---|---|
| 192.168.1.10/24 | 255.255.255.0 | 192.168.1.0 | 192.168.1.255 | 192.168.1.1–254 (254 hosty) |

Liczba hostów w podsieci = **2^(32 − prefiks) − 2** (odejmujemy adres sieci i rozgłoszeniowy). Dla /24: 2⁸ − 2 = 254.

## Adresy prywatne i specjalne

| Zakres | Zastosowanie |
|---|---|
| 10.0.0.0/8 | sieci prywatne (duże firmy) |
| 172.16.0.0/12 | sieci prywatne |
| 192.168.0.0/16 | sieci prywatne (domy, pracownie) |
| 127.0.0.1 | **localhost** — własny komputer (tak działa XAMPP) |

Adresów prywatnych nie widać w internecie — router zamienia je na publiczny adres (**NAT**).

**IPv6** ma 128 bitów i zapis szesnastkowy, np. `2001:db8::1`; powstał, bo adresów IPv4 zabrakło.

## DNS

1. Wpisujesz `www.szkola.pl`.
2. Komputer pyta serwer DNS o adres.
3. DNS odpowiada np. `185.12.34.56`.
4. Przeglądarka łączy się z tym adresem.

Najważniejsze rekordy: **A** (nazwa → IPv4), **AAAA** (nazwa → IPv6), **CNAME** (alias), **MX** (serwer poczty).

## Przepustowość

Ilość danych na sekundę, w **bitach**: kb/s, Mb/s, Gb/s. Czas pobrania = rozmiar w bitach ÷ przepustowość. Plik 50 MB przy 100 Mb/s: 50 × 8 = 400 Mb, czyli ok. 4 s.

## Na egzaminie

- Maskę /26 trzeba umieć zamienić na `255.255.255.192` i policzyć hosty: 2⁶ − 2 = 62.
- Dwa komputery „widzą się”, gdy po nałożeniu maski mają ten sam adres sieci.
- `localhost` = `127.0.0.1` — w zadaniach z PHP i MySQL to adres serwera bazy.

## Sprawdź się

1. Ile hostów zmieści się w sieci /24?
2. Czy adres 172.20.5.4 jest prywatny?
3. Który rekord DNS wskazuje serwer poczty?

**Odpowiedzi:** 1. 254. 2. Tak (zakres 172.16.0.0–172.31.255.255). 3. MX.
