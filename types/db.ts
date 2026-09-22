// Typy bazy danych (odpowiadają supabase/schema.sql).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export const CLASS_NAMES = ["2a", "4e", "4d"] as const;
export type ClassName = (typeof CLASS_NAMES)[number];

export type QuestionType = "closed" | "select" | "input";

/** Pytanie w postaci publicznej (bez poprawnej odpowiedzi). */
export type ChoiceQuestion = { type: "closed" | "select"; text: string; options: string[] };
export type InputQuestion = { type: "input"; text: string };
export type PublicQuestion = ChoiceQuestion | InputQuestion;

/** Klucz odpowiedzi: dla każdego pytania lista akceptowanych odpowiedzi. */
export type AnswerKeys = string[][];

export type ProgressRow = {
  class_name: ClassName;
  subtopic_id: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  position: number;
  title: string;
  description: string;
};

export type SubtopicRow = {
  id: string;
  category_id: string;
  position: number;
  title: string;
  theory_url: string | null;
  tasks_url: string | null;
};

export type TestRow = {
  id: string;
  title: string;
  time_limit: number; // sekundy
  questions: Json;
  question_count: number; // kolumna generowana
  created_at: string;
  created_by: string | null;
};

export type AttemptRow = {
  id: string;
  test_id: string | null;
  test_title: string;
  student_name: string;
  score: number;
  total: number;
  duration_sec: number;
  created_at: string;
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
};

/** Wynik open_test po poprawnym PIN-ie. */
export type OpenedTest = {
  sessionId: string;
  title: string;
  timeLimitSec: number;
  questions: PublicQuestion[];
};

export type OpenTestFailure = "bad_pin" | "rate_limited" | "not_found";

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
      categories: Table<CategoryRow, CategoryRow>;
      subtopics: Table<SubtopicRow, SubtopicRow>;
      tests: Table<
        TestRow,
        { id?: string; title: string; time_limit: number; questions: Json; created_at?: string; created_by?: string | null },
        { title?: string; time_limit?: number; questions?: Json }
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
    };
    Views: { [_ in never]: never };
    Functions: {
      create_test: {
        Args: { p_title: string; p_time_limit: number; p_questions: Json; p_keys: Json; p_pin?: string | null };
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
        Args: { p_session_id: string; p_answers: Json };
        Returns: Json;
      };
      set_test_pin: {
        Args: { p_test_id: string; p_pin?: string | null };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
