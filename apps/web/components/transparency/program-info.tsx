"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type ProgramEntry,
  type TokenAuthority,
  explorerUrl,
  truncateAddress,
} from "@/lib/config/transparency-config";

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
      className="h-6 w-6 shrink-0"
      title="Copy to clipboard"
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

interface ProgramInfoProps {
  programs: ProgramEntry[];
  repository: { url: string; license: string };
  tokenInfo: {
    name: string;
    symbol: string;
    authorities: TokenAuthority[];
  };
}

export function ProgramInfo({
  programs,
  repository,
  tokenInfo,
}: ProgramInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Chain Programs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Program list */}
        {programs.map((program, index) => (
          <div
            key={index}
            className="rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-[var(--color-gsd-text)]">
                {program.name}
              </span>
              <Badge
                variant={
                  program.network === "mainnet-beta" ? "success" : "warning"
                }
              >
                {program.network === "mainnet-beta" ? "Mainnet" : "Devnet"}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-gsd-text-muted)]">
                  Program ID:
                </span>
                <a
                  href={explorerUrl(program.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
                >
                  {truncateAddress(program.id, 6)}
                </a>
                <CopyButton text={program.id} />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[var(--color-gsd-text-muted)]">
                  Upgrade Authority:
                </span>
                <a
                  href={explorerUrl(program.upgradeAuthority)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
                >
                  {truncateAddress(program.upgradeAuthority, 6)}
                </a>
                <CopyButton text={program.upgradeAuthority} />
                <Badge variant="outline">Multisig</Badge>
              </div>

              {program.deployedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-gsd-text-muted)]">
                    Deployed:
                  </span>
                  <span className="text-[var(--color-gsd-text-secondary)]">
                    {new Date(program.deployedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Anti-Rug Standard: Token Authority Status */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-[var(--color-gsd-text-secondary)]">
            {tokenInfo.symbol} Token Authority Status
          </h4>
          <div className="space-y-2">
            {tokenInfo.authorities.map((authority, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-4 py-2.5"
              >
                <span className="text-sm text-[var(--color-gsd-text)]">
                  {authority.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-gsd-text-muted)]">
                    {authority.status}
                  </span>
                  {authority.address && (
                    <>
                      <a
                        href={explorerUrl(authority.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
                      >
                        {truncateAddress(authority.address)}
                      </a>
                      <CopyButton text={authority.address} />
                    </>
                  )}
                  {authority.verifiable && (
                    <Badge variant="success">Verifiable</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source code */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-gsd-border-subtle)] bg-[var(--color-gsd-bg)] px-4 py-3">
          <div>
            <span className="text-sm text-[var(--color-gsd-text)]">
              Source Code
            </span>
            <span className="ml-2 text-xs text-[var(--color-gsd-text-muted)]">
              {repository.license} License
            </span>
          </div>
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-gsd-accent)] underline-offset-4 hover:underline"
          >
            View on GitHub
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
