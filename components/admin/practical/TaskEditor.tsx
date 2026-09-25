"use client";

import { useMemo, useState } from "react";
import { AutoTestsEditor } from "@/components/admin/practical/AutoTestsEditor";
import { FilesEditor } from "@/components/admin/practical/FilesEditor";
import { TaskSheet } from "@/components/practical/TaskSheet";
import { runAutoTests, type RunProgress } from "@/lib/practical/runner";
import { saveTask } from "@/lib/practical/tasks";
import { PRACTICAL_LIMITS, newLocalId, validateAutoTest, validateCriterion, validateFiles } from "@/lib/practical/validation";
import { previewablePages } from "@/lib/practical/preview";
import type { AutoResult, ManualCriterion, PracticalTaskRow, ProjectFile } from "@/types/practical";
import { ArrowLeft, Check, Eye, X } from "lucide-react";

type Props = {
  task: PracticalTaskRow | null;
  onSaved: () => void;
  onCancel: () => void;
  onOpenAsStudent: (task: PracticalTaskRow) => void;
};

const emptyTask = (): PracticalTaskRow => ({
  id: "",
  title: "",
  summary: "",
  content_md: "## Treść zadania\n\nOpisz, co uczeń ma zrobić.",
  files: [
    { name: "index.html", content: "<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Strona</title>\n</head>\n<body>\n\n</body>\n</html>\n" },
    { name: "styl.css", content: "" },
    { name: "skrypt.js", content: "" },
  ],
  reference_files: [],
  auto_tests: [],
  manual_criteria: [],
  default_minutes: 150,
  allow_new_files: false,
  student_can_run_tests: false,
  is_ready: false,
  created_at: "",
});

export function TaskEditor({ task, onSaved, onCancel, onOpenAsStudent }: Props) {
  const [draft, setDraft] = useState<PracticalTaskRow>(task ?? emptyTask());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [checking, setChecking] = useState<RunProgress | null>(null);
  const [checkResults, setCheckResults] = useState<AutoResult[] | null>(null);

  const fileNames = useMemo(() => draft.files.map((f) => f.name), [draft.files]);
  const pageNames = useMemo(() => previewablePages(draft.files), [draft.files]);

  const problems = useMemo(() => {
    const list: string[] = [];
    if (draft.title.trim().length === 0) list.push("Tytuł jest wymagany.");
    if (draft.title.length > PRACTICAL_LIMITS.title.max) list.push("Tytuł jest za długi.");
    if (draft.summary.length > PRACTICAL_LIMITS.summary.max) list.push("Opis krótki: maks. 300 znaków.");
    if (draft.content_md.length > PRACTICAL_LIMITS.contentMd.max) list.push("Treść arkusza jest za długa.");
    if (draft.files.length === 0) list.push("Dodaj co najmniej jeden plik projektu.");
    const filesCheck = validateFiles(draft.files);
    if (!filesCheck.ok) list.push(filesCheck.error);
    const refCheck = validateFiles(draft.reference_files);
    if (!refCheck.ok) list.push(`Rozwiązanie wzorcowe: ${refCheck.error}`);
    if (draft.default_minutes < PRACTICAL_LIMITS.minutes.min || draft.default_minutes > PRACTICAL_LIMITS.minutes.max) {
      list.push("Czas: od 5 do 300 minut.");
    }
    draft.auto_tests.forEach((t, i) => validateAutoTest(t, fileNames).forEach((e) => list.push(`Test #${i + 1}: ${e}`)));
    draft.manual_criteria.forEach((c, i) => validateCriterion(c).forEach((e) => list.push(`Kryterium #${i + 1}: ${e}`)));
    return list;
  }, [draft, fileNames]);

  const allTestsPass =
    checkResults !== null && draft.auto_tests.length > 0 && checkResults.every((r) => r.passed);

  const save = async (markReady: boolean) => {
    if (saving) return;
    if (problems.length > 0) {
      setError("Popraw błędy przed zapisem.");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    const { id, error: saveError } = await saveTask(draft.id === "" ? null : draft.id, {
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      content_md: draft.content_md,
      files: draft.files,
      reference_files: draft.reference_files,
      auto_tests: draft.auto_tests,
      manual_criteria: draft.manual_criteria,
      default_minutes: draft.default_minutes,
      allow_new_files: draft.allow_new_files,
      student_can_run_tests: draft.student_can_run_tests,
      is_ready: markReady,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    if (id) setDraft((d) => ({ ...d, id, is_ready: markReady }));
    setInfo(markReady ? "Zapisano i oznaczono jako gotowe." : "Zapisano.");
    onSaved();
  };

  const checkOnReference = async () => {
    if (draft.reference_files.length === 0) {
      setError("Dodaj najpierw rozwiązanie wzorcowe.");
      return;
    }
    if (draft.auto_tests.length === 0) {
      setError("Dodaj najpierw testy automatyczne.");
      return;
    }
    setError(null);
    setCheckResults(null);
    const results = await runAutoTests(draft.reference_files, draft.auto_tests, setChecking);
    setChecking(null);
    setCheckResults(results);
  };

  const addCriterion = () =>
    setDraft((d) => ({
      ...d,
      manual_criteria: [...d.manual_criteria, { id: newLocalId("c"), name: "", description: "", points: 5 }],
    }));

  const updateCriterion = (id: string, patch: Partial<ManualCriterion>) =>
    setDraft((d) => ({
      ...d,
      manual_criteria: d.manual_criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const setFiles = (files: ProjectFile[]) => setDraft((d) => ({ ...d, files }));
  const setReference = (reference_files: ProjectFile[]) => setDraft((d) => ({ ...d, reference_files }));

  const maxAuto = draft.auto_tests.reduce((s, t) => s + t.points, 0);
  const maxManual = draft.manual_criteria.reduce((s, c) => s + c.points, 0);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">{draft.id === "" ? "Nowe zadanie" : "Edycja zadania"}</h2>
          <p className="text-xs text-muted">
            Punkty: {maxAuto} automatycznie + {maxManual} ręcznie = {maxAuto + maxManual}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
            <ArrowLeft size={14} aria-hidden /> wróć do listy
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => onOpenAsStudent(draft)}
            disabled={draft.files.length === 0}
          >
            <Eye size={14} aria-hidden /> Otwórz jako uczeń
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => void save(false)} disabled={saving}>
            {saving ? "Zapisywanie…" : "Zapisz szkic"}
          </button>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => void save(true)}
            disabled={saving || !allTestsPass}
            title={allTestsPass ? "" : "Najpierw uruchom testy na rozwiązaniu wzorcowym — muszą wszystkie przejść"}
          >
            Zapisz jako gotowe
          </button>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {info && <p className="alert-ok">{info}</p>}
      {problems.length > 0 && (
        <ul className="card space-y-1 border-warn/40 p-4 text-sm text-warn">
          {problems.slice(0, 8).map((p) => (
            <li key={p}>• {p}</li>
          ))}
        </ul>
      )}

      <div className="card grid gap-4 p-4 sm:grid-cols-[1fr_9rem]">
        <div>
          <label className="label" htmlFor="task-title">
            Tytuł
          </label>
          <input
            id="task-title"
            className="input"
            value={draft.title}
            maxLength={PRACTICAL_LIMITS.title.max}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <label className="label mt-3" htmlFor="task-summary">
            Opis krótki
          </label>
          <input
            id="task-summary"
            className="input"
            value={draft.summary}
            maxLength={PRACTICAL_LIMITS.summary.max}
            onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
          />
        </div>
        <div>
          <label className="label" htmlFor="task-minutes">
            Czas (min)
          </label>
          <input
            id="task-minutes"
            className="input font-mono"
            type="number"
            min={PRACTICAL_LIMITS.minutes.min}
            max={PRACTICAL_LIMITS.minutes.max}
            value={draft.default_minutes}
            onChange={(e) => setDraft((d) => ({ ...d, default_minutes: Number(e.target.value) }))}
          />
          <label className="mt-3 flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2de2c1]"
              checked={draft.allow_new_files}
              onChange={(e) => setDraft((d) => ({ ...d, allow_new_files: e.target.checked }))}
            />
            uczeń może dodawać pliki
          </label>
          <label className="mt-2 flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2de2c1]"
              checked={draft.student_can_run_tests}
              onChange={(e) => setDraft((d) => ({ ...d, student_can_run_tests: e.target.checked }))}
            />
            uczeń widzi nazwy testów
          </label>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Treść arkusza (Markdown)</h3>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setShowPreview((p) => !p)}>
            {showPreview ? "edytuj" : "podgląd"}
          </button>
        </div>
        {showPreview ? (
          <div className="mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-bg/40">
            <TaskSheet markdown={draft.content_md} />
          </div>
        ) : (
          <textarea
            className="input mt-2 min-h-[16rem] font-mono text-sm"
            value={draft.content_md}
            maxLength={PRACTICAL_LIMITS.contentMd.max}
            onChange={(e) => setDraft((d) => ({ ...d, content_md: e.target.value }))}
          />
        )}
      </div>

      <FilesEditor
        files={draft.files}
        onChange={setFiles}
        label="Pliki projektu (stan startowy ucznia)"
        hint="Uczeń dostaje te pliki z tą zawartością."
      />

      <FilesEditor
        files={draft.reference_files}
        onChange={setReference}
        label="Rozwiązanie wzorcowe (tylko dla nauczyciela)"
        hint="Na nim sprawdzamy, czy testy automatyczne są poprawnie napisane."
      />

      <AutoTestsEditor
        tests={draft.auto_tests}
        onChange={(auto_tests) => {
          setDraft((d) => ({ ...d, auto_tests }));
          setCheckResults(null);
        }}
        fileNames={fileNames}
        pageNames={pageNames}
      />

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Sprawdzenie na rozwiązaniu wzorcowym</h3>
            <p className="text-xs text-muted">Zadanie można oznaczyć jako gotowe dopiero, gdy wszystkie testy przechodzą.</p>
          </div>
          <button type="button" className="btn-primary btn-sm" onClick={() => void checkOnReference()} disabled={checking !== null}>
            {checking ? `Sprawdzanie… (${checking.done}/${checking.total})` : "▶ Sprawdź na wzorcu"}
          </button>
        </div>
        {checkResults && (
          <ul className="mt-3 space-y-1">
            {checkResults.map((r) => {
              const test = draft.auto_tests.find((t) => t.id === r.id);
              return (
                <li key={r.id} className="flex items-start gap-2 text-sm">
                  <span className={r.passed ? "text-accent" : "text-danger"}>
                        {r.passed ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
                      </span>
                  <span className="flex-1">
                    <span className="font-medium">{test?.name || r.id}</span>{" "}
                    <span className="text-muted">— {r.message}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Kryteria oceniane ręcznie</h3>
            <p className="text-xs text-muted">Np. estetyka, zgodność z makietą — punkty przyznaje nauczyciel.</p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={addCriterion}>
            + kryterium
          </button>
        </div>
        {draft.manual_criteria.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Brak kryteriów ręcznych.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {draft.manual_criteria.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2">
                <input
                  className="input min-w-[10rem] flex-1 py-1.5 text-sm"
                  placeholder="Nazwa kryterium"
                  value={c.name}
                  maxLength={200}
                  onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                />
                <input
                  className="input min-w-[10rem] flex-1 py-1.5 text-sm"
                  placeholder="Opis (opcjonalnie)"
                  value={c.description ?? ""}
                  maxLength={500}
                  onChange={(e) => updateCriterion(c.id, { description: e.target.value })}
                />
                <input
                  className="input w-20 py-1.5 font-mono text-sm"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={c.points}
                  onChange={(e) => updateCriterion(c.id, { points: Number(e.target.value) })}
                  aria-label="Punkty kryterium"
                />
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => setDraft((d) => ({ ...d, manual_criteria: d.manual_criteria.filter((x) => x.id !== c.id) }))}
                  aria-label="Usuń kryterium"
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
