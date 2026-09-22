"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient<Database> | undefined;

/** Klient Supabase w przeglądarce (singleton). Sesja admina trzymana w cookies. */
export function getBrowserSupabase(): SupabaseClient<Database> {
  if (!client) {
    const { url, anonKey } = getSupabaseEnv();
    client = createBrowserClient<Database>(url, anonKey);
  }
  return client;
}
