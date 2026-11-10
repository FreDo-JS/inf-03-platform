**W skrócie:** komputer działa według **architektury von Neumanna** — procesor pobiera z pamięci kolejne rozkazy i dane, wykonuje je i zapisuje wyniki. Wszystko łączą **magistrale**, czyli „drogi”, którymi płyną dane, adresy i sygnały sterujące.

## Najważniejsze elementy

| Element | Rola |
|---|---|
| **Procesor (CPU)** | wykonuje rozkazy programu |
| ALU (jednostka arytmetyczno-logiczna) | liczy: dodawanie, porównania, operacje logiczne |
| jednostka sterująca (CU) | pobiera rozkazy i steruje resztą procesora |
| rejestry | najszybsza, bardzo mała pamięć wewnątrz procesora |
| pamięć podręczna (cache L1/L2/L3) | szybki bufor między procesorem a RAM |
| **Pamięć operacyjna (RAM)** | przechowuje uruchomione programy i ich dane; **ulotna** — znika po wyłączeniu zasilania |
| **Pamięć ROM / UEFI (BIOS)** | nieulotna, uruchamia komputer i sprawdza sprzęt (POST) |
| **Pamięć masowa** (SSD, HDD) | trwałe przechowywanie plików |
| **Magistrale** | danych, adresowa i sterująca |
| Urządzenia wejścia/wyjścia | klawiatura, monitor, karta sieciowa… |

## Hierarchia pamięci

Im bliżej procesora, tym pamięć **szybsza, mniejsza i droższa**:

**rejestry → cache L1 → L2 → L3 → RAM → SSD → HDD → pamięć w chmurze**

Dlatego program, który ciągle czyta z dysku, jest dużo wolniejszy niż ten, który trzyma dane w RAM.

## Cykl rozkazowy

1. **Pobranie** rozkazu z pamięci (adres podaje licznik rozkazów).
2. **Dekodowanie** — jednostka sterująca sprawdza, co to za rozkaz.
3. **Wykonanie** — np. ALU dodaje dwie liczby.
4. **Zapis wyniku** do rejestru lub pamięci, przejście do kolejnego rozkazu.

## Jak to rozumieć

Procesor to kucharz, RAM to blat kuchenny, a dysk to spiżarnia. Kucharz pracuje tylko na tym, co leży na blacie. Mały blat (mało RAM) oznacza ciągłe chodzenie do spiżarni (dysku), więc wszystko trwa dłużej, nawet jeśli kucharz jest szybki.

## Na egzaminie

- **RAM jest ulotna, ROM nie** — częste pytanie zamknięte.
- Szerokość magistrali adresowej określa, ile pamięci da się zaadresować: 32 bity → 2³² adresów = 4 GB.
- Cache **nie** jest tym samym co RAM — to osobna, szybsza pamięć w procesorze.

## Sprawdź się

1. Która pamięć traci zawartość po wyłączeniu komputera: RAM, ROM czy SSD?
2. Która część procesora wykonuje dodawanie?
3. Ułóż od najszybszej: RAM, rejestr, SSD, cache L2.

**Odpowiedzi:** 1. RAM. 2. ALU. 3. Rejestr, cache L2, RAM, SSD.
