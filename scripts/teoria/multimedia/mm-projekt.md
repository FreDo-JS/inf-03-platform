**W skrócie:** stronę najpierw się **projektuje**, a dopiero potem koduje. Projekt odpowiada na pytania: dla kogo jest strona, co ma na niej być i gdzie. Jego efektem jest **makieta** (wireframe) — prosty szkic układu bez kolorów i ozdobników.

## Etapy projektowania

1. **Analiza** — cel strony, odbiorcy, wymagania klienta, przegląd konkurencji.
2. **Struktura treści** — jakie podstrony i sekcje, w jakiej kolejności (mapa strony).
3. **Makieta (wireframe)** — szare prostokąty: gdzie nagłówek, menu, treść, stopka.
4. **Projekt graficzny (mockup)** — kolory, kroje pisma, zdjęcia.
5. **Prototyp** — klikalna wersja, którą można przetestować z użytkownikiem.
6. **Kodowanie** i testy na różnych urządzeniach.

## Typowy układ strony

```
+--------------------------------+
|  header: logo + nav (menu)     |
+--------------------------------+
|  baner / sekcja główna         |
+----------------------+---------+
|  main: treść         | aside   |
|                      | (boczny)|
+----------------------+---------+
|  footer: kontakt, prawa        |
+--------------------------------+
```

W HTML5 odpowiadają mu znaczniki semantyczne: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`.

## Zasady dobrego projektu

- **Hierarchia wizualna** — najważniejsze rzeczy największe i najwyżej (jeden `h1`).
- **Siatka i wyrównanie** — elementy trzymają się wspólnych linii.
- **Odstępy (whitespace)** — puste miejsce poprawia czytelność.
- **Spójność** — te same przyciski, kolory i odstępy na każdej podstronie.
- **Mobile first** — projekt najpierw na telefon, potem na szersze ekrany (RWD).
- **Wezwanie do działania** — widoczny główny przycisk („Zapisz się”, „Kup”).

## Narzędzia

Kartka i ołówek, **Figma**, Penpot, Balsamiq.

## Analiza istniejącego projektu

Patrząc na gotową stronę, sprawdź: czy od razu wiadomo, czego dotyczy? czy menu jest jasne? czy tekst jest czytelny na telefonie? ile trwa wczytanie? czy da się obsłużyć stronę klawiaturą?

## Na egzaminie

- Makieta ≠ projekt graficzny: makieta to sam układ, bez kolorów.
- Znaczniki semantyczne odpowiadają częściom układu.
- W zadaniu praktycznym rozmieszczenie bloków jest zwykle podane rysunkiem — to właśnie makieta.

## Sprawdź się

1. Czym różni się makieta od projektu graficznego?
2. Który znacznik HTML5 odpowiada głównej treści strony?
3. Co oznacza podejście „mobile first”?

**Odpowiedzi:** 1. Makieta pokazuje tylko układ elementów, projekt graficzny dodaje kolory, kroje i zdjęcia. 2. `<main>`. 3. Projektowanie najpierw dla małych ekranów, potem rozszerzanie na większe.
