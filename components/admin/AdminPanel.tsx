"use client";

import { LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ADMIN_SECTIONS, isAdminSection, type AdminSection } from "@/components/shell/Sidebar";
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

type Props = {
  email: string;
  categories: CategoryRow[];
  subtopics: SubtopicRow[];
  initialProgress: (Pick<ProgressRow, "class_name" | "subtopic_id"> & { marked_by: string | null })[];
  teachers: TeacherRow[];
  /** false, gdy baza nie zna jeszcze kolumny progress.marked_by */
  authorColumn: boolean;
  /** identyfikator zalogowanego nauczyciela — do podpowiedzi „to Ty” */
  myId: string;
};


/**
 * Nazwa podpisywana przy podtematach, które oznaczysz. Zapisuje ją funkcja
 * set_my_display_name — 008 celowo odebrało kontom prawo zapisu do tabeli
 * admins, żeby nikt nie nadał sobie uprawnień przez API.
 */
function DisplayNameField({ initial, onSaved }: { initial: string; onSaved: () => void }) {
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
    // Podpisy przy tematach przychodzą z serwera (widok teachers) — bez tego
    // zmiana nazwy byłaby widoczna dopiero po odświeżeniu strony.
    onSaved();
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
export function AdminPanel({ email, categories, subtopics, initialProgress, teachers, myId, authorColumn }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [loggingOut, setLoggingOut] = useState(false);

  // Sekcję wybiera pasek boczny przez adres — dzięki temu działa cofanie
  // i da się podesłać komuś link prosto do wyników czy prac.
  const sekcja = params.get("sekcja");
  const tab: AdminSection = isAdminSection(sekcja) ? sekcja : "progress";
  const current = ADMIN_SECTIONS.find((sct) => sct.id === tab) ?? ADMIN_SECTIONS[0];

  const logout = async () => {
    setLoggingOut(true);
    await getBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Panel nauczyciela</p>
          <h1 className="page-title mt-1">{current.label}</h1>
          <p className="mt-1 truncate text-sm text-muted">{email}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <DisplayNameField
            initial={teachers.find((t) => t.id === myId)?.display_name ?? ""}
            onSaved={() => router.refresh()}
          />
          <button type="button" className="btn-ghost btn-sm" onClick={() => void logout()} disabled={loggingOut}>
            <LogOut size={14} aria-hidden />
            {loggingOut ? "Wylogowywanie…" : "Wyloguj"}
          </button>
        </div>
      </div>

      <div key={tab}>
        {tab === "progress" && (
          <ProgressTab
            categories={categories}
            subtopics={subtopics}
            initialProgress={initialProgress}
            teachers={teachers}
            myId={myId}
            authorColumn={authorColumn}
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
