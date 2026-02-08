import type { Metadata } from "next";
import { AppProviders } from "./providers";
import { Header } from "@/components/layout/header";
import "./globals.css";

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
    <html lang="en">
      <body>
        <AppProviders>
          <Header />
          <main className="min-h-screen">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
