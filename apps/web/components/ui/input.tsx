import { type InputHTMLAttributes, forwardRef } from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-[var(--color-gsd-border)] bg-[var(--color-gsd-surface)]/80 px-4 py-2 text-sm text-[var(--color-gsd-text)] placeholder:text-[var(--color-gsd-text-muted)] transition-theme duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gsd-accent)] focus-visible:border-[var(--color-gsd-accent)] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
