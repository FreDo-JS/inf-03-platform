// Konfiguracja Supabase z zmiennych środowiskowych.
// Wyłącznie anon key — dostęp chroniony przez RLS. Service role key nie może
// się tu nigdy pojawić (trafiłby do przeglądarki).

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY (zob. .env.example).");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL nie jest poprawnym adresem URL.");
  }

  // Wymuszamy HTTPS. Wyjątek: lokalny Supabase CLI (localhost) w trybie dev.
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(isLocal && process.env.NODE_ENV !== "production")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL musi używać https://");
  }

  return { url: parsed.origin, anonKey };
}
