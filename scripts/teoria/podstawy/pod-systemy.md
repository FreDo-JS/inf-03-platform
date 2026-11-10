**W skrócie:** dane mogą leżeć lokalnie (na dysku komputera), na **serwerze** w firmie albo w **chmurze** u dostawcy. Każde miejsce ma inne zalety, koszty i ryzyka — a ważne dane zawsze powinny mieć **kopię zapasową w innym miejscu**.

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

**Odpowiedzi:** 1. Pożar, kradzież lub atak ransomware zniszczy oba dyski naraz. 2. SaaS. 3. Nie — chroni tylko przed awarią jednego dysku.
