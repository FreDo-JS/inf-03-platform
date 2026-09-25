"use client";

import { useEffect, useRef } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { TeacherMark } from "@/components/TeacherMark";
import { safeLinkUrl } from "@/lib/validation";
import type { CategoryRow, ClassName, SubtopicLinkRow, SubtopicRow } from "@/types/db";
import { Check, ExternalLink, X } from "lucide-react";

type Props = {
  index: number;
  category: CategoryRow;
  subtopics: SubtopicRow[];
  isDone: (subtopicId: string) => boolean;
  /** nazwa nauczyciela, który oznaczył podtemat — null, gdy nieoznaczony lub bez nazwy */
  markedBy: (subtopicId: string) => string | null;
  linksBySubtopic: Map<string, SubtopicLinkRow[]>;
  className: ClassName;
  onClose: () => void;
};

/** Materiały podtematu. Etykieta renderowana jako tekst (JSX escapuje), href tylko dla http(s). */
function SubtopicLinks({ links }: { links: SubtopicLinkRow[] }) {
  const safe = links
    .map((l) => ({ id: l.id, label: l.label, href: safeLinkUrl(l.url) }))
    .filter((l): l is { id: string; label: string; href: string } => l.href !== null);

  if (safe.length === 0) {
    return <p className="mt-2 text-xs text-muted/70">Brak materiałów — dodaj je w panelu Admin.</p>;
  }

  return (
    <ul className="mt-2.5 flex flex-wrap gap-2">
      {safe.map((l) => (
        // min-w-0 na każdym poziomie: bez tego długa etykieta rozpycha element
        // i na telefonie wychodzi poza okno zamiast się przyciąć.
        <li key={l.id} className="min-w-0 max-w-full">
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="chip max-w-full transition hover:border-accent/50 hover:text-accent"
          >
            <span className="min-w-0 truncate">{l.label}</span>
            <ExternalLink size={12} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CategoryModal({ index, category, subtopics, isDone, markedBy, linksBySubtopic, className, onClose }: Props) {
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
        className="card max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-5 shadow-card sm:rounded-xl sm:p-6"
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
            <X size={16} aria-hidden />
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
                      done ? "border border-accent/50 bg-accent/10 text-accent" : "border border-line text-muted"
                    }`}
                  >
                    {done ? <Check size={14} aria-hidden /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium leading-snug ${done ? "text-fg" : "text-fg/85"}`}>{s.title}</p>
                    <SubtopicLinks links={linksBySubtopic.get(s.id) ?? []} />
                  </div>
                  <TeacherMark done={done} name={markedBy(s.id)} size="sm" />
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
