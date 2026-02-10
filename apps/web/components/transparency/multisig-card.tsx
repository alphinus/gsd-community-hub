"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type MultisigMember,
  explorerUrl,
  squadsUrl,
  truncateAddress,
} from "@/lib/config/transparency-config";

interface MultisigCardProps {
  address: string;
  threshold: number;
  totalMembers: number;
  members: MultisigMember[];
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: create a temporary textarea
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-6 w-6 shrink-0 cursor-pointer transition-theme duration-200"
      title="Copy address"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
    </Button>
  );
}

export function MultisigCard({
  address,
  threshold,
  totalMembers,
  members,
}: MultisigCardProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Program Governance</CardTitle>
          <Badge variant="success">
            {threshold} of {totalMembers} signatures required
          </Badge>
        </div>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          {threshold} core team + {totalMembers - threshold} trusted community
          members control all program upgrades via Squads multisig.
        </p>
      </CardHeader>
      <CardContent>
        {/* Multisig address */}
        <div className="mb-6 flex items-center gap-2 glass-surface rounded-2xl px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-gsd-text-muted)]">
            Multisig
          </span>
          <a
            href={squadsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer font-mono text-sm text-[var(--color-gsd-accent)] underline-offset-4 transition-theme duration-200 hover:text-[var(--color-gsd-accent-hover)] hover:underline"
          >
            {truncateAddress(address, 6)}
          </a>
          <CopyButton text={address} />
          <a
            href={explorerUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto cursor-pointer text-xs text-[var(--color-gsd-text-muted)] underline-offset-4 transition-theme duration-200 hover:text-[var(--color-gsd-text-secondary)] hover:underline"
          >
            Explorer
          </a>
        </div>

        {/* Member list */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--color-gsd-text-secondary)]">
            Signers
          </h4>
          {members.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-3 glass-surface rounded-2xl px-4 py-2.5 transition-theme duration-200 hover:border-[var(--color-gsd-accent)]/20"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-sm text-[var(--color-gsd-text)]">
                  {member.label}
                </span>
                <Badge
                  variant={
                    member.role === "Core Team" ? "default" : "secondary"
                  }
                >
                  {member.role}
                </Badge>
              </div>
              <a
                href={explorerUrl(member.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 cursor-pointer font-mono text-xs text-[var(--color-gsd-accent)] underline-offset-4 transition-theme duration-200 hover:text-[var(--color-gsd-accent-hover)] hover:underline"
              >
                {truncateAddress(member.address)}
              </a>
              <CopyButton text={member.address} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
