import type { Metadata, Viewport } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./redesign.css";
import "./liquid.css";

const poppins = Poppins({ variable: "--font-geist-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "azentio.ai | Build intelligence. Create shared value.", template: "%s | azentio.ai" },
  description:
    "Enterprise AI for financial services: explainable decisioning, document and financial analysis, portfolio insight and reporting, with governed collective learning.",
  openGraph: { siteName: "azentio.ai", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f1f7f4", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Entrance animations start hidden; without JavaScript, show everything at rest. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
