**W skrócie:** programowanie strukturalne buduje program **tylko z trzech konstrukcji** — sekwencji, wyboru i powtarzania — i dzieli go na **funkcje**. Czytelny kod to taki, który inna osoba (albo Ty za miesiąc) zrozumie bez zgadywania.

## Trzy konstrukcje

| Konstrukcja | Instrukcje |
|---|---|
| **Sekwencja** | instrukcje jedna po drugiej |
| **Wybór** | `if`, `else`, `switch` |
| **Iteracja** | `for`, `while`, `do…while` |

Do tego **podprogramy (funkcje)** — fragmenty z nazwą, które można wywoływać wiele razy. Nie używa się skoków `goto`, które psują przejrzystość.

## Dziel na funkcje

Każda funkcja robi **jedną rzecz** i ma nazwę, która to mówi:

```php
function srednia(array $oceny): float {
    if (count($oceny) === 0) return 0;
    return array_sum($oceny) / count($oceny);
}
```

Zamiast kopiować ten sam kod w trzech miejscach — wywołaj funkcję trzy razy (zasada **DRY**: *Don't Repeat Yourself*).

## Zasady czytelnego kodu

1. **Nazwy mówiące, co przechowują**: `liczbaUczniow`, nie `x` czy `a1`.
2. **Wcięcia** pokazują strukturę — jedno wcięcie na każdy poziom zagnieżdżenia.
3. **Krótkie funkcje** — jeśli funkcja nie mieści się na ekranie, pewnie robi za dużo.
4. **Mało zagnieżdżeń** — zamiast pięciu `if` w sobie, wcześniej wyjdź z funkcji (`return`).
5. **Stałe zamiast „magicznych liczb”**: `const VAT = 0.23;` zamiast samego `0.23` w obliczeniach.
6. **Komentarze wyjaśniają „dlaczego”**, a nie „co” — co robi kod, powinno być widać z niego samego.
7. **Spójny styl** w całym projekcie (jedna konwencja nazw, jednakowe wcięcia).

## Konwencje nazw

| Konwencja | Przykład | Gdzie spotkasz |
|---|---|---|
| camelCase | `cenaBrutto` | JavaScript, Java, C# (zmienne) |
| snake_case | `cena_brutto` | PHP (często), SQL, Python |
| PascalCase | `KoszykZakupow` | nazwy klas |
| UPPER_CASE | `MAX_UCZNIOW` | stałe |

## Przed i po

```js
// przed
function f(a){let s=0;for(let i=0;i<a.length;i++){if(a[i]>0){s=s+a[i]}}return s}

// po
function sumaDodatnich(liczby) {
  let suma = 0;
  for (const liczba of liczby) {
    if (liczba > 0) suma += liczba;
  }
  return suma;
}
```

## Na egzaminie

- Kryteria ręczne w zadaniu praktycznym często oceniają **czytelność kodu**: wcięcia, nazwy, komentarze.
- Trzy konstrukcje programowania strukturalnego: sekwencja, wybór, iteracja.

## Sprawdź się

1. Jakie trzy konstrukcje tworzą program strukturalny?
2. Co oznacza zasada DRY?
3. Dlaczego `const VAT = 0.23` jest lepsze niż samo `0.23` w kilku miejscach kodu?

**Odpowiedzi:** 1. Sekwencja, wybór (rozgałęzienie), iteracja (pętla). 2. Nie powtarzaj tego samego kodu — wydziel go do funkcji. 3. Nazwa wyjaśnia znaczenie, a zmiana stawki wymaga poprawki w jednym miejscu.
