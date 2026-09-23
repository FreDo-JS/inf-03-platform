// Walidacja modułu Praktyka po stronie przeglądarki.
// To tylko szybki feedback — właściwą walidację robią funkcje w bazie
// (supabase/006_practical.sql), bo przeglądarce nie ufamy.

import type { Result } from "@/lib/validation";
import { AUTO_TEST_TYPES, type AutoTest, type AutoTestType, type ManualCriterion, type ProjectFile } from "@/types/practical";

export const PRACTICAL_LIMITS = {
  studentName: { min: 2, max: 40 },
  title: { min: 1, max: 120 },
  summary: { max: 300 },
  contentMd: { max: 20000 },
  fileContent: { max: 200000 },
  filesTotal: { max: 1000000 },
  files: { max: 15 },
  minutes: { min: 5, max: 300 },
  threshold: { min: 1, max: 100 },
  testName: { min: 1, max: 200 },
  points: { min: 0, max: 100 },
  criteria: { max: 30 },
  tests: { max: 60 },
  pasteLog: 200, // od tylu znaków wklejenie trafia do dziennika
} as const;

const FILE_NAME_RE = /^[A-Za-z0-9_-]{1,40}\.(html|css|js|txt)$/;
// te same znaki co practical_clean_name() w SQL
const NAME_RE = /^[\p{L}][\p{L} '-]*$/u;

export function isProjectFileName(name: unknown): name is string {
  return typeof name === "string" && FILE_NAME_RE.test(name);
}

export function validatePracticalName(raw: unknown): Result<string> {
  const name = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (name.length < PRACTICAL_LIMITS.studentName.min) return { ok: false, error: "Podaj imię (min. 2 znaki)." };
  if ([...name].length > PRACTICAL_LIMITS.studentName.max) return { ok: false, error: "Imię jest za długie." };
  if (!NAME_RE.test(name)) return { ok: false, error: "Imię może zawierać tylko litery, spację, myślnik i apostrof." };
  return { ok: true, value: name };
}

export function validateFiles(files: readonly ProjectFile[]): Result<ProjectFile[]> {
  if (files.length > PRACTICAL_LIMITS.files.max) return { ok: false, error: `Maksymalnie ${PRACTICAL_LIMITS.files.max} plików.` };
  const names = new Set<string>();
  let total = 0;
  for (const f of files) {
    if (!isProjectFileName(f.name)) return { ok: false, error: `Nieprawidłowa nazwa pliku: ${f.name}` };
    if (names.has(f.name)) return { ok: false, error: `Powtórzona nazwa pliku: ${f.name}` };
    names.add(f.name);
    const size = new Blob([f.content]).size;
    if (size > PRACTICAL_LIMITS.fileContent.max) return { ok: false, error: `Plik ${f.name} przekracza 200 KB.` };
    total += size;
  }
  if (total > PRACTICAL_LIMITS.filesTotal.max) return { ok: false, error: "Projekt przekracza 1 MB." };
  return { ok: true, value: [...files] };
}

export function isAutoTestType(v: unknown): v is AutoTestType {
  return typeof v === "string" && (AUTO_TEST_TYPES as readonly string[]).includes(v);
}

/** Sprawdza pojedynczy test z kreatora; zwraca listę błędów po polsku. */
export function validateAutoTest(test: AutoTest, fileNames: readonly string[]): string[] {
  const errors: string[] = [];
  const name = test.name?.trim() ?? "";
  if (name.length === 0) errors.push("Nazwa testu jest wymagana.");
  if (name.length > PRACTICAL_LIMITS.testName.max) errors.push("Nazwa testu jest za długa.");
  if (!Number.isFinite(test.points) || test.points < PRACTICAL_LIMITS.points.min || test.points > PRACTICAL_LIMITS.points.max) {
    errors.push("Punkty: liczba od 0 do 100.");
  }

  const requirePage = (page: string) => {
    if (!page) errors.push("Wybierz stronę do sprawdzenia.");
    else if (!fileNames.includes(page)) errors.push(`Plik ${page} nie istnieje w zadaniu.`);
    else if (!page.endsWith(".html")) errors.push("Testy strony działają na plikach .html.");
  };
  const requireSelector = (selector: string) => {
    if (!selector?.trim()) errors.push("Podaj selektor CSS.");
  };

  switch (test.type) {
    case "file_not_empty":
      if (!test.file) errors.push("Wybierz plik.");
      else if (!fileNames.includes(test.file)) errors.push(`Plik ${test.file} nie istnieje w zadaniu.`);
      break;
    case "selector_count":
      requirePage(test.page);
      requireSelector(test.selector);
      if (test.min === undefined && test.max === undefined) errors.push("Podaj min. lub maks. liczbę elementów.");
      if (test.min !== undefined && test.max !== undefined && test.min > test.max) errors.push("Minimum jest większe niż maksimum.");
      break;
    case "selector_text":
    case "selector_attribute":
      requirePage(test.page);
      requireSelector(test.selector);
      if (!test.value?.trim()) errors.push("Podaj oczekiwaną wartość.");
      if (test.type === "selector_attribute" && !test.attribute?.trim()) errors.push("Podaj nazwę atrybutu.");
      if (test.mode === "regex") {
        try {
          new RegExp(test.value);
        } catch {
          errors.push("Nieprawidłowe wyrażenie regularne.");
        }
      }
      break;
    case "css_computed":
      requirePage(test.page);
      requireSelector(test.selector);
      if (!test.property?.trim()) errors.push("Podaj właściwość CSS (np. color).");
      if (!test.expected?.trim()) errors.push("Podaj oczekiwaną wartość właściwości.");
      break;
    case "html_lang_doctype":
      requirePage(test.page);
      break;
    case "interaction":
      requirePage(test.page);
      if (test.steps.length === 0) errors.push("Dodaj co najmniej jeden krok.");
      if (test.steps.length > 20) errors.push("Maksymalnie 20 kroków.");
      test.steps.forEach((s, i) => {
        if (s.action === "wait") {
          if (!Number.isFinite(s.ms) || s.ms < 0 || s.ms > 2000) errors.push(`Krok ${i + 1}: czekanie 0–2000 ms.`);
        } else if (!s.selector?.trim()) {
          errors.push(`Krok ${i + 1}: podaj selektor.`);
        } else if ((s.action === "fill" || s.action === "select") && s.value === undefined) {
          errors.push(`Krok ${i + 1}: podaj wartość.`);
        }
      });
      if (!test.expect?.selector?.trim()) errors.push("Podaj selektor oczekiwanego wyniku.");
      if (test.expect?.mode === "attribute" && !test.expect.attribute?.trim()) errors.push("Podaj atrybut w oczekiwanym wyniku.");
      break;
  }
  return errors;
}

export function validateCriterion(c: ManualCriterion): string[] {
  const errors: string[] = [];
  if (!c.name?.trim()) errors.push("Nazwa kryterium jest wymagana.");
  if (c.name && c.name.length > PRACTICAL_LIMITS.testName.max) errors.push("Nazwa kryterium jest za długa.");
  if (!Number.isFinite(c.points) || c.points < 0 || c.points > PRACTICAL_LIMITS.points.max) {
    errors.push("Punkty: liczba od 0 do 100.");
  }
  return errors;
}

/** Identyfikator testu/kryterium — krótki, stabilny, bez znaków specjalnych. */
export function newLocalId(prefix: string): string {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return `${prefix}-${buf[0]?.toString(36) ?? "0"}${buf[1]?.toString(36) ?? "0"}`.slice(0, 40);
}
