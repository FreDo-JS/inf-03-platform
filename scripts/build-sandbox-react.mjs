// Buduje paczkę Reacta dla piaskownicy podglądu — na wzór copy-monaco.mjs.
//
// Po co własna paczka: React 19 nie publikuje już builda UMD (w node_modules
// jest tylko CJS), a kodu ucznia nie ładujemy z CDN-u — pracownia bywa bez
// internetu, a CSP piaskownicy nie dopuszcza zewnętrznych skryptów. Dlatego
// zbijamy React i ReactDOM w jeden plik IIFE z globalami i serwujemy go z
// własnego katalogu public (CSP aplikacji ma connect-src 'self', więc panel
// może go wczytać i wkleić do dokumentu podglądu).
//
// Katalog public/vendor jest w .gitignore — plik powstaje przy predev/prebuild.
import { build } from "esbuild";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "vendor");
const outFile = join(outDir, "react.js");
const entry = join(outDir, "_entry-react.js");

mkdirSync(outDir, { recursive: true });

// Wejście generujemy w locie — nie ma sensu trzymać go w repozytorium.
writeFileSync(
  entry,
  `import * as React from "react";
import * as ReactDOM from "react-dom/client";
import * as JsxRuntime from "react/jsx-runtime";
window.React = React;
window.ReactDOM = ReactDOM;
// JSX bez importu Reacta (automatyczny runtime) wola react/jsx-runtime
window.ReactJsxRuntime = JsxRuntime;
`,
);

await build({
  entryPoints: [entry],
  outfile: outFile,
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2019"],
  // Produkcyjny build Reacta: mniejszy i bez ostrzeżeń trybu deweloperskiego,
  // które w podglądzie pracy byłyby tylko szumem.
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
});

const kb = Math.round(statSync(outFile).size / 1024);
console.log(`[vendor] public/vendor/react.js — ${kb} KB`);
