"use client";

import { useState } from "react";
import { CLASS_QUALIFICATION, QUALIFICATIONS, QUALIFICATION_LABEL, type ClassName, type Qualification } from "@/types/db";

/**
 * Która kwalifikacja (przedmiot) jest pokazana na mapie nauki.
 *
 * Domyślnie ta, której uczy się wybrana klasa. Ręczny wybór obowiązuje tylko
 * dla klasy, przy której go zrobiono — po zmianie klasy wracamy do jej domyślnej,
 * żeby nikt nie został z przedmiotem poprzedniej klasy.
 */
export function useQualificationView(cls: ClassName): [Qualification, (q: Qualification) => void] {
  const [picked, setPicked] = useState<{ cls: ClassName; q: Qualification } | null>(null);
  const current = picked && picked.cls === cls ? picked.q : CLASS_QUALIFICATION[cls];
  return [current, (q) => setPicked({ cls, q })];
}

export function QualificationTabs({
  value,
  onChange,
  home,
}: {
  value: Qualification;
  onChange: (q: Qualification) => void;
  /** Kwalifikacja wybranej klasy — czytnik ekranu dostaje informację, która jest „własna”. */
  home: Qualification;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kwalifikacja lub przedmiot">
      {QUALIFICATIONS.map((q) => (
        <button
          key={q}
          type="button"
          role="tab"
          aria-selected={value === q}
          onClick={() => onChange(q)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            q === "inf03" || q === "inf04" ? "font-mono" : ""
          } ${
            value === q
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-line text-muted hover:bg-white/[0.04] hover:text-fg"
          }`}
        >
          {QUALIFICATION_LABEL[q]}
          {q === home && <span className="sr-only"> (kwalifikacja tej klasy)</span>}
        </button>
      ))}
    </div>
  );
}
