import type { TeacherRow } from "@/types/db";

/**
 * Podpis „kto to oznaczył” przy podtemacie. Pokazujemy wyłącznie nazwę, którą
 * nauczyciel sam sobie ustawił w panelu — nigdy e-maila ani identyfikatora
 * konta. Gdy nazwy nie ma, nie renderujemy nic (zamiast „nieznany”).
 */
export function TeacherMark({ name, size = "md" }: { name: string | null; size?: "sm" | "md" }) {
  if (name === null || name.trim() === "") return null;
  return (
    <span
      className={`chip shrink-0 border-accent/30 text-accent ${size === "sm" ? "text-[0.68rem]" : ""}`}
      title={`Oznaczone przez: ${name}`}
    >
      <span aria-hidden>✓</span> <span className="truncate">{name}</span>
    </span>
  );
}

/** Mapa id → nazwa, wygodna przy renderowaniu list. */
export function teacherNames(teachers: readonly TeacherRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const t of teachers) {
    if (typeof t.id === "string" && typeof t.display_name === "string" && t.display_name.trim() !== "") {
      m.set(t.id, t.display_name);
    }
  }
  return m;
}
