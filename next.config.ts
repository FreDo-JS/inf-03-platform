import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Połączenia wychodzące tylko po HTTPS/WSS do własnego projektu Supabase.
let supabaseOrigins = "https://*.supabase.co wss://*.supabase.co";
try {
  const u = new URL(supabaseUrl);
  if (u.protocol === "https:") {
    supabaseOrigins = `${u.origin} wss://${u.host}`;
  }
} catch {
  // brak/niepoprawny URL — zostaje domyślny wildcard *.supabase.co
}

const csp = [
  "default-src 'self'",
  // Next.js wstrzykuje skrypty inline przy hydratacji; 'unsafe-eval' tylko w dev (HMR).
  // blob: — workery Monaco. Podgląd pracy ucznia to iframe ze srcdoc, który
  // dziedziczy tę politykę: kod ucznia działa inline, ale nie pobierze niczego z sieci.
  `script-src 'self' 'unsafe-inline' blob:${isDev ? " 'unsafe-eval'" : ""}`,
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigins}${isDev ? " ws://localhost:*" : ""}`,
  "frame-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
