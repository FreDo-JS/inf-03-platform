**W skrócie:** typografia to dobór **kroju pisma, wielkości, odstępów i długości wiersza**. Dobrze ułożony tekst czyta się bez wysiłku — źle ułożony zniechęca, nawet gdy treść jest świetna.

## Kroje pisma

| Rodzaj | Cecha | Przykłady | Użycie |
|---|---|---|---|
| **Szeryfowy** (serif) | małe „stopki” na końcach liter | Georgia, Times New Roman | dłuższe teksty, styl klasyczny |
| **Bezszeryfowy** (sans-serif) | proste zakończenia | Arial, Roboto, Open Sans | interfejsy, ekrany — najczęstszy wybór |
| **Monospace** | wszystkie znaki tej samej szerokości | Courier New, Consolas | kod |
| Ozdobny / odręczny | wyrazisty | — | tylko nagłówki, oszczędnie |

Zasada: **najwyżej 2 kroje** na stronę (np. jeden do nagłówków, drugi do treści).

## Właściwości CSS

```css
body {
  font-family: "Open Sans", Arial, sans-serif;  /* lista zapasowa! */
  font-size: 16px;
  line-height: 1.5;
  color: #222;
}
h1 { font-size: 2rem; font-weight: 700; }
p  { max-width: 70ch; }
```

| Właściwość | Za co odpowiada |
|---|---|
| `font-family` | krój — zawsze z krojami zapasowymi na końcu (`sans-serif`) |
| `font-size` | wielkość: `px`, `em` (względem rodzica), `rem` (względem `html`) |
| `font-weight` | grubość: `normal` (400), `bold` (700) |
| `line-height` | interlinia — dla treści ok. **1,4–1,6** |
| `letter-spacing` | odstęp między literami |
| `text-align` | wyrównanie — długie teksty do lewej, nie do środka |
| `text-transform` | `uppercase` — wielkie litery bez przepisywania tekstu |

## Czytelność

- Tekst główny **co najmniej 16 px**.
- Długość wiersza ok. **50–75 znaków** (`max-width: 70ch`).
- Wyraźna **hierarchia**: `h1` > `h2` > `h3` > tekst — różnica wielkości i grubości.
- Unikaj długich bloków pisanych wielkimi literami i justowania bez dzielenia wyrazów (tworzą „rzeki” odstępów).

## Fonty z internetu

Google Fonts albo pliki na własnym serwerze przez `@font-face`. Każdy font to dodatkowe pobieranie — bierz tylko potrzebne grubości.

## Na egzaminie

- `font-family` z listą zapasową, zakończoną rodziną ogólną (`serif`, `sans-serif`, `monospace`).
- `rem` liczy się od wielkości czcionki elementu `html`, `em` — od rodzica.
- Krój bezszeryfowy = bez „stopek”.

## Sprawdź się

1. Dlaczego w `font-family` podaje się kilka krojów?
2. Jaką interlinię (`line-height`) zaleca się dla tekstu ciągłego?
3. Czym różni się jednostka `rem` od `em`?

**Odpowiedzi:** 1. Jeśli pierwszego nie ma na komputerze użytkownika, przeglądarka użyje kolejnego. 2. Ok. 1,4–1,6. 3. `rem` odnosi się do rozmiaru czcionki elementu `html`, `em` — do rozmiaru rodzica.
