// Budowanie dokumentu podglądu pracy ucznia.
//
// Kod ucznia uruchamiamy w <iframe sandbox="allow-scripts allow-forms"> BEZ
// allow-same-origin, przez srcdoc. Dzięki temu skrypt ucznia nie ma dostępu do
// naszego origin: ani do sesji admina, ani do localStorage aplikacji. Jedyny
// kanał komunikacji to postMessage — i traktujemy jego treść jak dane, nie polecenia.
//
// Przed wstawieniem podmieniamy odwołania do plików projektu na treść inline,
// bo iframe nie ma serwera, z którego mógłby pobrać styl.css czy skrypt.js.

import type { ProjectFile } from "@/types/practical";

export type PreviewMessage =
  | { type: "ready" }
  | { type: "console"; level: "log" | "info" | "warn" | "error"; text: string }
  | { type: "navigate"; page: string }
  | { type: "test-result"; payload: unknown };

/** Skrypt mostka wstrzykiwany jako PIERWSZY element <head> — przed kodem ucznia. */
function bridgeScript(frameId: string): string {
  return `
(function () {
  var FRAME_ID = ${JSON.stringify(frameId)};
  function post(msg) {
    try { parent.postMessage(Object.assign({ source: "inf03-preview", frameId: FRAME_ID }, msg), "*"); } catch (e) {}
  }
  function fmt(v) {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  ["log", "info", "warn", "error"].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      post({ type: "console", level: level, text: Array.prototype.map.call(arguments, fmt).join(" ") });
      if (orig) orig.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (e) {
    post({ type: "console", level: "error", text: (e.message || "Błąd skryptu") + " (linia " + (e.lineno || 0) + ")" });
  });
  window.addEventListener("unhandledrejection", function (e) {
    post({ type: "console", level: "error", text: "Nieobsłużony błąd Promise: " + fmt(e.reason) });
  });
  // kliknięcie linku do innego pliku projektu przełącza stronę w podglądzie
  document.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el.nodeType === 1 && !el.hasAttribute("data-inf03-page")) el = el.parentElement;
    if (el && el.nodeType === 1) {
      e.preventDefault();
      post({ type: "navigate", page: el.getAttribute("data-inf03-page") });
    }
  });
  // Formularze: obsługa POST/GET dojdzie z etapem PHP. Na razie nie przeładowujemy podglądu.
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    post({ type: "console", level: "warn", text: "Wysłanie formularza zadziała po dodaniu obsługi PHP. Podgląd pokazuje samą stronę." });
  });
  document.addEventListener("DOMContentLoaded", function () { post({ type: "ready" }); });
})();`;
}

const byName = (files: readonly ProjectFile[], name: string) => files.find((f) => f.name === name);

/** "./styl.css?v=2" → "styl.css" (podgląd nie ma serwera, więc liczy się sama nazwa) */
function baseName(href: string): string {
  const cleaned = href.trim().split("#")[0]?.split("?")[0] ?? "";
  const parts = cleaned.split("/");
  return parts[parts.length - 1] ?? "";
}

export type BuildResult = { html: string; missing: string[] };

/**
 * Składa kompletny dokument HTML dla iframe: podmienia <link>, <script src>
 * i linki do innych stron projektu, dokleja mostek konsoli, a w trybie testów
 * także skrypt sprawdzający.
 */
export function buildPreviewDocument(
  files: readonly ProjectFile[],
  page: string,
  options: { frameId: string; extraScript?: string; disableStudentScripts?: boolean },
): BuildResult {
  const pageFile = byName(files, page);
  const missing: string[] = [];

  if (!pageFile) {
    return {
      html: `<!DOCTYPE html><html lang="pl"><body style="font-family:sans-serif;padding:1rem">Brak pliku ${escapeHtml(page)}</body></html>`,
      missing: [page],
    };
  }

  if (typeof DOMParser === "undefined") {
    return { html: pageFile.content, missing };
  }

  const doc = new DOMParser().parseFromString(pageFile.content || "<!DOCTYPE html><html><body></body></html>", "text/html");

  // <link rel="stylesheet" href="styl.css"> → <style>…</style>
  doc.querySelectorAll("link[href]").forEach((link) => {
    const rel = (link.getAttribute("rel") ?? "").toLowerCase();
    if (!rel.split(/\s+/).includes("stylesheet")) return;
    const name = baseName(link.getAttribute("href") ?? "");
    const file = byName(files, name);
    if (!file) {
      if (name) missing.push(name);
      return;
    }
    const style = doc.createElement("style");
    style.setAttribute("data-inf03-file", name);
    style.textContent = file.content;
    link.replaceWith(style);
  });

  if (options.disableStudentScripts === true) {
    // Sprawdzanie testów strukturalnych bez JS ucznia: skrypt ucznia działa
    // w tym samym kontekście co nasz sprawdzacz, więc mógłby podmienić DOM
    // albo podszyć się pod wynik testu. Testy, które JS-u nie potrzebują,
    // uruchamiamy na samym HTML i CSS.
    doc.querySelectorAll("script").forEach((script) => script.remove());
  } else {
    // <script src="skrypt.js"> → <script>…</script>
    doc.querySelectorAll("script[src]").forEach((script) => {
      const name = baseName(script.getAttribute("src") ?? "");
      const file = byName(files, name);
      if (!file) {
        if (name) missing.push(name);
        return;
      }
      const inline = doc.createElement("script");
      inline.setAttribute("data-inf03-file", name);
      inline.textContent = file.content;
      script.replaceWith(inline);
    });
  }

  // linki do innych stron projektu — przełączają podgląd zamiast wychodzić z aplikacji
  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (/^(https?:|mailto:|tel:|#)/i.test(href.trim())) return;
    const name = baseName(href);
    if (byName(files, name)) {
      a.setAttribute("data-inf03-page", name);
      a.setAttribute("href", "#");
    }
  });

  // mostek musi być pierwszy, żeby przechwycić błędy i console.log kodu ucznia
  const head = doc.head ?? doc.createElement("head");
  if (!doc.head) doc.documentElement.prepend(head);
  const bridge = doc.createElement("script");
  bridge.textContent = bridgeScript(options.frameId);
  head.prepend(bridge);

  if (options.extraScript) {
    const runner = doc.createElement("script");
    runner.textContent = options.extraScript;
    head.insertBefore(runner, bridge.nextSibling);
  }

  return { html: `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`, missing: [...new Set(missing)] };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** Sprawdza, czy wiadomość faktycznie przyszła z naszego iframe podglądu. */
export function isPreviewMessage(
  event: MessageEvent,
  frameWindow: Window | null,
  frameId: string,
): event is MessageEvent<PreviewMessage & { source: "inf03-preview"; frameId: string }> {
  if (frameWindow === null || event.source !== frameWindow) return false;
  const data: unknown = event.data;
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === "inf03-preview" &&
    (data as { frameId?: unknown }).frameId === frameId &&
    typeof (data as { type?: unknown }).type === "string"
  );
}

export const PREVIEW_SANDBOX = "allow-scripts allow-forms";

/** Strony, które da się wyświetlić w podglądzie. */
export function previewablePages(files: readonly ProjectFile[]): string[] {
  return files.filter((f) => f.name.endsWith(".html")).map((f) => f.name);
}
