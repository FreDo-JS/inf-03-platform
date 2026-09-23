"use client";

import { newLocalId, validateAutoTest } from "@/lib/practical/validation";
import type { AutoTest, AutoTestType, InteractionStep, TextMatchMode } from "@/types/practical";

type Props = {
  tests: AutoTest[];
  onChange: (tests: AutoTest[]) => void;
  fileNames: string[];
  pageNames: string[];
};

const TYPE_LABEL: Record<AutoTestType, string> = {
  file_not_empty: "Plik ma treść",
  selector_count: "Liczba elementów (selektor)",
  selector_text: "Tekst elementu",
  selector_attribute: "Atrybut elementu",
  css_computed: "Styl obliczony (CSS)",
  html_lang_doctype: "DOCTYPE i atrybut lang",
  interaction: "Scenariusz kliknięć i wpisywania",
};

const MODE_LABEL: Record<TextMatchMode, string> = {
  equals: "równa się",
  contains: "zawiera",
  regex: "pasuje do wyrażenia",
};

function emptyTest(type: AutoTestType, page: string, file: string): AutoTest {
  const base = { id: newLocalId("t"), name: "", points: 1 };
  switch (type) {
    case "file_not_empty":
      return { ...base, type, file };
    case "selector_count":
      return { ...base, type, page, selector: "", min: 1 };
    case "selector_text":
      return { ...base, type, page, selector: "", mode: "contains", value: "", ignoreCase: true };
    case "selector_attribute":
      return { ...base, type, page, selector: "", attribute: "", mode: "equals", value: "" };
    case "css_computed":
      return { ...base, type, page, selector: "", property: "color", expected: "" };
    case "html_lang_doctype":
      return { ...base, type, page, lang: "pl" };
    case "interaction":
      return {
        ...base,
        type,
        page,
        steps: [{ action: "click", selector: "" }],
        expect: { selector: "", mode: "contains", value: "" },
      };
  }
}

export function AutoTestsEditor({ tests, onChange, fileNames, pageNames }: Props) {
  const defaultPage = pageNames[0] ?? "";
  const defaultFile = fileNames[0] ?? "";

  const update = (id: string, patch: Partial<AutoTest>) =>
    onChange(tests.map((t) => (t.id === id ? ({ ...t, ...patch } as AutoTest) : t)));

  const totalPoints = tests.reduce((s, t) => s + (Number.isFinite(t.points) ? t.points : 0), 0);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Testy automatyczne</h3>
          <p className="text-xs text-muted">Budowane formularzem — nauczyciel nie pisze kodu. Razem: {totalPoints} pkt.</p>
        </div>
        <select
          className="input w-auto py-1.5 text-sm"
          value=""
          onChange={(e) => {
            const type = e.target.value as AutoTestType;
            if (type) onChange([...tests, emptyTest(type, defaultPage, defaultFile)]);
            e.target.value = "";
          }}
          aria-label="Dodaj test"
        >
          <option value="">+ dodaj test…</option>
          {(Object.keys(TYPE_LABEL) as AutoTestType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      {tests.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Brak testów — praca będzie oceniana tylko ręcznie.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {tests.map((test, index) => {
            const errors = validateAutoTest(test, fileNames);
            return (
              <li key={test.id} className={`rounded-xl border p-3 ${errors.length > 0 ? "border-danger/50" : "border-line"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-accent">#{index + 1}</span>
                  <span className="chip">{TYPE_LABEL[test.type]}</span>
                  <input
                    className="input min-w-[12rem] flex-1 py-1.5 text-sm"
                    placeholder="Nazwa widoczna dla ucznia"
                    value={test.name}
                    maxLength={200}
                    onChange={(e) => update(test.id, { name: e.target.value })}
                    aria-label="Nazwa testu"
                  />
                  <input
                    className="input w-20 py-1.5 font-mono text-sm"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={test.points}
                    onChange={(e) => update(test.id, { points: Number(e.target.value) })}
                    aria-label="Punkty"
                  />
                  <span className="text-xs text-muted">pkt</span>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => onChange(tests.filter((t) => t.id !== test.id))}
                    aria-label="Usuń test"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {"page" in test && (
                    <label className="text-xs text-muted">
                      Strona
                      <select
                        className="input mt-1 py-1.5 text-sm"
                        value={test.page}
                        onChange={(e) => update(test.id, { page: e.target.value } as Partial<AutoTest>)}
                      >
                        {pageNames.length === 0 && <option value="">brak plików .html</option>}
                        {pageNames.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {test.type === "file_not_empty" && (
                    <label className="text-xs text-muted">
                      Plik
                      <select
                        className="input mt-1 py-1.5 text-sm"
                        value={test.file}
                        onChange={(e) => update(test.id, { file: e.target.value } as Partial<AutoTest>)}
                      >
                        {fileNames.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {"selector" in test && (
                    <label className="text-xs text-muted">
                      Selektor CSS
                      <input
                        className="input mt-1 py-1.5 font-mono text-sm"
                        placeholder="np. table tr"
                        value={test.selector}
                        onChange={(e) => update(test.id, { selector: e.target.value } as Partial<AutoTest>)}
                      />
                    </label>
                  )}
                  {test.type === "selector_count" && (
                    <div className="flex gap-2">
                      <label className="flex-1 text-xs text-muted">
                        Min.
                        <input
                          className="input mt-1 py-1.5 font-mono text-sm"
                          type="number"
                          min={0}
                          value={test.min ?? ""}
                          onChange={(e) =>
                            update(test.id, { min: e.target.value === "" ? undefined : Number(e.target.value) } as Partial<AutoTest>)
                          }
                        />
                      </label>
                      <label className="flex-1 text-xs text-muted">
                        Maks.
                        <input
                          className="input mt-1 py-1.5 font-mono text-sm"
                          type="number"
                          min={0}
                          value={test.max ?? ""}
                          onChange={(e) =>
                            update(test.id, { max: e.target.value === "" ? undefined : Number(e.target.value) } as Partial<AutoTest>)
                          }
                        />
                      </label>
                    </div>
                  )}
                  {test.type === "selector_attribute" && (
                    <label className="text-xs text-muted">
                      Atrybut
                      <input
                        className="input mt-1 py-1.5 font-mono text-sm"
                        placeholder="np. alt"
                        value={test.attribute}
                        onChange={(e) => update(test.id, { attribute: e.target.value } as Partial<AutoTest>)}
                      />
                    </label>
                  )}
                  {(test.type === "selector_text" || test.type === "selector_attribute") && (
                    <>
                      <label className="text-xs text-muted">
                        Porównanie
                        <select
                          className="input mt-1 py-1.5 text-sm"
                          value={test.mode}
                          onChange={(e) => update(test.id, { mode: e.target.value as TextMatchMode } as Partial<AutoTest>)}
                        >
                          {(Object.keys(MODE_LABEL) as TextMatchMode[]).map((m) => (
                            <option key={m} value={m}>
                              {MODE_LABEL[m]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-muted">
                        Oczekiwana wartość
                        <input
                          className="input mt-1 py-1.5 text-sm"
                          value={test.value}
                          onChange={(e) => update(test.id, { value: e.target.value } as Partial<AutoTest>)}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-muted">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-[#2de2c1]"
                          checked={test.ignoreCase ?? false}
                          onChange={(e) => update(test.id, { ignoreCase: e.target.checked } as Partial<AutoTest>)}
                        />
                        ignoruj wielkość liter
                      </label>
                    </>
                  )}
                  {test.type === "css_computed" && (
                    <>
                      <label className="text-xs text-muted">
                        Właściwość
                        <input
                          className="input mt-1 py-1.5 font-mono text-sm"
                          placeholder="color"
                          value={test.property}
                          onChange={(e) => update(test.id, { property: e.target.value } as Partial<AutoTest>)}
                        />
                      </label>
                      <label className="text-xs text-muted">
                        Oczekiwana wartość
                        <input
                          className="input mt-1 py-1.5 font-mono text-sm"
                          placeholder="np. red albo #ff0000"
                          value={test.expected}
                          onChange={(e) => update(test.id, { expected: e.target.value } as Partial<AutoTest>)}
                        />
                      </label>
                    </>
                  )}
                  {test.type === "html_lang_doctype" && (
                    <label className="text-xs text-muted">
                      Oczekiwany lang (puste = dowolny)
                      <input
                        className="input mt-1 py-1.5 font-mono text-sm"
                        placeholder="pl"
                        value={test.lang ?? ""}
                        onChange={(e) => update(test.id, { lang: e.target.value } as Partial<AutoTest>)}
                      />
                    </label>
                  )}
                </div>

                {test.type === "interaction" && (
                  <InteractionEditor
                    test={test}
                    onChange={(patch) => update(test.id, patch as Partial<AutoTest>)}
                  />
                )}

                <input
                  className="input mt-2 py-1.5 text-sm"
                  placeholder="Opis (notatka dla nauczyciela, opcjonalnie)"
                  value={test.description ?? ""}
                  maxLength={500}
                  onChange={(e) => update(test.id, { description: e.target.value })}
                />

                {errors.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {errors.map((e) => (
                      <li key={e} className="text-xs text-danger">
                        • {e}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function InteractionEditor({
  test,
  onChange,
}: {
  test: Extract<AutoTest, { type: "interaction" }>;
  onChange: (patch: Partial<Extract<AutoTest, { type: "interaction" }>>) => void;
}) {
  const setStep = (i: number, step: InteractionStep) =>
    onChange({ steps: test.steps.map((s, k) => (k === i ? step : s)) });

  return (
    <div className="mt-3 rounded-lg border border-line bg-bg/40 p-3">
      <p className="label mb-2">Kroki scenariusza</p>
      <ul className="space-y-2">
        {test.steps.map((step, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">{i + 1}.</span>
            <select
              className="input w-auto py-1 text-xs"
              value={step.action}
              onChange={(e) => {
                const action = e.target.value as InteractionStep["action"];
                setStep(
                  i,
                  action === "wait"
                    ? { action: "wait", ms: 300 }
                    : action === "click"
                      ? { action: "click", selector: "" }
                      : { action, selector: "", value: "" },
                );
              }}
            >
              <option value="fill">wpisz</option>
              <option value="select">wybierz z listy</option>
              <option value="click">kliknij</option>
              <option value="wait">czekaj (ms)</option>
            </select>
            {step.action === "wait" ? (
              <input
                className="input w-28 py-1 font-mono text-xs"
                type="number"
                min={0}
                max={2000}
                value={step.ms}
                onChange={(e) => setStep(i, { action: "wait", ms: Number(e.target.value) })}
              />
            ) : (
              <>
                <input
                  className="input min-w-[10rem] flex-1 py-1 font-mono text-xs"
                  placeholder="selektor"
                  value={step.selector}
                  onChange={(e) => setStep(i, { ...step, selector: e.target.value })}
                />
                {step.action !== "click" && (
                  <input
                    className="input min-w-[8rem] flex-1 py-1 text-xs"
                    placeholder="wartość"
                    value={step.value}
                    onChange={(e) => setStep(i, { ...step, value: e.target.value })}
                  />
                )}
              </>
            )}
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => onChange({ steps: test.steps.filter((_, k) => k !== i) })}
              aria-label={`Usuń krok ${i + 1}`}
            >
              −
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn-ghost btn-sm mt-2"
        onClick={() => onChange({ steps: [...test.steps, { action: "click", selector: "" }] })}
      >
        + krok
      </button>

      <p className="label mb-2 mt-4">Oczekiwany wynik</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          className="input py-1.5 font-mono text-xs"
          placeholder="selektor"
          value={test.expect.selector}
          onChange={(e) => onChange({ expect: { ...test.expect, selector: e.target.value } })}
        />
        <select
          className="input py-1.5 text-xs"
          value={test.expect.mode}
          onChange={(e) =>
            onChange({ expect: { ...test.expect, mode: e.target.value as typeof test.expect.mode } })
          }
        >
          <option value="exists">istnieje</option>
          <option value="contains">zawiera tekst</option>
          <option value="equals">ma tekst równy</option>
          <option value="regex">tekst pasuje do wyrażenia</option>
          <option value="attribute">ma atrybut równy</option>
        </select>
        {test.expect.mode !== "exists" && (
          <input
            className="input py-1.5 text-xs"
            placeholder={test.expect.mode === "attribute" ? "atrybut=wartość" : "wartość"}
            value={test.expect.mode === "attribute" ? `${test.expect.attribute ?? ""}=${test.expect.value ?? ""}` : (test.expect.value ?? "")}
            onChange={(e) => {
              if (test.expect.mode === "attribute") {
                const [attribute = "", ...rest] = e.target.value.split("=");
                onChange({ expect: { ...test.expect, attribute, value: rest.join("=") } });
              } else {
                onChange({ expect: { ...test.expect, value: e.target.value } });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
