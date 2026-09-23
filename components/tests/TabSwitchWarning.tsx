"use client";

import { useEffect, useRef } from "react";

/**
 * Modal po pierwszym opuszczeniu karty. Blokuje odpowiadanie do potwierdzenia,
 * ale NIE zatrzymuje zegara — czas płynie dalej, to część konsekwencji.
 */
export function TabSwitchWarning({ onConfirm }: { onConfirm: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tab-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="card w-full max-w-md animate-fade-up border-warn/50 p-6 text-center sm:p-8">
        <p className="text-5xl">⚠️</p>
        <h2 id="tab-warning-title" className="mt-4 text-xl font-bold">
          Opuszczono kartę testu
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          Zauważyliśmy, że opuściłeś/aś tę kartę.{" "}
          <span className="font-semibold text-warn">Kolejna zmiana karty automatycznie zakończy test.</span>
        </p>
        <p className="mt-2 text-sm text-muted">Czas testu płynął przez ten moment dalej.</p>
        <button ref={buttonRef} type="button" className="btn-primary mt-6 w-full py-3" onClick={onConfirm}>
          Rozumiem, wracam do testu
        </button>
      </div>
    </div>
  );
}
