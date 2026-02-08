import { type ButtonHTMLAttributes, forwardRef } from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-[var(--color-gsd-accent)] text-[var(--color-gsd-bg)] hover:bg-[var(--color-gsd-accent-hover)]",
  secondary:
    "bg-[var(--color-gsd-surface-raised)] text-[var(--color-gsd-text)] hover:bg-[var(--color-gsd-border)]",
  outline:
    "border border-[var(--color-gsd-border)] bg-transparent text-[var(--color-gsd-text-secondary)] hover:bg-[var(--color-gsd-surface-raised)] hover:text-[var(--color-gsd-text)]",
  ghost:
    "bg-transparent text-[var(--color-gsd-text-secondary)] hover:bg-[var(--color-gsd-surface-raised)] hover:text-[var(--color-gsd-text)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-6 text-base",
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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gsd-accent)] disabled:pointer-events-none disabled:opacity-50",
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
