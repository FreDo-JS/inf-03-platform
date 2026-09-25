"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Code2,
  FileCode2,
  FilePlus2,
  FolderOpen,
  Link2,
  ListChecks,
  LogOut,
  Map,
  MonitorPlay,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "@/components/shell/Brand";
import { ClassPicker } from "@/components/ClassPicker";
import { getBrowserSupabase } from "@/lib/supabase/client";

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
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await getBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const onAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const section = params.get("sekcja");
  const activeSection: AdminSection = isAdminSection(section) ? section : "progress";
  // Uczeń wybiera klasę tutaj; w panelu nauczyciela wybór stoi nad paskiem postępu,
  // czyli przy danych, których dotyczy.
  const showClasses = pathname.startsWith("/roadmap");

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
        <div>
          <p className="nav-heading">Klasa</p>
          <ClassPicker />
        </div>
      )}

      {onAdmin && (
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="nav-link mt-auto disabled:opacity-50"
        >
          <LogOut size={16} strokeWidth={2} aria-hidden />
          {loggingOut ? "Wylogowywanie…" : "Wyloguj"}
        </button>
      )}
    </div>
  );
}
