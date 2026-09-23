"use client";

import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

// Monaco z naszego origin (public/monaco), nie z CDN — patrz scripts/copy-monaco.mjs.
loader.config({ paths: { vs: "/monaco/vs" } });

type Props = {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** false = blokujemy wklejanie (ustawienie sesji) */
  allowPaste?: boolean;
  /** wywoływane przy wklejeniu dłuższym niż próg — logujemy sam fakt, nie treść */
  onLargePaste?: (length: number) => void;
  largePasteThreshold?: number;
  onSubmitShortcut?: () => void;
};

const LANGUAGE_BY_EXT: Record<string, string> = {
  html: "html",
  css: "css",
  js: "javascript",
  txt: "plaintext",
};

export function languageForFile(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_BY_EXT[ext] ?? "plaintext";
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  allowPaste = true,
  onLargePaste,
  largePasteThreshold = 200,
  onSubmitShortcut,
}: Props) {
  const allowPasteRef = useRef(allowPaste);
  const largePasteRef = useRef(onLargePaste);
  const submitRef = useRef(onSubmitShortcut);

  useEffect(() => {
    allowPasteRef.current = allowPaste;
    largePasteRef.current = onLargePaste;
    submitRef.current = onSubmitShortcut;
  }, [allowPaste, onLargePaste, onSubmitShortcut]);

  const onMount: OnMount = (editor, monaco) => {
    editor.updateOptions({
      // zostawiamy kolorowanie składni i podpowiedzi tagów/właściwości,
      // wyłączamy natomiast podpowiadanie całych fragmentów kodu
      quickSuggestions: { other: false, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "off",
      tabCompletion: "off",
      wordBasedSuggestions: "off",
      inlineSuggest: { enabled: false },
      parameterHints: { enabled: false },
      snippetSuggestions: "none",
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 21,
      renderWhitespace: "selection",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      contextmenu: false,
    });

    editor.onKeyDown((e) => {
      if (e.ctrlKey && e.keyCode === monaco.KeyCode.Enter) {
        e.preventDefault();
        submitRef.current?.();
      }
    });

    // Wklejanie: blokada albo dziennik (bez treści — to sygnał, nie podsłuch)
    const dom = editor.getDomNode();
    dom?.addEventListener(
      "paste",
      (event) => {
        const text = (event as ClipboardEvent).clipboardData?.getData("text") ?? "";
        if (!allowPasteRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (text.length >= largePasteThreshold) largePasteRef.current?.(text.length);
      },
      true,
    );
  };

  return (
    <Editor
      value={value}
      language={language}
      theme="vs-dark"
      onMount={onMount}
      onChange={(v) => onChange?.(v ?? "")}
      options={{ readOnly, domReadOnly: readOnly }}
      loading={<p className="p-4 font-mono text-sm text-muted">Ładowanie edytora…</p>}
      height="100%"
    />
  );
}
