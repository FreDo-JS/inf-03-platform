**W skrócie:** na ekranie liczą się **wymiary w pikselach** (np. 1920×1080). **DPI/PPI** (punkty na cal) ma znaczenie dopiero przy **druku** — mówi, ile pikseli przypadnie na cal papieru, a więc jak duży i jak ostry będzie wydruk.

## Pojęcia

| Pojęcie | Znaczenie |
|---|---|
| **Wymiary w pikselach** | szerokość × wysokość obrazu, np. 1200 × 800 px |
| **Rozdzielczość (PPI / DPI)** | liczba pikseli (punktów) na cal; 1 cal = **2,54 cm** |
| **Megapiksele** | liczba pikseli w milionach: 6000 × 4000 = 24 Mpx |
| **Proporcje** | stosunek boków, np. 16:9, 4:3, 3:2, 1:1 |

**PPI** dotyczy pikseli obrazu, **DPI** — punktów drukarki; w praktyce oba skróty używa się zamiennie.

## Rozmiar wydruku

**rozmiar w calach = piksele ÷ PPI**, a w centymetrach: **(piksele ÷ PPI) × 2,54**.

Zdjęcie 3000 × 2000 px przy **300 PPI**: 3000 ÷ 300 = 10 cali = **25,4 cm** szerokości, 2000 ÷ 300 ≈ 6,67 cala ≈ **16,9 cm** wysokości.

To samo zdjęcie przy 150 PPI wydrukuje się dwa razy większe, ale mniej ostre.

| Zastosowanie | Typowa rozdzielczość |
|---|---|
| ekran, strona WWW | liczą się tylko piksele (metadana DPI nie ma znaczenia) |
| druk ulotek, zdjęć | **300 DPI** |
| plakat oglądany z daleka | 150 DPI wystarcza |

## W GIMP-ie

- **Obraz → Skaluj obraz** — zmienia liczbę pikseli (skaluje).
- **Obraz → Rozmiar wydruku** — zmienia tylko DPI, piksele zostają (zdjęcie się nie zmienia, zmienia się rozmiar na papierze).
- **Obraz → Rozmiar płótna** — powiększa/zmniejsza „kartkę” bez skalowania zawartości.

Pilnuj **łańcucha proporcji** przy skalowaniu, inaczej obraz się zniekształci.

## Pułapka: powiększanie

Zmniejszanie jest bezpieczne. **Powiększanie** rastra nie doda szczegółów — program „wymyśla” brakujące piksele (interpolacja), więc obraz robi się rozmyty.

## Na egzaminie

- 1 cal = 2,54 cm; druk dobrej jakości = 300 DPI.
- Na ekranie znaczenie mają piksele, a nie DPI.
- Skalowanie zmienia piksele, „Rozmiar wydruku” tylko DPI.

## Sprawdź się

1. Ile cm szerokości będzie miał wydruk obrazu 1800 px przy 300 DPI?
2. Czy zmiana DPI z 72 na 300 w „Rozmiarze wydruku” poprawi jakość zdjęcia na stronie?
3. Ile megapikseli ma zdjęcie 4000 × 3000 px?

**Odpowiedzi:** 1. 1800 ÷ 300 = 6 cali ≈ 15,24 cm. 2. Nie — na ekranie liczą się piksele, a ich liczba się nie zmieniła. 3. 12 Mpx.
