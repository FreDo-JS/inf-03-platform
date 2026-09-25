import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Tebby", template: "%s · Tebby" },
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
