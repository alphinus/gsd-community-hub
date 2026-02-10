import { type ButtonHTMLAttributes, forwardRef } from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "gold";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "gradient-cyan text-white shadow-[0_0_20px_rgba(79,209,197,0.15)] hover:shadow-[0_0_30px_rgba(79,209,197,0.25)] hover:brightness-110",
  secondary:
    "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text)] hover:bg-[var(--color-gsd-border)] border border-[var(--color-gsd-border-subtle)]",
  outline:
    "border border-[var(--color-gsd-border)] bg-transparent text-[var(--color-gsd-text-secondary)] hover:border-[var(--color-gsd-accent)] hover:text-[var(--color-gsd-accent)] hover:shadow-[0_0_20px_rgba(79,209,197,0.1)]",
  ghost:
    "bg-transparent text-[var(--color-gsd-text-secondary)] hover:bg-[var(--color-gsd-accent-muted)] hover:text-[var(--color-gsd-text)]",
  gold:
    "bg-[var(--color-gsd-gold)] text-[#0f172a] font-bold hover:bg-[var(--color-gsd-gold-hover)] shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-5 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-8 text-base",
  icon: "h-9 w-9",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-theme duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gsd-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-gsd-bg)] disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize };
