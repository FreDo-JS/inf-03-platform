"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import type { CategoryRow, ProgressRow, SubtopicRow, TeacherRow } from "@/types/db";
import { PracticalSessionsTab } from "./practical/PracticalSessionsTab";
import { PracticalTasksTab } from "./practical/PracticalTasksTab";
import { PracticalWorksTab } from "./practical/PracticalWorksTab";
import { LinksTab } from "./LinksTab";
import { NewTestTab } from "./NewTestTab";
import { ProgressTab } from "./ProgressTab";
import { ResultsTab } from "./ResultsTab";
import { TestsTab } from "./TestsTab";

const TABS = [
  { id: "progress", label: "📊 Postępy klas" },
  { id: "links", label: "🔗 Materiały" },
  { id: "tests", label: "📝 Testy i PIN-y" },
  { id: "new", label: "➕ Nowy test" },
  { id: "results", label: "🏆 Wyniki" },
  { id: "ptasks", label: "🧩 Zadania praktyczne" },
  { id: "psessions", label: "🎬 Sesje" },
  { id: "pworks", label: "📂 Prace" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Props = {
  email: string;
  categories: CategoryRow[];
  subtopics: SubtopicRow[];
  initialProgress: (Pick<ProgressRow, "class_name" | "subtopic_id"> & { marked_by: string | null })[];
  teachers: TeacherRow[];
  /** identyfikator zalogowanego nauczyciela — do podpowiedzi „to Ty” */
  myId: string;
};


/**
 * Nazwa podpisywana przy podtematach, które oznaczysz. Zapisuje ją funkcja
 * set_my_display_name — 008 celowo odebrało kontom prawo zapisu do tabeli
 * admins, żeby nikt nie nadał sobie uprawnień przez API.
 */
function DisplayNameField({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setState("idle");
    const { data, error } = await getBrowserSupabase().rpc("set_my_display_name", { p_name: name });
    setSaving(false);
    if (error) {
      setState("error");
      setMessage(friendlyError(error, "Nie udało się zapisać nazwy."));
      return;
    }
    if (typeof data === "string") setName(data);
    setState("saved");
    setMessage(null);
  };

  return (
    <div className="min-w-0">
      <label htmlFor="display-name" className="label">
        Twój podpis przy tematach
      </label>
      <div className="flex gap-2">
        <input
          id="display-name"
          className="input py-2 text-sm"
          value={name}
          maxLength={40}
          placeholder="np. p. Kowalska"
          onChange={(e) => {
            setName(e.target.value);
            setState("idle");
          }}
        />
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => void save()} disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz"}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        {state === "error" ? (
          <span className="text-danger">{message}</span>
        ) : state === "saved" ? (
          <span className="text-accent">Zapisano — podpis widać przy oznaczonych tematach.</span>
        ) : (
          "Widoczny także dla uczniów. Puste pole = bez podpisu."
        )}
      </p>
    </div>
  );
}
export function AdminPanel({ email, categories, subtopics, initialProgress, teachers, myId }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("progress");
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await getBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{"// panel administratora"}</p>
          <h1 className="page-title mt-2">
            Panel <span className="text-gradient">nauczyciela</span>
          </h1>
          <p className="mt-2 truncate text-sm text-muted">Zalogowano jako {email}</p>
        </div>
        <DisplayNameField initial={teachers.find((t) => t.id === myId)?.display_name ?? ""} />
        <button type="button" className="btn-ghost" onClick={() => void logout()} disabled={loggingOut}>
          {loggingOut ? "Wylogowywanie…" : "⏻ Wyloguj"}
        </button>
      </div>

      <div role="tablist" aria-label="Sekcje panelu" className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-panel/70 p-1.5 text-sm backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 font-medium transition ${
              tab === t.id ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/[0.04] hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" key={tab} className="animate-fade-up">
        {tab === "progress" && (
          <ProgressTab
            categories={categories}
            subtopics={subtopics}
            initialProgress={initialProgress}
            teachers={teachers}
          />
        )}
        {tab === "links" && <LinksTab categories={categories} subtopics={subtopics} />}
        {tab === "tests" && <TestsTab />}
        {tab === "new" && <NewTestTab />}
        {tab === "results" && <ResultsTab />}
        {tab === "ptasks" && <PracticalTasksTab />}
        {tab === "psessions" && <PracticalSessionsTab />}
        {tab === "pworks" && <PracticalWorksTab />}
      </div>
    </div>
  );
}
