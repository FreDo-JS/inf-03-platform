**W skrócie:** sieć komputerowa to urządzenia połączone tak, żeby mogły wymieniać dane. Sposób połączenia to **topologia**, a zasady rozmowy urządzeń opisują **protokoły**, ułożone w warstwy modelu **TCP/IP**.

## Rodzaje sieci

- **LAN** — sieć lokalna (pracownia, dom, firma).
- **WAN** — sieć rozległa, łączy odległe miejsca; największy przykład to internet.
- **WLAN** — sieć lokalna bezprzewodowa (Wi-Fi).

## Topologie fizyczne

| Topologia | Jak wygląda | Cecha |
|---|---|---|
| **Gwiazda** | wszystkie urządzenia do jednego przełącznika | najpopularniejsza; awaria kabla odcina jeden komputer, awaria przełącznika — całą sieć |
| **Magistrala** | jeden wspólny kabel | dawna; przerwanie kabla psuje całą sieć |
| **Pierścień** | każde urządzenie połączone z dwoma sąsiadami | dane krążą w jednym kierunku |
| **Siatka** | wiele połączeń między urządzeniami | odporna na awarie, droga — tak działa szkielet internetu |

## Model TCP/IP (4 warstwy)

| Warstwa | Za co odpowiada | Przykładowe protokoły |
|---|---|---|
| **Aplikacji** | dane dla programów | HTTP, HTTPS, FTP, SMTP, POP3, IMAP, DNS, SSH |
| **Transportowa** | dostarczenie danych do właściwego programu | **TCP** (niezawodny, z potwierdzeniami), **UDP** (szybki, bez potwierdzeń) |
| **Internetowa** | adresowanie i trasowanie pakietów | **IP**, ICMP (ping) |
| **Dostępu do sieci** | przesyłanie bitów kablem lub radiem | Ethernet, Wi-Fi |

Model **OSI** opisuje to samo w 7 warstwach (fizyczna, łącza danych, sieciowa, transportowa, sesji, prezentacji, aplikacji).

## Porty, które trzeba znać

| Usługa | Port |
|---|---|
| HTTP | 80 |
| HTTPS | 443 |
| FTP | 21 |
| SSH | 22 |
| SMTP (wysyłanie poczty) | 25 (587 z szyfrowaniem) |
| DNS | 53 |
| MySQL | 3306 |

## Urządzenia sieciowe

- **Przełącznik (switch)** — łączy komputery w sieci lokalnej, kieruje ramki na podstawie adresów MAC.
- **Router** — łączy różne sieci (np. domową z internetem), kieruje pakiety na podstawie adresów IP.
- **Punkt dostępowy (AP)** — dołącza urządzenia bezprzewodowe.

## Na egzaminie

- TCP vs UDP: transmisja wideo na żywo i DNS zwykle UDP, strony WWW i poczta — TCP.
- Router działa w warstwie internetowej (sieciowej), przełącznik — w warstwie dostępu (łącza danych).
- Pytania o porty: HTTP 80, HTTPS 443, MySQL 3306 — w XAMPP-ie zobaczysz je codziennie.

## Sprawdź się

1. Który protokół warstwy transportowej potwierdza dostarczenie danych?
2. Jaki port domyślnie obsługuje HTTPS?
3. Które urządzenie łączy sieć domową z internetem?

**Odpowiedzi:** 1. TCP. 2. 443. 3. Router.
