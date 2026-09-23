"use client";

import { useState } from "react";
import { CodeEditor, languageForFile } from "@/components/practical/CodeEditor";
import type { ProjectFile } from "@/types/practical";

/**
 * Podgląd plików pracy ucznia — wyłącznie w Monaco w trybie tylko do odczytu.
 * Kodu ucznia nigdy nie wstawiamy do DOM aplikacji; uruchamia się on jedynie
 * w sandboxowanym iframe podglądu.
 */
export function StudentFilesViewer({ files, height = 420 }: { files: ProjectFile[]; height?: number }) {
  const [active, setActive] = useState(files[0]?.name ?? "");
  const current = files.find((f) => f.name === active) ?? files[0];

  if (files.length === 0) return <p className="p-5 text-muted">Brak plików.</p>;

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] bg-panel/50 px-2 py-1.5">
        {files.map((f) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setActive(f.name)}
            className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs transition ${
              f.name === (current?.name ?? "") ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <div style={{ height }}>
        {current && (
          <CodeEditor key={current.name} value={current.content} language={languageForFile(current.name)} readOnly />
        )}
      </div>
    </div>
  );
}
