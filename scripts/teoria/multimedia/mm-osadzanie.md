**W skrócie:** wideo i dźwięk wstawiasz znacznikami `<video>` i `<audio>`. Atrybuty decydują, czy pojawią się przyciski, czy plik odtworzy się sam i w pętli. Filmy z YouTube czy Vimeo osadza się ramką `<iframe>` z kodu udostępniania.

## Znacznik `<video>`

```html
<video controls width="640" poster="okladka.jpg">
  <source src="film.webm" type="video/webm">
  <source src="film.mp4" type="video/mp4">
  Twoja przeglądarka nie obsługuje wideo.
</video>
```

Przeglądarka bierze **pierwsze** źródło `<source>`, które umie odtworzyć. Tekst w środku widać tylko w bardzo starych przeglądarkach.

## Najważniejsze atrybuty

| Atrybut | Znaczenie |
|---|---|
| `controls` | pokazuje przyciski (odtwórz, głośność, pełny ekran) |
| `autoplay` | uruchamia od razu — przeglądarki pozwalają na to zwykle tylko z `muted` |
| `muted` | wycisza |
| `loop` | odtwarza w pętli |
| `poster` | obrazek widoczny przed uruchomieniem filmu |
| `preload` | `none` / `metadata` / `auto` — ile pobrać przed kliknięciem |
| `width`, `height` | wymiary odtwarzacza |

Tło strony z filmem: `<video autoplay muted loop playsinline>`.

## Znacznik `<audio>`

```html
<audio controls>
  <source src="utwor.mp3" type="audio/mpeg">
  <source src="utwor.ogg" type="audio/ogg">
</audio>
```

Atrybuty jak w `<video>` (bez `poster`, `width`, `height`).

## Napisy — `<track>`

```html
<track src="napisy.vtt" kind="subtitles" srclang="pl" label="Polski">
```

Plik napisów w formacie **WebVTT** (.vtt). Napisy to też wymóg dostępności (WCAG).

## Serwisy zewnętrzne

YouTube → „Udostępnij” → „Umieść” daje kod `<iframe src="https://www.youtube.com/embed/...">`. Zalety: brak obciążenia własnego serwera, gotowy odtwarzacz. Wady: reklamy, ciasteczka serwisu, zależność od zewnętrznego dostawcy.

## Na egzaminie

- Bez atrybutu `controls` uczeń nie zobaczy przycisków — częsty błąd w zadaniach praktycznych.
- `autoplay` zadziała zwykle dopiero z `muted`.
- Kilka `<source>` = zapas formatów dla różnych przeglądarek.

## Sprawdź się

1. Jakiego atrybutu brakuje, jeśli film się wyświetla, ale nie ma przycisków?
2. Do czego służy atrybut `poster`?
3. W jakim formacie zapisuje się napisy dla `<track>`?

**Odpowiedzi:** 1. `controls`. 2. Wyświetla obrazek przed uruchomieniem filmu. 3. WebVTT (.vtt).
