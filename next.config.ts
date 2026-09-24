import type { NextConfig } from "next";

// CSP aplikacji generuje middleware.ts (nonce zmienia się co żądanie).
// Tutaj zostają nagłówki stałe oraz osobna, celowo luźna polityka dla
// /sandbox.html — dokumentu, w którym uruchamia się kod ucznia.

const STATIC_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * Piaskownica dla kodu ucznia.
 *
 * Dokument ładowany jest do <iframe sandbox="allow-scripts allow-forms"> bez
 * allow-same-origin, więc ma origin `null` i nie sięgnie naszych danych.
 * Skrypty ucznia muszą tu działać (to sens podglądu), dlatego 'unsafe-inline'
 * — ale wyłącznie w tym jednym dokumencie, nie w całej aplikacji.
 *
 * connect-src 'none' odcina wysyłanie czegokolwiek w świat z kodu ucznia,
 * frame-ancestors 'self' pozwala osadzić sandbox tylko naszej aplikacji.
 */
const SANDBOX_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' blob: data:",
  "style-src 'unsafe-inline' data:",
  "img-src data: blob: https:",
  "font-src data: https:",
  "media-src data: blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  // Ramka zewnętrzna nie ma atrybutu sandbox (ma go dopiero ramka z kodem
  // ucznia w środku), więc origin jest nasz i reguła działa normalnie.
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Wszystko poza piaskownicą. X-Frame-Options blokuje ramkę z sandbox
        // bez allow-same-origin (origin null), więc /sandbox.html tego nagłówka
        // dostać nie może — o osadzaniu decyduje tam frame-ancestors w CSP.
        source: "/((?!sandbox\\.html$).*)",
        headers: STATIC_HEADERS,
      },
      {
        source: "/sandbox.html",
        headers: [
          { key: "Content-Security-Policy", value: SANDBOX_CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
