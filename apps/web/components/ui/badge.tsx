import { type HTMLAttributes, forwardRef } from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "gold";

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "border-transparent bg-[var(--color-gsd-accent)]/15 text-[var(--color-gsd-accent)]",
  secondary:
    "border-transparent bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text-secondary)]",
  outline:
    "border-[var(--color-gsd-border)] text-[var(--color-gsd-text-secondary)]",
  success:
    "border-transparent bg-[var(--color-gsd-success)]/15 text-[var(--color-gsd-success)]",
  warning:
    "border-transparent bg-[var(--color-gsd-warning)]/15 text-[var(--color-gsd-warning)]",
  gold:
    "border-transparent bg-[var(--color-gsd-gold)]/15 text-[var(--color-gsd-gold)]",
};

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
export type { BadgeVariant };
