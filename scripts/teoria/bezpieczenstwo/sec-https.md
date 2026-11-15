**W skrócie:** **HTTPS** to HTTP przesyłany przez szyfrowane połączenie **TLS**. Szyfruje dane między przeglądarką a serwerem (nikt po drodze ich nie odczyta ani nie zmieni) i potwierdza **certyfikatem**, że łączysz się z prawdziwym serwerem, a nie z podszywającym się.

## Co daje TLS

| Cecha | Znaczenie |
|---|---|
| **Poufność** | dane są zaszyfrowane — w otwartym Wi-Fi nikt nie podejrzy hasła |
| **Integralność** | nikt po drodze nie podmieni treści strony (np. nie dopisze reklam ani skryptu) |
| **Uwierzytelnienie** | certyfikat potwierdza, że serwer naprawdę należy do domeny |

HTTP domyślnie działa na porcie **80**, HTTPS na **443**.

## Jak działa połączenie (w uproszczeniu)

1. Przeglądarka łączy się z serwerem i dostaje jego **certyfikat** z kluczem publicznym.
2. Sprawdza, czy certyfikat jest **ważny**, wystawiony dla tej domeny i podpisany przez zaufany **urząd certyfikacji (CA)**.
3. Strony uzgadniają wspólny **klucz sesji** (kryptografia asymetryczna służy tylko do bezpiecznego uzgodnienia).
4. Dalej dane szyfruje się szybkim szyfrem **symetrycznym** tym kluczem.

## Certyfikat

- Zawiera m.in. domenę, właściciela, klucz publiczny, okres ważności i podpis urzędu certyfikacji.
- Rodzaje według weryfikacji: **DV** (sprawdzona domena), **OV** (organizacja), **EV** (rozszerzona weryfikacja).
- **Let's Encrypt** wystawia darmowe certyfikaty DV z automatycznym odnawianiem (np. programem certbot).
- Certyfikat **samopodpisany** szyfruje, ale przeglądarka mu nie ufa — ostrzeżenie „Połączenie nie jest prywatne”. Nadaje się tylko do testów.

## Kłódka nie znaczy „bezpieczna strona”

Kłódka mówi tylko, że połączenie jest szyfrowane i domena się zgadza. Fałszywy sklep z phishingiem też może mieć HTTPS — trzeba patrzeć na **adres**.

## Wdrożenie na stronie

1. Zainstaluj certyfikat na serwerze (u hostingodawcy zwykle jednym kliknięciem).
2. **Przekieruj** cały ruch z HTTP na HTTPS (kod 301).
3. Włącz nagłówek **HSTS** (`Strict-Transport-Security`) — przeglądarka zapamięta, żeby łączyć się tylko przez HTTPS.
4. Popraw **mieszaną zawartość** (*mixed content*): obrazki i skrypty ładowane przez `http://` na stronie HTTPS przeglądarka zablokuje lub oznaczy jako niebezpieczne.
5. Ciasteczka sesji z flagą **Secure** — wysyłane tylko przez HTTPS.

## Na egzaminie

- HTTPS = HTTP + TLS, port 443.
- Certyfikat wystawia urząd certyfikacji; samopodpisany powoduje ostrzeżenie.
- Formularze z hasłem tylko przez HTTPS.

## Sprawdź się

1. Na jakim porcie domyślnie działa HTTPS?
2. Co oznacza ostrzeżenie przeglądarki przy certyfikacie samopodpisanym?
3. Czy strona z kłódką na pewno jest uczciwa?

**Odpowiedzi:** 1. 443. 2. Że certyfikatu nie podpisał zaufany urząd certyfikacji, więc nie można potwierdzić tożsamości serwera. 3. Nie — kłódka potwierdza tylko szyfrowanie i domenę, a nie uczciwość właściciela.
