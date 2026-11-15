**W skrócie:** **tryb barw** określa, jak obraz zapisuje kolory: **RGB** dla ekranów, **CMYK** dla druku, **skala szarości** dla obrazów czarno-białych. **Głębia kolorów** mówi, ile bitów przypada na piksel — a więc ile różnych kolorów da się zapisać.

## Tryby barw

| Tryb | Składowe | Rodzaj mieszania | Zastosowanie |
|---|---|---|---|
| **RGB** | czerwony, zielony, niebieski | **addytywne** — światło; wszystkie na max = biały | ekrany, strony WWW |
| **CMYK** | cyjan, magenta, żółty, czarny (Key) | **subtraktywne** — farba; wszystkie = ciemny/czarny | druk |
| **Skala szarości** | jasność od czerni do bieli | — | zdjęcia czarno-białe, mniejsze pliki |
| **Indeksowany** | ograniczona paleta (np. 256 kolorów) | — | GIF, małe PNG |
| **HSV / HSB** | barwa, nasycenie, jasność | — | wygodny wybór koloru w programach |

Barwy RGB wyświetlone na ekranie mogą wyjść w druku **inaczej** (ciemniej, mniej nasycone) — zakres barw CMYK jest mniejszy.

GIMP pracuje w RGB lub skali szarości; zmiana: **Obraz → Tryb**. Do profesjonalnego przygotowania druku w CMYK zwykle używa się innych programów lub wtyczek.

## Głębia kolorów

| Bity na piksel | Liczba kolorów | Gdzie |
|---|---|---|
| 1 bit | 2 (czarny, biały) | grafika jednobitowa |
| 8 bitów | 256 | GIF, skala szarości, tryb indeksowany |
| **24 bity** (3 × 8) | ok. **16,7 mln** (2²⁴) | „true color”: JPG, PNG |
| 32 bity | 16,7 mln + 8 bitów kanału alfa | PNG z przezroczystością |

Liczba kolorów = **2 do potęgi liczby bitów**.

## Zapis koloru w RGB

Każda składowa 0–255: biały `rgb(255, 255, 255)` = `#FFFFFF`, czarny `#000000`, czerwony `#FF0000`, szary `#808080`.

## Na egzaminie

- RGB — ekran, addytywne; CMYK — druk, subtraktywne.
- 24-bitowa głębia ≈ 16,7 mln kolorów; 8-bitowa = 256.
- „K” w CMYK to czarny (Key), nie „Kolor”.

## Sprawdź się

1. W jakim trybie barw przygotowuje się grafikę na stronę internetową?
2. Ile kolorów zapisze obraz o głębi 8 bitów?
3. Co powstanie po zmieszaniu na ekranie czerwieni, zieleni i niebieskiego w pełnej mocy?

**Odpowiedzi:** 1. RGB. 2. 256. 3. Biały (mieszanie addytywne).
