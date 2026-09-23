"use client";

import { parseAutoTests, parseCriteria, parseFiles } from "@/lib/practical/parse";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Json } from "@/types/db";
import type { AutoTest, ManualCriterion, PracticalTaskRow, ProjectFile } from "@/types/practical";

export const TASK_COLUMNS =
  "id, title, summary, content_md, files, reference_files, auto_tests, manual_criteria, default_minutes, allow_new_files, student_can_run_tests, is_ready, created_at" as const;

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
    is_ready: row.is_ready,
    created_at: row.created_at,
  };
}

export async function fetchTasks(): Promise<{ tasks: PracticalTaskRow[]; error: string | null }> {
  const { data, error } = await getBrowserSupabase()
    .from("practical_tasks")
    .select(TASK_COLUMNS)
    .order("created_at", { ascending: false });
  if (error || !data) return { tasks: [], error: "Nie udało się pobrać zadań." };
  return { tasks: data.map(parseTaskRow), error: null };
}

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
