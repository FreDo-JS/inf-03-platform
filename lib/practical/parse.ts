// Parsowanie odpowiedzi funkcji RPC modułu Praktyka.
// Nie ufamy kształtowi JSON-a z bazy — wszystko sprawdzamy w czasie wykonania.

import type {
  AttemptState,
  AttemptStatus,
  AutoResult,
  AutoTest,
  JoinFailure,
  ManualCriterion,
  ManualScore,
  PracticalEndedReason,
  ProjectFile,
  PublishedResult,
  ResultPayload,
  SessionStatus,
  TestOverride,
} from "@/types/practical";

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown, fallback = false): boolean => (typeof v === "boolean" ? v : fallback);
const nullableStr = (v: unknown): string | null => (typeof v === "string" ? v : null);

export function parseFiles(v: unknown): ProjectFile[] {
  if (!Array.isArray(v)) return [];
  const out: ProjectFile[] = [];
  for (const item of v) {
    if (isRecord(item) && typeof item.name === "string" && typeof item.content === "string") {
      out.push({ name: item.name, content: item.content });
    }
  }
  return out;
}

const SESSION_STATUSES: SessionStatus[] = ["lobby", "active", "finished"];
const ATTEMPT_STATUSES: AttemptStatus[] = ["in_progress", "submitted", "auto_checked", "reviewed", "published"];
const ENDED_REASONS: PracticalEndedReason[] = ["completed", "time_up", "tab_switch", "teacher_ended"];

const sessionStatus = (v: unknown): SessionStatus =>
  SESSION_STATUSES.find((s) => s === v) ?? "lobby";
const attemptStatus = (v: unknown): AttemptStatus =>
  ATTEMPT_STATUSES.find((s) => s === v) ?? "in_progress";
export const endedReason = (v: unknown): PracticalEndedReason | null =>
  ENDED_REASONS.find((s) => s === v) ?? null;

export function parseAttemptState(v: unknown): AttemptState | null {
  if (!isRecord(v)) return null;
  const session = isRecord(v.session) ? v.session : null;
  const task = isRecord(v.task) ? v.task : null;
  if (!session || !task || typeof v.attempt_id !== "string") return null;

  return {
    attemptId: v.attempt_id,
    studentName: str(v.student_name),
    status: attemptStatus(v.status),
    files: parseFiles(v.files),
    resultToken: str(v.result_token),
    tabSwitchCount: num(v.tab_switch_count),
    lastSavedAt: nullableStr(v.last_saved_at),
    endedReason: endedReason(v.ended_reason),
    session: {
      id: str(session.id),
      status: sessionStatus(session.status),
      allowPaste: bool(session.allow_paste, true),
      minutes: num(session.minutes, 150),
      startedAt: nullableStr(session.started_at),
      endsAt: nullableStr(session.ends_at),
      serverNow: str(session.server_now, new Date().toISOString()),
    },
    task: {
      id: str(task.id),
      title: str(task.title),
      summary: str(task.summary),
      content_md: str(task.content_md),
      files: parseFiles(task.files),
      allow_new_files: bool(task.allow_new_files),
      student_can_run_tests: bool(task.student_can_run_tests),
      test_names: Array.isArray(task.test_names)
        ? task.test_names.flatMap((t) => (isRecord(t) ? [{ id: str(t.id), name: str(t.name) }] : []))
        : [],
    },
  };
}

export type JoinOutcome =
  | { ok: true; attemptToken: string; state: AttemptState }
  | { ok: false; reason: JoinFailure };

export function parseJoin(v: unknown): JoinOutcome | null {
  if (!isRecord(v)) return null;
  if (v.ok === false) {
    const r = v.reason;
    return r === "bad_pin" || r === "rate_limited" || r === "name_taken" ? { ok: false, reason: r } : null;
  }
  const state = parseAttemptState(v.state);
  if (v.ok !== true || typeof v.attempt_token !== "string" || !state) return null;
  return { ok: true, attemptToken: v.attempt_token, state };
}

export function parseSave(v: unknown): { savedAt: string; endsAt: string | null; serverNow: string } | null {
  if (!isRecord(v) || v.ok !== true) return null;
  return { savedAt: str(v.saved_at), endsAt: nullableStr(v.ends_at), serverNow: str(v.server_now) };
}

export function parseEvent(v: unknown): { tabSwitchCount: number; largePasteCount: number; shouldEnd: boolean } | null {
  if (!isRecord(v) || v.ok !== true) return null;
  return {
    tabSwitchCount: num(v.tab_switch_count),
    largePasteCount: num(v.large_paste_count),
    shouldEnd: bool(v.should_end),
  };
}

export function parseSubmit(v: unknown): { resultToken: string; endedReason: PracticalEndedReason | null } | null {
  if (!isRecord(v) || v.ok !== true || typeof v.result_token !== "string") return null;
  return { resultToken: v.result_token, endedReason: endedReason(v.ended_reason) };
}

export function parseResult(v: unknown): ResultPayload | null {
  if (!isRecord(v)) return null;
  const base = { studentName: str(v.student_name), taskTitle: str(v.task_title), submittedAt: nullableStr(v.submitted_at) };
  if (v.published !== true) return { published: false, ...base };

  const published: PublishedResult = {
    published: true,
    ...base,
    endedReason: endedReason(v.ended_reason),
    finalPercent: num(v.final_percent),
    passThreshold: num(v.pass_threshold, 75),
    passed: bool(v.passed),
    teacherComment: str(v.teacher_comment),
    files: parseFiles(v.files),
    tests: Array.isArray(v.tests)
      ? v.tests.flatMap((t) =>
          isRecord(t)
            ? [{
                id: str(t.id),
                name: str(t.name),
                passed: bool(t.passed),
                points: num(t.points),
                maxPoints: num(t.max_points),
                message: str(t.message),
              }]
            : [],
        )
      : [],
    criteria: Array.isArray(v.criteria)
      ? v.criteria.flatMap((c) =>
          isRecord(c)
            ? [{
                id: str(c.id),
                name: str(c.name),
                description: typeof c.description === "string" ? c.description : undefined,
                maxPoints: num(c.max_points),
                points: num(c.points),
              }]
            : [],
        )
      : [],
  };
  return published;
}

// --- dane po stronie admina (odczyt prosto z tabel) -------------------------

export function parseAutoTests(v: unknown): AutoTest[] {
  if (!Array.isArray(v)) return [];
  // struktura jest pilnowana przez CHECK w bazie i kreator; tutaj tylko odsiewamy śmieci
  return v.filter((t): t is AutoTest => isRecord(t) && typeof t.id === "string" && typeof t.type === "string");
}

export function parseCriteria(v: unknown): ManualCriterion[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((c) =>
    isRecord(c) && typeof c.id === "string"
      ? [{
          id: c.id,
          name: str(c.name),
          description: typeof c.description === "string" ? c.description : undefined,
          points: num(c.points),
        }]
      : [],
  );
}

export function parseAutoResults(v: unknown): AutoResult[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) =>
    isRecord(r) && typeof r.id === "string"
      ? [{ id: r.id, passed: bool(r.passed), points: num(r.points), message: str(r.message) }]
      : [],
  );
}

export function parseOverrides(v: unknown): TestOverride[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) =>
    isRecord(r) && typeof r.id === "string"
      ? [{ id: r.id, passed: bool(r.passed), points: num(r.points), reason: str(r.reason) }]
      : [],
  );
}

export function parseManualScores(v: unknown): ManualScore[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) => (isRecord(r) && typeof r.id === "string" ? [{ id: r.id, points: num(r.points) }] : []));
}
