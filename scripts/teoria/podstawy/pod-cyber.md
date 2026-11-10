**W skrócie:** atak to próba uzyskania dostępu do danych, zniszczenia ich albo zablokowania usługi. Najczęściej nie zaczyna się od „hakowania”, tylko od **człowieka**: kliknięcia w link, słabego hasła albo nieaktualnego oprogramowania.

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

**Odpowiedzi:** 1. Koń trojański. 2. Aktualna kopia zapasowa przechowywana osobno. 3. Phishingu.
