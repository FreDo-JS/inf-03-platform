"use client";

import { useCallback, useEffect, useState } from "react";
import { isClassName } from "@/lib/validation";
import type { ClassName } from "@/types/db";

const STORAGE_KEY = "inf03.class";
const EVENT = "inf03:class-change";

/**
 * Wybrana klasa — zapamiętywana lokalnie wyłącznie dla wygody (nie jest to stan postępu).
 *
 * Klasę wybiera się w pasku bocznym, a używa jej treść po prawej, więc wszystkie
 * instancje hooka muszą widzieć tę samą wartość. Synchronizuje je zdarzenie okna:
 * własne w obrębie karty, storage między kartami.
 */
export function useSelectedClass(defaultClass: ClassName = "2a") {
  const [cls, setCls] = useState<ClassName>(defaultClass);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isClassName(saved)) setCls(saved);
    } catch {
      /* localStorage niedostępny — zostaje domyślna klasa */
    }

    const onChange = (e: Event) => {
      const next = e instanceof CustomEvent ? e.detail : null;
      if (isClassName(next)) setCls(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isClassName(e.newValue)) setCls(e.newValue);
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const select = useCallback((c: ClassName) => {
    setCls(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignorujemy */
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: c }));
  }, []);

  return [cls, select] as const;
}
