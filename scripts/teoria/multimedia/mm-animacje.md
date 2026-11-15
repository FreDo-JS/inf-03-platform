**W skrócie:** ruch na stronie można zrobić trzema drogami: **animowany GIF** (gotowy plik), **animacje CSS** (`transition` i `@keyframes`) albo **SVG** (grafika wektorowa animowana CSS-em lub JavaScriptem). Dziś najczęściej wybiera się CSS — jest lekki i płynny.

## Porównanie

| Sposób | Zalety | Wady |
|---|---|---|
| **GIF** | działa wszędzie, wystarczy `<img>` | tylko 256 kolorów, duże pliki, brak kontroli |
| **CSS** | lekkie, płynne, łatwo zmieniać | dla złożonych animacji kod robi się długi |
| **SVG** | ostre w każdej skali, mały rozmiar | wymaga przygotowania grafiki wektorowej |
| Krótkie wideo (MP4/WebM) | dużo lepsza jakość niż GIF przy mniejszym rozmiarze | potrzebuje `<video autoplay muted loop>` |

## Przejście — `transition`

Płynna zmiana właściwości po zdarzeniu, np. najechaniu myszą:

```css
.przycisk {
  background-color: #1565c0;
  transition: background-color 0.3s ease;
}
.przycisk:hover {
  background-color: #0d47a1;
}
```

Zapis: `transition: właściwość czas funkcja-czasu opóźnienie;`

## Animacja — `@keyframes`

Działa sama, bez zdarzenia, może się powtarzać:

```css
@keyframes pulsowanie {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.logo {
  animation: pulsowanie 2s ease-in-out infinite;
}
```

Zapis skrócony: `animation: nazwa czas funkcja-czasu liczba-powtórzeń;` (`infinite` = bez końca).

## Co animować, żeby było płynnie

Najlepiej **`transform`** (przesunięcie, obrót, skala) i **`opacity`** — przeglądarka liczy je wydajnie. Animowanie `width`, `top` czy `margin` potrafi „szarpać”.

## Dostępność

Część osób źle znosi ruch na ekranie. Szanuj ich ustawienie systemowe:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none; transition: none; }
}
```

## Na egzaminie

- `transition` potrzebuje zmiany (np. `:hover`), `@keyframes` + `animation` działa sam.
- `infinite` — animacja bez końca.
- GIF ma ograniczoną paletę (256 kolorów).

## Sprawdź się

1. Który zapis sprawi, że animacja `obrot` będzie trwała 3 s i powtarzała się bez końca?
2. Dlaczego zamiast długiego GIF-a lepiej dać krótkie wideo MP4?
3. Które właściwości najlepiej animować, żeby ruch był płynny?

**Odpowiedzi:** 1. `animation: obrot 3s linear infinite;` 2. Mniejszy plik i lepsza jakość (GIF ma tylko 256 kolorów). 3. `transform` i `opacity`.
