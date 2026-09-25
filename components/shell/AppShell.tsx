"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Brand } from "@/components/shell/Brand";
import { Sidebar } from "@/components/shell/Sidebar";

/**
 * Układ aplikacji: stała kolumna nawigacji po lewej, treść po prawej.
 *
 * Na wąskich ekranach kolumna chowa się za przyciskiem i wysuwa jako panel —
 * ta sama zawartość, tylko inaczej podana. Ekran pracy w IDE (body.ide-open)
 * zasłania wszystko sobą, więc nawigacja nie przeszkadza na egzaminie.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Po przejściu na inną stronę panel boczny na telefonie ma się zamknąć.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:flex">
      {/* pasek boczny — stały na dużych ekranach */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-panel lg:block">
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </aside>

      {/* pasek górny — tylko na wąskich ekranach */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel px-4 py-2.5 lg:hidden">
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setOpen(true)}
          aria-label="Otwórz nawigację"
          aria-expanded={open}
        >
          <Menu size={16} aria-hidden />
        </button>
        <Brand size={24} />
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Zamknij nawigację"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-line bg-panel shadow-card">
            <button
              type="button"
              className="btn-ghost btn-sm absolute right-2 top-3"
              onClick={() => setOpen(false)}
              aria-label="Zamknij nawigację"
            >
              <X size={16} aria-hidden />
            </button>
            <Suspense fallback={null}>
              <Sidebar onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 lg:pl-60">
        <main className="mx-auto w-full max-w-[84rem] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
