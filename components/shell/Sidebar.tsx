"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Code2,
  FileCode2,
  FilePlus2,
  FolderOpen,
  Link2,
  ListChecks,
  Map,
  MonitorPlay,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "@/components/shell/Brand";
import { useSelectedClass } from "@/lib/hooks/useSelectedClass";
import { CLASS_NAMES, CLASS_QUALIFICATION, QUALIFICATIONS, QUALIFICATION_LABEL } from "@/types/db";

type NavItem = { href: string; label: string; icon: LucideIcon };

const MAIN: NavItem[] = [
  { href: "/roadmap", label: "Mapa nauki", icon: Map },
  { href: "/testy", label: "Testy", icon: ClipboardList },
  { href: "/praktyka", label: "Praktyka", icon: Code2 },
  { href: "/admin", label: "Panel", icon: Settings },
];

/** Sekcje panelu nauczyciela — w adresie, więc da się je linkować i cofać. */
export const ADMIN_SECTIONS = [
  { id: "progress", label: "Postęp klas", icon: BarChart3 },
  { id: "links", label: "Materiały", icon: Link2 },
  { id: "tests", label: "Testy i PIN-y", icon: ListChecks },
  { id: "new", label: "Nowy test", icon: FilePlus2 },
  { id: "results", label: "Wyniki", icon: Trophy },
  { id: "ptasks", label: "Zadania praktyczne", icon: FileCode2 },
  { id: "psessions", label: "Sesje", icon: MonitorPlay },
  { id: "pworks", label: "Prace", icon: FolderOpen },
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number]["id"];

export function isAdminSection(v: string | null): v is AdminSection {
  return v !== null && ADMIN_SECTIONS.some((s) => s.id === v);
}

/**
 * Lewa kolumna aplikacji: nawigacja, sekcje panelu i wybór klasy.
 *
 * Wybór klasy siedzi tutaj, a nie nad treścią, bo dotyczy wszystkiego, co widać
 * po prawej — mapy, postępu i listy tematów.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [cls, setCls] = useSelectedClass();

  const onAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const section = params.get("sekcja");
  const activeSection: AdminSection = isAdminSection(section) ? section : "progress";
  // Klasa steruje mapą nauki i postępem w panelu — gdzie indziej nie ma po niej śladu.
  const showClasses = pathname.startsWith("/roadmap") || (onAdmin && activeSection === "progress");

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-4">
      <Link
        href="/roadmap"
        onClick={onNavigate}
        className="mb-3 flex items-center gap-2.5 px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <Brand size={30} />
      </Link>

      <nav aria-label="Główna nawigacja" className="flex flex-col gap-0.5">
        {MAIN.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`nav-link ${active ? "nav-link-active" : ""}`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      {onAdmin && (
        <nav aria-label="Sekcje panelu" className="flex flex-col gap-0.5">
          <p className="nav-heading">Panel</p>
          {ADMIN_SECTIONS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/admin?sekcja=${id}`}
              onClick={onNavigate}
              scroll={false}
              aria-current={activeSection === id ? "page" : undefined}
              className={`nav-link ${activeSection === id ? "nav-link-active" : ""}`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      )}

      {showClasses && (
        <div role="group" aria-label="Wybór klasy" className="flex flex-col gap-0.5">
          <p className="nav-heading">Klasa</p>
          {QUALIFICATIONS.map((q) => {
            const classes = CLASS_NAMES.filter((c) => CLASS_QUALIFICATION[c] === q);
            if (classes.length === 0) return null;
            return (
              <div key={q} className="mb-1">
                <p className="px-3 py-1 text-[11px] text-muted/60">{QUALIFICATION_LABEL[q]}</p>
                <div className="flex flex-wrap gap-1 px-2">
                  {classes.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCls(c)}
                      aria-pressed={cls === c}
                      className={`rounded-md border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                        cls === c
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-line text-muted hover:border-white/20 hover:text-fg"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
