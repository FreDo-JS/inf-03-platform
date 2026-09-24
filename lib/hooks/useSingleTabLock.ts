"use client";

import { useEffect, useRef, useState } from "react";

const HEARTBEAT_MS = 2000;
const STALE_MS = 6000;

type Lock = { tabId: string; at: number };

function readLock(key: string): Lock | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { tabId, at } = parsed as { tabId?: unknown; at?: unknown };
    return typeof tabId === "string" && typeof at === "number" ? { tabId, at } : null;
  } catch {
    return null;
  }
}

/**
 * Pilnuje, żeby egzamin był otwarty tylko w jednej karcie.
 *
 * Karta, która pracuje, co 2 s odświeża wpis w localStorage. Nowa karta widzi
 * świeży wpis innej karty i zostaje zablokowana (pracująca działa dalej —
 * odwrotna kolejność pozwalałaby wyrzucić kolegę z egzaminu).
 *
 * To zabezpieczenie działa w obrębie jednej przeglądarki i profilu. Okno
 * incognito albo inna przeglądarka go nie widzą — tam wejście blokuje serwer
 * (zajęte imię w sesji praktycznej) i wykrywanie utraty fokusa.
 */
export function useSingleTabLock(key: string | null, active: boolean) {
  const [blocked, setBlocked] = useState(false);
  const tabIdRef = useRef<string>("");

  if (tabIdRef.current === "") {
    tabIdRef.current = typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random());
  }

  useEffect(() => {
    if (!active || key === null) return;
    const storageKey = `inf03.lock.${key}`;
    const tabId = tabIdRef.current;

    const existing = readLock(storageKey);
    if (existing !== null && existing.tabId !== tabId && Date.now() - existing.at < STALE_MS) {
      setBlocked(true);
      return;
    }

    const write = () => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ tabId, at: Date.now() } satisfies Lock));
      } catch {
        /* localStorage niedostępny — blokada po prostu nie działa */
      }
    };
    write();
    const timer = window.setInterval(write, HEARTBEAT_MS);

    // druga karta przejęła wpis (np. po odświeżeniu tej) — wtedy ustępujemy
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || e.newValue === null) return;
      const lock = readLock(storageKey);
      if (lock !== null && lock.tabId !== tabId && lock.at > Date.now() - STALE_MS) {
        // nie blokujemy pracującej karty: zapisujemy się z powrotem
        write();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
      const lock = readLock(storageKey);
      if (lock?.tabId === tabId) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* ignorujemy */
        }
      }
    };
  }, [key, active]);

  return blocked;
}
