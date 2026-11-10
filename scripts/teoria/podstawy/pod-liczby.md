**W skrócie:** komputer zapisuje wszystko w **systemie dwójkowym** (0 i 1). Systemy ósemkowy i szesnastkowy to skróty do wygodnego zapisu długich ciągów bitów — szesnastkowy spotkasz codziennie w kolorach CSS (`#ff8800`).

## System pozycyjny

Wartość cyfry zależy od pozycji: każda pozycja to kolejna potęga podstawy.

`1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰ = 8 + 0 + 2 + 1 = 11₁₀`

| System | Podstawa | Cyfry | Przykład |
|---|---|---|---|
| dwójkowy (BIN) | 2 | 0–1 | 1010₂ |
| ósemkowy (OCT) | 8 | 0–7 | 12₈ |
| dziesiętny (DEC) | 10 | 0–9 | 10₁₀ |
| szesnastkowy (HEX) | 16 | 0–9, A–F | A₁₆ |

## Zamiana dziesiętny → dwójkowy

Dziel przez 2 i zapisuj reszty, a potem czytaj je **od dołu**:

25 : 2 = 12 r **1** → 12 : 2 = 6 r **0** → 6 : 2 = 3 r **0** → 3 : 2 = 1 r **1** → 1 : 2 = 0 r **1**

25₁₀ = **11001₂**

## Dwójkowy ↔ szesnastkowy i ósemkowy — na skróty

- **HEX**: grupuj bity **po 4** od prawej. `1010 1111₂ = AF₁₆`
- **OCT**: grupuj bity **po 3** od prawej. `011 001₂ = 31₈`

| HEX | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIN | 0000 | 0001 | 0010 | 0011 | 0100 | 0101 | 0110 | 0111 | 1000 | 1001 | 1010 | 1011 | 1100 | 1101 | 1110 | 1111 |

**Kolory CSS:** `#FF8800` to trzy bajty: czerwony FF (255), zielony 88 (136), niebieski 00 (0).

## Kod U2 — liczby ujemne

W kodzie uzupełnień do dwóch najstarszy bit ma wagę **ujemną**. Dla 8 bitów zakres to **−128 … 127**.

Jak zapisać −5 na 8 bitach:
1. 5 = `00000101`
2. odwróć bity: `11111010`
3. dodaj 1: `11111011` → to jest **−5 w U2**

Sprawdzenie: −128 + 64 + 32 + 16 + 8 + 2 + 1 = −5 ✓

## Na egzaminie

- Zamiany BIN ↔ DEC ↔ HEX to pewne punkty — ćwicz grupowanie po 4 bity.
- Kolor `#000` to czarny, `#FFF` biały — skrócony zapis podwaja każdą cyfrę (`#F80` = `#FF8800`).
- W U2 liczba z jedynką na początku jest **ujemna**.

## Sprawdź się

1. Zamień 1100 1010₂ na HEX.
2. Ile to dziesiętnie: 2F₁₆?
3. Jaki jest zakres liczb 8-bitowych w U2?

**Odpowiedzi:** 1. CA₁₆. 2. 47. 3. Od −128 do 127.
