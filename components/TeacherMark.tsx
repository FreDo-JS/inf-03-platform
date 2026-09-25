import type { TeacherRow } from "@/types/db";

type Props = {
  /** czy podtemat jest odhaczony — dla nieodhaczonych nie ma czego podpisywać */
  done: boolean;
  /** nazwa nauczyciela; null, gdy nie znamy autora albo nie ustawił podpisu */
  name: string | null;
  size?: "sm" | "md";
};

/**
 * Podpis „kto to oznaczył” przy podtemacie.
 *
 * Każdy odhaczony podtemat dostaje znacznik. Z nazwiskiem, gdy autor jest znany
 * i ustawił sobie podpis — inaczej neutralne „oznaczone”. Wolimy to od pustego
 * miejsca (wyglądało, jakby część tematów nikt nie odhaczył) i od zgadywania,
 * kto to był: wpisy sprzed migracji 012 naprawdę nie mają autora.
 *
 * Pokazujemy wyłącznie nazwę własną z panelu — nigdy e-maila ani identyfikatora.
 */
export function TeacherMark({ done, name, size = "md" }: Props) {
  if (!done) return null;
  const label = name !== null && name.trim() !== "" ? name.trim() : null;
  return (
    <span
      className={`chip shrink-0 ${label === null ? "border-line text-muted" : "border-accent/30 text-accent"} ${
        size === "sm" ? "text-[0.68rem]" : ""
      }`}
      title={label === null ? "Oznaczone przez nauczyciela — bez podpisu" : `Oznaczone przez: ${label}`}
    >
      <span aria-hidden>✓</span> <span className="truncate">{label ?? "oznaczone"}</span>
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
