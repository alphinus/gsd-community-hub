"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface HumanVerificationBadgeProps {
  /** Pass either wallet (fetches status) or direct verification data */
  wallet?: string;
  verified?: boolean;
  expiresAt?: string | null;
  /** Render as a small inline badge (for use in voter lists) */
  inline?: boolean;
}

interface VerificationResponse {
  verified: boolean;
  verifiedAt: string | null;
  expiresAt: string | null;
  gatekeeperNetwork: string | null;
}

function ShieldIcon({
  className,
  variant,
}: {
  className?: string;
  variant: "verified" | "expired" | "unverified";
}) {
  const colors = {
    verified: "text-emerald-500",
    expired: "text-amber-500",
    unverified: "text-gray-400",
  };

  return (
    <svg
      className={`${colors[variant]} ${className ?? "h-4 w-4"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function getVerificationStatus(
  verified: boolean,
  expiresAt?: string | null
): "verified" | "expired" | "unverified" {
  if (!verified) return "unverified";
  if (expiresAt && new Date(expiresAt) < new Date()) return "expired";
  return "verified";
}

export function HumanVerificationBadge({
  wallet,
  verified: verifiedProp,
  expiresAt: expiresAtProp,
  inline = false,
}: HumanVerificationBadgeProps) {
  // Fetch verification status if only wallet is provided
  const { data } = useQuery<VerificationResponse>({
    queryKey: ["human-verification", wallet],
    queryFn: async () => {
      const res = await fetch(
        `/api/governance/human-verification?wallet=${wallet}`
      );
      if (!res.ok) throw new Error("Failed to fetch verification status");
      return res.json();
    },
    enabled: !!wallet && verifiedProp === undefined,
    staleTime: 60_000,
  });

  // Use props if provided, otherwise use fetched data
  const verified = verifiedProp ?? data?.verified ?? false;
  const expiresAt = expiresAtProp ?? data?.expiresAt ?? null;
  const status = getVerificationStatus(verified, expiresAt);

  const labels = {
    verified: "Verified Human",
    expired: "Verification Expired",
    unverified: "Not Verified",
  };

  const bgColors = {
    verified: "bg-emerald-500/10",
    expired: "bg-amber-500/10",
    unverified: "bg-gray-500/10",
  };

  const textColors = {
    verified: "text-emerald-500",
    expired: "text-amber-500",
    unverified: "text-gray-400",
  };

  if (inline) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${bgColors[status]} ${textColors[status]}`}
        title={labels[status]}
      >
        <ShieldIcon variant={status} className="h-3 w-3" />
        {status === "verified" && "Verified"}
        {status === "expired" && "Expired"}
      </span>
    );
  }

  const content = (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${bgColors[status]}`}
    >
      <ShieldIcon variant={status} className="h-5 w-5" />
      <div>
        <p className={`text-sm font-medium ${textColors[status]}`}>
          {labels[status]}
        </p>
        {status === "expired" && (
          <p className="text-xs text-amber-400/70">
            Re-verify to maintain voting eligibility
          </p>
        )}
      </div>
    </div>
  );

  if (status === "unverified" || status === "expired") {
    return (
      <Link href="/governance/delegate" className="block">
        {content}
      </Link>
    );
  }

  return content;
}
