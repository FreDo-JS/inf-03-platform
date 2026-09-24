"use client";

import { CLASS_NAMES, CLASS_QUALIFICATION, QUALIFICATION_LABEL, QUALIFICATIONS, type ClassName } from "@/types/db";

/**
 * Wybór klasy. Klasy są pogrupowane kwalifikacjami, bo to one decydują, jaką
 * mapę nauki widzi uczeń — 2a/4e/4d uczą się INF.03, 4a/4g INF.04.
 */
export function ClassTabs({ value, onChange }: { value: ClassName; onChange: (c: ClassName) => void }) {
  return (
    <div role="tablist" aria-label="Klasa" className="flex flex-wrap items-center gap-2">
      {QUALIFICATIONS.map((q) => {
        const classes = CLASS_NAMES.filter((c) => CLASS_QUALIFICATION[c] === q);
        if (classes.length === 0) return null;
        return (
          <div
            key={q}
            className="inline-flex items-center gap-1 rounded-xl border border-white/[0.07] bg-panel/80 p-1 font-mono text-sm backdrop-blur"
          >
            <span className="px-2 text-[0.7rem] uppercase tracking-wide text-muted">{QUALIFICATION_LABEL[q]}</span>
            {classes.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={value === c}
                onClick={() => onChange(c)}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                  value === c
                    ? "bg-gradient-to-r from-accent to-accent2 text-bg shadow-glow"
                    : "text-muted hover:bg-white/[0.04] hover:text-fg"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
