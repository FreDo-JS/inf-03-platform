"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CodeEditor, languageForFile } from "@/components/practical/CodeEditor";
import { PreviewPane } from "@/components/practical/PreviewPane";
import { TaskSheet } from "@/components/practical/TaskSheet";
import { formatClock } from "@/lib/tests";
import type { AttemptState, ProjectFile } from "@/types/practical";
import { FlaskConical, RotateCcw, User, X } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Tryb ćwiczeniowy: bez licznika czasu i oddawania pracy, za to z przyciskiem
 * uruchamiającym testy i panelem z wynikami (zob. PracticeWorkspace).
 */
export type PracticeControls = {
  onRunTests: () => void;
  running: boolean;
  onReset: () => void;
  exitHref: string;
  /** np. „7/12” po uruchomieniu testów */
  badge: string | null;
  /** zwiększa się po każdym uruchomieniu testów — przełącza widok na wyniki */
  runId: number;
  /** praca wczytana z poprzedniej wizyty */
  restored: boolean;
  panel: ReactNode;
};

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
  practice?: PracticeControls;
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
  practice,
}: Props) {
  const [activeFile, setActiveFile] = useState(() => files[0]?.name ?? "");
  const [leftTab, setLeftTab] = useState<"sheet" | "tests">("sheet");
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

  // po uruchomieniu testów pokazujemy wyniki (także na telefonie, gdzie arkusz i wyniki dzielą kartę)
  const practiceRun = practice?.runId ?? 0;
  useEffect(() => {
    if (practiceRun > 0) {
      setLeftTab("tests");
      setMobileTab("sheet");
    }
  }, [practiceRun]);

  // Panel zajmuje cały ekran — zdejmujemy resztę strony także z kolejności Tab.
  useEffect(() => {
    document.body.classList.add("ide-open");
    return () => document.body.classList.remove("ide-open");
  }, []);

  const lowTime = remainingSec <= 600;
  const veryLowTime = remainingSec <= 60;

  const sheetPanel = practice ? (
    <div className="flex h-full min-h-0 flex-col">
      <div role="tablist" aria-label="Arkusz i wyniki" className="flex shrink-0 gap-1 border-b border-white/[0.07] bg-panel/40 p-1">
        {(["sheet", "tests"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={leftTab === t}
            onClick={() => setLeftTab(t)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${leftTab === t ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"}`}
          >
            {t === "sheet" ? "Arkusz" : `Testy${practice.badge ? ` · ${practice.badge}` : ""}`}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {leftTab === "tests" ? (
          practice.panel
        ) : (
          <TaskSheet markdown={state.task.content_md} title={state.task.title} summary={state.task.summary} />
        )}
      </div>
    </div>
  ) : (
    <TaskSheet markdown={state.task.content_md} title={state.task.title} summary={state.task.summary} />
  );

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
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      {/* pasek górny */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.07] bg-panel/80 px-3 py-2 backdrop-blur">
        <span className="text-sm font-semibold">
          Tebby <span className="text-muted">· {practice ? "ćwiczenie" : "praktyka"}</span>
        </span>
        {practice ? (
          <span className="flex min-w-0 items-center gap-1.5 truncate text-sm text-muted">
            <FlaskConical size={14} aria-hidden /> <span className="truncate">{state.task.title}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 truncate text-sm text-muted">
            <User size={14} aria-hidden /> {state.studentName}
          </span>
        )}
        {practice ? (
          practice.restored && <span className="chip border-accent/40 text-accent">wczytano Twoją pracę z poprzedniej wizyty</span>
        ) : (
          <span
            className={`chip ${saveStatus === "error" ? "border-danger/60 text-danger" : saveStatus === "saving" ? "border-warn/50 text-warn" : "border-accent/40 text-accent"}`}
            title={lastSavedAt ? `Ostatni zapis: ${new Date(lastSavedAt).toLocaleTimeString("pl-PL")}` : undefined}
          >
            {SAVE_LABEL[saveStatus]}
          </span>
        )}
        {practice ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" className="btn-primary btn-sm" onClick={practice.onRunTests} disabled={practice.running}>
              {practice.running ? "Sprawdzanie…" : "▶ Uruchom testy"}
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={practice.onReset} title="Wróć do pliku startowego">
              <RotateCcw size={14} aria-hidden /> Od nowa
            </button>
            <Link href={practice.exitHref} className="btn-ghost btn-sm">
              <X size={14} aria-hidden /> Zamknij
            </Link>
          </div>
        ) : (
        <div
          className={`ml-auto flex items-center gap-2 rounded-xl border px-3 py-1 ${
            veryLowTime
              ? "animate-pulse border-danger/60 bg-danger/10 text-danger"
              : lowTime
                ? "border-danger/50 text-danger"
                : "border-accent/40 bg-accent/5 text-accent"
          }`}
          role="timer"
          aria-label="Pozostały czas"
        >
          <span className="hidden text-[0.7rem] uppercase tracking-wide opacity-70 sm:inline">Pozostały czas</span>
          <span className="font-mono text-lg font-bold tabular-nums">{formatClock(remainingSec)}</span>
        </div>
        )}
        {!practice && (
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={onSubmit}
            disabled={submitting || readOnly}
            title="Oddaj pracę i zakończ podejście — także wtedy, gdy skończysz przed czasem"
          >
            {submitting ? "Oddawanie…" : "Zakończ podejście"}
          </button>
        )}
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
            {t === "sheet" ? (practice ? "Arkusz i testy" : "Arkusz") : t === "code" ? "Kod" : "Podgląd"}
          </button>
        ))}
      </div>

      {/* układ dzielony (desktop) */}
      <div ref={rootRef} className="hidden min-h-0 flex-1 lg:flex">
        <div style={{ width: `${sheetWidth}%` }} className="min-w-0 border-r border-white/[0.07] bg-panel/30">
          {sheetPanel}
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
        {mobileTab === "sheet" && sheetPanel}
        {mobileTab === "code" && editorPanel}
        {mobileTab === "preview" && <PreviewPane files={files} revision={revision} />}
      </div>
    </div>
  );
}
