**W skrócie:** **OWASP** (Open Worldwide Application Security Project) to organizacja, która publikuje **OWASP Top 10** — listę najpoważniejszych kategorii zagrożeń aplikacji webowych. To dobra lista kontrolna: jeśli Twoja strona broni się przed tymi dziesięcioma, unikasz większości typowych błędów.

## OWASP Top 10 (wydanie 2021)

| # | Kategoria | Na czym polega | Jak się bronić |
|---|---|---|---|
| A01 | **Błędna kontrola dostępu** | użytkownik dostaje się do cudzych danych, np. zmieniając `?id=5` na `?id=6` | sprawdzaj uprawnienia **na serwerze** przy każdym żądaniu |
| A02 | **Błędy kryptograficzne** | hasła bez skrótu, brak HTTPS, słabe algorytmy | HTTPS, `password_hash`, aktualne algorytmy |
| A03 | **Wstrzykiwanie (Injection)** | SQL injection, XSS, wstrzykiwanie poleceń systemu | zapytania przygotowane, escapowanie, walidacja |
| A04 | **Niebezpieczny projekt** | brak zabezpieczeń zaplanowanych od początku, np. brak limitu prób | myśl o zagrożeniach już przy projektowaniu |
| A05 | **Błędna konfiguracja** | domyślne hasła, włączone wyświetlanie błędów, listowanie katalogów | wyłącz zbędne funkcje, zmień ustawienia domyślne |
| A06 | **Podatne i nieaktualne komponenty** | stare wtyczki, biblioteki ze znanymi lukami | aktualizacje, przegląd zależności |
| A07 | **Błędy identyfikacji i uwierzytelniania** | słabe hasła, brak limitu prób, przewidywalne sesje | limity prób, 2FA, `session_regenerate_id` |
| A08 | **Błędy integralności oprogramowania i danych** | niezweryfikowane aktualizacje, skrypty z niezaufanych źródeł | ufaj tylko zaufanym źródłom, sprawdzaj podpisy |
| A09 | **Błędy logowania i monitorowania** | nikt nie zauważa ataku | zapisuj zdarzenia (np. nieudane logowania) i przeglądaj je |
| A10 | **SSRF** | serwer pobiera adres podany przez użytkownika i trafia do sieci wewnętrznej | lista dozwolonych adresów, blokada adresów wewnętrznych |

## Przykład A01 — najczęstszy błąd

```php
// faktura.php?id=1024 — źle: każdy zalogowany zobaczy każdą fakturę
$id = (int)$_GET["id"];
$sql = "SELECT * FROM faktury WHERE id = ?";

// dobrze: faktura musi należeć do zalogowanego
$sql = "SELECT * FROM faktury WHERE id = ? AND klient_id = ?";
```

Ukrycie przycisku w interfejsie **nie jest** zabezpieczeniem — atakujący wyśle żądanie ręcznie.

## Zasady ogólne

- **Nie ufaj danym od klienta** — formularze, adres URL, ciasteczka, nagłówki można podrobić.
- **Walidacja po stronie serwera** zawsze; po stronie przeglądarki to tylko wygoda.
- **Najmniejsze uprawnienia** — konto bazy, konto użytkownika, uprawnienia do plików.
- **Obrona w głąb** — kilka warstw zabezpieczeń zamiast jednej.
- **Aktualizacje** systemu, PHP, CMS-a i wtyczek.

## Na egzaminie

- Wstrzykiwanie (Injection) obejmuje SQL injection i XSS.
- Kontrola dostępu musi być po stronie serwera.
- Wyłącz wyświetlanie błędów na produkcji (`display_errors = Off`).

## Sprawdź się

1. Do której kategorii OWASP należy pozostawienie domyślnego hasła administratora?
2. Użytkownik zmienia w adresie `profil.php?id=7` na `id=8` i widzi cudze dane. Jaki to błąd?
3. Dlaczego walidacja tylko w JavaScripcie nie wystarcza?

**Odpowiedzi:** 1. A05 — błędna konfiguracja (lub A07, jeśli chodzi o uwierzytelnianie). 2. A01 — błędna kontrola dostępu. 3. Bo żądanie można wysłać z pominięciem przeglądarki i jej skryptów.
