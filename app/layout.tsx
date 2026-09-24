import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "INF.03 i INF.04 — mapa nauki", template: "%s · INF.03 / INF.04" },
  description: "Mapa nauki i testy: INF.03 dla klas 2a, 4e, 4d oraz INF.04 dla klas 4a, 4g.",
  robots: { index: false, follow: false },
};

// CSP z nonce wymaga renderowania na żądanie: nonce powstaje w middleware dla
// każdego żądania, więc strona zapisana na etapie budowania nie mogłaby go mieć,
// a jej skrypty zostałyby zablokowane.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#0b1116",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
