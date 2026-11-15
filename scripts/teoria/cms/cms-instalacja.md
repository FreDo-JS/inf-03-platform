**W skrócie:** **CMS** (system zarządzania treścią) pozwala prowadzić stronę bez pisania kodu: treść dodaje się w panelu administracyjnym, a wygląd zapewnia motyw. **WordPress** to najpopularniejszy CMS — napisany w PHP, dane trzyma w bazie MySQL/MariaDB. Instalacja to: serwer → baza danych → pliki → kreator instalacji.

## Czego potrzebuje WordPress

- serwer WWW (Apache lub nginx) z **PHP**,
- baza **MySQL / MariaDB**,
- lokalnie wystarczy **XAMPP** (Apache + MariaDB + PHP).

## Instalacja lokalna w XAMPP — krok po kroku

1. Uruchom w panelu XAMPP moduły **Apache** i **MySQL**.
2. Wejdź na `http://localhost/phpmyadmin` i **utwórz pustą bazę**, np. `wordpress`, z kodowaniem `utf8mb4_general_ci`.
3. Pobierz WordPressa z **wordpress.org**, rozpakuj do `C:\xampp\htdocs\wordpress`.
4. Otwórz `http://localhost/wordpress` — ruszy **kreator instalacji**.
5. Podaj dane bazy:
   - nazwa bazy: `wordpress`,
   - użytkownik: `root`, hasło: puste (domyślnie w XAMPP),
   - serwer bazy: `localhost`,
   - **prefiks tabel**: domyślnie `wp_` (na prawdziwym serwerze warto zmienić).
6. Kreator zapisze ustawienia w pliku **`wp-config.php`**.
7. Podaj **nazwę witryny**, **login i hasło administratora** (nie „admin”!) oraz e-mail.
8. Zaloguj się do panelu: `http://localhost/wordpress/wp-admin`.

## Najważniejsze pliki i katalogi

| Element | Zawartość |
|---|---|
| `wp-config.php` | dane połączenia z bazą, klucze bezpieczeństwa, prefiks tabel |
| `wp-content/themes/` | motywy |
| `wp-content/plugins/` | wtyczki |
| `wp-content/uploads/` | wgrane pliki (biblioteka mediów) |
| `wp-admin/` | panel administracyjny |

Treść (wpisy, strony, ustawienia, użytkownicy) leży w **bazie danych**, a nie w plikach.

## Podstawowa konfiguracja po instalacji

- **Ustawienia → Ogólne**: tytuł witryny, opis, strefa czasowa, format daty.
- **Ustawienia → Bezpośrednie odnośniki**: ładne adresy, np. „Nazwa wpisu” (`/o-nas/` zamiast `/?p=12`).
- **Ustawienia → Czytanie**: co jest stroną główną (najnowsze wpisy czy wybrana strona).
- Usuń przykładowy wpis, stronę i komentarz.

## Na egzaminie

- WordPress = PHP + MySQL; bazę tworzy się przed instalacją.
- Dane do bazy trafiają do `wp-config.php`.
- Panel administracyjny: `/wp-admin`.

## Sprawdź się

1. Co trzeba przygotować w phpMyAdmin przed instalacją WordPressa?
2. W którym pliku zapisane są dane połączenia z bazą?
3. Gdzie zmienić adresy stron na czytelne (bez `?p=12`)?

**Odpowiedzi:** 1. Pustą bazę danych. 2. `wp-config.php`. 3. Ustawienia → Bezpośrednie odnośniki.
