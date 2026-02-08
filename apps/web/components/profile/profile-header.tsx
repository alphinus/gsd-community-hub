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
        {/* Avatar */}
        <div
          className="h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24"
          style={{
            background: profile.avatarUrl
              ? `url(${profile.avatarUrl}) center/cover`
              : walletGradient(profile.walletAddress),
          }}
        />

        <div className="min-w-0 flex-1">
          {/* Display name */}
          <h1 className="text-2xl font-bold text-[var(--color-gsd-text)] sm:text-3xl">
            {profile.displayName}
          </h1>

          {/* Wallet address */}
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1.5 text-sm font-mono text-[var(--color-gsd-text-muted)] transition-colors hover:text-[var(--color-gsd-text-secondary)]"
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
                className="inline-flex items-center"
                title="View on-chain profile on Solana Explorer"
              >
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified on-chain
                </Badge>
              </a>
            )}
          </div>

          {/* Member since */}
          <p className="mt-1 text-sm text-[var(--color-gsd-text-muted)]">
            Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-[var(--color-gsd-text-secondary)] leading-relaxed">
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
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-gsd-border-subtle)] px-3 py-1.5 text-sm text-[var(--color-gsd-text-secondary)] transition-colors hover:border-[var(--color-gsd-accent)] hover:text-[var(--color-gsd-accent)]"
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
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-gsd-border-subtle)] px-3 py-1.5 text-sm text-[var(--color-gsd-text-secondary)] transition-colors hover:border-[var(--color-gsd-accent)] hover:text-[var(--color-gsd-accent)]"
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
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-gsd-border-subtle)] px-3 py-1.5 text-sm text-[var(--color-gsd-text-secondary)] transition-colors hover:border-[var(--color-gsd-accent)] hover:text-[var(--color-gsd-accent)]"
          >
            <Globe className="h-4 w-4" />
            Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {isOwnProfile && (
          <Link href="/profile/edit" className="ml-auto">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
