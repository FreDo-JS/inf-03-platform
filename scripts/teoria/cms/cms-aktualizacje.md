**W skrócie:** CMS, motywy i wtyczki **trzeba aktualizować** — większość włamań na strony z WordPressem wykorzystuje znane luki w nieaktualnych wtyczkach. Przed każdą większą aktualizacją robi się **kopię zapasową** — zarówno **plików**, jak i **bazy danych**.

## Co aktualizować

| Element | Gdzie | Uwagi |
|---|---|---|
| **Rdzeń WordPressa** | Kokpit → Aktualizacje | wersje poprawkowe (np. 6.5.1 → 6.5.2) instalują się zwykle automatycznie |
| **Wtyczki** | Wtyczki | można włączyć automatyczne aktualizacje dla każdej z osobna |
| **Motywy** | Wygląd → Motywy | zmiany w motywie nadrzędnym zostaną nadpisane — stąd motyw potomny |
| **PHP i serwer** | panel hostingu | nowsza wersja PHP = szybciej i bezpieczniej; sprawdź zgodność wtyczek |

## Kopia zapasowa — dwie części

1. **Pliki** — zwłaszcza `wp-content` (motywy, wtyczki, **uploads** z mediami) i `wp-config.php`.
2. **Baza danych** — wpisy, strony, ustawienia, użytkownicy.

Bez bazy kopia plików nie odtworzy treści, a bez plików — mediów i wyglądu.

### Jak zrobić

- **Wtyczką** (np. UpdraftPlus) — automatycznie, z harmonogramem i wysyłką do chmury.
- **Ręcznie**:
  - pliki: skopiowanie katalogu strony (FTP / menedżer plików),
  - baza: **phpMyAdmin → wybierz bazę → Eksport** (format SQL) — odtwarza się ją przez **Import**.
- **Panel hostingu** — wielu dostawców robi kopie codziennie.

Kopie przechowuj **poza serwerem** strony (zasada 3-2-1) i **sprawdzaj**, czy da się z nich odtworzyć stronę.

## Bezpieczna aktualizacja — procedura

1. Zrób pełną kopię (pliki + baza).
2. Najlepiej przetestuj aktualizację na **kopii testowej** (staging) strony.
3. Aktualizuj po kolei: wtyczki → motyw → rdzeń (lub zgodnie z zaleceniami).
4. Sprawdź stronę: wygląd, formularze, logowanie, sklep.
5. Gdy coś się zepsuło — przywróć kopię albo wyłącz winną wtyczkę (np. zmieniając nazwę jej katalogu przez FTP).

## Inne dobre praktyki bezpieczeństwa

- Silne hasło administratora i login inny niż „admin”, uwierzytelnianie dwuskładnikowe.
- Usuń nieużywane wtyczki i motywy.
- Ograniczenie prób logowania.
- Tryb konserwacji podczas większych prac.
- HTTPS na całej stronie.

## Na egzaminie

- Kopia = pliki **i** baza danych.
- Eksport bazy w phpMyAdmin: zakładka **Eksport**, przywracanie: **Import**.
- Nieaktualne wtyczki to główne źródło włamań.

## Sprawdź się

1. Z jakich dwóch części składa się pełna kopia zapasowa strony na WordPressie?
2. Jak w phpMyAdmin zrobić kopię bazy danych?
3. Co zrobisz przed aktualizacją ważnej wtyczki sklepu?

**Odpowiedzi:** 1. Z plików (zwłaszcza `wp-content` i `wp-config.php`) i bazy danych. 2. Wybrać bazę → zakładka Eksport → zapisać plik SQL. 3. Zrobię pełną kopię zapasową i najlepiej sprawdzę aktualizację na kopii testowej.
