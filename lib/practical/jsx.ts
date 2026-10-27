"use client";

/**
 * Przygotowanie pracy reactowej do uruchomienia w piaskownicy.
 *
 * Przeglądarka nie rozumie JSX-a ani `import`-ów między plikami projektu,
 * a piaskownica nie może wczytać żadnego skryptu z adresu (jej CSP to
 * `script-src 'unsafe-inline' 'unsafe-eval' blob: data:`, bez 'self').
 * Dlatego:
 *
 *   1. JSX przepisujemy **tutaj**, w aplikacji — raz na pracę, nie w każdej
 *      z ramek testowych. Sucrase tylko przepisuje tekst, nie wykonuje kodu,
 *      więc nie potrzebuje 'unsafe-eval' i mieści się w CSP aplikacji.
 *   2. React pobieramy jako tekst z własnego serwera (`/vendor/react.js`,
 *      buduje go `scripts/build-sandbox-react.mjs`) i wklejamy do dokumentu
 *      podglądu. CSP aplikacji ma `connect-src 'self'`, więc działa też
 *      w pracowni bez internetu.
 *   3. `import`-y między plikami obsługuje mały rejestr modułów — sucrase
 *      przepisuje ESM na CommonJS, a my dostarczamy `require`.
 *
 * Kod ucznia nadal wykonuje się wyłącznie w zagnieżdżonym iframe bez
 * allow-same-origin. Tutaj traktujemy go jak tekst.
 */

import type { ProjectFile } from "@/types/practical";

const REACT_VENDOR_URL = "/vendor/react.js";

/** Moduły, które uczeń może zaimportować poza plikami własnego projektu. */
export const DOSTEPNE_MODULY = ["react", "react-dom/client"] as const;

type Transformer = (code: string, filePath: string) => string;

let vendorPromise: Promise<string> | null = null;
let transformPromise: Promise<Transformer> | null = null;

/** Paczka Reacta jako tekst — pobierana raz na sesję przeglądarki. */
function loadReactVendor(): Promise<string> {
  vendorPromise ??= fetch(REACT_VENDOR_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => {
      if (!text.includes("window.React")) throw new Error("nieprawidłowa treść paczki");
      return text;
    })
    .catch((e: unknown) => {
      vendorPromise = null;
      throw new Error(
        `Nie udało się wczytać Reacta z ${REACT_VENDOR_URL} (${e instanceof Error ? e.message : "nieznany błąd"}). ` +
          "Uruchom „npm run vendor”, żeby zbudować paczkę.",
      );
    });
  return vendorPromise;
}

/** Sucrase ładujemy leniwie — do zadań HTML/CSS/JS nie jest potrzebny. */
function loadTransformer(): Promise<Transformer> {
  transformPromise ??= import("sucrase")
    .then(({ transform }): Transformer => {
      return (code, filePath) =>
        transform(code, {
          transforms: ["jsx", "imports"],
          jsxRuntime: "automatic",
          production: true,
          filePath,
        }).code;
    })
    .catch((e: unknown) => {
      transformPromise = null;
      throw new Error(`Nie udało się wczytać transpilatora JSX (${e instanceof Error ? e.message : "nieznany błąd"}).`);
    });
  return transformPromise;
}

const isScript = (name: string) => name.endsWith(".js") || name.endsWith(".jsx");

/**
 * `</script` w kodzie ucznia zamknęłoby znacznik, do którego ten kod wklejamy.
 * W poprawnym JS-ie ten ciąg występuje tylko w napisach, komentarzach
 * i wyrażeniach regularnych — tam ukośnik z backslashem nic nie zmienia.
 */
function bezZamkniecia(code: string): string {
  return code.replace(/<\/(script)/gi, "<\\/$1");
}

export type PreparedProject = {
  /** Pliki do podglądu: skrypty zamienione na wywołanie rejestru modułów. */
  files: ProjectFile[];
  /** Skrypt do wstrzyknięcia przed kodem ucznia: React + rejestr modułów. */
  prelude: string;
  /** Błąd składni albo brak paczki — wtedy nie ma czego uruchamiać. */
  error: string | null;
};

/**
 * Buduje rejestr modułów: każdy plik ze skryptem staje się funkcją
 * `(require, module, exports)`, a plik widziany przez `<script src>`
 * tylko uruchamia wejście.
 */
function budujRejestr(moduly: { name: string; code: string }[]): string {
  const defs = moduly
    .map((m) => `${JSON.stringify(m.name)}: function (require, module, exports) {\n${m.code}\n}`)
    .join(",\n");

  return `(function () {
  "use strict";
  var defs = {
${defs}
  };
  var cache = {};
  function base(id) {
    var s = String(id).split("?")[0].split("#")[0];
    var parts = s.split("/");
    return parts[parts.length - 1] || "";
  }
  function resolve(id) {
    var n = base(id);
    if (defs[n]) return n;
    if (defs[n + ".jsx"]) return n + ".jsx";
    if (defs[n + ".js"]) return n + ".js";
    return null;
  }
  function req(id) {
    var raw = String(id);
    if (raw === "react") return window.React;
    if (raw === "react/jsx-runtime" || raw === "react/jsx-dev-runtime") return window.ReactJsxRuntime;
    if (raw === "react-dom" || raw === "react-dom/client") return window.ReactDOM;
    var key = resolve(raw);
    if (!key) {
      throw new Error("Nie znaleziono modulu \\"" + raw + "\\". Dostepne sa pliki projektu oraz react i react-dom/client.");
    }
    if (cache[key]) return cache[key].exports;
    var mod = { exports: {} };
    cache[key] = mod;
    try { defs[key](req, mod, mod.exports); }
    catch (e) { delete cache[key]; throw e; }
    return mod.exports;
  }
  window.__inf03_require = req;
})();`;
}

/**
 * Przepisuje pracę ucznia tak, żeby dała się uruchomić w piaskownicy.
 * Zwraca też komunikat błędu, gdy JSX się nie kompiluje — dla nauczyciela
 * to najczęściej od razu widać, co uczeń zepsuł.
 */
export async function prepareReactProject(files: readonly ProjectFile[]): Promise<PreparedProject> {
  const puste: PreparedProject = { files: [...files], prelude: "", error: null };
  const skrypty = files.filter((f) => isScript(f.name));
  if (skrypty.length === 0) {
    return { ...puste, error: "Praca nie ma żadnego pliku .jsx ani .js — nie ma czego uruchomić." };
  }

  let react: string;
  let transform: Transformer;
  try {
    [react, transform] = await Promise.all([loadReactVendor(), loadTransformer()]);
  } catch (e) {
    return { ...puste, error: e instanceof Error ? e.message : "Nie udało się przygotować środowiska Reacta." };
  }

  const moduly: { name: string; code: string }[] = [];
  for (const f of skrypty) {
    try {
      moduly.push({ name: f.name, code: bezZamkniecia(transform(f.content, f.name)) });
    } catch (e) {
      // Komunikat sucrase zawiera numer linii — zostawiamy go, bo to jedyna
      // informacja, z której nauczyciel odczyta, gdzie uczeń ma błąd.
      const detail = e instanceof Error ? e.message.replace(/\s+/g, " ").slice(0, 300) : "nieznany błąd";
      return { ...puste, error: `Błąd składni w pliku ${f.name}: ${detail}` };
    }
  }

  const prelude = `${react}\n${budujRejestr(moduly)}`;
  const prepared = files.map((f) =>
    isScript(f.name) ? { name: f.name, content: `window.__inf03_require(${JSON.stringify(f.name)});` } : f,
  );
  return { files: prepared, prelude, error: null };
}
