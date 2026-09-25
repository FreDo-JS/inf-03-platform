import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryRow, Database, ProgressRow, TeacherRow } from "@/types/db";

/**
 * Zgodność z bazą, w której nie wykonano jeszcze wszystkich migracji.
 *
 * Aplikacja i migracje wdrażają się osobno: kod trafia na Vercela od razu,
 * a pliki SQL ktoś musi wkleić w Supabase. Między jednym a drugim strona
 * pytałaby o kolumny, których nie ma, i cała mapa nauki kończyła się błędem
 * „roadmap_load_failed”. Zamiast tego pobieramy nowszy zestaw kolumn, a gdy
 * baza go nie zna — wracamy do starego i po prostu nie pokazujemy nowej
 * funkcji. Brak migracji ma degradować widok, nie wywracać stronę.
 */

type Server = SupabaseClient<Database>;
type DbError = { code?: string; message?: string } | null;

/** 42703 = undefined_column, 42P01 = undefined_table (np. brak widoku teachers). */
function isMissingInDb(error: DbError): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "42P01") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("schema cache");
}

function warnMissing(migration: string, what: string): void {
  console.warn(
    `[baza] Brak ${what} — działam bez tej funkcji. Uruchom migrację supabase/${migration} w SQL Editorze.`,
  );
}

export async function loadCategories(supabase: Server): Promise<CategoryRow[] | null> {
  const full = await supabase
    .from("categories")
    .select("id, position, title, description, qualification")
    .order("position");
  if (!full.error) return full.data;
  if (!isMissingInDb(full.error)) return null;

  warnMissing("010_inf04.sql", "kolumny categories.qualification");
  const legacy = await supabase.from("categories").select("id, position, title, description").order("position");
  if (legacy.error) return null;
  // Baza sprzed podziału na kwalifikacje zawiera wyłącznie treści INF.03.
  return legacy.data.map((c) => ({ ...c, qualification: "inf03" as const }));
}

export type ProgressEntry = Pick<ProgressRow, "class_name" | "subtopic_id"> & { marked_by: string | null };

export async function loadProgress(supabase: Server): Promise<ProgressEntry[] | null> {
  const full = await supabase.from("progress").select("class_name, subtopic_id, marked_by");
  if (!full.error) return full.data;
  if (!isMissingInDb(full.error)) return null;

  warnMissing("012_progress_author.sql", "kolumny progress.marked_by");
  const legacy = await supabase.from("progress").select("class_name, subtopic_id");
  if (legacy.error) return null;
  return legacy.data.map((p) => ({ ...p, marked_by: null }));
}

/** Nazwy nauczycieli są ozdobnikiem — ich brak nigdy nie blokuje strony. */
export async function loadTeachers(supabase: Server): Promise<TeacherRow[]> {
  const { data, error } = await supabase.from("teachers").select("id, display_name");
  if (error) {
    if (isMissingInDb(error)) warnMissing("012_progress_author.sql", "widoku teachers");
    return [];
  }
  return data;
}
