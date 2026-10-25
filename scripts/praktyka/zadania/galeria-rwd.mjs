// Zadanie: galeria zdjęć, która dopasowuje układ do szerokości ekranu (RWD).
const OBRAZY = [
  ["e57373", "Czerwony"],
  ["64b5f6", "Niebieski"],
  ["81c784", "Zielony"],
  ["ffd54f", "Żółty"],
  ["ba68c8", "Fioletowy"],
  ["4db6ac", "Morski"],
];
const svg = (kolor) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23${kolor}'/%3E%3C/svg%3E`;

const listaObrazow = OBRAZY.map(([kolor, nazwa], i) => `${i + 1}. ${nazwa}\n${svg(kolor)}`).join("\n\n");

const figury = OBRAZY.map(
  ([kolor, nazwa]) => `    <figure>
      <img src="${svg(kolor)}" alt="Kolorowy prostokąt: ${nazwa.toLowerCase()}">
      <figcaption>${nazwa}</figcaption>
    </figure>`,
).join("\n");

const zadanie = {
  title: "Galeria responsywna (HTML/CSS)",
  summary: "Galeria sześciu obrazków, która na telefonie ustawia się w jednej kolumnie (media queries).",
  minutes: 60,
  studentCanRunTests: true,
  sheet: `## Zadanie: galeria responsywna

Zbuduj stronę z galerią, która dobrze wygląda i na komputerze, i na telefonie.
Pracuj w plikach \`index.html\` i \`styl.css\`. Adresy obrazków znajdziesz w pliku
\`obrazy.txt\` — skopiuj je do atrybutów \`src\`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją \`<!DOCTYPE html>\`, język strony to \`pl\`, kodowanie UTF-8.
2. Tytuł strony: **Galeria**. Nagłówek pierwszego stopnia: **Moja galeria**.
3. Element \`<section>\` o identyfikatorze \`galeria\`, a w nim **sześć** elementów \`<figure>\`.
4. Każdy \`<figure>\` zawiera \`<img>\` z **opisem alternatywnym** (\`alt\`) oraz \`<figcaption>\`
   z nazwą koloru.

### 2. Plik styl.css

1. Tło strony: \`#fafafa\`, czcionka bezszeryfowa.
2. \`#galeria\` jest kontenerem elastycznym (\`display: flex\`) z zawijaniem elementów;
   na szerokim ekranie obrazki leżą **w rzędzie** (\`flex-direction: row\`).
3. Obrazki nigdy nie wychodzą poza swój kontener (\`max-width: 100%\`).
4. Podpisy \`figcaption\` są wyśrodkowane.
5. **Media query**: gdy okno ma szerokość **do 600 px**, \`#galeria\` układa elementy
   **w kolumnie** (\`flex-direction: column\`).

Układ przy 1024 px i przy 375 px sprawdzisz przyciskiem testów — strona jest wtedy
oglądana przy obu szerokościach.
`,
  files: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Galeria</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek i galerię -->

</body>
</html>
`,
    },
    { name: "styl.css", content: "/* Tutaj wpisz style galerii */\n" },
    { name: "obrazy.txt", content: `Adresy obrazków do atrybutów src:\n\n${listaObrazow}\n` },
  ],
  reference: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Galeria</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Moja galeria</h1>

  <section id="galeria">
${figury}
  </section>
</body>
</html>
`,
    },
    {
      name: "styl.css",
      content: `body {
  background-color: #fafafa;
  font-family: Arial, sans-serif;
  margin: 16px;
}

#galeria {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
}

figure {
  margin: 0;
  flex: 1 1 30%;
}

img {
  max-width: 100%;
  display: block;
}

figcaption {
  text-align: center;
  padding: 6px 0;
}

@media (max-width: 600px) {
  #galeria {
    flex-direction: column;
  }
}
`,
    },
    { name: "obrazy.txt", content: `Adresy obrazków do atrybutów src:\n\n${listaObrazow}\n` },
  ],
  tests: [
    { id: "t1", name: "DOCTYPE i język strony pl", points: 1, type: "html_lang_doctype", page: "index.html", lang: "pl" },
    { id: "t2", name: "Tytuł strony: Galeria", points: 1, type: "selector_text", page: "index.html", selector: "title", mode: "equals", value: "Galeria" },
    { id: "t3", name: "Nagłówek h1: Moja galeria", points: 1, type: "selector_text", page: "index.html", selector: "h1", mode: "equals", value: "Moja galeria" },
    { id: "t4", name: "Struktura nagłówków (jeden h1)", points: 1, type: "heading_structure", page: "index.html" },
    { id: "t5", name: "Sekcja #galeria", points: 1, type: "selector_count", page: "index.html", selector: "section#galeria", min: 1, max: 1 },
    { id: "t6", name: "Sześć elementów figure w galerii", points: 2, type: "selector_count", page: "index.html", selector: "#galeria > figure", min: 6, max: 6 },
    { id: "t7", name: "Każdy figure ma figcaption", points: 1, type: "selector_count", page: "index.html", selector: "#galeria figure > figcaption", min: 6 },
    { id: "t8", name: "Obrazki mają opis alt (min. 6)", points: 3, type: "images_alt", page: "index.html", min: 6 },
    { id: "t9", name: "Tło strony #fafafa", points: 1, type: "css_computed", page: "index.html", selector: "body", property: "background-color", expected: "#fafafa" },
    { id: "t10", name: "Galeria jest kontenerem flex", points: 2, type: "css_computed", page: "index.html", selector: "#galeria", property: "display", expected: "flex" },
    { id: "t11", name: "Szeroki ekran (1024 px): układ w rzędzie", points: 3, type: "css_computed", page: "index.html", selector: "#galeria", property: "flex-direction", expected: "row", viewport: 1024 },
    { id: "t12", name: "Telefon (375 px): układ w kolumnie", points: 4, type: "css_computed", page: "index.html", selector: "#galeria", property: "flex-direction", expected: "column", viewport: 375 },
    { id: "t13", name: "W stylach jest media query z szerokością", points: 3, type: "css_media", page: "index.html", min: 1 },
    { id: "t14", name: "Obrazki nie wychodzą poza kontener (max-width 100%)", points: 2, type: "css_computed", page: "index.html", selector: "#galeria img", property: "max-width", expected: "100%" },
    { id: "t15", name: "Podpisy wyśrodkowane", points: 1, type: "css_computed", page: "index.html", selector: "figcaption", property: "text-align", expected: "center" },
  ],
  criteria: [
    { id: "k1", name: "Wygląd galerii", description: "Odstępy, równe rozmiary, czytelne podpisy.", points: 4 },
    { id: "k2", name: "Znaczące opisy alt", description: "Opisy mówią, co jest na obrazku, a nie „obrazek 1”.", points: 3 },
    { id: "k3", name: "Porządek w kodzie", description: "Wcięcia, brak powtórzeń w CSS, sensowna kolejność reguł.", points: 3 },
  ],
};

export default zadanie;
