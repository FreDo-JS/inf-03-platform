"use client";

import { useCallback, useEffect, useState } from "react";
import { isClassName } from "@/lib/validation";
import type { ClassName } from "@/types/db";

const STORAGE_KEY = "inf03.class";

/** Wybrana klasa — zapamiętywana lokalnie wyłącznie dla wygody (nie jest to stan postępu). */
export function useSelectedClass(defaultClass: ClassName = "2a") {
  const [cls, setCls] = useState<ClassName>(defaultClass);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isClassName(saved)) setCls(saved);
    } catch {
      /* localStorage niedostępny — zostaje domyślna klasa */
    }
  }, []);

  const select = useCallback((c: ClassName) => {
    setCls(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignorujemy */
    }
  }, []);

  return [cls, select] as const;
}
