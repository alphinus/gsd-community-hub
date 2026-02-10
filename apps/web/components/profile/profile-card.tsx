import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileCardProps {
  profile: {
    walletAddress: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
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

export function ProfileCard({ profile }: ProfileCardProps) {
  const truncatedAddress = `${profile.walletAddress.slice(0, 4)}...${profile.walletAddress.slice(-4)}`;
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/profile/${profile.walletAddress}`}>
      <Card className="glass group cursor-pointer transition-theme duration-200 hover:glow-cyan-strong motion-safe:hover:scale-[1.02]">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar with gradient ring on hover */}
            <div className="shrink-0 rounded-full p-[2px] transition-theme duration-200 group-hover:bg-gradient-to-br group-hover:from-[var(--color-gsd-accent)] group-hover:to-[var(--color-gsd-gold)]">
              <div
                className="h-12 w-12 rounded-full ring-2 ring-transparent transition-transform duration-200 motion-safe:group-hover:scale-105"
                style={{
                  background: profile.avatarUrl
                    ? `url(${profile.avatarUrl}) center/cover`
                    : walletGradient(profile.walletAddress),
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              {/* Name + Verified */}
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-[var(--color-gsd-text)] transition-theme duration-200 group-hover:text-[var(--color-gsd-accent-hover)]">
                  {profile.displayName}
                </h3>
                {profile.onChainPda && (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--color-gsd-success)]" />
                )}
              </div>

              {/* Wallet address */}
              <p className="text-xs font-mono text-[var(--color-gsd-text-muted)]">
                {truncatedAddress}
              </p>

              {/* Bio excerpt */}
              {profile.bio && (
                <p className="mt-2 line-clamp-2 text-xs text-[var(--color-gsd-text-secondary)]">
                  {profile.bio}
                </p>
              )}

              {/* Member since */}
              <p className="mt-2 text-xs text-[var(--color-gsd-text-muted)]">
                Joined {memberSince}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
