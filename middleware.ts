import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/db";
import { getSupabaseEnv } from "@/lib/supabase/env";

const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP z jednorazowym nonce zamiast 'unsafe-inline'.
 *
 * Nonce losujemy na każde żądanie i podajemy Next.js przez nagłówek żądania —
 * framework doklei go do swoich skryptów startowych. 'strict-dynamic' sprawia,
 * że skrypty doładowane przez zaufany kod (np. loader Monaco) też działają,
 * a wstrzyknięty przez atakującego `<script>` bez nonce — już nie.
 *
 * Uwaga: kod ucznia NIE działa pod tą polityką. Podgląd pracy ładuje się z
 * /sandbox.html, który ma własną, celowo luźną CSP (patrz next.config.ts).
 */
function buildCsp(nonce: string, supabaseOrigins: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "worker-src 'self' blob:",
    // style wstrzykiwane w czasie działania (m.in. Monaco) nie mają nonce
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigins}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function supabaseOriginsFor(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return `${u.origin} wss://${u.host}`;
  } catch {
    /* brak/niepoprawny URL — zostaje wildcard */
  }
  return "https://*.supabase.co wss://*.supabase.co";
}

export async function middleware(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce, supabaseOriginsFor(url));

  // Next.js czyta nonce z nagłówka żądania i dokleja go do własnych skryptów.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const withCsp = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  const path = request.nextUrl.pathname;
  const isAdmin = path === "/admin" || path.startsWith("/admin/");

  // Poza /admin nie ruszamy Supabase — CSP to jedyne zadanie middleware.
  if (!isAdmin) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // --- /admin: dodatkowo sprawdzenie sesji ----------------------------------
  // To warstwa UX. Właściwą ochroną danych są reguły RLS i lista adminów w bazie —
  // nawet gdyby ktoś ominął middleware, bez uprawnień nic nie odczyta ani nie zmieni.
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() weryfikuje token na serwerze Auth (w przeciwieństwie do getSession()).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = path === "/admin/login";

  if (!user && !isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return withCsp(NextResponse.redirect(to));
  }
  if (user && isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin";
    to.search = "";
    return withCsp(NextResponse.redirect(to));
  }

  response.headers.set("Cache-Control", "private, no-store");
  return withCsp(response);
}

export const config = {
  matcher: [
    /*
     * Wszystkie ścieżki poza zasobami statycznymi. Pliki z /public (w tym
     * /sandbox.html i Monaco) obsługuje next.config.ts — sandbox musi mieć
     * własną politykę, bo uruchamia kod ucznia.
     */
    {
      source: "/((?!_next/static|_next/image|monaco|sandbox.html|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
