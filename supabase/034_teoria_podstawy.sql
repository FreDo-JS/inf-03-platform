-- generuj: podstawy 034
-- =============================================================================
-- 034_teoria_podstawy.sql — teoria do podtematów: podstawy
--
-- Uruchom po 033_subtopic_notes.sql.
--
-- PLIK GENEROWANY: źródła w scripts/teoria/<dział>/*.md, generator
-- scripts/teoria/generuj.mjs. Poprawiasz treść w pliku .md i generujesz od nowa.
-- Istniejących notatek nie nadpisuje (on conflict do nothing).
--
--   podstawy: pod-adresacja, pod-architektura, pod-binarne, pod-cyber, pod-dane-osobowe, pod-liczby, pod-normy, pod-sieci, pod-sprzet, pod-systemy
-- =============================================================================

do $$
begin
  if to_regclass('public.subtopic_notes') is null then
    raise exception 'Brakuje migracji 033_subtopic_notes.sql — uruchom ją przed 034.';
  end if;
end $$;

insert into subtopic_notes (subtopic_id, content_md)
select n.id, n.tresc
from (values
  ($t0$pod-adresacja$t0$, $t0$**W skrócie:** każde urządzenie w sieci ma **adres IP**. **Maska** mówi, która część adresu oznacza sieć, a która urządzenie. **DNS** zamienia nazwy, które pamięta człowiek (`szkola.pl`), na adresy IP, których potrzebują komputery.

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

**Odpowiedzi:** 1. 254. 2. Tak (zakres 172.16.0.0–172.31.255.255). 3. MX.$t0$),
  ($t0$pod-architektura$t0$, $t0$**W skrócie:** komputer działa według **architektury von Neumanna** — procesor pobiera z pamięci kolejne rozkazy i dane, wykonuje je i zapisuje wyniki. Wszystko łączą **magistrale**, czyli „drogi”, którymi płyną dane, adresy i sygnały sterujące.

## Najważniejsze elementy

| Element | Rola |
|---|---|
| **Procesor (CPU)** | wykonuje rozkazy programu |
| ALU (jednostka arytmetyczno-logiczna) | liczy: dodawanie, porównania, operacje logiczne |
| jednostka sterująca (CU) | pobiera rozkazy i steruje resztą procesora |
| rejestry | najszybsza, bardzo mała pamięć wewnątrz procesora |
| pamięć podręczna (cache L1/L2/L3) | szybki bufor między procesorem a RAM |
| **Pamięć operacyjna (RAM)** | przechowuje uruchomione programy i ich dane; **ulotna** — znika po wyłączeniu zasilania |
| **Pamięć ROM / UEFI (BIOS)** | nieulotna, uruchamia komputer i sprawdza sprzęt (POST) |
| **Pamięć masowa** (SSD, HDD) | trwałe przechowywanie plików |
| **Magistrale** | danych, adresowa i sterująca |
| Urządzenia wejścia/wyjścia | klawiatura, monitor, karta sieciowa… |

## Hierarchia pamięci

Im bliżej procesora, tym pamięć **szybsza, mniejsza i droższa**:

**rejestry → cache L1 → L2 → L3 → RAM → SSD → HDD → pamięć w chmurze**

Dlatego program, który ciągle czyta z dysku, jest dużo wolniejszy niż ten, który trzyma dane w RAM.

## Cykl rozkazowy

1. **Pobranie** rozkazu z pamięci (adres podaje licznik rozkazów).
2. **Dekodowanie** — jednostka sterująca sprawdza, co to za rozkaz.
3. **Wykonanie** — np. ALU dodaje dwie liczby.
4. **Zapis wyniku** do rejestru lub pamięci, przejście do kolejnego rozkazu.

## Jak to rozumieć

Procesor to kucharz, RAM to blat kuchenny, a dysk to spiżarnia. Kucharz pracuje tylko na tym, co leży na blacie. Mały blat (mało RAM) oznacza ciągłe chodzenie do spiżarni (dysku), więc wszystko trwa dłużej, nawet jeśli kucharz jest szybki.

## Na egzaminie

- **RAM jest ulotna, ROM nie** — częste pytanie zamknięte.
- Szerokość magistrali adresowej określa, ile pamięci da się zaadresować: 32 bity → 2³² adresów = 4 GB.
- Cache **nie** jest tym samym co RAM — to osobna, szybsza pamięć w procesorze.

## Sprawdź się

1. Która pamięć traci zawartość po wyłączeniu komputera: RAM, ROM czy SSD?
2. Która część procesora wykonuje dodawanie?
3. Ułóż od najszybszej: RAM, rejestr, SSD, cache L2.

**Odpowiedzi:** 1. RAM. 2. ALU. 3. Rejestr, cache L2, RAM, SSD.$t0$),
  ($t0$pod-binarne$t0$, $t0$**W skrócie:** na liczbach dwójkowych liczy się jak na dziesiętnych, tylko „przeniesienie” następuje już przy 2. Operacje logiczne (AND, OR, XOR, NOT) działają na każdym bicie osobno — z nich korzystają maski sieciowe, uprawnienia i warunki w programach.

## Dodawanie

| a | b | wynik | przeniesienie |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | **1** |

```
   1011   (11)
 + 0110   ( 6)
 ------
  10001   (17)
```

## Odejmowanie i mnożenie

- **Odejmowanie** robi się jak pisemnie, z pożyczką — albo jako dodanie liczby przeciwnej w kodzie U2.
- **Mnożenie** to dodawanie przesuniętych kopii: `101 · 11 = 101 + 1010 = 1111` (5 · 3 = 15).
- **Przesunięcie w lewo o 1 bit** mnoży przez 2, **w prawo** — dzieli przez 2 (bez reszty).

## Operacje logiczne

| a | b | a AND b | a OR b | a XOR b | NOT a |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 |

Zapamiętaj:
- **AND** — 1 tylko gdy **oba** są 1 („i”),
- **OR** — 1 gdy **którykolwiek** jest 1 („lub”),
- **XOR** — 1 gdy są **różne**,
- **NOT** — odwraca.

## Gdzie to się przydaje

**Adres sieci = adres IP AND maska:**

```
  192.168.1.130  = 11000000.10101000.00000001.10000010
  255.255.255.192 = 11111111.11111111.11111111.11000000
  AND             = 11000000.10101000.00000001.10000000 = 192.168.1.128
```

W programowaniu te same operacje są w warunkach: `if (zalogowany && admin)` to AND, `||` to OR, `!` to NOT.

## Na egzaminie

- Dodawanie binarne z przeniesieniem — sprawdzaj wynik, przeliczając na dziesiętny.
- Pytania „jaki będzie wynik `1100 AND 1010`” — licz bit po bicie: `1000`.
- Przepełnienie: suma dwóch 8-bitowych liczb może potrzebować 9 bitów.

## Sprawdź się

1. Policz `1101 + 0011` w systemie dwójkowym.
2. Ile wynosi `1100 XOR 1010`?
3. Jak przesunięcie bitowe w lewo o 2 pozycje zmienia liczbę?

**Odpowiedzi:** 1. `10000` (13 + 3 = 16). 2. `0110`. 3. Mnoży ją przez 4.$t0$),
  ($t0$pod-cyber$t0$, $t0$**W skrócie:** atak to próba uzyskania dostępu do danych, zniszczenia ich albo zablokowania usługi. Najczęściej nie zaczyna się od „hakowania”, tylko od **człowieka**: kliknięcia w link, słabego hasła albo nieaktualnego oprogramowania.

## Złośliwe oprogramowanie (malware)

| Rodzaj | Co robi |
|---|---|
| **Wirus** | dołącza się do plików i rozprzestrzenia przy ich uruchomieniu |
| **Robak (worm)** | rozsyła się sam przez sieć, bez udziału użytkownika |
| **Koń trojański** | udaje przydatny program, a w tle daje atakującemu dostęp |
| **Ransomware** | szyfruje pliki i żąda okupu za klucz |
| **Spyware / keylogger** | śledzi użytkownika, zapisuje wciskane klawisze i hasła |
| **Adware** | wyświetla niechciane reklamy |
| **Rootkit** | ukrywa obecność innego złośliwego oprogramowania w systemie |
| **Botnet** | sieć zainfekowanych komputerów sterowanych zdalnie, np. do ataków DDoS |

## Rodzaje ataków

- **Phishing** — fałszywa wiadomość lub strona podszywająca się pod bank, sklep, szkołę, żeby wyłudzić hasło.
- **Socjotechnika** — manipulacja człowiekiem („jestem z działu IT, podaj hasło”).
- **Brute force / atak słownikowy** — zgadywanie hasła po kolei lub z listy popularnych haseł.
- **DoS / DDoS** — zalanie serwera żądaniami, żeby przestał odpowiadać.
- **Man-in-the-middle** — podsłuch lub podmiana danych między dwiema stronami (np. w otwartym Wi-Fi).
- **SQL injection** — wstrzyknięcie kodu SQL przez formularz, gdy aplikacja skleja zapytania z danych użytkownika.
- **XSS** — wstrzyknięcie skryptu JavaScript na stronę, który wykona się u innych użytkowników.

Dwa ostatnie dotyczą bezpośrednio programisty stron — więcej w dziale *Bezpieczeństwo aplikacji*.

## Jak się chronić

1. **Aktualizacje** systemu i programów — łatają znane luki.
2. **Silne, różne hasła** i menedżer haseł; **uwierzytelnianie dwuskładnikowe (2FA)**.
3. **Kopie zapasowe** (zasada 3-2-1) — jedyny ratunek po ransomware.
4. **Zapora sieciowa (firewall)** i program antywirusowy.
5. **HTTPS** zamiast HTTP — szyfruje transmisję.
6. Zasada **najmniejszych uprawnień**: konto ma tylko te prawa, których potrzebuje.
7. Zdrowy rozsądek: sprawdzaj adres strony i nadawcę, zanim klikniesz.

## Na egzaminie

- Rozróżnij robaka (sam się rozsyła) i wirusa (potrzebuje uruchomienia pliku).
- Pytania o skutki: zaszyfrowane pliki z żądaniem zapłaty → ransomware.
- Ochrona przed SQL injection w PHP: **zapytania przygotowane** (`prepare`), nie sklejanie tekstu.

## Sprawdź się

1. Jak nazywa się program, który udaje grę, a w tle otwiera dostęp do komputera?
2. Co najlepiej chroni dane przed skutkami ransomware?
3. Mejl „Twoje konto zostanie zablokowane, zaloguj się tutaj” z dziwnym adresem nadawcy to przykład…?

**Odpowiedzi:** 1. Koń trojański. 2. Aktualna kopia zapasowa przechowywana osobno. 3. Phishingu.$t0$),
  ($t0$pod-dane-osobowe$t0$, $t0$**W skrócie:** **RODO** określa, jak wolno przetwarzać dane osobowe. **Prawo autorskie** chroni twórczość — także kod, zdjęcia i grafiki na stronie. **Licencja** mówi, co wolno zrobić z cudzym programem lub materiałem.

## RODO — najważniejsze pojęcia

- **Dane osobowe** — informacje pozwalające zidentyfikować osobę: imię i nazwisko, PESEL, e-mail, adres IP, zdjęcie twarzy.
- **Dane szczególnej kategorii** (wrażliwe) — zdrowie, poglądy, wyznanie, dane biometryczne; chronione mocniej.
- **Administrator danych** — decyduje, po co i jak dane są przetwarzane (np. szkoła, sklep).
- **Podmiot danych** — osoba, której dane dotyczą.

**Zasady przetwarzania:** zgodność z prawem i przejrzystość, ograniczenie celu, **minimalizacja danych** (zbieraj tylko to, co potrzebne), prawidłowość, ograniczenie czasu przechowywania, integralność i poufność.

**Prawa osoby:** dostęp do danych, sprostowanie, usunięcie („prawo do bycia zapomnianym”), ograniczenie przetwarzania, przenoszenie danych, sprzeciw.

**Co to znaczy dla programisty:** formularz rejestracji pyta tylko o potrzebne dane, hasła przechowuje jako skrót (`password_hash`), połączenie jest szyfrowane (HTTPS), a strona ma politykę prywatności.

## Prawo autorskie

- Utwór jest chroniony **od chwili powstania**, bez rejestracji. Program komputerowy też jest utworem.
- **Autorskie prawa osobiste** (np. prawo do podpisu) są niezbywalne; **majątkowe** (zarabianie na utworze) można sprzedać. Kod napisany w pracy zwykle należy do pracodawcy.
- Majątkowe prawa autorskie wygasają co do zasady **70 lat po śmierci autora**.
- **Dozwolony użytek** pozwala np. cytować fragment z podaniem źródła — ale nie wolno skopiować cudzej grafiki na stronę firmową, bo „była w Google”.

## Licencje oprogramowania

| Licencja | Co oznacza |
|---|---|
| **Freeware** | darmowe użytkowanie, bez dostępu do kodu |
| **Shareware** | wersja próbna, po czasie trzeba zapłacić |
| **Trial / demo** | ograniczona czasowo lub funkcjonalnie |
| **OEM** | dołączona do sprzętu, przypisana do konkretnego komputera |
| **BOX** | „pudełkowa”, można przenieść na inny komputer |
| **GNU GPL** | otwarty kod; zmiany i wersje pochodne trzeba udostępnić na tej samej licencji |
| **MIT, BSD** | otwarty kod, bardzo swobodne użycie, także w zamkniętych projektach — wystarczy zachować informację o autorze |
| **Creative Commons** | dla treści (zdjęcia, teksty); oznaczenia BY (podaj autora), NC (niekomercyjnie), ND (bez zmian), SA (na tych samych warunkach) |
| **Domena publiczna** | brak majątkowych praw autorskich, wolno używać dowolnie |

## Na egzaminie

- Adres IP i e-mail **są** danymi osobowymi.
- GPL a MIT: przy GPL zmieniony kod musi pozostać otwarty, przy MIT nie.
- Grafika na stronę: użyj własnej, z licencją CC/domeny publicznej albo kupionej — i zapisz źródło.

## Sprawdź się

1. Czy numer telefonu klienta sklepu internetowego to dana osobowa?
2. Którą licencję wybierzesz, jeśli chcesz, by każda zmodyfikowana wersja Twojego programu też była otwarta?
3. Zdjęcie ma licencję CC BY-NC. Czy możesz go użyć na stronie sklepu, który zarabia?

**Odpowiedzi:** 1. Tak. 2. GNU GPL. 3. Nie — NC zabrania użycia komercyjnego.$t0$),
  ($t0$pod-liczby$t0$, $t0$**W skrócie:** komputer zapisuje wszystko w **systemie dwójkowym** (0 i 1). Systemy ósemkowy i szesnastkowy to skróty do wygodnego zapisu długich ciągów bitów — szesnastkowy spotkasz codziennie w kolorach CSS (`#ff8800`).

## System pozycyjny

Wartość cyfry zależy od pozycji: każda pozycja to kolejna potęga podstawy.

`1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰ = 8 + 0 + 2 + 1 = 11₁₀`

| System | Podstawa | Cyfry | Przykład |
|---|---|---|---|
| dwójkowy (BIN) | 2 | 0–1 | 1010₂ |
| ósemkowy (OCT) | 8 | 0–7 | 12₈ |
| dziesiętny (DEC) | 10 | 0–9 | 10₁₀ |
| szesnastkowy (HEX) | 16 | 0–9, A–F | A₁₆ |

## Zamiana dziesiętny → dwójkowy

Dziel przez 2 i zapisuj reszty, a potem czytaj je **od dołu**:

25 : 2 = 12 r **1** → 12 : 2 = 6 r **0** → 6 : 2 = 3 r **0** → 3 : 2 = 1 r **1** → 1 : 2 = 0 r **1**

25₁₀ = **11001₂**

## Dwójkowy ↔ szesnastkowy i ósemkowy — na skróty

- **HEX**: grupuj bity **po 4** od prawej. `1010 1111₂ = AF₁₆`
- **OCT**: grupuj bity **po 3** od prawej. `011 001₂ = 31₈`

| HEX | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIN | 0000 | 0001 | 0010 | 0011 | 0100 | 0101 | 0110 | 0111 | 1000 | 1001 | 1010 | 1011 | 1100 | 1101 | 1110 | 1111 |

**Kolory CSS:** `#FF8800` to trzy bajty: czerwony FF (255), zielony 88 (136), niebieski 00 (0).

## Kod U2 — liczby ujemne

W kodzie uzupełnień do dwóch najstarszy bit ma wagę **ujemną**. Dla 8 bitów zakres to **−128 … 127**.

Jak zapisać −5 na 8 bitach:
1. 5 = `00000101`
2. odwróć bity: `11111010`
3. dodaj 1: `11111011` → to jest **−5 w U2**

Sprawdzenie: −128 + 64 + 32 + 16 + 8 + 2 + 1 = −5 ✓

## Na egzaminie

- Zamiany BIN ↔ DEC ↔ HEX to pewne punkty — ćwicz grupowanie po 4 bity.
- Kolor `#000` to czarny, `#FFF` biały — skrócony zapis podwaja każdą cyfrę (`#F80` = `#FF8800`).
- W U2 liczba z jedynką na początku jest **ujemna**.

## Sprawdź się

1. Zamień 1100 1010₂ na HEX.
2. Ile to dziesiętnie: 2F₁₆?
3. Jaki jest zakres liczb 8-bitowych w U2?

**Odpowiedzi:** 1. CA₁₆. 2. 47. 3. Od −128 do 127.$t0$),
  ($t0$pod-normy$t0$, $t0$**W skrócie:** **norma** to dokument, który opisuje, jak coś zrobić w jednolity sposób — od wymiarów wtyczki po zasady dostępności stron. **Ocena zgodności** sprawdza, czy produkt spełnia wymagania, a dobry programista wie, **gdzie szukać rzetelnych informacji technicznych**.

## Kto tworzy normy

| Skrót | Organizacja | Przykład |
|---|---|---|
| **PN** | Polski Komitet Normalizacyjny | PN-EN ISO 9241 — ergonomia pracy przy komputerze |
| **EN** | europejskie (CEN, CENELEC) | normy przyjęte w całej UE |
| **ISO / IEC** | międzynarodowe | ISO/IEC 27001 — bezpieczeństwo informacji, ISO 9001 — zarządzanie jakością |
| **IEEE** | inżynierowie elektrycy i elektronicy | IEEE 802.3 (Ethernet), IEEE 802.11 (Wi-Fi) |
| **W3C** | konsorcjum WWW | standardy HTML, CSS, WCAG (dostępność) |
| **IETF** | standardy internetu | dokumenty **RFC**, np. opis HTTP i TCP |

Oznaczenie **PN-EN ISO** znaczy, że norma międzynarodowa ISO została przyjęta jako europejska, a potem jako polska.

Stosowanie norm jest **dobrowolne**, chyba że przepis prawa każe się do nich stosować — wtedy stają się obowiązkowe w praktyce.

## Ocena zgodności i oznakowanie

- **Oznakowanie CE** — producent deklaruje, że wyrób spełnia wymagania unijne (bezpieczeństwo, kompatybilność elektromagnetyczna). Musi je mieć np. zasilacz czy router sprzedawany w UE.
- **Deklaracja zgodności** — dokument producenta potwierdzający spełnienie wymagań.
- **Certyfikat** — potwierdzenie zgodności wydane przez niezależną jednostkę.
- Znak **zużytego sprzętu (przekreślony kosz)** — elektroniki nie wyrzuca się do zwykłych śmieci.

Dla stron internetowych podmiotów publicznych obowiązują wymagania **dostępności** oparte na **WCAG**: teksty alternatywne obrazów, kontrast, obsługa klawiaturą, podpisy do filmów.

## Źródła informacji technicznej

Od najbardziej wiarygodnych:

1. **Dokumentacja oficjalna** — php.net, dev.mysql.com, dokumentacja producenta sprzętu.
2. **Specyfikacje i standardy** — W3C, WHATWG, RFC.
3. **Rzetelne serwisy edukacyjne** — MDN Web Docs (Mozilla), dokumentacje frameworków.
4. **Społeczności** — Stack Overflow, fora; przydatne, ale odpowiedzi trzeba sprawdzać (bywają przestarzałe).
5. **Narzędzia AI** — jak każdą podpowiedź, weryfikuj z dokumentacją.

Patrz zawsze na **datę i wersję**: rozwiązanie dla PHP 5 może nie działać w PHP 8.

## Na egzaminie

- Do czego służy oznakowanie CE — pytanie zamknięte z BHP i przepisów.
- Wytyczne dostępności stron to **WCAG** (W3C), standard Wi-Fi to **IEEE 802.11**.
- Do sprawdzenia poprawności HTML i CSS służy **walidator W3C**.

## Sprawdź się

1. Która organizacja publikuje standard HTML i wytyczne WCAG?
2. Co oznacza oznakowanie CE na routerze?
3. Gdzie najpierw szukać opisu funkcji `mysqli_query`?

**Odpowiedzi:** 1. W3C. 2. Deklarację producenta, że wyrób spełnia wymagania UE. 3. W oficjalnej dokumentacji PHP (php.net).$t0$),
  ($t0$pod-sieci$t0$, $t0$**W skrócie:** sieć komputerowa to urządzenia połączone tak, żeby mogły wymieniać dane. Sposób połączenia to **topologia**, a zasady rozmowy urządzeń opisują **protokoły**, ułożone w warstwy modelu **TCP/IP**.

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

**Odpowiedzi:** 1. TCP. 2. 443. 3. Router.$t0$),
  ($t0$pod-sprzet$t0$, $t0$**W skrócie:** komputer dobiera się do zadań, a nie „na najlepszy”. Programista potrzebuje przede wszystkim szybkiego dysku SSD, dużo pamięci RAM i dobrego monitora — gra komputerowa potrzebuje mocnej karty graficznej.

## Najważniejsze parametry

| Podzespół | Parametr | Jednostka | Co oznacza w praktyce |
|---|---|---|---|
| Procesor (CPU) | liczba rdzeni i wątków | szt. | ile zadań naraz (kompilacja, Docker, przeglądarka) |
| | taktowanie | GHz | jak szybko liczy jeden rdzeń |
| | pamięć podręczna (cache) | MB | szybka pamięć w samym procesorze |
| Pamięć RAM | pojemność | GB | ile programów i kart przeglądarki zmieści się naraz |
| | częstotliwość, typ | MHz, DDR4/DDR5 | szybkość wymiany danych z procesorem |
| Dysk | typ | HDD / SSD SATA / SSD NVMe | SSD uruchamia system i projekty kilka razy szybciej niż HDD |
| | pojemność | GB / TB | miejsce na system, projekty, obrazy maszyn wirtualnych |
| Karta graficzna (GPU) | pamięć | GB | ważna przy grach, grafice 3D i uczeniu maszynowym |
| Monitor | rozdzielczość, przekątna | px, cale | ile kodu widać naraz |
| Zasilacz | moc | W | musi mieć zapas względem sumy poboru podzespołów |

## Jak dobrać stanowisko programisty

1. **Dysk SSD** (najlepiej NVMe) — to on najbardziej wpływa na odczucie „szybkości” komputera.
2. **RAM: 16 GB to rozsądne minimum**, 32 GB przy maszynach wirtualnych lub kontenerach.
3. **Procesor** wielordzeniowy — kompilacja i narzędzia deweloperskie korzystają z wielu rdzeni.
4. **Monitor** Full HD lub lepszy, często dwa — kod na jednym, podgląd strony na drugim.
5. **Ergonomia**: monitor na wysokości oczu, odległość ok. 50–70 cm, krzesło z regulacją (to łączy się z działem BHP).

## Przykład

Strona internetowa w PHP i MySQL, edytor VS Code i XAMPP: wystarczy procesor 4–6 rdzeni, 16 GB RAM, SSD 512 GB i zintegrowana karta graficzna. Droga karta graficzna nic tu nie da — tych narzędzi nie przyspiesza.

## Na egzaminie

- Jednostki pojemności: 1 KB = 1024 B (tradycyjnie w informatyce), producenci dysków liczą 1 GB = 1000 MB — dlatego „1 TB” w systemie pokazuje się jako ok. 931 GB.
- Prędkość transmisji podaje się w **bitach** na sekundę (Mb/s), a rozmiar plików w **bajtach** (MB). 1 bajt = 8 bitów.
- Pytania typu „który podzespół poprawi…” — szukaj wąskiego gardła: wolny system przy SSD i 4 GB RAM to zwykle brak pamięci, nie procesor.

## Sprawdź się

1. Co bardziej przyspieszy codzienną pracę programisty na starym laptopie: wymiana HDD na SSD czy szybsza karta graficzna?
2. Łącze ma 100 Mb/s. Ile w najlepszym razie trwa pobranie pliku 100 MB?
3. Dlaczego dysk 1 TB w systemie pokazuje ok. 931 GB?

**Odpowiedzi:** 1. Wymiana na SSD. 2. Około 8 sekund (100 MB = 800 Mb). 3. Producent liczy 1 TB = 10¹² bajtów, a system dzieli przez 1024³.$t0$),
  ($t0$pod-systemy$t0$, $t0$**W skrócie:** dane mogą leżeć lokalnie (na dysku komputera), na **serwerze** w firmie albo w **chmurze** u dostawcy. Każde miejsce ma inne zalety, koszty i ryzyka — a ważne dane zawsze powinny mieć **kopię zapasową w innym miejscu**.

## Rodzaje systemów informatycznych

- **System operacyjny** — Windows, Linux, macOS; zarządza sprzętem i uruchamia programy.
- **System bazodanowy** (DBMS) — MySQL/MariaDB, PostgreSQL; przechowuje i udostępnia dane aplikacjom.
- **System informatyczny firmy** — połączenie ludzi, sprzętu, oprogramowania i danych, np. sklep internetowy z magazynem i płatnościami.

## Gdzie przechowujemy dane

| Miejsce | Przykład | Zalety | Wady |
|---|---|---|---|
| Nośnik lokalny | dysk SSD, pendrive | szybki dostęp bez internetu | łatwo zgubić lub zniszczyć |
| Serwer plików / NAS | dysk sieciowy w szkole | wspólny dostęp w sieci lokalnej, kontrola nad danymi | trzeba go utrzymywać i zabezpieczać |
| Chmura | Google Drive, OneDrive, AWS | dostęp z każdego miejsca, skalowalność | zależność od internetu i dostawcy, dane poza naszą kontrolą |
| Taśma, archiwum | kopie zapasowe w firmie | tanie przechowywanie dużych ilości | wolny dostęp |

## Modele usług w chmurze

- **IaaS** (infrastruktura jako usługa) — wynajmujesz maszyny wirtualne i sieć, resztę konfigurujesz sam.
- **PaaS** (platforma jako usługa) — dostajesz gotowe środowisko do uruchomienia aplikacji, np. hosting aplikacji.
- **SaaS** (oprogramowanie jako usługa) — korzystasz z gotowego programu w przeglądarce, np. poczta e-mail.

## Kopie zapasowe — zasada 3-2-1

**3** kopie danych, na **2** różnych rodzajach nośników, w tym **1** poza siedzibą (np. w chmurze). Rodzaje kopii:

- **pełna** — wszystko, za każdym razem,
- **przyrostowa** — tylko zmiany od *ostatniej dowolnej* kopii (mało miejsca, wolniejsze odtwarzanie),
- **różnicowa** — zmiany od *ostatniej pełnej* kopii.

**RAID** (np. RAID 1 — lustro dwóch dysków) chroni przed awarią dysku, ale **nie jest kopią zapasową**: przypadkowe skasowanie pliku od razu znika z obu dysków.

## Na egzaminie

- Rozróżnij kopię przyrostową i różnicową — to typowe pytanie zamknięte.
- Hosting strony WWW z bazą danych to najczęściej PaaS lub zwykły hosting współdzielony.

## Sprawdź się

1. Firma trzyma kopię tylko na drugim dysku w tym samym serwerze. Co jej grozi?
2. Poczta Gmail to IaaS, PaaS czy SaaS?
3. Czy RAID 1 zastępuje kopie zapasowe?

**Odpowiedzi:** 1. Pożar, kradzież lub atak ransomware zniszczy oba dyski naraz. 2. SaaS. 3. Nie — chroni tylko przed awarią jednego dysku.$t0$)
) as n(id, tresc)
join subtopics s on s.id = n.id
on conflict (subtopic_id) do nothing;
