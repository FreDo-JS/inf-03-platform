"use client";

import { useEffect, useRef } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { safeHttpsUrl } from "@/lib/validation";
import type { CategoryRow, ClassName, SubtopicRow } from "@/types/db";

type Props = {
  index: number;
  category: CategoryRow;
  subtopics: SubtopicRow[];
  isDone: (subtopicId: string) => boolean;
  className: ClassName;
  onClose: () => void;
};

function ExtLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  const safe = safeHttpsUrl(href);
  if (!safe) {
    return <span className="chip cursor-default opacity-50">{children} · brak</span>;
  }
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="chip transition hover:border-accent/50 hover:text-accent"
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}

export function CategoryModal({ index, category, subtopics, isDone, className, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const n = subtopics.filter((s) => isDone(s.id)).length;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-title"
        className="card max-h-[88vh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-b-none bg-panel/95 p-5 sm:rounded-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">
              etap {String(index).padStart(2, "0")} · klasa {className}
            </p>
            <h2 id="cat-title" className="mt-1.5 text-2xl font-bold tracking-tight">
              {category.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{category.description}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="btn-ghost btn-sm shrink-0" aria-label="Zamknij">
            ✕
          </button>
        </div>

        <div className="mt-5">
          <ProgressBar value={n} max={subtopics.length} label="ukończone" size="sm" />
        </div>

        <ul className="mt-5 space-y-2.5">
          {subtopics.map((s, i) => {
            const done = isDone(s.id);
            return (
              <li
                key={s.id}
                className={`rounded-xl border p-4 transition ${
                  done ? "border-accent/30 bg-accent/[0.05]" : "border-line bg-bg/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    role="img"
                    aria-label={done ? "ukończone" : "nieukończone"}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                      done ? "bg-gradient-to-br from-accent to-accent2 text-bg" : "border border-line text-muted"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium leading-snug ${done ? "text-fg" : "text-fg/85"}`}>{s.title}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <ExtLink href={s.theory_url}>📖 teoria</ExtLink>
                      <ExtLink href={s.tasks_url}>✏️ zadania</ExtLink>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-center text-xs text-muted">Stan ukończenia ustawia nauczyciel — widok tylko do odczytu.</p>
      </div>
    </div>
  );
}
