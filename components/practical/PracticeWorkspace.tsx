"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IdeWorkspace } from "@/components/practical/IdeWorkspace";
import { PracticeResults } from "@/components/practical/PracticeResults";
import { runAutoTests } from "@/lib/practical/runner";
import { validateFiles } from "@/lib/practical/validation";
import type { AttemptState, AutoResult, PracticeTask, ProjectFile } from "@/types/practical";

const storageKey = (taskId: string) => `inf03.cwiczenie.${taskId}`;

/** Własna praca z poprzedniej wizyty — tylko jeśli ma sens (te same pliki, poprawne treści). */
function loadSaved(task: PracticeTask): ProjectFile[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(task.id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const files = parsed.flatMap((f) =>
      typeof f === "object" && f !== null && typeof (f as ProjectFile).name === "string" && typeof (f as ProjectFile).content === "string"
        ? [{ name: (f as ProjectFile).name, content: (f as ProjectFile).content }]
        : [],
    );
    const check = validateFiles(files);
    if (!check.ok) return null;
    // zadanie mogło się zmienić od ostatniej wizyty: zapis musi zawierać wszystkie pliki startowe
    const names = new Set(files.map((f) => f.name));
    return task.files.every((f) => names.has(f.name)) ? check.value : null;
  } catch {
    return null;
  }
}

/** Przeglądarka ucznia: edytor, podgląd i testy uruchamiane lokalnie. Nic nie idzie do bazy. */
export function PracticeWorkspace({ task }: { task: PracticeTask }) {
  const [files, setFiles] = useState<ProjectFile[]>(task.files);
  const [results, setResults] = useState<AutoResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  // odczyt zapisanej pracy dopiero po zamontowaniu (localStorage nie istnieje na serwerze)
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const saved = loadSaved(task);
    if (saved) {
      setFiles(saved);
      setRestored(true);
    }
  }, [task]);

  // zapis pracy w przeglądarce, z opóźnieniem
  useEffect(() => {
    if (!loaded.current) return;
    const t = window.setTimeout(() => {
      try {
        // plik startowy bez zmian niczego nie zapisujemy — „wczytano Twoją pracę" ma znaczyć prawdziwą pracę
        if (JSON.stringify(files) === JSON.stringify(task.files)) window.localStorage.removeItem(storageKey(task.id));
        else window.localStorage.setItem(storageKey(task.id), JSON.stringify(files));
      } catch {
        /* localStorage niedostępny — praca przetrwa do odświeżenia strony */
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [files, task.id, task.files]);

  const runTests = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResults(null);
    const out = await runAutoTests(files, task.tests, (p) => setProgress(p.current ? `${p.done + 1}/${p.total}: ${p.current}` : null));
    setResults(out);
    setProgress(null);
    setRunning(false);
    setRunId((n) => n + 1);
  }, [files, running, task.tests]);

  const reset = useCallback(() => {
    if (!window.confirm("Wrócić do pliku startowego? Twoje zmiany w tym zadaniu zostaną usunięte.")) return;
    setFiles(task.files);
    setResults(null);
    setRestored(false);
    try {
      window.localStorage.removeItem(storageKey(task.id));
    } catch {
      /* brak localStorage */
    }
  }, [task]);

  // sztuczny stan podejścia — IDE oczekuje kształtu z egzaminu
  const state = useMemo<AttemptState>(
    () => ({
      attemptId: "cwiczenie",
      studentName: "ćwiczenie",
      status: "in_progress",
      files,
      resultToken: "",
      tabSwitchCount: 0,
      lastSavedAt: null,
      endedReason: null,
      session: { id: "cwiczenie", status: "active", allowPaste: true, minutes: 0, startedAt: null, endsAt: null, serverNow: "" },
      task: {
        id: task.id,
        title: task.title,
        summary: task.summary,
        content_md: task.contentMd,
        files: task.files,
        allow_new_files: task.allowNewFiles,
        student_can_run_tests: true,
        test_names: [],
      },
    }),
    [files, task],
  );

  const passed = results?.filter((r) => r.passed).length ?? 0;

  return (
    <IdeWorkspace
      state={state}
      files={files}
      onFilesChange={setFiles}
      remainingSec={0}
      saveStatus="idle"
      lastSavedAt={null}
      onSubmit={() => undefined}
      submitting={false}
      onLargePaste={() => undefined}
      practice={{
        onRunTests: () => void runTests(),
        running,
        onReset: reset,
        exitHref: "/praktyka/cwiczenia",
        badge: results ? `${passed}/${task.tests.length}` : null,
        runId,
        restored,
        panel: <PracticeResults task={task} results={results} running={running} progress={progress} />,
      }}
    />
  );
}
