"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TabSwitchKind = "tab" | "fullscreen";

/**
 * Wykrywa opuszczenie karty w trakcie podejścia (Page Visibility API), a
 * opcjonalnie także wyjście z trybu pełnoekranowego. Wspólny hook dla modułu
 * Testy i modułu Praktyka.
 *
 * UCZCIWE ZASTRZEŻENIE: to wykrywa wyłącznie przełączenie karty/okna,
 * zminimalizowanie TEJ przeglądarki albo wyjście z pełnego ekranu. Nie wykrywa
 * drugiego urządzenia (telefon obok), drugiego monitora ani okna obok w trybie
 * podzielonego ekranu. To sygnał dla nauczyciela, a nie ochrona przed ściąganiem.
 * Pełną blokadę daje dopiero Safe Exam Browser.
 *
 * Zasada: 1. wyjście → ostrzeżenie po powrocie; 2. wyjście → koniec podejścia
 * (natychmiast, bez czekania aż uczeń wróci).
 */
export function useTabSwitchGuard({
  active,
  onLimitExceeded,
  onSwitch,
  watchFullscreen = false,
}: {
  active: boolean;
  onLimitExceeded: (count: number) => void;
  /** wywoływane przy każdym wyjściu — np. żeby zgłosić zdarzenie na serwer */
  onSwitch?: (kind: TabSwitchKind, count: number) => void;
  watchFullscreen?: boolean;
}) {
  const countRef = useRef(0);
  const [count, setCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastKind, setLastKind] = useState<TabSwitchKind>("tab");
  const limitRef = useRef(onLimitExceeded);
  const switchRef = useRef(onSwitch);

  useEffect(() => {
    limitRef.current = onLimitExceeded;
    switchRef.current = onSwitch;
  }, [onLimitExceeded, onSwitch]);

  useEffect(() => {
    // Nasłuch tylko w trakcie aktywnego podejścia — poza nim (mapa, lista
    // testów, panel) nic się nie dzieje.
    if (!active) return;

    const register = (kind: TabSwitchKind) => {
      countRef.current += 1;
      setCount(countRef.current);
      setLastKind(kind);
      switchRef.current?.(kind, countRef.current);
      if (countRef.current >= 2) {
        // drugie wyjście kończy podejście od razu, nawet jeśli uczeń nie wróci
        limitRef.current(countRef.current);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) register("tab");
      else if (countRef.current === 1) setShowWarning(true);
    };

    const onFullscreenChange = () => {
      if (document.fullscreenElement === null) {
        register("fullscreen");
        if (countRef.current === 1) setShowWarning(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (watchFullscreen) document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (watchFullscreen) document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [active, watchFullscreen]);

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  return { count, countRef, showWarning, dismissWarning, lastKind };
}
