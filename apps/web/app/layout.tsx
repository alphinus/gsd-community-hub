import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppProviders } from "./providers";
import { Header } from "@/components/layout/header";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GSD Community Hub",
  description:
    "Open source developer community on Solana. Collaborate, build, earn. Every contribution tracked on-chain, every reward verifiable.",
  keywords: [
    "Solana",
    "developer",
    "community",
    "open source",
    "GSD",
    "blockchain",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AppProviders>
          <Header />
          <main className="min-h-screen pt-24">{children}</main>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(11, 17, 32, 0.9)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(79, 209, 197, 0.15)",
                color: "var(--color-gsd-text)",
              },
            }}
          />
        </AppProviders>
      </body>
    </html>
  );
}
