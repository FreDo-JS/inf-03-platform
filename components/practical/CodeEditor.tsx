"use client";

import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

// Monaco z naszego origin (public/monaco), nie z CDN — patrz scripts/copy-monaco.mjs.
loader.config({ paths: { vs: "/monaco/vs" } });

/**
 * Emmet: skróty w rodzaju `ul>li*3` i `m10` rozwijane Tabem.
 *
 * Monaco nie ma Emmeta w środku (w VS Code to osobne rozszerzenie), dokłada go
 * `emmet-monaco-es` — zwykły moduł npm, więc nie łamie CSP i nie potrzebuje
 * internetu. Ładujemy go leniwie, przy pierwszym montowaniu edytora, żeby
 * 95 kB nie leciało na mapę nauki ani do testów teoretycznych.
 *
 * Rejestracja jest **globalna dla instancji Monaco**, a edytor montuje się
 * wielokrotnie (uczeń przełącza pliki, panel otwiera kolejne prace) — stąd
 * strażnik na poziomie modułu. Bez niego obsługa Taba nakładałaby się przy
 * każdym montowaniu.
 *
 * Tylko HTML i CSS. Emmet dla JavaScriptu oznacza JSX, a nasze `skrypt.js`
 * to zwykły JS — włączenie tamtego trybu kończyłoby się wstawianiem
 * `<div></div>` po wpisaniu `div` i naciśnięciu Taba.
 */
let emmetWlaczony = false;

/**
 * Czy w tym języku podpowiadać przy pisaniu.
 *
 * Emmet z `emmet-monaco-es` wpina się jako **dostawca podpowiedzi**, nie jako
 * skrót klawiszowy. Przy wyłączonym `quickSuggestions` skróty CSS (`m10`)
 * nigdy by się nie pokazały — w HTML ratują je znaki wyzwalające (`>`, `*`),
 * w CSS takich nie ma. Włączamy więc podpowiadanie dla HTML i CSS, gdzie
 * podpowiedzi tagów i właściwości i tak były zamierzone, a zostawiamy
 * wyłączone dla JavaScriptu: tam Emmet nic nie wnosi (jego tryb dla JS to
 * JSX), a podpowiadanie całych fragmentów kodu wyłączono świadomie.
 *
 * Sprawdzone w przeglądarce na naszym Monaco z `public/monaco`:
 * `ul>li*3` + Tab i `m10` + Tab rozwijają się, zwykły Tab nadal robi wcięcie.
 */
const podpowiadacPrzyPisaniu = (language: string) => language === "html" || language === "css";

async function wlaczEmmet(monaco: Parameters<OnMount>[1]): Promise<void> {
  if (emmetWlaczony) return;
  emmetWlaczony = true;
  try {
    const { emmetHTML, emmetCSS } = await import("emmet-monaco-es");
    emmetHTML(monaco);
    emmetCSS(monaco);
  } catch {
    // Brak Emmeta to niedogodność, nie awaria — edytor ma działać dalej.
    emmetWlaczony = false;
  }
}

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
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const allowPasteRef = useRef(allowPaste);
  const largePasteRef = useRef(onLargePaste);
  const submitRef = useRef(onSubmitShortcut);

  useEffect(() => {
    allowPasteRef.current = allowPaste;
    largePasteRef.current = onLargePaste;
    submitRef.current = onSubmitShortcut;
  }, [allowPaste, onLargePaste, onSubmitShortcut]);

  // Przełączenie pliku zmienia język już po zamontowaniu edytora.
  useEffect(() => {
    editorRef.current?.updateOptions({
      quickSuggestions: { other: podpowiadacPrzyPisaniu(language), comments: false, strings: false },
    });
  }, [language]);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    void wlaczEmmet(monaco);

    editor.updateOptions({
      // zostawiamy kolorowanie składni i podpowiedzi tagów/właściwości,
      // wyłączamy natomiast podpowiadanie całych fragmentów kodu
      quickSuggestions: { other: podpowiadacPrzyPisaniu(language), comments: false, strings: false },
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
      options={{
        readOnly,
        domReadOnly: readOnly,
        // Nauczyciel czyta cudzy kod. Podpowiedzi po najechaniu renderują treść z komentarzy
        // (JSDoc) przez sanitizer DOMPurify wbudowany w Monaco (3.4.8, starszy niż 3.4.17, w którym
        // poprawiono zgłoszone luki) — przy cudzym kodzie wyłączamy je, a adresy w kodzie nie są klikalne.
        hover: { enabled: readOnly ? "off" : "on" },
        links: false,
      }}
      loading={<p className="p-4 font-mono text-sm text-muted">Ładowanie edytora…</p>}
      height="100%"
    />
  );
}
