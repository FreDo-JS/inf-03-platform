"use client";

import { useEffect, useMemo, useState } from "react";
import { friendlyError } from "@/lib/errors";
import { useRealtimeLinks } from "@/lib/hooks/useRealtimeLinks";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { LIMITS, isSubtopicId, safeLinkUrl, validateLinkLabel, validateLinkUrl, validateSortOrder } from "@/lib/validation";
import { QUALIFICATIONS, QUALIFICATION_LABEL, type CategoryRow, type Qualification, type SubtopicLinkRow, type SubtopicRow } from "@/types/db";
import { ArrowDown, ArrowUp } from "lucide-react";

type Props = {
  categories: CategoryRow[];
  subtopics: SubtopicRow[];
};

type Draft = { label: string; url: string; sortOrder: string };

const emptyDraft = (): Draft => ({ label: "", url: "", sortOrder: "" });

export function LinksTab({ categories, subtopics }: Props) {
  const { bySubtopic, refetch } = useRealtimeLinks([]);
  const [qualification, setQualification] = useState<Qualification>("inf03");
  const [subtopicId, setSubtopicId] = useState<string>(subtopics[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // formularz dodawania
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftErrors, setDraftErrors] = useState<{ label?: string; url?: string; sortOrder?: string }>({});

  // edycja istniejącego
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [editErrors, setEditErrors] = useState<{ label?: string; url?: string; sortOrder?: string }>({});

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const grouped = useMemo(
    () =>
      categories
        .filter((c) => c.qualification === qualification)
        .map((c) => ({
          category: c,
          items: subtopics.filter((s) => s.category_id === c.id).sort((a, b) => a.position - b.position),
        })),
    [categories, subtopics, qualification],
  );

  // Po zmianie kwalifikacji wybrany podtemat może już nie być na liście.
  useEffect(() => {
    const first = grouped.flatMap((g) => g.items)[0]?.id;
    if (!grouped.some((g) => g.items.some((s) => s.id === subtopicId))) {
      setSubtopicId(first ?? "");
      setEditingId(null);
    }
  }, [grouped, subtopicId]);

  const links = bySubtopic.get(subtopicId) ?? [];
  const subtopic = subtopics.find((s) => s.id === subtopicId);

  const validateDraft = (d: Draft) => {
    const label = validateLinkLabel(d.label);
    const url = validateLinkUrl(d.url);
    const order = validateSortOrder(d.sortOrder);
    const errs = {
      label: label.ok ? undefined : label.error,
      url: url.ok ? undefined : url.error,
      sortOrder: order.ok ? undefined : order.error,
    };
    const ok = label.ok && url.ok && order.ok;
    return ok
      ? { ok: true as const, value: { label: label.value, url: url.value, sortOrder: order.value }, errs }
      : { ok: false as const, errs };
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !isSubtopicId(subtopicId)) return;
    // walidacja tuż przed zapytaniem (nie ufamy samemu formularzowi)
    const v = validateDraft(draft);
    setDraftErrors(v.errs);
    if (!v.ok) return;

    setBusy(true);
    setError(null);
    const sortOrder = draft.sortOrder.trim() === "" ? nextOrder(links) : v.value.sortOrder;
    const { error: dbError } = await getBrowserSupabase().from("subtopic_links").insert({
      subtopic_id: subtopicId,
      label: v.value.label,
      url: v.value.url,
      sort_order: sortOrder,
    });
    setBusy(false);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się dodać materiału."));
      return;
    }
    setDraft(emptyDraft());
    setDraftErrors({});
    void refetch();
  };

  const startEdit = (l: SubtopicLinkRow) => {
    setEditingId(l.id);
    setEditDraft({ label: l.label, url: l.url, sortOrder: String(l.sort_order) });
    setEditErrors({});
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || editingId === null) return;
    const v = validateDraft(editDraft);
    setEditErrors(v.errs);
    if (!v.ok) return;

    setBusy(true);
    setError(null);
    const { error: dbError } = await getBrowserSupabase()
      .from("subtopic_links")
      .update({ label: v.value.label, url: v.value.url, sort_order: v.value.sortOrder })
      .eq("id", editingId);
    setBusy(false);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się zapisać zmian."));
      return;
    }
    setEditingId(null);
    void refetch();
  };

  const remove = async (l: SubtopicLinkRow) => {
    if (busy) return;
    if (!window.confirm(`Usunąć materiał „${l.label}”?`)) return;
    setBusy(true);
    setError(null);
    const { error: dbError } = await getBrowserSupabase().from("subtopic_links").delete().eq("id", l.id);
    setBusy(false);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się usunąć materiału."));
      return;
    }
    void refetch();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = links[index];
    const b = links[index + dir];
    if (busy || !a || !b) return;

    setBusy(true);
    setError(null);
    const supabase = getBrowserSupabase();
    // zapisujemy pozycje całej listy — porządkuje też ewentualne duplikaty sort_order
    const reordered = [...links];
    reordered[index] = b;
    reordered[index + dir] = a;
    const results = await Promise.all(
      reordered.map((l, i) => supabase.from("subtopic_links").update({ sort_order: i }).eq("id", l.id)),
    );
    setBusy(false);
    const failed = results.find((r) => r.error);
    if (failed?.error) setError(friendlyError(failed.error, "Nie udało się zmienić kolejności."));
    void refetch();
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <label htmlFor="subtopic-pick" className="label">
          Podtemat
        </label>
        <div className="mb-3 flex gap-2">
          {QUALIFICATIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQualification(q)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                qualification === q
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line text-muted hover:bg-white/[0.04] hover:text-fg"
              }`}
            >
              {QUALIFICATION_LABEL[q]}
            </button>
          ))}
        </div>
        <select
          id="subtopic-pick"
          className="input"
          value={subtopicId}
          onChange={(e) => {
            setSubtopicId(e.target.value);
            setEditingId(null);
            setDraftErrors({});
          }}
        >
          {grouped.map(({ category, items }) => (
            <optgroup key={category.id} label={category.title}>
              {items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {subtopic && (
          <p className="mt-2 text-sm text-muted">
            {links.length === 0
              ? "Ten podtemat nie ma jeszcze materiałów."
              : `Materiałów: ${links.length} — kolejność jak poniżej.`}
          </p>
        )}
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((l, i) => {
            const href = safeLinkUrl(l.url);
            return (
              <li key={l.id} className="card p-4">
                {editingId === l.id ? (
                  <form onSubmit={saveEdit} className="space-y-3" noValidate>
                    <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_6rem]">
                      <div>
                        <label className="label">Etykieta</label>
                        <input
                          className="input"
                          value={editDraft.label}
                          maxLength={LIMITS.linkLabel.max}
                          onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))}
                          aria-invalid={Boolean(editErrors.label)}
                          autoFocus
                        />
                        {editErrors.label && <p className="field-error">{editErrors.label}</p>}
                      </div>
                      <div>
                        <label className="label">Adres URL</label>
                        <input
                          className="input font-mono text-sm"
                          value={editDraft.url}
                          maxLength={LIMITS.linkUrl.max}
                          inputMode="url"
                          onChange={(e) => setEditDraft((d) => ({ ...d, url: e.target.value }))}
                          aria-invalid={Boolean(editErrors.url)}
                        />
                        {editErrors.url && <p className="field-error">{editErrors.url}</p>}
                      </div>
                      <div>
                        <label className="label">Kolejność</label>
                        <input
                          className="input font-mono"
                          type="number"
                          min={0}
                          max={LIMITS.sortOrder.max}
                          value={editDraft.sortOrder}
                          onChange={(e) => setEditDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                          aria-invalid={Boolean(editErrors.sortOrder)}
                        />
                        {editErrors.sortOrder && <p className="field-error">{editErrors.sortOrder}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary btn-sm" disabled={busy}>
                        Zapisz
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                        Anuluj
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium">
                        <span className="font-mono text-xs text-muted">{i + 1}.</span>
                        <span className="break-words">{l.label}</span>
                      </p>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-1 block truncate font-mono text-xs text-accent hover:underline"
                        >
                          {l.url}
                        </a>
                      ) : (
                        <p className="mt-1 truncate font-mono text-xs text-danger">
                          Niepoprawny adres — popraw go: {l.url}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => void move(i, -1)}
                        disabled={busy || i === 0}
                        aria-label="Przesuń w górę"
                      >
                        <ArrowUp size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => void move(i, 1)}
                        disabled={busy || i === links.length - 1}
                        aria-label="Przesuń w dół"
                      >
                        <ArrowDown size={14} aria-hidden />
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => startEdit(l)} disabled={busy}>
                        Edytuj
                      </button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => void remove(l)} disabled={busy}>
                        Usuń
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={add} className="card space-y-3 p-5" noValidate>
        <h3 className="font-semibold">Dodaj materiał</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_6rem]">
          <div>
            <label htmlFor="new-label" className="label">
              Etykieta
            </label>
            <input
              id="new-label"
              className="input"
              placeholder="np. Teoria, Zadania, Film"
              value={draft.label}
              maxLength={LIMITS.linkLabel.max}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              aria-invalid={Boolean(draftErrors.label)}
            />
            {draftErrors.label && <p className="field-error">{draftErrors.label}</p>}
          </div>
          <div>
            <label htmlFor="new-url" className="label">
              Adres URL
            </label>
            <input
              id="new-url"
              className="input font-mono text-sm"
              placeholder="https://…"
              value={draft.url}
              maxLength={LIMITS.linkUrl.max}
              inputMode="url"
              onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              aria-invalid={Boolean(draftErrors.url)}
            />
            {draftErrors.url && <p className="field-error">{draftErrors.url}</p>}
          </div>
          <div>
            <label htmlFor="new-order" className="label">
              Kolejność
            </label>
            <input
              id="new-order"
              className="input font-mono"
              type="number"
              min={0}
              max={LIMITS.sortOrder.max}
              placeholder="auto"
              value={draft.sortOrder}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
              aria-invalid={Boolean(draftErrors.sortOrder)}
            />
            {draftErrors.sortOrder && <p className="field-error">{draftErrors.sortOrder}</p>}
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={busy || subtopicId === ""}>
          {busy ? "Zapisywanie…" : "+ Dodaj materiał"}
        </button>
      </form>
    </div>
  );
}

function nextOrder(links: readonly SubtopicLinkRow[]): number {
  const max = links.reduce((m, l) => Math.max(m, l.sort_order), -1);
  return Math.min(max + 1, LIMITS.sortOrder.max);
}
