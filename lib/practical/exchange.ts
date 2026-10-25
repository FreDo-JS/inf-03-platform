// Wymiana zadań praktycznych między nauczycielami: kopia w panelu oraz eksport
// i import pliku JSON. Import niczemu nie ufa — plik pochodzi od kogoś innego, więc
// przechodzi tę samą walidację co zadanie wpisane ręcznie w kreatorze, a trafia do
// bazy zawsze jako szkic (trzeba go przejrzeć, zanim posłuży do sesji).

import type { TaskPayload } from "@/lib/practical/tasks";
import { parseAutoTests, parseCriteria, parseFiles } from "@/lib/practical/parse";
import {
  PRACTICAL_LIMITS,
  isAutoTestType,
  validateAutoTest,
  validateCriterion,
  validateFiles,
} from "@/lib/practical/validation";
import type { Result } from "@/lib/validation";
import type { PracticalTaskRow } from "@/types/practical";

export const EXPORT_FORMAT = "tebby-praktyka-zadanie";
export const EXPORT_VERSION = 1;
/** Plik większy niż to nie jest zadaniem (limit bazy to 1 MB plików + testy). */
export const MAX_IMPORT_BYTES = 2_500_000;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Zadanie jako tekst JSON do zapisania w pliku. Bez identyfikatorów i dat z bazy. */
export function exportTask(task: PracticalTaskRow): string {
  return JSON.stringify(
    {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      title: task.title,
      summary: task.summary,
      content_md: task.content_md,
      default_minutes: task.default_minutes,
      allow_new_files: task.allow_new_files,
      student_can_run_tests: task.student_can_run_tests,
      practice: task.practice,
      files: task.files,
      reference_files: task.reference_files,
      auto_tests: task.auto_tests,
      manual_criteria: task.manual_criteria,
    },
    null,
    2,
  );
}

/** Nazwa pliku z tytułu zadania: małe litery, cyfry i myślniki. */
export function exportFileName(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/gi, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `zadanie-${slug || "praktyczne"}.json`;
}

/** Kopia zadania do edycji: ten sam materiał, tytuł z dopiskiem, zawsze szkic. */
export function copyOf(task: PracticalTaskRow): TaskPayload {
  const prefix = "Kopia: ";
  return {
    title: (prefix + task.title).slice(0, PRACTICAL_LIMITS.title.max),
    summary: task.summary,
    content_md: task.content_md,
    files: task.files,
    reference_files: task.reference_files,
    auto_tests: task.auto_tests,
    manual_criteria: task.manual_criteria,
    default_minutes: task.default_minutes,
    allow_new_files: task.allow_new_files,
    student_can_run_tests: task.student_can_run_tests,
    // kopia nie jest od razu publiczna: tryb ćwiczeń trzeba włączyć świadomie
    practice: false,
    is_ready: false,
  };
}

/** Odczyt i sprawdzenie pliku z zadaniem. Pierwszy błąd kończy sprawdzanie. */
export function importTask(text: string): Result<TaskPayload> {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: "Plik jest za duży jak na zadanie." };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "To nie jest poprawny plik JSON." };
  }
  if (!isRecord(raw) || raw.format !== EXPORT_FORMAT) {
    return { ok: false, error: "To nie jest plik zadania z Tebby (brak znacznika formatu)." };
  }
  if (typeof raw.version !== "number" || raw.version > EXPORT_VERSION) {
    return { ok: false, error: "Plik pochodzi z nowszej wersji aplikacji — zaktualizuj Tebby." };
  }

  const title = typeof raw.title === "string" ? raw.title.replace(/\s+/g, " ").trim() : "";
  if (title.length < PRACTICAL_LIMITS.title.min || title.length > PRACTICAL_LIMITS.title.max) {
    return { ok: false, error: "Tytuł zadania musi mieć od 1 do 120 znaków." };
  }
  const summary = typeof raw.summary === "string" ? raw.summary : "";
  if (summary.length > PRACTICAL_LIMITS.summary.max) return { ok: false, error: "Opis zadania jest za długi (maks. 300 znaków)." };
  const contentMd = typeof raw.content_md === "string" ? raw.content_md : "";
  if (contentMd.length > PRACTICAL_LIMITS.contentMd.max) return { ok: false, error: "Arkusz zadania jest za długi (maks. 20 000 znaków)." };

  const minutes = raw.default_minutes;
  if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes < PRACTICAL_LIMITS.minutes.min || minutes > PRACTICAL_LIMITS.minutes.max) {
    return { ok: false, error: "Czas zadania musi być liczbą całkowitą minut od 5 do 300." };
  }

  const rawFiles = Array.isArray(raw.files) ? raw.files : [];
  const rawReference = Array.isArray(raw.reference_files) ? raw.reference_files : [];
  const parsedFiles = parseFiles(rawFiles);
  const parsedReference = parseFiles(rawReference);
  if (parsedFiles.length !== rawFiles.length) return { ok: false, error: "Pliki startowe: część wpisów ma nieprawidłowy kształt." };
  if (parsedReference.length !== rawReference.length) return { ok: false, error: "Rozwiązanie wzorcowe: część wpisów ma nieprawidłowy kształt." };
  const files = validateFiles(parsedFiles);
  if (!files.ok) return { ok: false, error: `Pliki startowe: ${files.error}` };
  const reference = validateFiles(parsedReference);
  if (!reference.ok) return { ok: false, error: `Rozwiązanie wzorcowe: ${reference.error}` };

  const rawTests = Array.isArray(raw.auto_tests) ? raw.auto_tests : [];
  if (rawTests.length > PRACTICAL_LIMITS.tests.max) return { ok: false, error: `Za dużo testów (maks. ${PRACTICAL_LIMITS.tests.max}).` };
  const tests = parseAutoTests(rawTests);
  if (tests.length !== rawTests.length) return { ok: false, error: "Część testów ma nieprawidłowy kształt." };

  const fileNames = [...new Set([...files.value, ...reference.value].map((f) => f.name))];
  const ids = new Set<string>();
  for (const t of tests) {
    if (!isAutoTestType(t.type)) return { ok: false, error: `Nieznany typ testu „${String(t.type)}” — plik z nowszej wersji?` };
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(t.id) || ids.has(t.id)) return { ok: false, error: `Identyfikator testu „${t.id}” jest nieprawidłowy lub powtórzony.` };
    ids.add(t.id);
    const errors = validateAutoTest(t, fileNames);
    if (errors.length > 0) return { ok: false, error: `Test „${t.name}”: ${errors[0]}` };
  }

  const rawCriteria = Array.isArray(raw.manual_criteria) ? raw.manual_criteria : [];
  if (rawCriteria.length > PRACTICAL_LIMITS.criteria.max) return { ok: false, error: `Za dużo kryteriów (maks. ${PRACTICAL_LIMITS.criteria.max}).` };
  const criteria = parseCriteria(rawCriteria);
  if (criteria.length !== rawCriteria.length) return { ok: false, error: "Część kryteriów ma nieprawidłowy kształt." };
  const criterionIds = new Set<string>();
  for (const c of criteria) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(c.id) || criterionIds.has(c.id)) return { ok: false, error: `Identyfikator kryterium „${c.id}” jest nieprawidłowy lub powtórzony.` };
    criterionIds.add(c.id);
    const errors = validateCriterion(c);
    if (errors.length > 0) return { ok: false, error: `Kryterium „${c.name}”: ${errors[0]}` };
  }

  return {
    ok: true,
    value: {
      title,
      summary,
      content_md: contentMd,
      files: files.value,
      reference_files: reference.value,
      auto_tests: tests,
      manual_criteria: criteria,
      default_minutes: minutes,
      allow_new_files: raw.allow_new_files === true,
      student_can_run_tests: raw.student_can_run_tests === true,
      // z cudzego pliku nic nie staje się publiczne samo — ćwiczenia włącza nauczyciel po przejrzeniu
      practice: false,
      // import zawsze trafia jako szkic — nauczyciel przegląda go przed użyciem
      is_ready: false,
    },
  };
}
