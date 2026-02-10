import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DelegateCardProps {
  delegate: string;
  delegatorCount: number;
  totalDelegated: string;
  isVerified: boolean;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function DelegateCard({
  delegate,
  delegatorCount,
  totalDelegated,
  isVerified,
}: DelegateCardProps) {
  const formattedAmount = (Number(BigInt(totalDelegated)) / 1e9).toFixed(2);

  return (
    <Link href={`/profile/${delegate}`} className="cursor-pointer">
      <Card className="glass eluma-card transition-theme duration-200 hover:glow-cyan hover:border-[var(--color-gsd-accent)]/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono text-[var(--color-gsd-text)]">
              {truncateAddress(delegate)}
            </CardTitle>
            {isVerified && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-gsd-accent)]/15"
                title="Verified Human"
              >
                <svg
                  className="h-3 w-3 text-[var(--color-gsd-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-xl">
              {delegatorCount} {delegatorCount === 1 ? "delegator" : "delegators"}
            </Badge>
            <span className="text-sm font-normal gradient-text-cyan">
              {formattedAmount} $GSD
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
