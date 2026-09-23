"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wykrywa opuszczenie karty w trakcie podejścia (Page Visibility API).
 *
 * UCZCIWE ZASTRZEŻENIE: to wykrywa wyłącznie przełączenie karty/okna albo
 * zminimalizowanie TEJ przeglądarki. Nie wykrywa drugiego urządzenia (telefon
 * obok), drugiego monitora ani okna obok w trybie podzielonego ekranu.
 * To sygnał dla nauczyciela, a nie ochrona przed ściąganiem.
 *
 * Zasada: 1. wyjście → ostrzeżenie po powrocie; 2. wyjście → koniec testu
 * (natychmiast, bez czekania aż uczeń wróci).
 */
export function useTabSwitchGuard({
  active,
  onLimitExceeded,
}: {
  active: boolean;
  onLimitExceeded: (count: number) => void;
}) {
  const countRef = useRef(0);
  const [count, setCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const limitRef = useRef(onLimitExceeded);

  useEffect(() => {
    limitRef.current = onLimitExceeded;
  }, [onLimitExceeded]);

  useEffect(() => {
    // Nasłuch tylko w trakcie aktywnego podejścia — poza testem (mapa, lista
    // testów, panel) nic się nie dzieje.
    if (!active) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        countRef.current += 1;
        setCount(countRef.current);
        if (countRef.current >= 2) {
          // druga zmiana karty kończy test od razu, nawet jeśli uczeń nie wróci
          limitRef.current(countRef.current);
        }
      } else if (countRef.current === 1) {
        // uczeń wrócił po pierwszym wyjściu — pokazujemy ostrzeżenie
        setShowWarning(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [active]);

  const dismissWarning = useCallback(() => setShowWarning(false), []);

  return { count, countRef, showWarning, dismissWarning };
}
