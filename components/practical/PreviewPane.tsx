"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  SANDBOX_URL,
  buildPreviewDocument,
  isPreviewMessage,
  previewablePages,
  writeToSandbox,
} from "@/lib/practical/preview";
import type { ProjectFile } from "@/types/practical";

type ConsoleEntry = { id: number; level: "log" | "info" | "warn" | "error"; text: string; at: string };

type Props = {
  files: ProjectFile[];
  /** wersja plików — zmiana oznacza „jest co odświeżyć” */
  revision: number;
};

const LEVEL_STYLE: Record<ConsoleEntry["level"], string> = {
  log: "text-fg/80",
  info: "text-accent2",
  warn: "text-warn",
  error: "text-danger",
};

export function PreviewPane({ files, revision }: Props) {
  const frameId = useId();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const pages = useMemo(() => previewablePages(files), [files]);
  const [page, setPage] = useState<string>(() => pages[0] ?? "");
  const [autoRun, setAutoRun] = useState(false);
  // Dokument nie idzie do srcdoc, tylko do /sandbox.html (własna, luźna CSP).
  // Każde uruchomienie to nowy iframe — document.write wykonuje się raz.
  const [runId, setRunId] = useState(0);
  const pendingHtml = useRef<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [staleRevision, setStaleRevision] = useState<number | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    if (pages.length > 0 && !pages.includes(page)) setPage(pages[0] ?? "");
  }, [pages, page]);

  const run = useCallback(
    (targetPage?: string) => {
      const p = targetPage ?? page;
      if (!p) return;
      setEntries([]);
      const built = buildPreviewDocument(files, p, { frameId });
      pendingHtml.current = built.html;
      setMissing(built.missing);
      setHasRun(true);
      setRunId((n) => n + 1); // nowy iframe → gospodarz piaskownicy zgłosi gotowość
      setStaleRevision(null);
    },
    [files, page, frameId],
  );

  // automatyczne odświeżanie albo znacznik „są niezapisane zmiany”
  useEffect(() => {
    if (autoRun) {
      const t = window.setTimeout(() => run(), 400);
      return () => window.clearTimeout(t);
    }
    setStaleRevision(revision);
    return undefined;
  }, [revision, autoRun, run]);

  // wiadomości z iframe: konsola i nawigacja po plikach projektu.
  // Treść wiadomości to dane od kodu ucznia — wyświetlamy jako tekst, nic nie wykonujemy.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frameWindow = frameRef.current?.contentWindow ?? null;
      if (!isPreviewMessage(event, frameWindow, frameId)) return;
      const data = event.data;
      if (data.type === "sandbox-ready") {
        const html = pendingHtml.current;
        if (html !== null) writeToSandbox(frameRef.current, html);
      } else if (data.type === "console") {
        setEntries((prev) => {
          const entry: ConsoleEntry = {
            id: nextId.current++,
            level: data.level === "error" || data.level === "warn" || data.level === "info" ? data.level : "log",
            text: String(data.text ?? "").slice(0, 2000),
            at: new Date().toLocaleTimeString("pl-PL"),
          };
          if (entry.level === "error") setConsoleOpen(true);
          return [...prev.slice(-199), entry];
        });
      } else if (data.type === "navigate" && typeof data.page === "string") {
        const target = data.page;
        if (pages.includes(target)) {
          setPage(target);
          run(target);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameId, pages, run]);

  const errorCount = entries.filter((e) => e.level === "error").length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] bg-panel/60 px-3 py-2">
        <button type="button" className="btn-primary btn-sm" onClick={() => run()} title="Ctrl+Enter">
          ▶ Uruchom
        </button>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" className="h-3.5 w-3.5 accent-[#2de2c1]" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} />
          auto
        </label>
        <select
          className="input w-auto py-1 text-xs"
          value={page}
          onChange={(e) => {
            setPage(e.target.value);
            run(e.target.value);
          }}
          aria-label="Strona startowa podglądu"
        >
          {pages.length === 0 && <option value="">brak plików .html</option>}
          {pages.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {staleRevision !== null && hasRun && <span className="chip border-warn/50 text-warn">zmiany nieodświeżone</span>}
        <button
          type="button"
          className={`btn-ghost btn-sm ml-auto ${errorCount > 0 ? "border-danger/50 text-danger" : ""}`}
          onClick={() => setConsoleOpen((o) => !o)}
        >
          Konsola{errorCount > 0 ? ` (${errorCount})` : ""} {consoleOpen ? "▾" : "▴"}
        </button>
      </div>

      {missing.length > 0 && (
        <p className="border-b border-warn/30 bg-warn/10 px-3 py-1.5 text-xs text-warn">
          Brak plików w projekcie: {missing.join(", ")}
        </p>
      )}

      <div className="relative min-h-0 flex-1 bg-white">
        {!hasRun ? (
          <div className="flex h-full items-center justify-center bg-bg text-sm text-muted">
            Kliknij „Uruchom”, aby zobaczyć stronę.
          </div>
        ) : (
          <iframe
            key={runId}
            ref={frameRef}
            title="Podgląd strony"
            className="h-full w-full border-0 bg-white"
            src={SANDBOX_URL}
          />
        )}
      </div>

      {consoleOpen && (
        <div className="max-h-48 min-h-[6rem] overflow-y-auto border-t border-white/[0.07] bg-bg/90 p-2 font-mono text-xs">
          {entries.length === 0 ? (
            <p className="text-muted">Konsola jest pusta.</p>
          ) : (
            <ul className="space-y-0.5">
              {entries.map((e) => (
                <li key={e.id} className={LEVEL_STYLE[e.level]}>
                  <span className="mr-2 text-muted/60">{e.at}</span>
                  <span className="whitespace-pre-wrap break-words">{e.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
