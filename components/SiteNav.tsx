"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/roadmap", label: "Mapa" },
  { href: "/testy", label: "Testy" },
  { href: "/admin", label: "Admin" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/roadmap" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2 font-mono text-sm font-bold text-bg shadow-glow">
            {">_"}
          </span>
          <span className="font-mono text-sm font-bold tracking-tight">
            INF<span className="text-accent">.03</span>
          </span>
        </Link>
        <ul className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 text-sm">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-1.5 font-medium transition sm:px-4 ${
                    active ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/[0.04] hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
