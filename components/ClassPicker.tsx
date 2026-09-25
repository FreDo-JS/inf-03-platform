"use client";

import { useSelectedClass } from "@/lib/hooks/useSelectedClass";
import { CLASS_NAMES, CLASS_QUALIFICATION, QUALIFICATIONS, QUALIFICATION_LABEL } from "@/types/db";

/**
 * Wybór klasy, pogrupowany kwalifikacjami.
 *
 * Ten sam element działa w pasku bocznym (uczeń, układ pionowy) i nad treścią
 * w panelu nauczyciela (układ poziomy) — stan jest wspólny, bo useSelectedClass
 * synchronizuje wszystkie instancje zdarzeniem okna.
 */
export function ClassPicker({ layout = "stack" }: { layout?: "stack" | "row" }) {
  const [cls, setCls] = useSelectedClass();

  return (
    <div
      role="group"
      aria-label="Wybór klasy"
      className={layout === "row" ? "flex flex-wrap items-center gap-x-4 gap-y-2" : "flex flex-col gap-1"}
    >
      {QUALIFICATIONS.map((q) => {
        const classes = CLASS_NAMES.filter((c) => CLASS_QUALIFICATION[c] === q);
        if (classes.length === 0) return null;
        return (
          <div key={q} className={layout === "row" ? "flex items-center gap-2" : ""}>
            <p className={layout === "row" ? "text-[11px] text-muted" : "px-3 py-1 text-[11px] text-muted/60"}>
              {QUALIFICATION_LABEL[q]}
            </p>
            <div className={`flex flex-wrap gap-1 ${layout === "row" ? "" : "px-2"}`}>
              {classes.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCls(c)}
                  aria-pressed={cls === c}
                  className={`rounded-md border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                    cls === c
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-line text-muted hover:border-white/20 hover:text-fg"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
