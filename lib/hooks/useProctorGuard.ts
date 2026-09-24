"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ProctorKind = "tab" | "focus" | "fullscreen";

export const PROCTOR_LABEL: Record<ProctorKind, string> = {
  tab: "przełączenie karty",
  focus: "przejście do innego okna",
  fullscreen: "wyjście z trybu pełnoekranowego",
};

/**
 * Nadzór nad uczniem w trakcie podejścia — wspólny dla części teoretycznej
 * (moduł Testy) i praktycznej.
 *
 * Wykrywa trzy sygnały:
 *  - `visibilitychange` → przełączenie karty lub zminimalizowanie okna,
 *  - `blur` okna → przejście do innego okna albo drugiego monitora,
 *    także gdy karta pozostaje widoczna (np. okno obok),
 *  - wyjście z trybu pełnoekranowego.
 *
 * Sygnały lecą seriami (zmiana okna to zwykle blur + visibilitychange), więc
 * zdarzenia z tej samej sekundy liczymy jako jedno naruszenie.
 *
 * UCZCIWE ZASTRZEŻENIE: to wykrywa zachowanie TEJ przeglądarki. Nie wykryje
 * telefonu obok, drugiego komputera ani kartki pod ławką. To sygnał dla
 * nauczyciela, nie blokada ściągania — pełną kontrolę daje Safe Exam Browser.
 */
export function useProctorGuard({
  active,
  onLimitExceeded,
  onViolation,
  watchFullscreen = true,
  limit = 2,
}: {
  active: boolean;
  /** po przekroczeniu limitu naruszeń — zwykle natychmiastowe oddanie pracy */
  onLimitExceeded: (count: number) => void;
  /** każde naruszenie — np. zgłoszenie zdarzenia na serwer */
  onViolation?: (kind: ProctorKind, count: number) => void;
  watchFullscreen?: boolean;
  limit?: number;
}) {
  const countRef = useRef(0);
  const lastAtRef = useRef(0);
  const [count, setCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastKind, setLastKind] = useState<ProctorKind>("tab");
  const limitRef = useRef(onLimitExceeded);
  const violationRef = useRef(onViolation);

  useEffect(() => {
    limitRef.current = onLimitExceeded;
    violationRef.current = onViolation;
  }, [onLimitExceeded, onViolation]);

  useEffect(() => {
    // Nasłuch tylko w trakcie aktywnego podejścia — poza nim (mapa, lista
    // testów, panel) nic się nie dzieje.
    if (!active) return;

    const register = (kind: ProctorKind) => {
      const now = Date.now();
      // blur i visibilitychange przy jednym przełączeniu okna = jedno naruszenie
      if (now - lastAtRef.current < 1000) return;
      lastAtRef.current = now;

      countRef.current += 1;
      setCount(countRef.current);
      setLastKind(kind);
      violationRef.current?.(kind, countRef.current);

      if (countRef.current >= limit) {
        limitRef.current(countRef.current);
      } else {
        // ostrzeżenie pokazujemy od razu: przy zmianie okna karta bywa widoczna
        setShowWarning(true);
      }
    };

    const onVisibility = () => {
      if (document.hidden) register("tab");
    };

    const onBlur = () => {
      // Fokus w ramce podglądu (iframe) to nadal nasza strona — nie naruszenie.
      // Dlatego sprawdzamy stan chwilę później, gdy przeglądarka go ustali.
      window.setTimeout(() => {
        if (!active) return;
        if (document.hasFocus()) return;
        if (document.activeElement instanceof HTMLIFrameElement) return;
        register("focus");
      }, 120);
    };

    const onFullscreen = () => {
      if (document.fullscreenElement === null) register("fullscreen");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    if (watchFullscreen) document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      if (watchFullscreen) document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [active, watchFullscreen, limit]);

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  return { count, countRef, showWarning, dismissWarning, lastKind };
}
