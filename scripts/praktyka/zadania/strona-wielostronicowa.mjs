// Zadanie: mała strona firmowa z trzech podstron i wspólnym stylem.
const strona = (plik, tytul, h1, tresc) => `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>${tytul}</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <header>
    <nav>
      <a href="index.html">Start</a>
      <a href="o-nas.html">O nas</a>
      <a href="kontakt.html">Kontakt</a>
    </nav>
  </header>
  <main>
    <h1>${h1}</h1>
${tresc}
  </main>
  <footer>
    <p>© 2026 Pracownia Zielona</p>
  </footer>
</body>
</html>
`;

export default {
  title: "Strona firmowa z trzech podstron (HTML/CSS)",
  summary: "Trzy powiązane pliki HTML, wspólne menu, semantyczny układ i jeden arkusz stylów.",
  minutes: 90,
  studentCanRunTests: true,
  sheet: `## Zadanie: strona firmowa z trzech podstron

Zbuduj małą stronę pracowni „Pracownia Zielona”. Składa się z trzech plików
\`index.html\`, \`o-nas.html\` i \`kontakt.html\`, które korzystają z **jednego** arkusza
\`styl.css\`. Podgląd otworzysz przyciskiem **Uruchom**; przełączaj strony listą nad podglądem.

Czas: **90 minut**.

### 1. Każda z trzech stron

1. Deklaracja \`<!DOCTYPE html>\`, język \`pl\`, kodowanie UTF-8, połączenie z \`styl.css\`.
2. Tytuły stron: **Strona główna**, **O nas**, **Kontakt** (w tej kolejności dla plików).
3. Układ semantyczny: \`<header>\` z menu \`<nav>\`, \`<main>\` z treścią, \`<footer>\`.
4. W \`<nav>\` **trzy linki** do wszystkich podstron: **Start** (\`index.html\`),
   **O nas** (\`o-nas.html\`), **Kontakt** (\`kontakt.html\`) — na każdej stronie te same.
5. Dokładnie **jeden** nagłówek \`<h1>\` (**Witamy**, **O nas**, **Kontakt**), bez przeskoków
   poziomów (po \`h1\` może być \`h2\`, nie od razu \`h4\`).
6. W stopce akapit: **© 2026 Pracownia Zielona**.

### 2. Dodatkowo na stronie Kontakt

W \`<main>\` formularz z trzema polami, każde z etykietą \`<label>\`:
imię (\`text\`), e-mail (\`email\`) i wiadomość (\`textarea\`), oraz przycisk **Wyślij**.

### 3. Plik styl.css

1. Nagłówek \`header\` ma tło \`#1b5e20\`, a linki w menu — biały kolor tekstu.
2. Menu \`nav\` jest ułożone w rzędzie (\`display: flex\`) z odstępem między linkami.
3. Stopka \`footer\` ma wyśrodkowany tekst i tło \`#e8f5e9\`.
4. Czcionka strony: bezszeryfowa.
`,
  files: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Strona główna</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- header z menu, main z nagłówkiem, footer -->

</body>
</html>
`,
    },
    { name: "o-nas.html", content: "<!-- Tutaj zbuduj stronę „O nas” na wzór index.html -->\n" },
    { name: "kontakt.html", content: "<!-- Tutaj zbuduj stronę „Kontakt” z formularzem -->\n" },
    { name: "styl.css", content: "/* Wspólny arkusz stylów dla wszystkich stron */\n" },
  ],
  reference: [
    {
      name: "index.html",
      content: strona("index.html", "Strona główna", "Witamy", "    <p>Pracownia Zielona zajmuje się projektowaniem ogrodów.</p>"),
    },
    {
      name: "o-nas.html",
      content: strona("o-nas.html", "O nas", "O nas", "    <h2>Nasz zespół</h2>\n    <p>Od 2010 roku tworzymy ogrody dla domów i firm.</p>"),
    },
    {
      name: "kontakt.html",
      content: strona(
        "kontakt.html",
        "Kontakt",
        "Kontakt",
        `    <form>
      <p><label for="imie">Imię</label> <input type="text" id="imie" name="imie"></p>
      <p><label for="email">E-mail</label> <input type="email" id="email" name="email"></p>
      <p><label for="wiadomosc">Wiadomość</label><br><textarea id="wiadomosc" name="wiadomosc" rows="4"></textarea></p>
      <button type="submit">Wyślij</button>
    </form>`,
      ),
    },
    {
      name: "styl.css",
      content: `body {
  font-family: Arial, sans-serif;
  margin: 0;
}

header {
  background-color: #1b5e20;
  padding: 12px 24px;
}

nav {
  display: flex;
  gap: 24px;
}

nav a {
  color: #ffffff;
  text-decoration: none;
}

main {
  padding: 24px;
}

footer {
  background-color: #e8f5e9;
  text-align: center;
  padding: 12px;
}
`,
    },
  ],
  tests: (() => {
    const PODSTRONY = [
      ["index.html", "Strona główna", "Witamy"],
      ["o-nas.html", "O nas", "O nas"],
      ["kontakt.html", "Kontakt", "Kontakt"],
    ];
    const testy = [];
    let n = 0;
    const id = () => `t${++n}`;
    for (const [plik, tytul, h1] of PODSTRONY) {
      testy.push({ id: id(), name: `${plik}: DOCTYPE i język pl`, points: 1, type: "html_lang_doctype", page: plik, lang: "pl" });
      testy.push({ id: id(), name: `${plik}: tytuł „${tytul}”`, points: 1, type: "selector_text", page: plik, selector: "title", mode: "equals", value: tytul });
      testy.push({ id: id(), name: `${plik}: nagłówek h1 „${h1}”`, points: 1, type: "selector_text", page: plik, selector: "main h1", mode: "equals", value: h1 });
      testy.push({ id: id(), name: `${plik}: header, main i footer`, points: 1, type: "selector_count", page: plik, selector: "body > header nav, body > main, body > footer", min: 3 });
      testy.push({ id: id(), name: `${plik}: trzy linki w menu`, points: 1, type: "selector_count", page: plik, selector: "header nav a", min: 3, max: 3 });
      testy.push({ id: id(), name: `${plik}: linki prowadzą do plików projektu`, points: 1, type: "links_valid", page: plik, min: 3 });
      testy.push({ id: id(), name: `${plik}: struktura nagłówków`, points: 1, type: "heading_structure", page: plik });
      testy.push({ id: id(), name: `${plik}: stopka z informacją o prawach`, points: 1, type: "selector_text", page: plik, selector: "footer p", mode: "contains", value: "© 2026 Pracownia Zielona" });
    }
    testy.push({ id: id(), name: "Kontakt: pola formularza mają etykiety", points: 3, type: "form_labels", page: "kontakt.html", min: 3 });
    testy.push({ id: id(), name: "Kontakt: pole wiadomości to textarea", points: 1, type: "selector_count", page: "kontakt.html", selector: "form textarea", min: 1, max: 1 });
    testy.push({ id: id(), name: "Kontakt: przycisk Wyślij", points: 1, type: "selector_text", page: "kontakt.html", selector: "form button", mode: "equals", value: "Wyślij" });
    testy.push({ id: id(), name: "Header: tło #1b5e20", points: 1, type: "css_computed", page: "index.html", selector: "header", property: "background-color", expected: "#1b5e20" });
    testy.push({ id: id(), name: "Header na podstronie O nas ma ten sam styl", points: 1, type: "css_computed", page: "o-nas.html", selector: "header", property: "background-color", expected: "#1b5e20" });
    testy.push({ id: id(), name: "Menu ułożone w rzędzie (flex)", points: 2, type: "css_computed", page: "index.html", selector: "nav", property: "display", expected: "flex" });
    testy.push({ id: id(), name: "Linki menu: biały tekst", points: 1, type: "css_computed", page: "index.html", selector: "nav a", property: "color", expected: "#ffffff" });
    testy.push({ id: id(), name: "Stopka: wyśrodkowany tekst", points: 1, type: "css_computed", page: "kontakt.html", selector: "footer", property: "text-align", expected: "center" });
    testy.push({ id: id(), name: "Stopka: tło #e8f5e9", points: 1, type: "css_computed", page: "index.html", selector: "footer", property: "background-color", expected: "#e8f5e9" });
    return testy;
  })(),
  criteria: [
    { id: "k1", name: "Spójny wygląd wszystkich stron", description: "Strony wyglądają jak jedna witryna, menu w tym samym miejscu.", points: 4 },
    { id: "k2", name: "Sensowna treść i nazwy plików", description: "Treść ma sens, pliki nazwane zgodnie z poleceniem.", points: 3 },
    { id: "k3", name: "Porządek w kodzie", description: "Wcięcia, brak powtórzeń w CSS, jeden arkusz dla wszystkich.", points: 3 },
  ],
};
