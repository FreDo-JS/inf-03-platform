"use client";

// Silnik testów automatycznych.
//
// Uruchamiany w przeglądarce NAUCZYCIELA (panel Prace), nie u ucznia — uczeń
// mógłby podmienić wynik. Nie uruchamiamy też kodu uczniów na serwerze:
// wykonywanie cudzego kodu po stronie serwera to niepotrzebne ryzyko.
// Każdy test dostaje świeży iframe (sandbox bez allow-same-origin) i limit czasu.

import { PREVIEW_SANDBOX, buildPreviewDocument } from "@/lib/practical/preview";
import { RUNNER_SCRIPT } from "@/lib/practical/runnerScript";
import type { AutoResult, AutoTest, ProjectFile } from "@/types/practical";

const TEST_TIMEOUT_MS = 5000;

type FrameResult = { passed: boolean; message: string };

function newFrameId(): string {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return `rt-${buf[0]?.toString(36) ?? ""}${buf[1]?.toString(36) ?? ""}`;
}

/** Uruchamia jeden test w izolowanym iframe. Zawsze rozwiązuje się (błąd = 0 pkt). */
async function runInFrame(files: readonly ProjectFile[], test: AutoTest, page: string): Promise<FrameResult> {
  const frameId = newFrameId();
  const built = buildPreviewDocument(files, page, { frameId, extraScript: RUNNER_SCRIPT });

  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", PREVIEW_SANDBOX);
  frame.setAttribute("title", `Sprawdzanie: ${test.name}`);
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;visibility:hidden";
  frame.srcdoc = built.html;

  return new Promise<FrameResult>((resolve) => {
    let done = false;
    const finish = (result: FrameResult) => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      frame.remove();
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null) return;
      const msg = data as { source?: unknown; frameId?: unknown; type?: unknown; payload?: unknown };
      if (msg.source !== "inf03-preview" || msg.frameId !== frameId) return;

      if (msg.type === "ready") {
        frame.contentWindow?.postMessage({ source: "inf03-runner", type: "run-test", frameId, test }, "*");
      } else if (msg.type === "test-result") {
        const payload = msg.payload as { passed?: unknown; message?: unknown } | null;
        finish({
          passed: payload?.passed === true,
          message: typeof payload?.message === "string" ? payload.message.slice(0, 500) : "",
        });
      }
    };

    const timeout = window.setTimeout(
      () => finish({ passed: false, message: `Test przekroczył limit czasu (${TEST_TIMEOUT_MS / 1000} s).` }),
      TEST_TIMEOUT_MS,
    );

    window.addEventListener("message", onMessage);
    document.body.appendChild(frame);
  });
}

function runFileTest(files: readonly ProjectFile[], test: Extract<AutoTest, { type: "file_not_empty" }>): FrameResult {
  const file = files.find((f) => f.name === test.file);
  if (!file) return { passed: false, message: `Brak pliku ${test.file} w pracy.` };
  const length = file.content.trim().length;
  return length > 0
    ? { passed: true, message: `Plik ${test.file} ma treść (${length} znaków).` }
    : { passed: false, message: `Plik ${test.file} jest pusty.` };
}

export type RunProgress = { done: number; total: number; current: string };

/** Uruchamia komplet testów po kolei i zwraca wyniki z punktacją. */
export async function runAutoTests(
  files: readonly ProjectFile[],
  tests: readonly AutoTest[],
  onProgress?: (p: RunProgress) => void,
): Promise<AutoResult[]> {
  const results: AutoResult[] = [];

  for (const [index, test] of tests.entries()) {
    onProgress?.({ done: index, total: tests.length, current: test.name });

    let outcome: FrameResult;
    try {
      if (test.type === "file_not_empty") {
        outcome = runFileTest(files, test);
      } else {
        const page = "page" in test ? test.page : "";
        if (!files.some((f) => f.name === page)) {
          outcome = { passed: false, message: `Brak pliku ${page} w pracy.` };
        } else {
          outcome = await runInFrame(files, test, page);
        }
      }
    } catch (e) {
      outcome = { passed: false, message: `Błąd sprawdzania: ${e instanceof Error ? e.message : "nieznany"}` };
    }

    results.push({
      id: test.id,
      passed: outcome.passed,
      points: outcome.passed ? test.points : 0,
      message: outcome.message,
    });
  }

  onProgress?.({ done: tests.length, total: tests.length, current: "" });
  return results;
}
