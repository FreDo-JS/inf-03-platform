// Kopiuje Monaco Editor do public/monaco, żeby ładował się z naszego origin.
// CSP dopuszcza skrypty tylko z 'self' — wersja z CDN (domyślna w
// @monaco-editor/react) byłaby zablokowana, a w szkolnej pracowni bez internetu
// i tak by się nie wczytała.
import { cp, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "monaco-editor", "min", "vs");
const dest = join(root, "public", "monaco", "vs");

try {
  await stat(src);
} catch {
  console.error("Brak node_modules/monaco-editor — uruchom najpierw npm install.");
  process.exit(1);
}

await mkdir(dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log("Monaco skopiowane do public/monaco/vs");
