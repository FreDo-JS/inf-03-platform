"use client";

import { useState } from "react";
import { CodeEditor, languageForFile } from "@/components/practical/CodeEditor";
import { isProjectFileName } from "@/lib/practical/validation";
import type { ProjectFile } from "@/types/practical";

type Props = {
  files: ProjectFile[];
  onChange: (files: ProjectFile[]) => void;
  label: string;
  hint?: string;
  height?: number;
};

export function FilesEditor({ files, onChange, label, hint, height = 260 }: Props) {
  const [active, setActive] = useState(files[0]?.name ?? "");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const current = files.find((f) => f.name === active) ?? files[0];

  const addFile = () => {
    const name = newName.trim();
    if (!isProjectFileName(name)) {
      setError("Nazwa: litery, cyfry, _ lub -, rozszerzenie .html, .css, .js albo .txt");
      return;
    }
    if (files.some((f) => f.name === name)) {
      setError("Plik o tej nazwie już istnieje.");
      return;
    }
    onChange([...files, { name, content: "" }]);
    setActive(name);
    setNewName("");
    setError(null);
  };

  const removeFile = (name: string) => {
    if (!window.confirm(`Usunąć plik ${name}?`)) return;
    const next = files.filter((f) => f.name !== name);
    onChange(next);
    if (active === name) setActive(next[0]?.name ?? "");
  };

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{label}</h3>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <div className="flex gap-2">
          <input
            className="input w-44 py-1.5 font-mono text-sm"
            placeholder="index.html"
            value={newName}
            maxLength={40}
            onChange={(e) => {
              setNewName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFile();
              }
            }}
            aria-label={`Nazwa nowego pliku (${label})`}
          />
          <button type="button" className="btn-ghost btn-sm" onClick={addFile}>
            + plik
          </button>
        </div>
      </div>
      {error && <p className="field-error">{error}</p>}

      {files.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Brak plików.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-1 border-b border-white/[0.06] pb-2">
            {files.map((f) => (
              <span key={f.name} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActive(f.name)}
                  className={`rounded-l-lg px-3 py-1.5 font-mono text-xs transition ${
                    f.name === (current?.name ?? "") ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"
                  }`}
                >
                  {f.name}
                </button>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  className="rounded-r-lg px-1.5 py-1.5 text-xs text-muted hover:text-danger"
                  aria-label={`Usuń ${f.name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-line" style={{ height }}>
            {current && (
              <CodeEditor
                key={current.name}
                value={current.content}
                language={languageForFile(current.name)}
                onChange={(content) => onChange(files.map((f) => (f.name === current.name ? { ...f, content } : f)))}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
