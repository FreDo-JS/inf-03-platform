**W skrócie:** dobra strona ma **mało kolorów**, dobranych świadomie: kolor główny, kolor akcentu i neutralne tła. Tekst musi mieć wystarczający **kontrast** z tłem — inaczej części osób trudno go przeczytać.

## Modele barw

| Model | Gdzie | Zapis w CSS |
|---|---|---|
| **RGB** | ekrany (barwy addytywne: światło) | `rgb(255, 136, 0)`, `#ff8800` |
| **HSL** | wygodne dobieranie odcieni | `hsl(32, 100%, 50%)` — odcień, nasycenie, jasność |
| **CMYK** | druk (barwy subtraktywne: farba) | nie używa się na stronach |

HSL ułatwia budowanie palety: ten sam odcień, różne jasności → spójny zestaw.

## Harmonie barw (koło barw)

- **Monochromatyczna** — jeden odcień w różnych jasnościach; spokojna i bezpieczna.
- **Analogiczna** — sąsiednie barwy na kole (np. niebieski, turkus, zieleń).
- **Dopełniająca** — barwy naprzeciw siebie (niebieski i pomarańczowy); mocny kontrast, dobra na akcent.
- **Triada** — trzy barwy co 120°.

## Zasada 60-30-10

- **60%** — kolor dominujący (zwykle tło, neutralny),
- **30%** — kolor uzupełniający,
- **10%** — **akcent**: przyciski, linki, ważne elementy.

## Kontrast (WCAG)

| Tekst | Minimalny kontrast |
|---|---|
| zwykły (poziom AA) | **4,5 : 1** |
| duży, od ok. 24 px lub 19 px pogrubiony (AA) | 3 : 1 |
| poziom AAA | 7 : 1 |

Szary tekst na szarym tle prawie zawsze nie przechodzi. Sprawdzisz to w narzędziach deweloperskich przeglądarki albo w kalkulatorze kontrastu WebAIM.

**Kolor nie może być jedyną informacją**: pole z błędem oznacz na czerwono *i* komunikatem tekstowym — osoby z daltonizmem mogą czerwieni nie odróżnić.

## Zmienne CSS — jedna paleta dla całej strony

```css
:root {
  --kolor-glowny: #1565c0;
  --kolor-akcent: #ff8f00;
  --tlo: #f5f7fa;
}
button { background: var(--kolor-akcent); }
```

## Na egzaminie

- Zapis `#RRGGBB` i `rgb()` — przelicz HEX na liczby (FF = 255).
- RGB dla ekranu, CMYK dla druku.
- Minimalny kontrast zwykłego tekstu (AA): 4,5 : 1.

## Sprawdź się

1. Jaki kontrast musi mieć zwykły tekst według WCAG na poziomie AA?
2. Który model barw stosuje się w druku?
3. Ile procent powierzchni według zasady 60-30-10 zajmuje kolor akcentu?

**Odpowiedzi:** 1. 4,5 : 1. 2. CMYK. 3. Ok. 10%.
