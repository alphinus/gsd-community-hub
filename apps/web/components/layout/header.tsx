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
        "eluma-nav-link relative px-3 py-1.5 text-sm font-light tracking-wide transition-theme duration-200 rounded-lg",
        active
          ? "text-[var(--color-gsd-text)] bg-[var(--color-gsd-accent)]/10"
          : "text-[var(--color-gsd-text-secondary)] hover:text-[var(--color-gsd-text)]"
      )}
    >
      {children}
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
            {/* Hexagonal icon mark */}
            <svg width="28" height="28" viewBox="0 0 32 32" className="shrink-0 transition-transform duration-300 group-hover:scale-105">
              <defs>
                <linearGradient id="hdr-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a5f"/>
                  <stop offset="100%" stopColor="#4fd1c5"/>
                </linearGradient>
              </defs>
              <g transform="translate(16,16)">
                <polygon points="0,-11 9.5,-5.5 9.5,5.5 0,11 -9.5,5.5 -9.5,-5.5" fill="none" stroke="url(#hdr-g)" strokeWidth="1" opacity="0.5"/>
                <rect x="-5" y="-5.5" width="10" height="1.5" rx="0.75" fill="#4fd1c5" opacity="0.9"/>
                <rect x="-5" y="-0.75" width="8" height="1.5" rx="0.75" fill="#38b2ac"/>
                <rect x="-5" y="4" width="6" height="1.5" rx="0.75" fill="#4fd1c5" opacity="0.7"/>
                <circle cx="0" cy="-11" r="1.5" fill="#4fd1c5"/>
                <circle cx="9.5" cy="-5.5" r="1.2" fill="#38b2ac"/>
                <circle cx="9.5" cy="5.5" r="1.2" fill="#38b2ac"/>
                <circle cx="0" cy="11" r="1.5" fill="#4fd1c5"/>
              </g>
            </svg>
            <span className="text-xl font-extralight tracking-wider gradient-text-cyan">
              GSD
            </span>
            <span className="hidden sm:inline text-sm font-light text-[var(--color-gsd-text-muted)] group-hover:text-[var(--color-gsd-text-secondary)] transition-colors tracking-wide">
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
