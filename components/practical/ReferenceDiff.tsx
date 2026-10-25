"use client";

import { DiffEditor, loader } from "@monaco-editor/react";
import { useMemo, useState } from "react";
import { languageForFile } from "@/components/practical/CodeEditor";
import type { ProjectFile } from "@/types/practical";

loader.config({ paths: { vs: "/monaco/vs" } });

type Props = {
  /** rozwiązanie wzorcowe zadania */
  reference: readonly ProjectFile[];
  /** praca ucznia */
  student: readonly ProjectFile[];
  /** identyfikator pracy — rozróżnia modele edytora między pracami (inaczej Monaco pokazałby cudzą treść) */
  scope: string;
  height?: number;
};

/**
 * Praca ucznia obok rozwiązania wzorcowego, plik po pliku, z podświetlonymi różnicami.
 * Tylko do odczytu; podpowiedzi po najechaniu są wyłączone, bo to cudzy kod
 * (zob. komentarz w CodeEditor).
 */
export function ReferenceDiff({ reference, student, scope, height = 380 }: Props) {
  const names = useMemo(() => {
    const all = new Set<string>();
    for (const f of student) all.add(f.name);
    for (const f of reference) all.add(f.name);
    return [...all];
  }, [reference, student]);
  const [current, setCurrent] = useState<string>(() => names[0] ?? "");
  const active = names.includes(current) ? current : (names[0] ?? "");

  const ref = reference.find((f) => f.name === active);
  const mine = student.find((f) => f.name === active);

  if (names.length === 0) return <p className="p-4 text-sm text-muted">Brak plików do porównania.</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2" role="tablist" aria-label="Plik do porównania">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === active}
            onClick={() => setCurrent(name)}
            className={`rounded-md border px-2.5 py-1 font-mono text-xs transition ${
              name === active
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-line text-muted hover:bg-white/[0.04] hover:text-fg"
            }`}
          >
            {name}
            {!ref && name === active ? " (tylko u ucznia)" : ""}
            {ref && !mine && name === active ? " (brak u ucznia)" : ""}
          </button>
        ))}
        <span className="ml-auto flex gap-4 text-xs text-muted">
          <span>◀ wzorzec</span>
          <span>praca ucznia ▶</span>
        </span>
      </div>
      <div style={{ height }}>
        {/* Bez `key` i z zachowanymi modelami: remontaż DiffEditora kasuje modele przed
            odpięciem widżetu i Monaco rzuca „TextModel got disposed before DiffEditorWidget
            model got reset”. Każdy plik ma własną ścieżkę modelu, więc przełączanie działa. */}
        <DiffEditor
          original={ref?.content ?? ""}
          modified={mine?.content ?? ""}
          originalModelPath={`inmemory://wzorzec/${scope}/${active}`}
          modifiedModelPath={`inmemory://praca/${scope}/${active}`}
          keepCurrentOriginalModel
          keepCurrentModifiedModel
          language={languageForFile(active)}
          theme="vs-dark"
          height="100%"
          loading={<p className="p-4 font-mono text-sm text-muted">Ładowanie porównania…</p>}
          options={{
            readOnly: true,
            domReadOnly: true,
            originalEditable: false,
            renderSideBySide: true,
            minimap: { enabled: false },
            hover: { enabled: "off" },
            links: false,
            contextmenu: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 13,
          }}
        />
      </div>
    </div>
  );
}
