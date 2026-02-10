"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function NavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative px-3 py-1.5 text-sm font-medium transition-theme duration-200 rounded-lg",
        active
          ? "text-[var(--color-gsd-text)] bg-[var(--color-gsd-accent)]/10"
          : "text-[var(--color-gsd-text-secondary)] hover:text-[var(--color-gsd-text)] hover:bg-white/5"
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full gradient-cyan" />
      )}
    </Link>
  );
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { href: "/explore", label: "Explore", active: pathname === "/explore" },
    { href: "/governance", label: "Governance", active: pathname.startsWith("/governance") },
    { href: "/treasury", label: "Treasury", active: pathname === "/treasury" },
    { href: "/transparency", label: "Transparency", active: pathname === "/transparency" },
  ];

  return (
    <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
      <div className="glass-strong rounded-2xl shadow-[0_0_40px_rgba(79,209,197,0.06)]">
        <div className="flex h-14 items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <span className="text-xl font-bold gradient-text-cyan">
              GSD
            </span>
            <span className="text-sm font-medium text-[var(--color-gsd-text-muted)] group-hover:text-[var(--color-gsd-text-secondary)] transition-colors">
              Community Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} active={link.active}>
                {link.label}
              </NavLink>
            ))}
            {session?.publicKey && (
              <NavLink href="/profile/edit" active={pathname === "/profile/edit"}>
                My Profile
              </NavLink>
            )}
          </nav>

          {/* Wallet + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <WalletConnectButton />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--color-gsd-text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--color-gsd-text)] sm:hidden cursor-pointer"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="border-t border-[var(--color-gsd-border-subtle)] px-5 pb-4 pt-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  active={link.active}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              {session?.publicKey && (
                <NavLink
                  href="/profile/edit"
                  active={pathname === "/profile/edit"}
                  onClick={() => setMobileOpen(false)}
                >
                  My Profile
                </NavLink>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
