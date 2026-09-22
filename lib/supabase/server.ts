import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/db";
import { getSupabaseEnv } from "./env";

/** Klient Supabase dla Server Components — czyta sesję z cookies (tylko odczyt). */
export async function getServerSupabase(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        // W Server Components nie można ustawiać cookies — odświeżanie sesji
        // robi middleware.ts, więc tutaj błąd ignorujemy.
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          /* no-op */
        }
      },
    },
  });
}
