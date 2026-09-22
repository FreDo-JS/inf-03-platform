"use client";

import { CLASS_NAMES, type ClassName } from "@/types/db";

export function ClassTabs({ value, onChange }: { value: ClassName; onChange: (c: ClassName) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Klasa"
      className="inline-flex rounded-xl border border-white/[0.07] bg-panel/80 p-1 font-mono text-sm backdrop-blur"
    >
      {CLASS_NAMES.map((c) => (
        <button
          key={c}
          type="button"
          role="tab"
          aria-selected={value === c}
          onClick={() => onChange(c)}
          className={`rounded-lg px-5 py-2 font-semibold transition ${
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
}
