"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { explorerUrl, truncateAddress } from "@/lib/config/transparency-config";

interface ProgramUpgrade {
  id: string;
  programId: string;
  version: string;
  description: string;
  signers: string[];
  transactionSignature: string;
  multisigAddress: string;
  createdAt: string;
}

interface ChangelogResponse {
  upgrades: ProgramUpgrade[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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
      className="h-5 w-5 shrink-0"
      title="Copy to clipboard"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
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

export function ChangelogList() {
  const { data, isLoading, isError } = useQuery<ChangelogResponse>({
    queryKey: ["transparency", "changelog"],
    queryFn: async () => {
      const res = await fetch("/api/transparency/changelog");
      if (!res.ok) throw new Error("Failed to fetch changelog");
      return res.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Program Upgrade Changelog</CardTitle>
          {data && data.total > 0 && (
            <Badge variant="secondary">{data.total} upgrades</Badge>
          )}
        </div>
        <p className="text-sm text-[var(--color-gsd-text-muted)]">
          Every program upgrade is logged with what changed, who signed, and the
          on-chain transaction.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-gsd-accent)] border-t-transparent" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-[var(--color-gsd-error)]/30 bg-[var(--color-gsd-error)]/5 px-4 py-3 text-sm text-[var(--color-gsd-error)]">
            Unable to load changelog. The database may not be configured yet.
          </div>
        )}

        {data && data.upgrades.length === 0 && (
          <div className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-6 py-12 text-center">
            <p className="text-sm text-[var(--color-gsd-text-muted)]">
              No program upgrades yet. Initial deployment pending.
            </p>
          </div>
        )}

        {data && data.upgrades.length > 0 && (
          <div className="space-y-4">
            {data.upgrades.map((upgrade) => (
              <div
                key={upgrade.id}
                className="relative rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] p-4"
              >
                {/* Header: version + date */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">v{upgrade.version}</Badge>
                    <span className="font-mono text-xs text-[var(--color-gsd-text-muted)]">
                      {truncateAddress(upgrade.programId, 4)}
                    </span>
                  </div>
                  <time className="text-xs text-[var(--color-gsd-text-muted)]">
                    {new Date(upgrade.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>

                {/* Description */}
                <p className="mb-3 text-sm text-[var(--color-gsd-text-secondary)]">
                  {upgrade.description}
                </p>

                {/* Signers */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[var(--color-gsd-text-muted)]">
                    Signed by:
                  </span>
                  {upgrade.signers.map((signer, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <a
                        href={explorerUrl(signer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
                      >
                        {truncateAddress(signer)}
                      </a>
                      <CopyButton text={signer} />
                    </span>
                  ))}
                </div>

                {/* Transaction link */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-gsd-text-muted)]">
                    Transaction:
                  </span>
                  <a
                    href={explorerUrl(upgrade.transactionSignature, "tx")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
                  >
                    {truncateAddress(upgrade.transactionSignature, 8)}
                  </a>
                  <CopyButton text={upgrade.transactionSignature} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
