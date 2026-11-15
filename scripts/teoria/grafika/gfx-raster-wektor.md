**W skrócie:** grafika **rastrowa** to siatka kolorowych pikseli — idealna na zdjęcia, ale traci jakość przy powiększaniu. Grafika **wektorowa** to opis kształtów wzorami (linie, krzywe, wypełnienia) — można ją powiększać bez końca, ale nie nadaje się do zdjęć.

## Porównanie

| | Rastrowa (bitmapa) | Wektorowa |
|---|---|---|
| Z czego się składa | z pikseli | z obiektów: punktów, linii, krzywych Béziera |
| Powiększanie | pojawiają się „schodki” i rozmycie | zawsze ostra |
| Rozmiar pliku | rośnie z liczbą pikseli | zależy od liczby obiektów, zwykle mały |
| Najlepsza do | zdjęć, obrazów z płynnymi przejściami barw | logo, ikon, wykresów, map, napisów |
| Formaty | JPG, PNG, GIF, WebP, BMP, TIFF | SVG, AI, EPS, PDF (częściowo) |
| Programy | **GIMP**, Photoshop, Krita | **Inkscape**, Illustrator, CorelDRAW |

## Jak to rozumieć

Rastrowe logo 200×200 px na billboardzie trzeba by rozciągnąć wielokrotnie — piksele zrobią się widoczne jak klocki. To samo logo w SVG wydrukuje się ostro w każdym rozmiarze, bo komputer od nowa przelicza kształty.

## Rasteryzacja i wektoryzacja

- **Rasteryzacja** — zamiana wektora na piksele (dzieje się zawsze przy wyświetlaniu na ekranie i przy eksporcie SVG do PNG).
- **Wektoryzacja (trasowanie)** — zamiana bitmapy na wektory (np. w Inkscape: Ścieżka → Wektoryzuj bitmapę); dobrze działa dla prostych, kontrastowych rysunków, słabo dla zdjęć.

## Na stronie WWW

- Zdjęcia → raster (JPG, WebP).
- Logo, ikony, proste ilustracje → **SVG** — ostre na ekranach o dużej gęstości pikseli i zwykle bardzo lekkie.
- SVG można wstawić jako `<img src="logo.svg">` albo bezpośrednio w kod HTML i stylować CSS-em.

## Na egzaminie

- Która grafika traci jakość przy powiększaniu → rastrowa.
- Format wektorowy na strony → SVG.
- GIMP to program do grafiki **rastrowej**, Inkscape — **wektorowej**.

## Sprawdź się

1. Jaki rodzaj grafiki wybierzesz na logo, które ma być na wizytówce i na billboardzie?
2. W jakim programie z darmowych edytujesz grafikę wektorową?
3. Czy zdjęcie zapisane jako SVG stanie się grafiką wektorową?

**Odpowiedzi:** 1. Wektorową (np. SVG). 2. Inkscape. 3. Nie — SVG może tylko „opakować” obraz rastrowy; zdjęcia nie są zbudowane z kształtów.
