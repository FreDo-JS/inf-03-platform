"use client";

import { useEffect, useRef } from "react";
import { PROCTOR_LABEL, type ProctorKind } from "@/lib/hooks/useProctorGuard";
import { TriangleAlert } from "lucide-react";

/**
 * Ostrzeżenie po pierwszym opuszczeniu egzaminu (zmiana karty, przejście do
 * innego okna albo wyjście z pełnego ekranu). Blokuje dalszą pracę do
 * potwierdzenia, ale NIE zatrzymuje zegara — czas płynie dalej.
 */
export function ProctorWarning({
  kind,
  onConfirm,
  onReturnFullscreen,
}: {
  kind: ProctorKind;
  onConfirm: () => void;
  /** gdy podejście wymaga pełnego ekranu — przycisk wraca do niego */
  onReturnFullscreen?: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="proctor-warning-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <div className="card w-full max-w-md animate-fade-up border-warn/50 p-6 text-center sm:p-8">
        <TriangleAlert size={40} className="mx-auto text-warn" aria-hidden />
        <h2 id="proctor-warning-title" className="mt-4 text-xl font-bold">
          Wykryto {PROCTOR_LABEL[kind]}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Egzamin wymaga pracy w jednym oknie, na pełnym ekranie.{" "}
          <span className="font-semibold text-warn">Kolejne opuszczenie zakończy pracę automatycznie.</span>
        </p>
        <p className="mt-2 text-sm text-muted">Czas przez ten moment płynął dalej.</p>
        <button
          ref={buttonRef}
          type="button"
          className="btn-primary mt-6 w-full py-3"
          onClick={() => {
            onReturnFullscreen?.();
            onConfirm();
          }}
        >
          {onReturnFullscreen ? "Wracam na pełny ekran" : "Rozumiem, wracam do pracy"}
        </button>
      </div>
    </div>
  );
}
