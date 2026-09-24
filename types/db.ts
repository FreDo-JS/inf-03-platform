// Typy bazy danych (odpowiadają supabase/schema.sql).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Kwalifikacje obsługiwane przez aplikację. Klasa decyduje, którą uczeń widzi. */
export const QUALIFICATIONS = ["inf03", "inf04"] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

export const QUALIFICATION_LABEL: Record<Qualification, string> = {
  inf03: "INF.03",
  inf04: "INF.04",
};

export const QUALIFICATION_FULL: Record<Qualification, string> = {
  inf03: "Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych",
  inf04: "Projektowanie, programowanie i testowanie aplikacji",
};

export const CLASS_NAMES = ["2a", "4e", "4d", "4a", "4g"] as const;
export type ClassName = (typeof CLASS_NAMES)[number];

/**
 * Do której kwalifikacji należy klasa. Odpowiednik tabeli classes w bazie —
 * tutaj jest po to, żeby interfejs nie musiał czekać na zapytanie.
 */
export const CLASS_QUALIFICATION: Record<ClassName, Qualification> = {
  "2a": "inf03",
  "4e": "inf03",
  "4d": "inf03",
  "4a": "inf04",
  "4g": "inf04",
};

export function classesOf(q: Qualification): ClassName[] {
  return CLASS_NAMES.filter((c) => CLASS_QUALIFICATION[c] === q);
}

export type ClassRow = {
  name: ClassName;
  qualification: Qualification;
  position: number;
};

export type QuestionType = "closed" | "select" | "input" | "matching";

/** Pytanie w postaci publicznej (bez poprawnej odpowiedzi). */
export type ChoiceQuestion = { type: "closed" | "select"; text: string; options: string[] };
export type InputQuestion = { type: "input"; text: string };
/** Dopasowywanie par. Kolumna "right" jest zapisana w losowej kolejności — nie zdradza par. */
export type MatchingQuestion = { type: "matching"; text: string; left: string[]; right: string[] };
export type PublicQuestion = ChoiceQuestion | InputQuestion | MatchingQuestion;

/**
 * Odpowiedź ucznia na jedno pytanie: napis (closed/select/input) albo —
 * dla matching — wartości z prawej kolumny w kolejności lewej.
 */
export type QuizAnswer = string | null | (string | null)[];

/**
 * Klucz odpowiedzi. Dla closed/select/input: lista akceptowanych odpowiedzi.
 * Dla matching: wartości prawej kolumny w kolejności lewej.
 */
export type AnswerKeys = string[][];

export type ProgressRow = {
  class_name: ClassName;
  subtopic_id: string;
  updated_at: string;
  /** kto oznaczył podtemat — wpisuje trigger z auth.uid(), nie klient */
  marked_by: string | null;
};

/** Nauczyciel widoczny przy podtemacie. Widok teachers: bez e-maila. */
export type TeacherRow = {
  id: string;
  display_name: string;
};

export type CategoryRow = {
  id: string;
  position: number;
  title: string;
  description: string;
  qualification: Qualification;
};

export type SubtopicRow = {
  id: string;
  category_id: string;
  position: number;
  title: string;
  theory_url: string | null;
  tasks_url: string | null;
};

export type SubtopicLinkRow = {
  id: string;
  subtopic_id: string;
  label: string;
  url: string;
  sort_order: number;
  created_at: string;
};

export type TestRow = {
  id: string;
  title: string;
  time_limit: number; // sekundy
  questions: Json;
  question_count: number; // kolumna generowana
  qualification: Qualification;
  created_at: string;
  created_by: string | null;
};

/** Powód zakończenia podejścia. */
export type EndedReason = "completed" | "time_up" | "tab_switch";

export type AttemptRow = {
  id: string;
  test_id: string | null;
  test_title: string;
  student_name: string;
  score: number;
  total: number;
  duration_sec: number;
  created_at: string;
  ended_reason: EndedReason;
  /** ile razy uczeń opuścił kartę w trakcie podejścia (sygnał, nie dowód) */
  tab_switch_count: number;
};

export type TestKeysRow = {
  test_id: string;
  answers: Json;
  pin: string; // 6 cyfr, widoczny tylko dla adminów
};

export type SubmitResult = {
  score: number;
  total: number;
  results: boolean[];
  durationSec: number;
  endedReason: EndedReason;
  tabSwitchCount: number;
};

/** Wynik open_test po poprawnym PIN-ie. */
export type OpenedTest = {
  sessionId: string;
  title: string;
  timeLimitSec: number;
  questions: PublicQuestion[];
};

export type OpenTestFailure = "bad_pin" | "rate_limited" | "not_found";

// Wiersze modułu Praktyka w postaci „bazodanowej” (jsonb jako Json)
type PracticalTaskRowDb = {
  id: string;
  title: string;
  summary: string;
  content_md: string;
  files: Json;
  reference_files: Json;
  auto_tests: Json;
  manual_criteria: Json;
  default_minutes: number;
  allow_new_files: boolean;
  student_can_run_tests: boolean;
  is_ready: boolean;
  schema_info: string;
  db_sql: string;
  db_sql_sqlite: string;
  assets: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PracticalSessionRowDb = {
  id: string;
  task_id: string;
  class_name: string;
  pin: string;
  status: string;
  minutes: number;
  allow_paste: boolean;
  pass_threshold: number;
  started_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
};

type PracticalAttemptRowDb = {
  id: string;
  session_id: string;
  student_name: string;
  attempt_token_hash: string;
  result_token: string;
  files: Json;
  last_saved_at: string | null;
  status: string;
  submitted_at: string | null;
  ended_reason: string | null;
  tab_switch_count: number;
  large_paste_count: number;
  auto_results: Json;
  auto_checked_at: string | null;
  overrides: Json;
  manual_scores: Json;
  teacher_comment: string;
  final_percent: number | null;
  published_at: string | null;
  created_at: string;
};

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      progress: Table<ProgressRow, { class_name: ClassName; subtopic_id: string; updated_at?: string }>;
      classes: Table<ClassRow, ClassRow>;
      categories: Table<CategoryRow, CategoryRow>;
      subtopics: Table<SubtopicRow, SubtopicRow>;
      subtopic_links: Table<
        SubtopicLinkRow,
        { id?: string; subtopic_id: string; label: string; url: string; sort_order?: number; created_at?: string },
        { label?: string; url?: string; sort_order?: number }
      >;
      tests: Table<
        TestRow,
        {
          id?: string;
          title: string;
          time_limit: number;
          questions: Json;
          qualification?: Qualification;
          created_at?: string;
          created_by?: string | null;
        },
        { title?: string; time_limit?: number; questions?: Json; qualification?: Qualification }
      >;
      attempts: Table<
        AttemptRow,
        {
          id?: string;
          test_id?: string | null;
          test_title: string;
          student_name: string;
          score: number;
          total: number;
          duration_sec: number;
          created_at?: string;
        }
      >;
      test_keys: Table<TestKeysRow, { test_id: string; answers: Json; pin?: string }>;
      // moduł Praktyka — uczeń nie ma do tych tabel dostępu (RLS), admin tak
      practical_tasks: Table<PracticalTaskRowDb, Partial<PracticalTaskRowDb> & { title: string }>;
      practical_sessions: Table<PracticalSessionRowDb, Partial<PracticalSessionRowDb>>;
      practical_attempts: Table<PracticalAttemptRowDb, Partial<PracticalAttemptRowDb>>;
      practical_events: Table<
        { id: number; attempt_id: string; type: string; details: Json; created_at: string },
        { attempt_id: string; type: string; details?: Json }
      >;
    };
    Views: {
      teachers: { Row: TeacherRow; Relationships: [] };
    };
    Functions: {
      create_test: {
        Args: {
          p_title: string;
          p_time_limit: number;
          p_questions: Json;
          p_keys: Json;
          p_pin?: string | null;
          p_qualification?: Qualification;
        };
        Returns: Json;
      };
      open_test: {
        Args: { p_test_id: string; p_pin: string };
        Returns: Json;
      };
      begin_session: {
        Args: { p_session_id: string; p_student_name: string };
        Returns: Json;
      };
      submit_attempt: {
        Args: { p_session_id: string; p_answers: Json; p_ended_reason?: EndedReason; p_tab_switches?: number };
        Returns: Json;
      };
      set_test_pin: {
        Args: { p_test_id: string; p_pin?: string | null };
        Returns: string;
      };
      practical_join: { Args: { p_pin: string; p_name: string }; Returns: Json };
      practical_state: { Args: { p_token: string }; Returns: Json };
      practical_save: { Args: { p_token: string; p_files: Json }; Returns: Json };
      practical_event: { Args: { p_token: string; p_type: string; p_details?: Json }; Returns: Json };
      practical_submit: { Args: { p_token: string; p_files: Json; p_reason?: string }; Returns: Json };
      practical_result: { Args: { p_result_token: string }; Returns: Json };
      practical_create_session: {
        Args: { p_task_id: string; p_class: string; p_minutes: number; p_allow_paste?: boolean; p_pass_threshold?: number };
        Returns: Json;
      };
      practical_start_session: { Args: { p_session_id: string }; Returns: Json };
      practical_finish_session: { Args: { p_session_id: string }; Returns: Json };
      practical_recalc: { Args: { p_attempt_id: string }; Returns: number };
      set_my_display_name: { Args: { p_name: string }; Returns: string };
      quiz_time: { Args: { p_session_id: string }; Returns: Json };
      practical_time: { Args: { p_token: string }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
