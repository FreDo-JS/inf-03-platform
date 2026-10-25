// Zadanie: cennik w tabeli HTML ostylowanej w CSS.
const WIERSZE = [
  ["Przegląd okresowy", "60 min", "150 zł"],
  ["Wymiana oleju", "45 min", "120 zł"],
  ["Wymiana klocków hamulcowych", "90 min", "280 zł"],
  ["Geometria kół", "50 min", "130 zł"],
  ["Diagnostyka komputerowa", "30 min", "90 zł"],
  ["Wymiana opon", "40 min", "100 zł"],
];

const wiersze = WIERSZE.map(
  ([a, b, c]) => `      <tr>
        <td>${a}</td>
        <td>${b}</td>
        <td>${c}</td>
      </tr>`,
).join("\n");

const zadanie = {
  title: "Cennik w tabeli (HTML/CSS)",
  summary: "Tabela z nagłówkiem, podpisem i zebrą w CSS — semantyczna, bez sztuczek z układem.",
  minutes: 60,
  studentCanRunTests: true,
  sheet: `## Zadanie: cennik warsztatu

Przygotuj stronę z cennikiem usług warsztatu w **prawdziwej tabeli HTML**
(nie w układzie z \`div\`-ów). Pracuj w plikach \`index.html\` i \`styl.css\`.
Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją \`<!DOCTYPE html>\`, język strony to \`pl\`, kodowanie UTF-8.
2. Tytuł strony: **Cennik**. Nagłówek pierwszego stopnia: **Cennik warsztatu**.
3. Tabela o identyfikatorze \`cennik\` z podpisem \`<caption>\`: **Cennik usług**.
4. Wiersz nagłówkowy w \`<thead>\`: trzy komórki \`<th scope="col">\` o treści
   **Usługa**, **Czas**, **Cena**.
5. W \`<tbody>\` co najmniej **pięć** wierszy, po trzy komórki \`<td>\`
   (nazwa usługi, czas, cena — dane wymyśl sam).
6. Pod tabelą akapit o identyfikatorze \`uwaga\` z tekstem
   **Ceny zawierają podatek VAT.**

### 2. Plik styl.css

1. Tabela zajmuje całą szerokość strony, a obramowania komórek są scalone
   (\`border-collapse: collapse\`).
2. Komórki nagłówka: tło \`#263238\`, biały tekst.
3. Co drugi wiersz ciała tabeli (\`tbody tr:nth-child(even)\`) ma tło \`#eceff1\`.
4. Komórki mają odstęp wewnętrzny \`8px\`, a **ceny (ostatnia kolumna)** są wyrównane do prawej.
5. Czcionka strony: bezszeryfowa.
`,
  files: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Cennik</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek, tabelę i akapit z uwagą -->

</body>
</html>
`,
    },
    { name: "styl.css", content: "/* Tutaj wpisz style tabeli */\n" },
  ],
  reference: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Cennik</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Cennik warsztatu</h1>

  <table id="cennik">
    <caption>Cennik usług</caption>
    <thead>
      <tr>
        <th scope="col">Usługa</th>
        <th scope="col">Czas</th>
        <th scope="col">Cena</th>
      </tr>
    </thead>
    <tbody>
${wiersze}
    </tbody>
  </table>

  <p id="uwaga">Ceny zawierają podatek VAT.</p>
</body>
</html>
`,
    },
    {
      name: "styl.css",
      content: `body {
  font-family: Arial, sans-serif;
  margin: 24px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background-color: #263238;
  color: #ffffff;
  text-align: left;
}

th,
td {
  padding: 8px;
  border: 1px solid #b0bec5;
}

tbody tr:nth-child(even) {
  background-color: #eceff1;
}

td:last-child {
  text-align: right;
}
`,
    },
  ],
  tests: [
    { id: "t1", name: "DOCTYPE i język strony pl", points: 1, type: "html_lang_doctype", page: "index.html", lang: "pl" },
    { id: "t2", name: "Tytuł strony: Cennik", points: 1, type: "selector_text", page: "index.html", selector: "title", mode: "equals", value: "Cennik" },
    { id: "t3", name: "Nagłówek h1: Cennik warsztatu", points: 1, type: "selector_text", page: "index.html", selector: "h1", mode: "equals", value: "Cennik warsztatu" },
    { id: "t4", name: "Tabela #cennik", points: 1, type: "selector_count", page: "index.html", selector: "table#cennik", min: 1, max: 1 },
    { id: "t5", name: "Podpis tabeli (caption): Cennik usług", points: 2, type: "selector_text", page: "index.html", selector: "table#cennik > caption", mode: "equals", value: "Cennik usług" },
    { id: "t6", name: "Trzy nagłówki kolumn w thead", points: 2, type: "selector_count", page: "index.html", selector: "table#cennik > thead th", min: 3, max: 3 },
    { id: "t7", name: "Nagłówki mają scope=col", points: 2, type: "selector_count", page: "index.html", selector: "table#cennik th[scope=col]", min: 3 },
    { id: "t8", name: "Nagłówek pierwszej kolumny: Usługa", points: 1, type: "selector_text", page: "index.html", selector: "thead th:nth-child(1)", mode: "equals", value: "Usługa" },
    { id: "t9", name: "Nagłówek ostatniej kolumny: Cena", points: 1, type: "selector_text", page: "index.html", selector: "thead th:nth-child(3)", mode: "equals", value: "Cena" },
    { id: "t10", name: "Co najmniej pięć wierszy w tbody", points: 2, type: "selector_count", page: "index.html", selector: "table#cennik > tbody > tr", min: 5 },
    { id: "t11", name: "Każdy wiersz ma trzy komórki td", points: 2, type: "selector_count", page: "index.html", selector: "tbody tr td:nth-child(3)", min: 5 },
    { id: "t12", name: "Akapit z uwagą o VAT", points: 1, type: "selector_text", page: "index.html", selector: "p#uwaga", mode: "equals", value: "Ceny zawierają podatek VAT." },
    { id: "t13", name: "Obramowania komórek scalone", points: 2, type: "css_computed", page: "index.html", selector: "table#cennik", property: "border-collapse", expected: "collapse" },
    { id: "t14", name: "Nagłówek: tło #263238", points: 2, type: "css_computed", page: "index.html", selector: "thead th", property: "background-color", expected: "#263238" },
    { id: "t15", name: "Nagłówek: biały tekst", points: 1, type: "css_computed", page: "index.html", selector: "thead th", property: "color", expected: "#ffffff" },
    { id: "t16", name: "Zebra: parzysty wiersz ma tło #eceff1", points: 3, type: "css_computed", page: "index.html", selector: "tbody tr:nth-child(2)", property: "background-color", expected: "#eceff1" },
    { id: "t17", name: "Odstęp wewnętrzny komórek 8px", points: 1, type: "css_computed", page: "index.html", selector: "tbody td", property: "padding-top", expected: "8px" },
    { id: "t18", name: "Ceny wyrównane do prawej", points: 2, type: "css_computed", page: "index.html", selector: "tbody tr:nth-child(1) td:last-child", property: "text-align", expected: "right" },
    { id: "t19", name: "Struktura nagłówków (jeden h1)", points: 1, type: "heading_structure", page: "index.html" },
    { id: "t20", name: "Tabela nie jest stylowana atrybutami (bez border= i bgcolor=)", points: 1, type: "file_content", file: "index.html", mode: "regex", value: "(border|bgcolor|cellpadding|cellspacing)\\s*=", ignoreCase: true, negate: true },
  ],
  criteria: [
    { id: "k1", name: "Czytelność tabeli", description: "Odstępy, kontrast, zebra — tabelę dobrze się czyta.", points: 4 },
    { id: "k2", name: "Poprawna semantyka", description: "thead/tbody/caption użyte zgodnie z przeznaczeniem.", points: 3 },
    { id: "k3", name: "Porządek w kodzie", description: "Wcięcia, brak powtórzeń w CSS.", points: 3 },
  ],
};

export default zadanie;
