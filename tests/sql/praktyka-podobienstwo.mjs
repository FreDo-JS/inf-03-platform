// Wykrywanie podobnych prac (lib/practical/similarity.ts).
//
// Moduł jest czystym TypeScriptem bez zależności, więc ładujemy go wprost pod Node
// (usuwanie typów) i sprawdzamy na zadaniu „Licznik” z biblioteki zadań:
// dosłowna kopia, kopia z kosmetycznymi zmianami, praca napisana inaczej
// i praca bez własnego kodu.
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const { findSimilar, tokenize, originalShingles, MIN_ORIGINAL_SHINGLES } = await import(
  pathToFileURL(join(repo, "lib", "practical", "similarity.ts")).href
);
const licznik = (await import(pathToFileURL(join(repo, "scripts", "praktyka", "zadania", "licznik-motyw.mjs")).href)).default;

let pass = 0, fail = 0;
const ok = (label, warunek, szczegol = "") => {
  if (warunek) { pass++; console.log("  ok   ", label); }
  else { fail++; console.log("  FAIL ", label, szczegol ? "→ " + szczegol : ""); }
};

const wzor = licznik.reference;
const zmien = (pliki, nazwa, fn) => pliki.map((f) => (f.name === nazwa ? { ...f, content: fn(f.content) } : f));

// kopia: te same pliki z przemianowanymi zmiennymi, innymi odstępami i własnymi komentarzami
const kosmetyka = zmien(
  zmien(wzor, "skrypt.js", (s) =>
    "// moja wersja\n" + s.replace(/wartosc/g, "licznik").replace(/pole/g, "ekran").replace(/odswiez/g, "pokaz").replace(/\n/g, "\n\n"),
  ),
  "index.html",
  (s) => s.replace(/>\s+</g, ">\n\n    <"),
);

// praca napisana po swojemu: ta sama funkcjonalność, inny styl kodu i inne selektory
const wlasna = [
  wzor[0],
  { name: "styl.css", content: "body { background: white; color: #212121; }\nbody.ciemny { background: #212121; color: white; }\nbutton { margin: 4px; }\n" },
  {
    name: "skrypt.js",
    content: `let n = 0;
const el = document.querySelector("#wartosc");
const msg = document.querySelector("#info");
const draw = () => {
  el.textContent = String(n);
  msg.textContent = n === 10 ? "Osiągnięto 10!" : "";
};
document.querySelector("#plus").onclick = () => { n += 1; draw(); };
document.querySelector("#minus").onclick = () => {
  if (n > 0) { n -= 1; draw(); } else { msg.textContent = "Wartość nie może być ujemna"; }
};
document.querySelector("#reset").onclick = () => { n = 0; draw(); };
document.querySelector("#motyw").onclick = () => document.body.classList.toggle("ciemny");
`,
  },
];

console.log("== TOKENIZACJA ==");
{
  const t = tokenize("skrypt.js", "var a = 1; // komentarz\n/* blok */ b++;");
  ok("komentarze JS nie wchodzą do porównania", !t.includes("komentarz") && !t.includes("blok"), t.join(" "));
  ok("wielkość liter i odstępy nie mają znaczenia", tokenize("a.css", "A  {COLOR:RED}").join(" ") === tokenize("a.css", "a{color:red}").join(" "));
  ok("adres URL w kodzie nie jest brany za komentarz", tokenize("s.js", 'x = "http://a.pl";').includes("http"));
}

console.log("\n== PORÓWNANIE ==");
{
  const prace = [
    { id: "ala", files: wzor },
    { id: "ola", files: wzor },
    { id: "ela", files: kosmetyka },
    { id: "kasia", files: wlasna },
    { id: "puste", files: licznik.files },
  ];
  const wynik = findSimilar(prace, licznik.files);
  const dla = (id) => wynik.get(id) ?? [];
  const procent = (a, b) => dla(a).find((m) => m.id === b)?.percent;

  ok("dwie identyczne prace: 100%", procent("ala", "ola") === 100, String(procent("ala", "ola")));
  ok("kopia z przemianowanymi zmiennymi i komentarzami wychodzi prawie 100%", (procent("ala", "ela") ?? 0) >= 95, String(procent("ala", "ela")));
  ok("praca napisana po swojemu nie jest zgłoszona", procent("ala", "kasia") === undefined && dla("kasia").length === 0, JSON.stringify(dla("kasia")));
  ok("praca bez własnego kodu (sam start) jest pomijana", dla("puste").length === 0 && !dla("ala").some((m) => m.id === "puste"));
  ok("lista jest symetryczna", procent("ela", "ala") === procent("ala", "ela"));
  ok("najbardziej podobna jest na początku listy", dla("ela")[0]?.percent >= (dla("ela")[1]?.percent ?? 0));
  const wszystko = findSimilar(prace, licznik.files, 0);
  const wlasnaProcent = wszystko.get("ala")?.find((m) => m.id === "kasia")?.percent ?? -1;
  ok("przy progu 0 widać też pracę napisaną po swojemu — ale z niskim wynikiem", wlasnaProcent >= 0 && wlasnaProcent < 50, String(wlasnaProcent));
  ok("próg 101% nie zgłasza niczego", findSimilar(prace, licznik.files, 101).size === 0);
}

console.log("\n== PLIKI STARTOWE NIE LICZĄ SIĘ ==");
{
  const own = originalShingles(wzor, licznik.files);
  const tylkoStart = originalShingles(licznik.files, licznik.files);
  ok("sam plik startowy nie ma własnego kodu", tylkoStart.size === 0);
  ok("wzorzec ma wyraźnie więcej własnego kodu niż próg", own.size > MIN_ORIGINAL_SHINGLES * 3, String(own.size));
  const dwaStarty = findSimilar([{ id: "a", files: licznik.files }, { id: "b", files: licznik.files }], licznik.files, 1);
  ok("dwie prace bez zmian względem startu nie są „podobne”", dwaStarty.size === 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
