// Podobieństwo prac uczniów — podpowiedź dla nauczyciela, nie dowód.
//
// Zadanie narzuca identyfikatory i strukturę (#zadanie, #dodaj…), więc każda poprawna
// praca ma ze sobą coś wspólnego. Dlatego porównujemy tylko to, co uczeń DODAŁ do plików
// startowych, i robimy to na ciągach pięciu kolejnych elementów kodu (n-gramy), bez
// komentarzy, wielkości liter i odstępów. Zmiana nazw zmiennych obniża wynik, ale
// kopia z kosmetycznymi poprawkami nadal wychodzi wysoko.
//
// Czysty moduł bez zależności od przeglądarki — działa też w testach pod Node.

export type SimilarityFile = { name: string; content: string };
export type SimilarityInput = { id: string; files: readonly SimilarityFile[] };
export type SimilarMatch = { id: string; percent: number };

/** Domyślny próg „warto spojrzeć”. */
export const DEFAULT_THRESHOLD = 80;
/** Pracy z mniejszą ilością własnego kodu nie porównujemy — wynik byłby przypadkowy. */
export const MIN_ORIGINAL_SHINGLES = 25;
const SHINGLE = 5;

function stripComments(name: string, text: string): string {
  if (name.endsWith(".html")) return text.replace(/<!--[\s\S]*?-->/g, " ");
  if (name.endsWith(".css")) return text.replace(/\/\*[\s\S]*?\*\//g, " ");
  if (name.endsWith(".js")) return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1 ");
  return text;
}

const IDENT = /^[a-ząćęłńóśźż_$][a-ząćęłńóśźż0-9_$]*$/;

/**
 * W JavaScripcie nazwy zmiennych, funkcji i parametrów zadeklarowane przez ucznia
 * zamieniamy na jedną nazwę — samo przemianowanie zmiennych nie ukryje kopii.
 */
function normalizeIdentifiers(tokens: string[]): string[] {
  const declared = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const next = tokens[i + 1];
    if ((t === "var" || t === "let" || t === "const") && next !== undefined && IDENT.test(next)) declared.add(next);
    if (t === "function") {
      if (next !== undefined && IDENT.test(next)) declared.add(next);
      // parametry: od najbliższego "(" do ")"
      const open = tokens.indexOf("(", i);
      if (open !== -1 && open - i <= 2) {
        for (let k = open + 1; k < tokens.length && tokens[k] !== ")"; k++) {
          const p = tokens[k];
          if (p !== undefined && IDENT.test(p)) declared.add(p);
        }
      }
    }
    if (t === "catch" && tokens[i + 1] === "(" && tokens[i + 2] !== undefined && IDENT.test(tokens[i + 2] ?? "")) {
      declared.add(tokens[i + 2] ?? "");
    }
  }
  // słów kluczowych i API przeglądarki nigdy nie przemianowujemy
  for (const zarezerwowane of ["document", "window", "console", "this", "true", "false", "null", "undefined"]) {
    declared.delete(zarezerwowane);
  }
  return tokens.map((t) => (declared.has(t) ? "_v" : t));
}

/** Elementy kodu: słowa, liczby i pojedyncze znaki interpunkcji, małymi literami. */
export function tokenize(name: string, text: string): string[] {
  const js = name.endsWith(".js");
  // w CSS i HTML myślnik należy do nazwy (background-color), w JavaScripcie to odejmowanie
  const word = js ? /[a-ząćęłńóśźż_$][a-ząćęłńóśźż0-9_$]*|\d+|[^\s\w]/g : /[a-ząćęłńóśźż_$][a-ząćęłńóśźż0-9_$-]*|\d+|[^\s\w]/g;
  const tokens = stripComments(name, text).toLowerCase().match(word) ?? [];
  return js ? normalizeIdentifiers(tokens) : tokens;
}

function shingles(files: readonly SimilarityFile[]): Set<string> {
  const out = new Set<string>();
  for (const f of files) {
    if (!/\.(html|css|js)$/.test(f.name)) continue;
    const tokens = tokenize(f.name, f.content);
    for (let i = 0; i + SHINGLE <= tokens.length; i++) out.add(`${f.name}|${tokens.slice(i, i + SHINGLE).join(" ")}`);
  }
  return out;
}

/** Zbiór n-gramów pracy bez tych, które były już w plikach startowych. */
export function originalShingles(files: readonly SimilarityFile[], starter: readonly SimilarityFile[]): Set<string> {
  const base = shingles(starter);
  const own = shingles(files);
  for (const s of base) own.delete(s);
  return own;
}

/**
 * Dla każdej pracy zwraca listę innych prac podobnych co najmniej na `threshold` procent
 * (miara Jaccarda), od najbardziej podobnej. Prace bez własnego kodu są pomijane.
 */
export function findSimilar(
  attempts: readonly SimilarityInput[],
  starter: readonly SimilarityFile[],
  threshold: number = DEFAULT_THRESHOLD,
): Map<string, SimilarMatch[]> {
  const sets = attempts.map((a) => ({ id: a.id, set: originalShingles(a.files, starter) }));
  const result = new Map<string, SimilarMatch[]>();

  for (let i = 0; i < sets.length; i++) {
    const a = sets[i];
    if (!a || a.set.size < MIN_ORIGINAL_SHINGLES) continue;
    for (let j = i + 1; j < sets.length; j++) {
      const b = sets[j];
      if (!b || b.set.size < MIN_ORIGINAL_SHINGLES) continue;

      let common = 0;
      const [small, large] = a.set.size <= b.set.size ? [a.set, b.set] : [b.set, a.set];
      for (const s of small) if (large.has(s)) common++;
      const percent = Math.round((common / (a.set.size + b.set.size - common)) * 100);
      if (percent < threshold) continue;

      result.set(a.id, [...(result.get(a.id) ?? []), { id: b.id, percent }]);
      result.set(b.id, [...(result.get(b.id) ?? []), { id: a.id, percent }]);
    }
  }
  for (const list of result.values()) list.sort((x, y) => y.percent - x.percent);
  return result;
}
