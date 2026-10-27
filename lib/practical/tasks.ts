"use client";

import { parseAutoTests, parseCriteria, parseFiles, practicalRuntime } from "@/lib/practical/parse";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Json } from "@/types/db";
import type { AutoTest, ManualCriterion, PracticalRuntime, PracticalTaskRow, ProjectFile } from "@/types/practical";

const BASE_TASK_COLUMNS =
  "id, title, summary, content_md, files, reference_files, auto_tests, manual_criteria, default_minutes, allow_new_files, student_can_run_tests, is_ready, created_at" as const;

/**
 * Kolumny dokładane późniejszymi migracjami: `practice` przez 029, `runtime` przez 032.
 * Każdej może brakować osobno — kod i migracje wdrażają się niezależnie — więc
 * pobieranie schodzi po kolejnych zestawach, zamiast od razu zrzucać obie.
 */
const OPTIONAL_COLUMNS = ["practice", "runtime"] as const;
type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number];

const columnsFor = (opcjonalne: readonly OptionalColumn[]): string =>
  opcjonalne.length === 0 ? BASE_TASK_COLUMNS : `${BASE_TASK_COLUMNS}, ${opcjonalne.join(", ")}`;

export const TASK_COLUMNS = columnsFor(OPTIONAL_COLUMNS);

/** Które z tych kolumn baza zna — ustalane przy pierwszym pobraniu zadań. */
const obecne: Record<OptionalColumn, boolean> = { practice: true, runtime: true };

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
  runtime?: string;
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
    runtime: practicalRuntime(row.runtime),
    is_ready: row.is_ready,
    created_at: row.created_at,
  };
}

export async function fetchTasks(): Promise<{ tasks: PracticalTaskRow[]; error: string | null }> {
  const supabase = getBrowserSupabase();
  // od pełnego zestawu w dół: brak jednej kolumny nie może kasować drugiej
  const proby: readonly (readonly OptionalColumn[])[] = [["practice", "runtime"], ["practice"], ["runtime"], []];

  for (const zestaw of proby) {
    const { data, error } = await supabase
      .from("practical_tasks")
      .select(columnsFor(zestaw))
      .order("created_at", { ascending: false });

    if (!error && data) {
      for (const kolumna of OPTIONAL_COLUMNS) obecne[kolumna] = zestaw.includes(kolumna);
      // lista kolumn składana w czasie działania, więc supabase-js nie wywnioskuje
      // kształtu wiersza; parseTaskRow i tak sprawdza każde pole z osobna
      return { tasks: (data as unknown as TaskRowDb[]).map(parseTaskRow), error: null };
    }
    // 42703 = nie ma takiej kolumny, czyli brakuje migracji. Każdy inny błąd
    // (sieć, uprawnienia) powtarzanie zapytania tylko zdublowałoby.
    if (!error || (error.code !== "42703" && !/column .* does not exist/i.test(error.message ?? ""))) break;
  }
  return { tasks: [], error: "Nie udało się pobrać zadań." };
}

/** Czy panel ma pokazywać przełącznik trybu ćwiczeń (migracja 029 wgrana). */
export const practiceAvailable = (): boolean => obecne.practice;

/** Czy panel ma pokazywać wybór środowiska HTML/React (migracja 032 wgrana). */
export const runtimeAvailable = (): boolean => obecne.runtime;

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
  runtime: PracticalRuntime;
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
    // brak migracji = brak kolumny; wtedy jej nie wysyłamy, żeby zwykły zapis zadania działał
    ...(obecne.practice ? { practice: payload.practice } : {}),
    ...(obecne.runtime ? { runtime: payload.runtime } : {}),
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
