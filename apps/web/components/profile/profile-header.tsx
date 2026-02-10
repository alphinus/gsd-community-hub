"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ExternalLink,
  Github,
  Globe,
  Twitter,
  Copy,
  Check,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  profile: {
    walletAddress: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    githubUrl: string | null;
    twitterUrl: string | null;
    websiteUrl: string | null;
    onChainPda: string | null;
    createdAt: string;
  };
}

/**
 * Generate a deterministic gradient from a wallet address for avatar display.
 */
function walletGradient(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 120) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 70%, 50%))`;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const isOwnProfile = session?.publicKey === profile.walletAddress;
  const truncatedAddress = `${profile.walletAddress.slice(0, 4)}...${profile.walletAddress.slice(-4)}`;
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function handleCopyAddress() {
    navigator.clipboard.writeText(profile.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const explorerUrl = profile.onChainPda
    ? `https://explorer.solana.com/address/${profile.onChainPda}?cluster=devnet`
    : null;

  return (
    <div className="space-y-6">
      {/* Avatar + Name */}
      <div className="flex items-start gap-6">
        {/* Avatar with cyan gradient ring */}
        <div className="shrink-0 rounded-full bg-gradient-to-br from-[var(--color-gsd-accent)] to-[var(--color-gsd-accent-deep)] p-[3px] shadow-lg shadow-[var(--color-gsd-accent)]/20">
          <div
            className="h-20 w-20 rounded-full ring-2 ring-[var(--color-gsd-bg)] sm:h-24 sm:w-24"
            style={{
              background: profile.avatarUrl
                ? `url(${profile.avatarUrl}) center/cover`
                : walletGradient(profile.walletAddress),
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Display name */}
          <h1 className="text-2xl font-extralight tracking-wide text-[var(--color-gsd-text)] sm:text-3xl">
            {profile.displayName}
          </h1>

          {/* Wallet address */}
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleCopyAddress}
              className="flex cursor-pointer items-center gap-1.5 text-sm font-mono text-[var(--color-gsd-text-muted)] transition-colors duration-200 hover:text-[var(--color-gsd-text-secondary)]"
              title="Copy wallet address"
            >
              {truncatedAddress}
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[var(--color-gsd-success)]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>

            {/* On-chain verification badge */}
            {profile.onChainPda && explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex cursor-pointer items-center"
                title="View on-chain profile on Solana Explorer"
              >
                <Badge className="gap-1 border-[var(--color-gsd-accent)]/30 bg-[var(--color-gsd-accent)]/10 text-[var(--color-gsd-accent-light)] hover:bg-[var(--color-gsd-accent)]/20 text-[10px] font-light uppercase tracking-[0.15em]">
                  <ShieldCheck className="h-3 w-3 text-[var(--color-gsd-accent)]" />
                  Verified on-chain
                </Badge>
              </a>
            )}
          </div>

          {/* Member since */}
          <p className="mt-1 text-sm font-light text-[var(--color-gsd-text-muted)]">
            Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="font-light text-[var(--color-gsd-text-secondary)] leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* External links + Edit button */}
      <div className="flex flex-wrap items-center gap-3">
        {profile.githubUrl && (
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eluma-card glass-surface flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-light text-[var(--color-gsd-text-secondary)] transition-theme duration-200 hover:text-[var(--color-gsd-accent-light)]"
          >
            <Github className="h-4 w-4" />
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {profile.twitterUrl && (
          <a
            href={profile.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eluma-card glass-surface flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-light text-[var(--color-gsd-text-secondary)] transition-theme duration-200 hover:text-[var(--color-gsd-accent-light)]"
          >
            <Twitter className="h-4 w-4" />
            Twitter/X
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {profile.websiteUrl && (
          <a
            href={profile.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eluma-card glass-surface flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-light text-[var(--color-gsd-text-secondary)] transition-theme duration-200 hover:text-[var(--color-gsd-accent-light)]"
          >
            <Globe className="h-4 w-4" />
            Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {isOwnProfile && (
          <Link href="/profile/edit" className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5 font-light tracking-wide border-[var(--color-gsd-accent)]/30 text-[var(--color-gsd-accent-light)] hover:border-[var(--color-gsd-accent)] hover:bg-[var(--color-gsd-accent)]/10 hover:text-[var(--color-gsd-accent)]">
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
