**W skrócie:** komputer dobiera się do zadań, a nie „na najlepszy”. Programista potrzebuje przede wszystkim szybkiego dysku SSD, dużo pamięci RAM i dobrego monitora — gra komputerowa potrzebuje mocnej karty graficznej.

## Najważniejsze parametry

| Podzespół | Parametr | Jednostka | Co oznacza w praktyce |
|---|---|---|---|
| Procesor (CPU) | liczba rdzeni i wątków | szt. | ile zadań naraz (kompilacja, Docker, przeglądarka) |
| | taktowanie | GHz | jak szybko liczy jeden rdzeń |
| | pamięć podręczna (cache) | MB | szybka pamięć w samym procesorze |
| Pamięć RAM | pojemność | GB | ile programów i kart przeglądarki zmieści się naraz |
| | częstotliwość, typ | MHz, DDR4/DDR5 | szybkość wymiany danych z procesorem |
| Dysk | typ | HDD / SSD SATA / SSD NVMe | SSD uruchamia system i projekty kilka razy szybciej niż HDD |
| | pojemność | GB / TB | miejsce na system, projekty, obrazy maszyn wirtualnych |
| Karta graficzna (GPU) | pamięć | GB | ważna przy grach, grafice 3D i uczeniu maszynowym |
| Monitor | rozdzielczość, przekątna | px, cale | ile kodu widać naraz |
| Zasilacz | moc | W | musi mieć zapas względem sumy poboru podzespołów |

## Jak dobrać stanowisko programisty

1. **Dysk SSD** (najlepiej NVMe) — to on najbardziej wpływa na odczucie „szybkości” komputera.
2. **RAM: 16 GB to rozsądne minimum**, 32 GB przy maszynach wirtualnych lub kontenerach.
3. **Procesor** wielordzeniowy — kompilacja i narzędzia deweloperskie korzystają z wielu rdzeni.
4. **Monitor** Full HD lub lepszy, często dwa — kod na jednym, podgląd strony na drugim.
5. **Ergonomia**: monitor na wysokości oczu, odległość ok. 50–70 cm, krzesło z regulacją (to łączy się z działem BHP).

## Przykład

Strona internetowa w PHP i MySQL, edytor VS Code i XAMPP: wystarczy procesor 4–6 rdzeni, 16 GB RAM, SSD 512 GB i zintegrowana karta graficzna. Droga karta graficzna nic tu nie da — tych narzędzi nie przyspiesza.

## Na egzaminie

- Jednostki pojemności: 1 KB = 1024 B (tradycyjnie w informatyce), producenci dysków liczą 1 GB = 1000 MB — dlatego „1 TB” w systemie pokazuje się jako ok. 931 GB.
- Prędkość transmisji podaje się w **bitach** na sekundę (Mb/s), a rozmiar plików w **bajtach** (MB). 1 bajt = 8 bitów.
- Pytania typu „który podzespół poprawi…” — szukaj wąskiego gardła: wolny system przy SSD i 4 GB RAM to zwykle brak pamięci, nie procesor.

## Sprawdź się

1. Co bardziej przyspieszy codzienną pracę programisty na starym laptopie: wymiana HDD na SSD czy szybsza karta graficzna?
2. Łącze ma 100 Mb/s. Ile w najlepszym razie trwa pobranie pliku 100 MB?
3. Dlaczego dysk 1 TB w systemie pokazuje ok. 931 GB?

**Odpowiedzi:** 1. Wymiana na SSD. 2. Około 8 sekund (100 MB = 800 Mb). 3. Producent liczy 1 TB = 10¹² bajtów, a system dzieli przez 1024³.
