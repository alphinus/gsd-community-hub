"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";

export function Header() {
  const { data: session } = useSession();

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
          {session?.publicKey && (
            <Link
              href="/profile/edit"
              className="text-sm font-medium text-[var(--color-gsd-text-secondary)] transition-colors hover:text-[var(--color-gsd-text)]"
            >
              My Profile
            </Link>
          )}
        </nav>

        {/* Wallet + Auth */}
        <div className="flex items-center gap-3">
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
