"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodeEditor, languageForFile } from "@/components/practical/CodeEditor";
import { PreviewPane } from "@/components/practical/PreviewPane";
import { TaskSheet } from "@/components/practical/TaskSheet";
import { formatDuration } from "@/lib/tests";
import type { AttemptState, ProjectFile } from "@/types/practical";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  state: AttemptState;
  files: ProjectFile[];
  onFilesChange: (files: ProjectFile[]) => void;
  /** sekundy do końca, liczone od czasu serwera */
  remainingSec: number;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  onSubmit: () => void;
  submitting: boolean;
  onLargePaste: (length: number, file: string) => void;
  readOnly?: boolean;
};

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "Zapisano",
  saving: "Zapisywanie…",
  saved: "Zapisano",
  error: "Błąd zapisu",
};

export function IdeWorkspace({
  state,
  files,
  onFilesChange,
  remainingSec,
  saveStatus,
  lastSavedAt,
  onSubmit,
  submitting,
  onLargePaste,
  readOnly = false,
}: Props) {
  const [activeFile, setActiveFile] = useState(() => files[0]?.name ?? "");
  const [revision, setRevision] = useState(0);
  const [mobileTab, setMobileTab] = useState<"sheet" | "code" | "preview">("code");
  const [sheetWidth, setSheetWidth] = useState(34); // % szerokości
  const [editorHeight, setEditorHeight] = useState(58); // % wysokości prawej kolumny
  const dragRef = useRef<"sheet" | "editor" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (files.length > 0 && !files.some((f) => f.name === activeFile)) setActiveFile(files[0]?.name ?? "");
  }, [files, activeFile]);

  const current = useMemo(() => files.find((f) => f.name === activeFile), [files, activeFile]);

  const updateContent = useCallback(
    (content: string) => {
      onFilesChange(files.map((f) => (f.name === activeFile ? { ...f, content } : f)));
      setRevision((r) => r + 1);
    },
    [files, activeFile, onFilesChange],
  );

  // przeciąganie granic paneli
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!dragRef.current || !root) return;
      const rect = root.getBoundingClientRect();
      if (dragRef.current === "sheet") {
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSheetWidth(Math.min(70, Math.max(18, pct)));
      } else {
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorHeight(Math.min(85, Math.max(20, pct)));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const lowTime = remainingSec <= 600;
  const veryLowTime = remainingSec <= 60;

  const editorPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.07] bg-panel/60 px-2 py-1.5">
        {files.map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setActiveFile(f.name)}
            className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition ${
              f.name === activeFile ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/[0.04] hover:text-fg"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {current ? (
          <CodeEditor
            key={current.name}
            value={current.content}
            language={languageForFile(current.name)}
            onChange={updateContent}
            readOnly={readOnly}
            allowPaste={state.session.allowPaste}
            onLargePaste={(len) => onLargePaste(len, current.name)}
            onSubmitShortcut={() => setRevision((r) => r + 1)}
          />
        ) : (
          <p className="p-4 text-sm text-muted">Brak plików w zadaniu.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-bg">
      {/* pasek górny */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.07] bg-panel/80 px-3 py-2 backdrop-blur">
        <span className="font-mono text-sm font-bold">
          INF<span className="text-accent">.03</span> · praktyka
        </span>
        <span className="truncate text-sm text-muted">👤 {state.studentName}</span>
        <span
          className={`chip ${saveStatus === "error" ? "border-danger/60 text-danger" : saveStatus === "saving" ? "border-warn/50 text-warn" : "border-accent/40 text-accent"}`}
          title={lastSavedAt ? `Ostatni zapis: ${new Date(lastSavedAt).toLocaleTimeString("pl-PL")}` : undefined}
        >
          {SAVE_LABEL[saveStatus]}
        </span>
        <div
          className={`ml-auto rounded-xl border px-3 py-1 font-mono text-lg font-bold tabular-nums ${
            veryLowTime
              ? "animate-pulse border-danger/60 bg-danger/10 text-danger"
              : lowTime
                ? "border-danger/50 text-danger"
                : "border-accent/40 bg-accent/5 text-accent"
          }`}
          role="timer"
          aria-label="Pozostały czas"
        >
          {formatDuration(remainingSec)}
        </div>
        <button type="button" className="btn-primary btn-sm" onClick={onSubmit} disabled={submitting || readOnly}>
          {submitting ? "Oddawanie…" : "Zakończ i oddaj"}
        </button>
      </header>

      {/* zakładki na wąskich ekranach */}
      <div className="flex shrink-0 gap-1 border-b border-white/[0.07] bg-panel/40 p-1 lg:hidden">
        {(["sheet", "code", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMobileTab(t)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${
              mobileTab === t ? "bg-accent/15 text-accent" : "text-muted"
            }`}
          >
            {t === "sheet" ? "Arkusz" : t === "code" ? "Kod" : "Podgląd"}
          </button>
        ))}
      </div>

      {/* układ dzielony (desktop) */}
      <div ref={rootRef} className="hidden min-h-0 flex-1 lg:flex">
        <div style={{ width: `${sheetWidth}%` }} className="min-w-0 border-r border-white/[0.07] bg-panel/30">
          <TaskSheet markdown={state.task.content_md} title={state.task.title} summary={state.task.summary} />
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          className="w-1.5 shrink-0 cursor-col-resize bg-white/[0.04] transition hover:bg-accent/40"
          onMouseDown={() => {
            dragRef.current = "sheet";
            document.body.style.userSelect = "none";
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div style={{ height: `${editorHeight}%` }} className="min-h-0">
            {editorPanel}
          </div>
          <div
            role="separator"
            aria-orientation="horizontal"
            className="h-1.5 shrink-0 cursor-row-resize bg-white/[0.04] transition hover:bg-accent/40"
            onMouseDown={() => {
              dragRef.current = "editor";
              document.body.style.userSelect = "none";
            }}
          />
          <div className="min-h-0 flex-1">
            <PreviewPane files={files} revision={revision} />
          </div>
        </div>
      </div>

      {/* układ zakładkowy (mobile/tablet) */}
      <div className="min-h-0 flex-1 lg:hidden">
        {mobileTab === "sheet" && (
          <TaskSheet markdown={state.task.content_md} title={state.task.title} summary={state.task.summary} />
        )}
        {mobileTab === "code" && editorPanel}
        {mobileTab === "preview" && <PreviewPane files={files} revision={revision} />}
      </div>
    </div>
  );
}
