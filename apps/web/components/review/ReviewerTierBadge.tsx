/**
 * Reviewer tier badge with tier-specific icon and color.
 *
 * Explorer: compass icon, blue
 * Builder: hammer icon, purple
 * Architect: crown icon, gold
 */

import { Compass, Hammer, Crown } from "lucide-react";
import type { ReviewerTier } from "@gsd/types";

interface ReviewerTierBadgeProps {
  tier: ReviewerTier;
  size?: "sm" | "md";
}

const tierConfig: Record<
  ReviewerTier,
  { name: string; color: string; bgColor: string; Icon: typeof Compass }
> = {
  1: {
    name: "Explorer",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    Icon: Compass,
  },
  2: {
    name: "Builder",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    Icon: Hammer,
  },
  3: {
    name: "Architect",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
    Icon: Crown,
  },
};

const sizeClasses = {
  sm: { wrapper: "px-2 py-0.5 text-xs", icon: "h-3 w-3" },
  md: { wrapper: "px-2.5 py-1 text-sm", icon: "h-3.5 w-3.5" },
};

export function ReviewerTierBadge({
  tier,
  size = "md",
}: ReviewerTierBadgeProps) {
  const config = tierConfig[tier];
  const sizes = sizeClasses[size];
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bgColor} ${config.color} ${sizes.wrapper}`}
    >
      <Icon className={sizes.icon} />
      {config.name}
    </span>
  );
}
