// Typy modułu „Praktyka” (symulator części praktycznej INF.03).
// Wersja HTML/CSS/JS — typy testów dla PHP i SQL dojdą wraz z tamtym etapem.

export type ProjectFile = { name: string; content: string };

export type SessionStatus = "lobby" | "active" | "finished";
export type AttemptStatus = "in_progress" | "submitted" | "auto_checked" | "reviewed" | "published";
export type PracticalEndedReason = "completed" | "time_up" | "tab_switch" | "teacher_ended";

export const AUTO_TEST_TYPES = [
  "file_not_empty",
  "selector_count",
  "selector_text",
  "selector_attribute",
  "css_computed",
  "html_lang_doctype",
  "interaction",
] as const;
export type AutoTestType = (typeof AUTO_TEST_TYPES)[number];

export type TextMatchMode = "equals" | "contains" | "regex";

type TestBase = { id: string; name: string; description?: string; points: number };

export type FileNotEmptyTest = TestBase & { type: "file_not_empty"; file: string };
export type SelectorCountTest = TestBase & { type: "selector_count"; page: string; selector: string; min?: number; max?: number };
export type SelectorTextTest = TestBase & {
  type: "selector_text";
  page: string;
  selector: string;
  mode: TextMatchMode;
  value: string;
  ignoreCase?: boolean;
};
export type SelectorAttributeTest = TestBase & {
  type: "selector_attribute";
  page: string;
  selector: string;
  attribute: string;
  mode: TextMatchMode;
  value: string;
  ignoreCase?: boolean;
};
export type CssComputedTest = TestBase & { type: "css_computed"; page: string; selector: string; property: string; expected: string };
export type HtmlLangDoctypeTest = TestBase & { type: "html_lang_doctype"; page: string; lang?: string };

export type InteractionStep =
  | { action: "fill"; selector: string; value: string }
  | { action: "select"; selector: string; value: string }
  | { action: "click"; selector: string }
  | { action: "wait"; ms: number };

export type InteractionExpect = {
  selector: string;
  mode: TextMatchMode | "exists" | "attribute";
  value?: string;
  attribute?: string;
  ignoreCase?: boolean;
};

export type InteractionTest = TestBase & {
  type: "interaction";
  page: string;
  steps: InteractionStep[];
  expect: InteractionExpect;
};

export type AutoTest =
  | FileNotEmptyTest
  | SelectorCountTest
  | SelectorTextTest
  | SelectorAttributeTest
  | CssComputedTest
  | HtmlLangDoctypeTest
  | InteractionTest;

export type ManualCriterion = { id: string; name: string; description?: string; points: number };

/** Wynik jednego testu automatycznego. */
export type AutoResult = { id: string; passed: boolean; points: number; message: string };
/** Korekta nauczyciela — oryginalny wynik automatu zostaje nienaruszony. */
export type TestOverride = { id: string; passed: boolean; points: number; reason: string };
export type ManualScore = { id: string; points: number };

export type PracticalTaskRow = {
  id: string;
  title: string;
  summary: string;
  content_md: string;
  files: ProjectFile[];
  reference_files: ProjectFile[];
  auto_tests: AutoTest[];
  manual_criteria: ManualCriterion[];
  default_minutes: number;
  allow_new_files: boolean;
  student_can_run_tests: boolean;
  is_ready: boolean;
  created_at: string;
};

/** Obraz zadania widziany przez ucznia — bez wzorca i bez parametrów testów. */
export type PracticalTaskPublic = {
  id: string;
  title: string;
  summary: string;
  content_md: string;
  files: ProjectFile[];
  allow_new_files: boolean;
  student_can_run_tests: boolean;
  test_names: { id: string; name: string }[];
};

export type PracticalSessionRow = {
  id: string;
  task_id: string;
  class_name: string;
  pin: string;
  status: SessionStatus;
  minutes: number;
  allow_paste: boolean;
  pass_threshold: number;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type PracticalAttemptRow = {
  id: string;
  session_id: string;
  student_name: string;
  result_token: string;
  files: ProjectFile[];
  last_saved_at: string | null;
  status: AttemptStatus;
  submitted_at: string | null;
  ended_reason: PracticalEndedReason | null;
  tab_switch_count: number;
  large_paste_count: number;
  auto_results: AutoResult[];
  auto_checked_at: string | null;
  overrides: TestOverride[];
  manual_scores: ManualScore[];
  teacher_comment: string;
  final_percent: number | null;
  published_at: string | null;
  created_at: string;
};

/** Stan podejścia zwracany uczniowi przez practical_join / practical_state. */
export type AttemptState = {
  attemptId: string;
  studentName: string;
  status: AttemptStatus;
  files: ProjectFile[];
  resultToken: string;
  tabSwitchCount: number;
  lastSavedAt: string | null;
  endedReason: PracticalEndedReason | null;
  session: {
    id: string;
    status: SessionStatus;
    allowPaste: boolean;
    minutes: number;
    startedAt: string | null;
    endsAt: string | null;
    serverNow: string;
  };
  task: PracticalTaskPublic;
};

export type JoinFailure = "bad_pin" | "rate_limited" | "name_taken";

/** Wynik widziany przez ucznia pod linkiem z tokenem. */
export type PublishedResult = {
  published: true;
  studentName: string;
  taskTitle: string;
  submittedAt: string | null;
  endedReason: PracticalEndedReason | null;
  finalPercent: number;
  passThreshold: number;
  passed: boolean;
  teacherComment: string;
  files: ProjectFile[];
  tests: { id: string; name: string; passed: boolean; points: number; maxPoints: number; message: string }[];
  criteria: { id: string; name: string; description?: string; maxPoints: number; points: number }[];
};

export type PendingResult = {
  published: false;
  studentName: string;
  taskTitle: string;
  submittedAt: string | null;
};

export type ResultPayload = PublishedResult | PendingResult;
