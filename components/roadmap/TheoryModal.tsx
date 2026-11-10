"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Portal } from "@/components/shell/Portal";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { safeLinkUrl } from "@/lib/validation";
import { BookOpen, X } from "lucide-react";

type Props = {
  subtopicId: string;
  title: string;
  onClose: () => void;
};

/**
 * Teoria podtematu w oknie nad mapą. Treść pobieramy dopiero po kliknięciu —
 * mapa ładuje tylko listę podtematów, które mają notatkę.
 * Markdown bez rehype-raw: surowy HTML z notatki się nie wyrenderuje, a linki
 * przechodzą przez safeLinkUrl (tylko http/https).
 */
export function TheoryModal({ subtopicId, title, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: dbError } = await getBrowserSupabase()
        .from("subtopic_notes")
        .select("content_md")
        .eq("subtopic_id", subtopicId)
        .maybeSingle();
      if (cancelled) return;
      if (dbError || !data) setError(true);
      else setContent(data.content_md);
    })();
    return () => {
      cancelled = true;
    };
  }, [subtopicId]);

  useEffect(() => {
    closeRef.current?.focus();
    // Faza przechwytywania na window: Escape zamyka tylko to okno, a nie leżące
    // pod nim okno działu (ono nasłuchuje na document, czyli później).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="theory-title"
          className="card flex max-h-[92vh] w-full max-w-3xl flex-col rounded-b-none shadow-card sm:rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5 sm:px-6">
            <div className="min-w-0">
              <p className="eyebrow flex items-center gap-1.5">
                <BookOpen size={13} aria-hidden /> teoria
              </p>
              <h2 id="theory-title" className="mt-1.5 text-xl font-bold leading-snug tracking-tight">
                {title}
              </h2>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="btn-ghost btn-sm shrink-0" aria-label="Zamknij teorię">
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
            {error ? (
              <p className="pt-5 text-sm text-muted">Nie udało się wczytać teorii. Spróbuj ponownie za chwilę.</p>
            ) : content === null ? (
              <p className="pt-5 text-sm text-muted">Wczytywanie…</p>
            ) : (
              <TheoryMarkdown content={content} />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** Treść teorii: Markdown bez surowego HTML-a, linki tylko http/https, bez obrazków z zewnątrz. */
export function TheoryMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-inf03 prose-teoria">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const safe = safeLinkUrl(href);
            if (!safe) return <span>{children}</span>;
            return (
              <a href={safe} target="_blank" rel="noopener noreferrer nofollow">
                {children}
              </a>
            );
          },
          // obrazki w notatkach nie są przewidziane — nie ładujemy niczego z zewnątrz
          img: () => null,
          // szerokie tabele przewijają się w poziomie, zamiast rozpychać okno na telefonie
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
