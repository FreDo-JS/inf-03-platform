// Zadanie: formularz rejestracyjny z walidacją po stronie przeglądarki.
export default {
  title: "Formularz rejestracyjny z walidacją (HTML/CSS/JS)",
  summary: "Formularz z etykietami i skrypt, który sprawdza dane i wyświetla pierwszy napotkany błąd.",
  minutes: 90,
  studentCanRunTests: true,
  sheet: `## Zadanie: formularz rejestracyjny

Przygotuj stronę z formularzem zakładania konta. Dane sprawdza **Twój skrypt** —
przeglądarka nie ma ich blokować. Pracuj w plikach \`index.html\`, \`styl.css\`
i \`skrypt.js\`. Podgląd otworzysz przyciskiem **Uruchom**.

Czas: **90 minut**.

### 1. Plik index.html

1. Dokument zaczyna się deklaracją \`<!DOCTYPE html>\`, język strony to \`pl\`, kodowanie UTF-8.
2. Tytuł strony: **Rejestracja**. Nagłówek pierwszego stopnia: **Rejestracja konta**.
3. Formularz o identyfikatorze \`formularz\` z atrybutem \`novalidate\` (walidację robi skrypt).
4. W formularzu pięć pól, **każde z powiązaną etykietą** \`<label>\` (atrybuty \`for\` i \`id\`):
   - \`imie\` — pole tekstowe,
   - \`email\` — pole typu \`email\`,
   - \`haslo\` — pole typu \`password\`,
   - \`powtorz\` — drugie pole typu \`password\`,
   - \`regulamin\` — pole wyboru (checkbox).
5. Przycisk \`<button type="submit">\` z napisem **Zarejestruj**.
6. Dwa puste akapity: \`blad\` (komunikat o błędzie) i \`sukces\` (komunikat o powodzeniu).

### 2. Plik styl.css

1. Tło strony \`#f5f7fa\`.
2. Przycisk w formularzu: tło \`#1565c0\`, biały tekst.
3. Akapit \`blad\` ma kolor tekstu \`#c62828\`, akapit \`sukces\` — \`#2e7d32\`.
4. Pola formularza ułóż czytelnie, jedno pod drugim (ocenia nauczyciel).

### 3. Plik skrypt.js

Po wysłaniu formularza (zdarzenie \`submit\`, strona **nie** może się przeładować)
sprawdzaj dane **w tej kolejności** i wyświetl w akapicie \`blad\` tylko **pierwszy** napotkany błąd:

1. imię puste → **Podaj imię**,
2. e-mail bez znaku \`@\` albo bez kropki po \`@\` → **Podaj poprawny e-mail**,
3. hasło krótsze niż 8 znaków → **Hasło musi mieć co najmniej 8 znaków**,
4. hasła różne → **Hasła nie są takie same**,
5. regulamin niezaznaczony → **Zaakceptuj regulamin**.

Gdy wszystko jest poprawne, akapit \`blad\` jest pusty, a w akapicie \`sukces\`
pojawia się tekst **Konto zostało utworzone dla: ** i imię z formularza.
Przy kolejnym wysłaniu stare komunikaty znikają. Nie używaj okienek \`alert\`.

### Przykład

Imię \`Ola\`, e-mail \`olaexample.com\` → w akapicie \`blad\`: *Podaj poprawny e-mail*.
Imię \`Ola\`, e-mail \`ola@example.com\`, hasło i powtórzenie \`tajnehaslo1\`, regulamin zaznaczony →
w akapicie \`sukces\`: *Konto zostało utworzone dla: Ola*.
`,
  files: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Rejestracja</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>

  <!-- Tutaj wstaw nagłówek, formularz i akapity na komunikaty -->

  <script src="skrypt.js"></script>
</body>
</html>
`,
    },
    { name: "styl.css", content: "/* Tutaj wpisz style strony */\n" },
    { name: "skrypt.js", content: "// Tutaj wpisz skrypt sprawdzający formularz\n" },
  ],
  reference: [
    {
      name: "index.html",
      content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>Rejestracja</title>
  <link rel="stylesheet" href="styl.css">
</head>
<body>
  <h1>Rejestracja konta</h1>

  <form id="formularz" novalidate>
    <div>
      <label for="imie">Imię</label>
      <input type="text" id="imie" name="imie">
    </div>
    <div>
      <label for="email">E-mail</label>
      <input type="email" id="email" name="email">
    </div>
    <div>
      <label for="haslo">Hasło</label>
      <input type="password" id="haslo" name="haslo">
    </div>
    <div>
      <label for="powtorz">Powtórz hasło</label>
      <input type="password" id="powtorz" name="powtorz">
    </div>
    <div>
      <input type="checkbox" id="regulamin" name="regulamin">
      <label for="regulamin">Akceptuję regulamin</label>
    </div>
    <button type="submit">Zarejestruj</button>
  </form>

  <p id="blad"></p>
  <p id="sukces"></p>

  <script src="skrypt.js"></script>
</body>
</html>
`,
    },
    {
      name: "styl.css",
      content: `body {
  background-color: #f5f7fa;
  font-family: Arial, sans-serif;
  margin: 24px;
}

form div {
  margin-bottom: 12px;
}

label {
  display: inline-block;
  min-width: 120px;
}

button {
  background-color: #1565c0;
  color: #ffffff;
  border: none;
  padding: 8px 20px;
  cursor: pointer;
}

#blad {
  color: #c62828;
}

#sukces {
  color: #2e7d32;
}
`,
    },
    {
      name: "skrypt.js",
      content: `var formularz = document.getElementById("formularz");
var blad = document.getElementById("blad");
var sukces = document.getElementById("sukces");

formularz.addEventListener("submit", function (zdarzenie) {
  zdarzenie.preventDefault();
  blad.textContent = "";
  sukces.textContent = "";

  var imie = document.getElementById("imie").value.trim();
  var email = document.getElementById("email").value.trim();
  var haslo = document.getElementById("haslo").value;
  var powtorz = document.getElementById("powtorz").value;
  var regulamin = document.getElementById("regulamin").checked;

  var komunikat = "";
  if (imie === "") {
    komunikat = "Podaj imię";
  } else if (email.indexOf("@") < 1 || email.indexOf(".", email.indexOf("@")) === -1) {
    komunikat = "Podaj poprawny e-mail";
  } else if (haslo.length < 8) {
    komunikat = "Hasło musi mieć co najmniej 8 znaków";
  } else if (haslo !== powtorz) {
    komunikat = "Hasła nie są takie same";
  } else if (!regulamin) {
    komunikat = "Zaakceptuj regulamin";
  }

  if (komunikat !== "") {
    blad.textContent = komunikat;
    return;
  }

  sukces.textContent = "Konto zostało utworzone dla: " + imie;
});
`,
    },
  ],
  tests: (() => {
    const wypelnij = (imie, email, haslo, powtorz) => [
      { action: "fill", selector: "#imie", value: imie },
      { action: "fill", selector: "#email", value: email },
      { action: "fill", selector: "#haslo", value: haslo },
      { action: "fill", selector: "#powtorz", value: powtorz },
    ];
    const wyslij = { action: "click", selector: "#formularz button" };
    return [
      { id: "t1", name: "DOCTYPE i język strony pl", points: 1, type: "html_lang_doctype", page: "index.html", lang: "pl" },
      { id: "t2", name: "Tytuł strony: Rejestracja", points: 1, type: "selector_text", page: "index.html", selector: "title", mode: "equals", value: "Rejestracja" },
      { id: "t3", name: "Nagłówek h1: Rejestracja konta", points: 1, type: "selector_text", page: "index.html", selector: "h1", mode: "equals", value: "Rejestracja konta" },
      { id: "t4", name: "Formularz #formularz z atrybutem novalidate", points: 2, type: "selector_count", page: "index.html", selector: "form#formularz[novalidate]", min: 1, max: 1 },
      { id: "t5", name: "Pola mają etykiety (min. 5)", points: 3, type: "form_labels", page: "index.html", min: 5 },
      { id: "t6", name: "Pole e-mail ma typ email", points: 1, type: "selector_attribute", page: "index.html", selector: "#email", attribute: "type", mode: "equals", value: "email" },
      { id: "t7", name: "Pole hasła ma typ password", points: 1, type: "selector_attribute", page: "index.html", selector: "#haslo", attribute: "type", mode: "equals", value: "password" },
      { id: "t8", name: "Pole wyboru #regulamin (checkbox)", points: 1, type: "selector_attribute", page: "index.html", selector: "#regulamin", attribute: "type", mode: "equals", value: "checkbox" },
      { id: "t9", name: "Przycisk Zarejestruj", points: 1, type: "selector_text", page: "index.html", selector: "#formularz button[type=submit]", mode: "equals", value: "Zarejestruj" },
      { id: "t10", name: "Tło strony #f5f7fa", points: 1, type: "css_computed", page: "index.html", selector: "body", property: "background-color", expected: "#f5f7fa" },
      { id: "t11", name: "Przycisk: tło #1565c0", points: 1, type: "css_computed", page: "index.html", selector: "#formularz button", property: "background-color", expected: "#1565c0" },
      { id: "t12", name: "Błąd: kolor tekstu #c62828", points: 1, type: "css_computed", page: "index.html", selector: "#blad", property: "color", expected: "#c62828" },
      { id: "t13", name: "Sukces: kolor tekstu #2e7d32", points: 1, type: "css_computed", page: "index.html", selector: "#sukces", property: "color", expected: "#2e7d32" },
      { id: "t14", name: "Skrypt działa bez błędów", points: 2, type: "no_js_errors", page: "index.html" },
      { id: "t15", name: "Skrypt używa addEventListener", points: 1, type: "file_content", file: "skrypt.js", mode: "contains", value: "addEventListener" },
      { id: "t16", name: "Bez okienek alert", points: 1, type: "file_content", file: "skrypt.js", mode: "contains", value: "alert(", negate: true },
      {
        id: "t17", name: "Puste imię → Podaj imię", points: 2, type: "interaction", page: "index.html",
        steps: [...wypelnij("", "ola@example.com", "tajnehaslo1", "tajnehaslo1"), { action: "click", selector: "#regulamin" }, wyslij],
        expect: { selector: "#blad", mode: "equals", value: "Podaj imię" },
      },
      {
        id: "t18", name: "E-mail bez @ → Podaj poprawny e-mail", points: 2, type: "interaction", page: "index.html",
        steps: [...wypelnij("Ola", "olaexample.com", "tajnehaslo1", "tajnehaslo1"), wyslij],
        expect: { selector: "#blad", mode: "equals", value: "Podaj poprawny e-mail" },
      },
      {
        id: "t19", name: "Krótkie hasło → komunikat o 8 znakach", points: 2, type: "interaction", page: "index.html",
        steps: [...wypelnij("Ola", "ola@example.com", "krotkie", "krotkie"), wyslij],
        expect: { selector: "#blad", mode: "equals", value: "Hasło musi mieć co najmniej 8 znaków" },
      },
      {
        id: "t20", name: "Różne hasła → Hasła nie są takie same", points: 2, type: "interaction", page: "index.html",
        steps: [...wypelnij("Ola", "ola@example.com", "tajnehaslo1", "innehaslo22"), wyslij],
        expect: { selector: "#blad", mode: "equals", value: "Hasła nie są takie same" },
      },
      {
        id: "t21", name: "Brak zgody → Zaakceptuj regulamin", points: 2, type: "interaction", page: "index.html",
        steps: [...wypelnij("Ola", "ola@example.com", "tajnehaslo1", "tajnehaslo1"), wyslij],
        expect: { selector: "#blad", mode: "equals", value: "Zaakceptuj regulamin" },
      },
      {
        id: "t22", name: "Poprawne dane → komunikat sukcesu", points: 3, type: "interaction", page: "index.html",
        steps: [...wypelnij("Ola", "ola@example.com", "tajnehaslo1", "tajnehaslo1"), { action: "click", selector: "#regulamin" }, wyslij],
        expect: { selector: "#sukces", mode: "equals", value: "Konto zostało utworzone dla: Ola" },
      },
      {
        id: "t23", name: "Poprawne dane → pusty komunikat błędu", points: 1, type: "interaction", page: "index.html",
        steps: [...wypelnij("Ola", "ola@example.com", "tajnehaslo1", "tajnehaslo1"), { action: "click", selector: "#regulamin" }, wyslij],
        expect: { selector: "#blad", mode: "equals", value: "" },
      },
    ];
  })(),
  criteria: [
    { id: "k1", name: "Czytelny układ formularza", description: "Pola jedno pod drugim, etykiety równo, odstępy.", points: 4 },
    { id: "k2", name: "Czytelność i porządek kodu", description: "Wcięcia, sensowne nazwy zmiennych, brak zbędnego kodu.", points: 3 },
    { id: "k3", name: "Komunikaty zrozumiałe dla użytkownika", description: "Błąd i sukces widoczne, stare komunikaty znikają przy kolejnym wysłaniu.", points: 3 },
  ],
};
