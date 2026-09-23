"use client";

import { useCallback, useEffect, useState } from "react";
import { TaskEditor } from "@/components/admin/practical/TaskEditor";
import { IdeWorkspace } from "@/components/practical/IdeWorkspace";
import { fetchTasks } from "@/lib/practical/tasks";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { AttemptState, PracticalTaskRow, ProjectFile } from "@/types/practical";

/** Sztuczny stan podejścia — podgląd IDE zadania, bez sesji i bez zapisu. */
function previewState(task: PracticalTaskRow): AttemptState {
  return {
    attemptId: "preview",
    studentName: "podgląd nauczyciela",
    status: "in_progress",
    files: task.files,
    resultToken: "",
    tabSwitchCount: 0,
    lastSavedAt: null,
    endedReason: null,
    session: {
      id: "preview",
      status: "active",
      allowPaste: true,
      minutes: task.default_minutes,
      startedAt: null,
      endsAt: null,
      serverNow: new Date().toISOString(),
    },
    task: {
      id: task.id,
      title: task.title,
      summary: task.summary,
      content_md: task.content_md,
      files: task.files,
      allow_new_files: task.allow_new_files,
      student_can_run_tests: task.student_can_run_tests,
      test_names: [],
    },
  };
}

export function PracticalTasksTab() {
  const [tasks, setTasks] = useState<PracticalTaskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PracticalTaskRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewTask, setPreviewTask] = useState<PracticalTaskRow | null>(null);
  const [previewFiles, setPreviewFiles] = useState<ProjectFile[]>([]);

  const load = useCallback(async () => {
    const { tasks: rows, error: loadError } = await fetchTasks();
    setError(loadError);
    setTasks(rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (task: PracticalTaskRow) => {
    if (!window.confirm(`Usunąć zadanie „${task.title}”? Sesji opartych na nim nie da się usunąć.`)) return;
    const { error: delError } = await getBrowserSupabase().from("practical_tasks").delete().eq("id", task.id);
    if (delError) {
      setError("Nie udało się usunąć zadania (może istnieć sesja, która z niego korzysta).");
      return;
    }
    void load();
  };

  const openPreview = (task: PracticalTaskRow) => {
    setPreviewTask(task);
    setPreviewFiles(task.files);
  };

  if (previewTask) {
    return (
      <>
        <IdeWorkspace
          state={previewState(previewTask)}
          files={previewFiles}
          onFilesChange={setPreviewFiles}
          remainingSec={previewTask.default_minutes * 60}
          saveStatus="idle"
          lastSavedAt={null}
          onSubmit={() => setPreviewTask(null)}
          submitting={false}
          onLargePaste={() => undefined}
        />
        <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
          <button type="button" className="btn-ghost shadow-card" onClick={() => setPreviewTask(null)}>
            ✕ Zamknij podgląd (nic się nie zapisuje)
          </button>
        </div>
      </>
    );
  }

  if (creating || editing) {
    return (
      <TaskEditor
        task={editing}
        onSaved={() => void load()}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
        }}
        onOpenAsStudent={openPreview}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Zadania praktyczne — z nich tworzysz sesje egzaminacyjne.</p>
        <button type="button" className="btn-primary btn-sm" onClick={() => setCreating(true)}>
          + Nowe zadanie
        </button>
      </div>

      {error && <p className="alert-error">{error}</p>}

      {tasks === null ? (
        <p className="text-sm text-muted">Ładowanie…</p>
      ) : tasks.length === 0 ? (
        <p className="card p-8 text-center text-muted">Brak zadań — utwórz pierwsze.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-lg font-semibold">
                    {t.title}
                    {t.is_ready ? (
                      <span className="chip border-accent/40 text-accent">gotowe</span>
                    ) : (
                      <span className="chip border-warn/50 text-warn">szkic</span>
                    )}
                  </p>
                  {t.summary && <p className="mt-0.5 text-sm text-muted">{t.summary}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip">{t.files.length} plików</span>
                    <span className="chip">{t.auto_tests.length} testów</span>
                    <span className="chip">{t.manual_criteria.length} kryteriów</span>
                    <span className="chip">⏱ {t.default_minutes} min</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => openPreview(t)}>
                    👁 Jako uczeń
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(t)}>
                    Edytuj
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => void remove(t)}>
                    Usuń
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
