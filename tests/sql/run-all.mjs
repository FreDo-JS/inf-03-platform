// Uruchamia wszystkie zestawy testów bazy danych na PGlite (Postgres w pamięci).
// Nie dotyka prawdziwego Supabase — każdy zestaw stawia świeżą bazę z migracji.
//
//   npm run test:sql
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const suites = readdirSync(here)
  .filter((f) => f.endsWith(".mjs") && f !== "run-all.mjs")
  .sort();

let failed = 0;

for (const suite of suites) {
  const out = await new Promise((resolve) => {
    const child = spawn(process.execPath, [join(here, suite)], { encoding: "utf8" });
    let buffer = "";
    child.stdout.on("data", (d) => (buffer += d));
    child.stderr.on("data", (d) => (buffer += d));
    child.on("close", (code) => resolve({ code, buffer }));
  });

  const summary = out.buffer.trim().split("\n").pop() ?? "";
  const bad = out.code !== 0 || /[1-9]\d* (fail|uwag)/.test(summary);
  if (bad) {
    failed++;
    console.error(`FAIL  ${suite.padEnd(16)} ${summary}`);
    console.error(out.buffer.split("\n").filter((l) => l.includes("FAIL")).join("\n"));
  } else {
    console.log(`ok    ${suite.padEnd(16)} ${summary}`);
  }
}

console.log(failed === 0 ? "\nWszystkie zestawy przeszły." : `\n${failed} zestaw(y) z błędami.`);
process.exit(failed === 0 ? 0 : 1);
