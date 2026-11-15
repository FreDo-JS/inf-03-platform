**W skrócie:** **Joomla!** to drugi popularny CMS w PHP z bazą MySQL. W porównaniu z WordPressem ma bardziej rozbudowane wbudowane funkcje (wielojęzyczność, zaawansowane uprawnienia), ale jest trudniejsza na start. Instaluje się ją podobnie: baza → pliki → kreator.

## Instalacja (XAMPP)

1. Uruchom **Apache** i **MySQL** w XAMPP.
2. W phpMyAdmin utwórz **pustą bazę**, np. `joomla`.
3. Pobierz Joomlę z **joomla.org**, rozpakuj do `htdocs/joomla`.
4. Otwórz `http://localhost/joomla` — kreator instalacji:
   - język, **nazwa witryny**,
   - **dane konta Super Użytkownika** (administratora),
   - **baza danych**: typ MySQLi, host `localhost`, użytkownik `root`, hasło puste, nazwa `joomla`, **prefiks tabel** (losowy, np. `abc12_`).
5. Po instalacji kreator może poprosić o **usunięcie katalogu `installation`** (ze względów bezpieczeństwa).
6. Konfiguracja zapisuje się w pliku **`configuration.php`**.

Panel administracyjny: **`/administrator`**.

## Podstawowe pojęcia Joomli

| Pojęcie | Co to jest | Odpowiednik w WordPressie |
|---|---|---|
| **Artykuł** | treść (tekst, obrazy) | wpis / strona |
| **Kategoria** | grupa artykułów | kategoria |
| **Menu i pozycja menu** | pozycja menu decyduje, **co** pokazać (artykuł, lista kategorii, formularz) | menu |
| **Moduł** | blok wyświetlany w **pozycji** szablonu (menu, logowanie, najnowsze artykuły) | widżet / blok |
| **Komponent** | główna aplikacja w treści strony (artykuły, kontakty, użytkownicy) | — |
| **Szablon** | wygląd witryny i administracji | motyw |
| **Rozszerzenie** | wspólna nazwa: komponenty, moduły, wtyczki, szablony, języki | wtyczka |
| **Super Użytkownik** | pełne uprawnienia | Administrator |

## Typowe zadania w panelu

- **Treść → Artykuły → Nowy** — tytuł, tekst, kategoria, stan (opublikowany / nieopublikowany).
- **Menu → Menu główne → Nowa pozycja** — typ (np. „Pojedynczy artykuł”) i wybór artykułu.
- **Treść → Moduły witryny** — przypisanie modułu do pozycji szablonu (np. `sidebar-right`).
- **System → Zarządzaj → Rozszerzenia / Instaluj rozszerzenia** — dodawanie rozszerzeń.
- **Użytkownicy** — grupy i poziomy dostępu (rejestrowani, autorzy, edytorzy, publikujący, menedżerowie, administratorzy).
- **System → Aktualizacja** — aktualizacja Joomli (po zrobieniu kopii zapasowej, np. rozszerzeniem Akeeba Backup).

## WordPress czy Joomla

| | WordPress | Joomla! |
|---|---|---|
| Łatwość na start | bardzo łatwy | trudniejsza |
| Liczba motywów i wtyczek | ogromna | mniejsza |
| Wielojęzyczność | przez wtyczkę | wbudowana |
| Uprawnienia | proste role | rozbudowane grupy i poziomy dostępu |
| Typowe użycie | blogi, strony firmowe, sklepy | portale, serwisy z wieloma grupami użytkowników |

## Na egzaminie

- Panel Joomli: `/administrator`, panel WordPressa: `/wp-admin`.
- Moduł wyświetla się w pozycji szablonu; artykuł to podstawowa treść.
- Konfiguracja Joomli: `configuration.php` (WordPress: `wp-config.php`).

## Sprawdź się

1. Pod jakim adresem jest panel administracyjny Joomli?
2. Czym w Joomli jest moduł?
3. Jak w Joomli sprawić, żeby artykuł był dostępny z menu?

**Odpowiedzi:** 1. `/administrator`. 2. Blokiem treści wyświetlanym w wybranej pozycji szablonu (np. menu w kolumnie bocznej). 3. Dodać pozycję menu typu „Pojedynczy artykuł” i wskazać ten artykuł.
