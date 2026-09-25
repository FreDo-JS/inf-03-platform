"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  pin: string;
  /** ścieżka, którą mają wpisać uczniowie (domyślnie lista testów) */
  path?: string;
  onClose: () => void;
};

/** Pełnoekranowy PIN do wyświetlenia na rzutniku (jak w Kahoot). */
export function PinPresenter({ title, pin, path = "/testy", onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Krótki adres do przepisania z rzutnika — uczeń wybiera test z listy.
  const url = typeof window !== "undefined" ? `${window.location.host}${path}` : "";

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`PIN testu ${title}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95 p-6 backdrop-blur-xl"
    >
      <button ref={closeRef} type="button" onClick={onClose} className="btn-ghost absolute right-4 top-4">
        <X size={14} aria-hidden /> Zamknij
      </button>
      <p className="eyebrow text-base">wejdź na stronę i wybierz test</p>
      <h2 className="mt-3 max-w-4xl text-center text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      <p className="mt-4 break-all text-center font-mono text-lg text-muted sm:text-2xl">{url}</p>

      <p className="mt-12 font-mono text-sm uppercase tracking-[0.3em] text-muted">PIN</p>
      <div className="mt-4 flex gap-2 sm:gap-4">
        {pin.split("").map((d, i) => (
          <span
            key={i}
            className="flex h-20 w-14 items-center justify-center rounded-xl border border-accent/40 bg-accent/[0.06] font-mono text-5xl font-bold text-accent sm:h-32 sm:w-24 sm:text-8xl"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
