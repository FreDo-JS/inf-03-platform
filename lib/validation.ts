// Walidacja i sanityzacja danych wejściowych.
// Używane dwustronnie: w formularzach (natychmiastowy feedback) ORAZ tuż przed
// każdym zapytaniem do Supabase. Baza ma dodatkowo własne CHECK constraints
// i walidację w funkcjach create_test / submit_attempt (supabase/schema.sql).

import { shuffle } from "@/lib/shuffle";
import {
  CLASS_NAMES,
  type AnswerKeys,
  type ClassName,
  type EndedReason,
  type Json,
  type OpenedTest,
  type OpenTestFailure,
  type PublicQuestion,
  type QuestionType,
  type QuizAnswer,
  type SubmitResult,
} from "@/types/db";

export const LIMITS = {
  studentName: { min: 1, max: 40 },
  title: { min: 1, max: 120 },
  questionText: { min: 1, max: 500 },
  option: { min: 1, max: 200 },
  options: { min: 2, max: 10 },
  accepted: { min: 1, max: 10 },
  questions: { min: 1, max: 100 },
  timeLimitMinutes: { min: 1, max: 120 },
  answer: { max: 500 },
  pinLength: 6,
  pairs: { min: 2, max: 10 },
  pairSide: { min: 1, max: 150 },
  linkLabel: { min: 1, max: 120 },
  linkUrl: { min: 1, max: 500 },
  sortOrder: { min: 0, max: 999 },
} as const;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Podstawowe operacje na tekście
// ---------------------------------------------------------------------------

/** Usuwa znaki kontrolne (Cc) i formatujące (Cf: zero-width, bidi override…). */
export function stripControlChars(input: string): string {
  return input.replace(/[\p{Cc}\p{Cf}]/gu, "");
}

/** Usuwa znaki kontrolne, zwija białe znaki do pojedynczej spacji, przycina. */
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";
  // najpierw zamiana tab/newline na spację, potem usunięcie reszty znaków kontrolnych
  return stripControlChars(input.replace(/\s+/g, " ")).trim();
}

/** Normalizacja odpowiedzi — identyczna jak public.normalize_answer() w SQL. */
export function normalizeAnswer(input: string): string {
  return input.replace(/\s+/g, " ").trim().toLowerCase();
}

function lengthOk(s: string, lim: { min: number; max: number }): boolean {
  const n = [...s].length;
  return n >= lim.min && n <= lim.max;
}

// ---------------------------------------------------------------------------
// Uczeń
// ---------------------------------------------------------------------------

export function validateStudentName(raw: unknown): Result<string> {
  const name = cleanText(raw);
  if (name.length === 0) return { ok: false, error: "Podaj imię." };
  if (!lengthOk(name, LIMITS.studentName)) {
    return { ok: false, error: `Imię może mieć maksymalnie ${LIMITS.studentName.max} znaków.` };
  }
  return { ok: true, value: name };
}

export function isClassName(v: unknown): v is ClassName {
  return typeof v === "string" && (CLASS_NAMES as readonly string[]).includes(v);
}

const SUBTOPIC_ID_RE = /^[a-z0-9-]{1,64}$/;
export function isSubtopicId(v: unknown): v is string {
  return typeof v === "string" && SUBTOPIC_ID_RE.test(v);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Zwraca URL tylko jeśli to poprawny https:// — blokuje javascript:, data: itd. */
export function safeHttpsUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Materiały (linki) przy podtematach
// ---------------------------------------------------------------------------

/**
 * URL materiału do wstawienia w href — tylko http(s), tak jak CHECK w bazie.
 * Wszystko inne (javascript:, data:, //evil) zwraca null i nie trafia do DOM.
 */
export function safeLinkUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function validateLinkLabel(raw: unknown): Result<string> {
  const label = cleanText(raw);
  if (label.length === 0) return { ok: false, error: "Etykieta jest wymagana." };
  if (!lengthOk(label, LIMITS.linkLabel)) return { ok: false, error: `Etykieta: maks. ${LIMITS.linkLabel.max} znaków.` };
  return { ok: true, value: label };
}

export function validateLinkUrl(raw: unknown): Result<string> {
  const url = typeof raw === "string" ? stripControlChars(raw).trim() : "";
  if (url.length === 0) return { ok: false, error: "Adres URL jest wymagany." };
  if (url.length > LIMITS.linkUrl.max) return { ok: false, error: `Adres URL: maks. ${LIMITS.linkUrl.max} znaków.` };
  if (safeLinkUrl(url) === null) return { ok: false, error: "Adres musi zaczynać się od http:// lub https://" };
  return { ok: true, value: url };
}

export function validateSortOrder(raw: unknown): Result<number> {
  const s = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  if (s === "") return { ok: true, value: 0 };
  if (!/^\d{1,3}$/.test(s)) return { ok: false, error: "Kolejność: liczba 0–999." };
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < 0 || n > LIMITS.sortOrder.max) {
    return { ok: false, error: `Kolejność: liczba 0–${LIMITS.sortOrder.max}.` };
  }
  return { ok: true, value: n };
}

function cleanAnswer(a: unknown): string | null {
  if (typeof a !== "string") return null;
  const cleaned = stripControlChars(a).trim().slice(0, LIMITS.answer.max);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Odpowiedzi ucznia przed wysłaniem. Dla closed/select/input: napis albo null.
 * Dla matching: tablica wartości prawej kolumny w kolejności lewej (null = brak).
 */
export function sanitizeAnswers(answers: readonly QuizAnswer[], total: number): QuizAnswer[] {
  const out: QuizAnswer[] = [];
  for (let i = 0; i < total; i++) {
    const a = answers[i];
    out.push(Array.isArray(a) ? a.slice(0, LIMITS.pairs.max).map(cleanAnswer) : cleanAnswer(a));
  }
  return out;
}

const PIN_RE = /^[0-9]{6}$/;

/** PIN testu: dokładnie 6 cyfr. */
export function validatePin(raw: unknown): Result<string> {
  const pin = typeof raw === "string" ? raw.replace(/\s+/g, "") : "";
  if (!PIN_RE.test(pin)) return { ok: false, error: "PIN to 6 cyfr." };
  return { ok: true, value: pin };
}

// ---------------------------------------------------------------------------
// Limit czasu
// ---------------------------------------------------------------------------

export function validateTimeLimitMinutes(raw: unknown): Result<number> {
  const s = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  if (!/^\d{1,4}$/.test(s)) return { ok: false, error: "Limit czasu musi być liczbą całkowitą minut." };
  const n = Number(s);
  const { min, max } = LIMITS.timeLimitMinutes;
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    return { ok: false, error: `Limit czasu: od ${min} do ${max} minut.` };
  }
  return { ok: true, value: n };
}

// ---------------------------------------------------------------------------
// Kreator testu (admin)
// ---------------------------------------------------------------------------

export type DraftPair = { left: string; right: string };

export type DraftQuestion = {
  type: QuestionType;
  text: string;
  /** closed/select: opcje odpowiedzi */
  options: string[];
  /** closed/select: indeks poprawnej opcji */
  correctIndex: number | null;
  /** input: akceptowane warianty odpowiedzi */
  accepted: string[];
  /** matching: pary do dopasowania */
  pairs: DraftPair[];
};

export type TestDraft = {
  title: string;
  timeLimitMinutes: string;
  /** pusty = PIN wylosuje baza */
  pin: string;
  questions: DraftQuestion[];
};

export type TestPayload = {
  title: string;
  timeLimitSec: number;
  pin: string | null;
  questions: PublicQuestion[];
  keys: AnswerKeys;
};

export type DraftErrors = {
  title?: string;
  timeLimit?: string;
  pin?: string;
  general?: string;
  questions: Record<number, string[]>;
};

export function emptyQuestion(type: QuestionType = "closed"): DraftQuestion {
  return {
    type,
    text: "",
    options: type === "closed" || type === "select" ? ["", ""] : [],
    correctIndex: null,
    accepted: type === "input" ? [""] : [],
    pairs: type === "matching" ? [emptyPair(), emptyPair()] : [],
  };
}

export function emptyPair(): DraftPair {
  return { left: "", right: "" };
}

function validateQuestion(q: DraftQuestion): { errors: string[]; question?: PublicQuestion; key?: string[] } {
  const errors: string[] = [];
  const text = cleanText(q.text);
  if (text.length === 0) errors.push("Treść pytania jest wymagana.");
  else if (!lengthOk(text, LIMITS.questionText)) errors.push(`Treść pytania: maks. ${LIMITS.questionText.max} znaków.`);

  if (q.type === "closed" || q.type === "select") {
    const options = q.options.map(cleanText);
    if (options.length < LIMITS.options.min || options.length > LIMITS.options.max) {
      errors.push(`Pytanie musi mieć od ${LIMITS.options.min} do ${LIMITS.options.max} opcji.`);
    }
    if (options.some((o) => o.length === 0)) errors.push("Opcje odpowiedzi nie mogą być puste.");
    if (options.some((o) => !lengthOk(o, LIMITS.option) && o.length > 0)) {
      errors.push(`Opcja odpowiedzi: maks. ${LIMITS.option.max} znaków.`);
    }
    if (new Set(options).size !== options.length) errors.push("Opcje odpowiedzi muszą być unikalne.");
    const idx = q.correctIndex;
    const correct = idx !== null && idx >= 0 && idx < options.length ? options[idx] : undefined;
    if (correct === undefined || correct.length === 0) errors.push("Zaznacz dokładnie jedną poprawną odpowiedź.");

    if (errors.length > 0 || correct === undefined) return { errors };
    return { errors, question: { type: q.type, text, options }, key: [correct] };
  }

  if (q.type === "matching") {
    const pairs = q.pairs.map((p) => ({ left: cleanText(p.left), right: cleanText(p.right) }));
    if (pairs.length < LIMITS.pairs.min || pairs.length > LIMITS.pairs.max) {
      errors.push(`Pytanie musi mieć od ${LIMITS.pairs.min} do ${LIMITS.pairs.max} par.`);
    }
    if (pairs.some((p) => p.left.length === 0 || p.right.length === 0)) {
      errors.push("Obie strony każdej pary muszą być wypełnione.");
    }
    if (pairs.some((p) => !lengthOk(p.left, LIMITS.pairSide) && p.left.length > 0)) {
      errors.push(`Lewa strona pary: maks. ${LIMITS.pairSide.max} znaków.`);
    }
    if (pairs.some((p) => !lengthOk(p.right, LIMITS.pairSide) && p.right.length > 0)) {
      errors.push(`Prawa strona pary: maks. ${LIMITS.pairSide.max} znaków.`);
    }
    if (new Set(pairs.map((p) => p.left)).size !== pairs.length) {
      errors.push("Lewa kolumna nie może się powtarzać.");
    }
    if (new Set(pairs.map((p) => p.right)).size !== pairs.length) {
      errors.push("Prawa kolumna nie może się powtarzać.");
    }

    if (errors.length > 0) return { errors };
    // Prawą kolumnę zapisujemy potasowaną, żeby kolejność w bazie nie zdradzała par.
    // Uczeń i tak zobaczy ją potasowaną ponownie przy każdym podejściu.
    return {
      errors,
      question: { type: "matching", text, left: pairs.map((p) => p.left), right: shuffle(pairs.map((p) => p.right)) },
      key: pairs.map((p) => p.right),
    };
  }

  // input
  const accepted = q.accepted.map(cleanText).filter((a) => a.length > 0);
  const unique = [...new Set(accepted)];
  if (unique.length < LIMITS.accepted.min) errors.push("Podaj co najmniej jedną poprawną odpowiedź.");
  if (unique.length > LIMITS.accepted.max) errors.push(`Maksymalnie ${LIMITS.accepted.max} wariantów odpowiedzi.`);
  if (unique.some((a) => !lengthOk(a, LIMITS.option))) errors.push(`Wariant odpowiedzi: maks. ${LIMITS.option.max} znaków.`);

  if (errors.length > 0) return { errors };
  return { errors, question: { type: "input", text }, key: unique };
}

export function validateTestDraft(draft: TestDraft): { ok: true; value: TestPayload } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = { questions: {} };
  let failed = false;

  const title = cleanText(draft.title);
  if (title.length === 0) {
    errors.title = "Tytuł jest wymagany.";
    failed = true;
  } else if (!lengthOk(title, LIMITS.title)) {
    errors.title = `Tytuł: maks. ${LIMITS.title.max} znaków.`;
    failed = true;
  }

  const time = validateTimeLimitMinutes(draft.timeLimitMinutes);
  if (!time.ok) {
    errors.timeLimit = time.error;
    failed = true;
  }

  let pin: string | null = null;
  if (draft.pin.trim() !== "") {
    const p = validatePin(draft.pin);
    if (p.ok) pin = p.value;
    else {
      errors.pin = p.error;
      failed = true;
    }
  }

  if (draft.questions.length < LIMITS.questions.min || draft.questions.length > LIMITS.questions.max) {
    errors.general = `Test musi mieć od ${LIMITS.questions.min} do ${LIMITS.questions.max} pytań.`;
    failed = true;
  }

  const questions: PublicQuestion[] = [];
  const keys: AnswerKeys = [];
  draft.questions.forEach((q, i) => {
    const r = validateQuestion(q);
    if (r.errors.length > 0 || !r.question || !r.key) {
      errors.questions[i] = r.errors;
      failed = true;
    } else {
      questions.push(r.question);
      keys.push(r.key);
    }
  });

  if (failed || !time.ok) return { ok: false, errors };
  return { ok: true, value: { title, timeLimitSec: time.value * 60, pin, questions, keys } };
}

// ---------------------------------------------------------------------------
// Parsowanie danych z bazy (nie ufamy kształtowi JSON-a)
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

export function parseQuestions(json: Json | unknown): PublicQuestion[] | null {
  if (!Array.isArray(json)) return null;
  const out: PublicQuestion[] = [];
  for (const item of json) {
    if (!isRecord(item) || typeof item.text !== "string") return null;
    if (item.type === "input") {
      out.push({ type: "input", text: item.text });
    } else if (item.type === "matching") {
      const { left, right } = item;
      if (!isStringArray(left) || !isStringArray(right) || left.length !== right.length || left.length < 2) return null;
      out.push({ type: "matching", text: item.text, left, right });
    } else if (item.type === "closed" || item.type === "select") {
      const opts = item.options;
      if (!Array.isArray(opts) || !opts.every((o): o is string => typeof o === "string")) return null;
      out.push({ type: item.type, text: item.text, options: opts });
    } else {
      return null;
    }
  }
  return out;
}

export function isEndedReason(v: unknown): v is EndedReason {
  return v === "completed" || v === "time_up" || v === "tab_switch";
}

/**
 * Czas z serwera (quiz_time / practical_time). Zwracamy znaczniki w
 * milisekundach — odliczanie liczymy względem czasu serwera, nie zegara ucznia.
 */
export function parseServerTime(json: unknown): { serverNow: number; endsAt: number | null } | null {
  if (!isRecord(json)) return null;
  const now = typeof json.server_now === "string" ? Date.parse(json.server_now) : NaN;
  if (Number.isNaN(now)) return null;
  const ends = typeof json.ends_at === "string" ? Date.parse(json.ends_at) : NaN;
  return { serverNow: now, endsAt: Number.isNaN(ends) ? null : ends };
}

export function parseSubmitResult(json: unknown): SubmitResult | null {
  if (!isRecord(json)) return null;
  const { score, total, results, duration_sec, ended_reason, tab_switch_count } = json;
  if (typeof score !== "number" || typeof total !== "number" || !Array.isArray(results)) return null;
  if (!results.every((r): r is boolean => typeof r === "boolean")) return null;
  return {
    score,
    total,
    results,
    durationSec: typeof duration_sec === "number" ? duration_sec : 0,
    endedReason: isEndedReason(ended_reason) ? ended_reason : "completed",
    tabSwitchCount: typeof tab_switch_count === "number" ? tab_switch_count : 0,
  };
}

export function parseOpenTest(
  json: unknown,
): { ok: true; value: OpenedTest } | { ok: false; reason: OpenTestFailure } | null {
  if (!isRecord(json)) return null;
  if (json.ok === false) {
    const r = json.reason;
    return r === "bad_pin" || r === "rate_limited" || r === "not_found" ? { ok: false, reason: r } : null;
  }
  const { session_id, title, time_limit, questions } = json;
  const qs = parseQuestions(questions);
  if (json.ok !== true || !isUuid(session_id) || typeof title !== "string" || typeof time_limit !== "number" || !qs) {
    return null;
  }
  return { ok: true, value: { sessionId: session_id, title, timeLimitSec: time_limit, questions: qs } };
}

export function parseCreateTestResult(json: unknown): { id: string; pin: string } | null {
  if (!isRecord(json)) return null;
  const { id, pin } = json;
  return isUuid(id) && typeof pin === "string" && PIN_RE.test(pin) ? { id, pin } : null;
}

export function parseBeginSession(json: unknown): string | null {
  if (!isRecord(json) || json.ok !== true || typeof json.student_name !== "string") return null;
  return json.student_name;
}
