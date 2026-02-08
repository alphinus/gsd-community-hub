"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

// Dynamic import to avoid SSR issues with wallet adapter
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export function Header() {
  const { data: session } = useSession();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[var(--color-gsd-accent)]">
            GSD
          </span>
          <span className="text-sm font-medium text-[var(--color-gsd-text-muted)]">
            Community Hub
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/explore"
            className="text-sm font-medium text-[var(--color-gsd-text-secondary)] transition-colors hover:text-[var(--color-gsd-text)]"
          >
            Explore
          </Link>
          <Link
            href="/transparency"
            className="text-sm font-medium text-[var(--color-gsd-text-secondary)] transition-colors hover:text-[var(--color-gsd-text)]"
          >
            Transparency
          </Link>
        </nav>

        {/* Wallet + Session */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className="hidden text-sm text-[var(--color-gsd-text-secondary)] sm:inline-block">
              {truncateAddress((session as any).publicKey || "")}
            </span>
          )}
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
