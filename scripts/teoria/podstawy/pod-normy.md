**W skrócie:** **norma** to dokument, który opisuje, jak coś zrobić w jednolity sposób — od wymiarów wtyczki po zasady dostępności stron. **Ocena zgodności** sprawdza, czy produkt spełnia wymagania, a dobry programista wie, **gdzie szukać rzetelnych informacji technicznych**.

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

**Odpowiedzi:** 1. W3C. 2. Deklarację producenta, że wyrób spełnia wymagania UE. 3. W oficjalnej dokumentacji PHP (php.net).
