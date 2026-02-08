import { type TextareaHTMLAttributes, forwardRef } from "react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[100px] w-full rounded-lg border border-[var(--color-gsd-border)] bg-[var(--color-gsd-surface)] px-3 py-2 text-sm text-[var(--color-gsd-text)] placeholder:text-[var(--color-gsd-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gsd-accent)] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
