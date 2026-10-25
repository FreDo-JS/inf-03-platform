"use client";

import { parseAutoTests, parseCriteria, parseFiles } from "@/lib/practical/parse";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Json } from "@/types/db";
import type { AutoTest, ManualCriterion, PracticalTaskRow, ProjectFile } from "@/types/practical";

const LEGACY_TASK_COLUMNS =
  "id, title, summary, content_md, files, reference_files, auto_tests, manual_criteria, default_minutes, allow_new_files, student_can_run_tests, is_ready, created_at" as const;
/** Kolumna `practice` pochodzi z migracji 029; bez niej panel działa jak dotąd. */
export const TASK_COLUMNS = `${LEGACY_TASK_COLUMNS}, practice` as const;

/** Czy baza zna kolumnę practice — ustalane przy pierwszym pobraniu zadań. */
let practiceColumn = true;

type TaskRowDb = {
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
  practice?: boolean;
  is_ready: boolean;
  created_at: string;
};

export function parseTaskRow(row: TaskRowDb): PracticalTaskRow {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content_md: row.content_md,
    files: parseFiles(row.files),
    reference_files: parseFiles(row.reference_files),
    auto_tests: parseAutoTests(row.auto_tests),
    manual_criteria: parseCriteria(row.manual_criteria),
    default_minutes: row.default_minutes,
    allow_new_files: row.allow_new_files,
    student_can_run_tests: row.student_can_run_tests,
    practice: row.practice === true,
    is_ready: row.is_ready,
    created_at: row.created_at,
  };
}

export async function fetchTasks(): Promise<{ tasks: PracticalTaskRow[]; error: string | null }> {
  const supabase = getBrowserSupabase();
  const full = await supabase.from("practical_tasks").select(TASK_COLUMNS).order("created_at", { ascending: false });
  if (!full.error && full.data) {
    practiceColumn = true;
    return { tasks: full.data.map(parseTaskRow), error: null };
  }
  // baza sprzed migracji 029 — pobieramy stary zestaw kolumn i nie pokazujemy trybu ćwiczeń
  if (full.error && (full.error.code === "42703" || /practice/.test(full.error.message ?? ""))) {
    const legacy = await supabase.from("practical_tasks").select(LEGACY_TASK_COLUMNS).order("created_at", { ascending: false });
    if (!legacy.error && legacy.data) {
      practiceColumn = false;
      return { tasks: legacy.data.map(parseTaskRow), error: null };
    }
  }
  return { tasks: [], error: "Nie udało się pobrać zadań." };
}

/** Czy panel ma pokazywać przełącznik trybu ćwiczeń (migracja 029 wgrana). */
export const practiceAvailable = (): boolean => practiceColumn;

export type TaskPayload = {
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
  practice: boolean;
  is_ready: boolean;
};

/** Zapis zadania. Baza i tak sprawdzi wszystko swoimi CHECK-ami. */
export async function saveTask(id: string | null, payload: TaskPayload): Promise<{ id: string | null; error: string | null }> {
  const supabase = getBrowserSupabase();
  const row = {
    title: payload.title,
    summary: payload.summary,
    content_md: payload.content_md,
    files: payload.files as unknown as Json,
    reference_files: payload.reference_files as unknown as Json,
    auto_tests: payload.auto_tests as unknown as Json,
    manual_criteria: payload.manual_criteria as unknown as Json,
    default_minutes: payload.default_minutes,
    allow_new_files: payload.allow_new_files,
    student_can_run_tests: payload.student_can_run_tests,
    // bez migracji 029 kolumny nie ma — wtedy jej nie wysyłamy, żeby zwykły zapis zadania działał
    ...(practiceColumn ? { practice: payload.practice } : {}),
    is_ready: payload.is_ready,
    updated_at: new Date().toISOString(),
  };

  if (id === null) {
    const { data, error } = await supabase.from("practical_tasks").insert(row).select("id").single();
    if (error || !data) return { id: null, error: "Nie udało się zapisać zadania." };
    return { id: data.id, error: null };
  }
  const { error } = await supabase.from("practical_tasks").update(row).eq("id", id);
  if (error) return { id: null, error: "Nie udało się zapisać zmian." };
  return { id, error: null };
}
