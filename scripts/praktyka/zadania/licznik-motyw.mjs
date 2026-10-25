// Zadanie: licznik z przyciskami i przełącznikiem motywu (JavaScript na DOM).
const zadanie = {
  title: "Licznik i przełącznik motywu (HTML/CSS/JS)",
  summary: "Licznik z przyciskami +, − i reset oraz przełączanie jasnego i ciemnego motywu klasą CSS.",
  minutes: 60,
  studentCanRunTests: true,
  sheet: `## Zadanie: licznik i motyw strony

Zbuduj prostą aplikację: licznik, który można zwiększać, zmniejszać i zerować,
oraz przycisk zmieniający motyw strony. Pracuj w plikach \`index.html\`, \`styl.css\`
i \`skrypt.js\`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **60 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją \`<!DOCTYPE html>\`, język strony to \`pl\`, kodowanie UTF-8.
2. Tytuł strony: **Licznik**. Nagłówek pierwszego stopnia: **Licznik**.
3. Element \`<span>\` o identyfikatorze \`wartosc\` z początkową treścią **0**.
4. Cztery przyciski: \`plus\` (napis **+**), \`minus\` (napis **-**), \`reset\` (napis **Reset**)
   oraz \`motyw\` (napis **Zmień motyw**).
5. Akapit o identyfikatorze \`info\` na komunikaty (na starcie pusty).

### 2. Plik styl.css

1. Strona ma białe tło (\`#ffffff\`) i ciemny tekst (\`#212121\`).
2. Klasa \`.ciemny\` nadana elementowi \`body\` zmienia tło na \`#212121\`, a tekst na \`#ffffff\`.

### 3. Plik skrypt.js

1. **+** zwiększa wartość o 1, **-** zmniejsza o 1, **Reset** ustawia **0**.
   Aktualna wartość jest zawsze widoczna w elemencie \`wartosc\`.
2. Wartość **nie może być ujemna**: gdy jest \`0\` i klikniesz **-**, wartość zostaje \`0\`,
   a w akapicie \`info\` pojawia się **Wartość nie może być ujemna**.
3. Gdy wartość dojdzie do **10**, w akapicie \`info\` wyświetl **Osiągnięto 10!**.
   Gdy spadnie poniżej 10 albo po resecie — akapit \`info\` jest znów pusty.
4. Przycisk **Zmień motyw** przełącza klasę \`ciemny\` na elemencie \`body\`
   (metoda \`classList.toggle\`). Kolejne kliknięcie wraca do jasnego motywu.
5. Używaj \`addEventListener\`; nie wstawiaj treści przez \`innerHTML\`.
`,
  files: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Licznik</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek, licznik, przyciski i akapit z komunikatem -->

  <script src="skrypt.js"></script>
</body>
</html>
`,
    },
    { name: "styl.css", content: "/* Tutaj wpisz style, w tym motyw ciemny */\n" },
    { name: "skrypt.js", content: "// Tutaj wpisz skrypt licznika\n" },
  ],
  reference: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Licznik</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Licznik</h1>

  <p>Wartość: <span id="wartosc">0</span></p>

  <button id="plus">+</button>
  <button id="minus">-</button>
  <button id="reset">Reset</button>
  <button id="motyw">Zmień motyw</button>

  <p id="info"></p>

  <script src="skrypt.js"></script>
</body>
</html>
`,
    },
    {
      name: "styl.css",
      content: `body {
  background-color: #ffffff;
  color: #212121;
  font-family: Arial, sans-serif;
  margin: 24px;
}

body.ciemny {
  background-color: #212121;
  color: #ffffff;
}

button {
  padding: 6px 14px;
  margin-right: 6px;
}
`,
    },
    {
      name: "skrypt.js",
      content: `var wartosc = 0;
var pole = document.getElementById("wartosc");
var info = document.getElementById("info");

function odswiez() {
  pole.textContent = wartosc;
  info.textContent = wartosc >= 10 ? "Osiągnięto 10!" : "";
}

document.getElementById("plus").addEventListener("click", function () {
  wartosc++;
  odswiez();
});

document.getElementById("minus").addEventListener("click", function () {
  if (wartosc === 0) {
    info.textContent = "Wartość nie może być ujemna";
    return;
  }
  wartosc--;
  odswiez();
});

document.getElementById("reset").addEventListener("click", function () {
  wartosc = 0;
  odswiez();
});

document.getElementById("motyw").addEventListener("click", function () {
  document.body.classList.toggle("ciemny");
});
`,
    },
  ],
  tests: (() => {
    const plus = (n) => Array.from({ length: n }, () => ({ action: "click", selector: "#plus" }));
    return [
      { id: "t1", name: "DOCTYPE i język strony pl", points: 1, type: "html_lang_doctype", page: "index.html", lang: "pl" },
      { id: "t2", name: "Tytuł strony: Licznik", points: 1, type: "selector_text", page: "index.html", selector: "title", mode: "equals", value: "Licznik" },
      { id: "t3", name: "Nagłówek h1: Licznik", points: 1, type: "selector_text", page: "index.html", selector: "h1", mode: "equals", value: "Licznik" },
      { id: "t4", name: "Wartość początkowa 0", points: 1, type: "selector_text", page: "index.html", selector: "span#wartosc", mode: "equals", value: "0" },
      { id: "t5", name: "Cztery przyciski o właściwych identyfikatorach", points: 2, type: "selector_count", page: "index.html", selector: "button#plus, button#minus, button#reset, button#motyw", min: 4, max: 4 },
      { id: "t6", name: "Akapit #info jest na starcie pusty", points: 1, type: "selector_text", page: "index.html", selector: "p#info", mode: "equals", value: "" },
      { id: "t7", name: "Tło strony #ffffff", points: 1, type: "css_computed", page: "index.html", selector: "body", property: "background-color", expected: "#ffffff" },
      { id: "t8", name: "Kolor tekstu #212121", points: 1, type: "css_computed", page: "index.html", selector: "body", property: "color", expected: "#212121" },
      { id: "t9", name: "Styl .ciemny w arkuszu", points: 2, type: "file_content", file: "styl.css", mode: "regex", value: "\\.ciemny", },
      { id: "t10", name: "Skrypt działa bez błędów", points: 2, type: "no_js_errors", page: "index.html" },
      { id: "t11", name: "Skrypt używa addEventListener i classList", points: 2, type: "file_content", file: "skrypt.js", mode: "regex", value: "addEventListener[\\s\\S]*classList|classList[\\s\\S]*addEventListener" },
      { id: "t12", name: "Bez innerHTML", points: 1, type: "file_content", file: "skrypt.js", mode: "contains", value: "innerHTML", negate: true },
      { id: "t13", name: "Trzy kliknięcia + → 3", points: 2, type: "interaction", page: "index.html", steps: plus(3), expect: { selector: "#wartosc", mode: "equals", value: "3" } },
      { id: "t14", name: "+ + − → 1", points: 2, type: "interaction", page: "index.html", steps: [...plus(2), { action: "click", selector: "#minus" }], expect: { selector: "#wartosc", mode: "equals", value: "1" } },
      { id: "t15", name: "Reset po kliknięciach → 0", points: 2, type: "interaction", page: "index.html", steps: [...plus(4), { action: "click", selector: "#reset" }], expect: { selector: "#wartosc", mode: "equals", value: "0" } },
      { id: "t16", name: "Minus przy 0: wartość zostaje 0", points: 2, type: "interaction", page: "index.html", steps: [{ action: "click", selector: "#minus" }], expect: { selector: "#wartosc", mode: "equals", value: "0" } },
      { id: "t17", name: "Minus przy 0: komunikat o ujemnej wartości", points: 2, type: "interaction", page: "index.html", steps: [{ action: "click", selector: "#minus" }], expect: { selector: "#info", mode: "equals", value: "Wartość nie może być ujemna" } },
      { id: "t18", name: "Przy 10: komunikat Osiągnięto 10!", points: 2, type: "interaction", page: "index.html", steps: plus(10), expect: { selector: "#info", mode: "equals", value: "Osiągnięto 10!" } },
      { id: "t19", name: "Reset czyści komunikat", points: 1, type: "interaction", page: "index.html", steps: [...plus(10), { action: "click", selector: "#reset" }], expect: { selector: "#info", mode: "equals", value: "" } },
      { id: "t20", name: "Przycisk motywu nadaje klasę ciemny", points: 3, type: "interaction", page: "index.html", steps: [{ action: "click", selector: "#motyw" }], expect: { selector: "body", mode: "attribute", attribute: "class", value: "ciemny" } },
      { id: "t21", name: "Drugie kliknięcie wraca do jasnego motywu", points: 2, type: "interaction", page: "index.html", steps: [{ action: "click", selector: "#motyw" }, { action: "click", selector: "#motyw" }], expect: { selector: "body", mode: "attribute", attribute: "class", value: "" } },
    ];
  })(),
  criteria: [
    { id: "k1", name: "Czytelność i porządek kodu", description: "Wcięcia, sensowne nazwy, brak powtarzania tej samej logiki.", points: 4 },
    { id: "k2", name: "Wygląd motywów", description: "Oba motywy są czytelne, kontrast tekstu i tła.", points: 3 },
    { id: "k3", name: "Obsługa skrajnych przypadków", description: "Zachowanie przy 0 i 10 jest sensowne i zrozumiałe.", points: 3 },
  ],
};

export default zadanie;
