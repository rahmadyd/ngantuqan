import { cn, formatCurrency } from "@/lib/utils";

export function Price({
  amount,
  discountAmount,
  className,
  size = "md",
}: {
  amount: number;
  discountAmount?: number | null;
  className?: string;
  size?: "md" | "lg";
}) {
  const formatted = formatCurrency(amount);
  const value = size === "lg" ? "text-3xl" : "text-2xl";

  if (discountAmount == null || discountAmount >= amount) {
    return (
      <span className={cn("font-display font-semibold", value, className)}>
        {formatted}
      </span>
    );
  }

  const discounted = formatCurrency(discountAmount);

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("font-display font-semibold", value)}>{discounted}</span>
      <span className="font-label text-sm text-muted-foreground line-through">
        {formatted}
      </span>
    </span>
  );
}

export function CategoryChip({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-surface-sunken px-3 py-1 font-label text-xs font-medium text-muted",
        className,
      )}
    >
      {name}
    </span>
  );
}

/**
 * The label that says a card opens something.
 *
 * A drawn rule rather than an arrow. The rule grows on hover, so the gesture
 * is the line drawing itself instead of the same glyph repeated on every
 * card and every button (R-08).
 */
export function CardAffordance({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-label text-xs font-medium uppercase tracking-[0.08em] text-primary",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="h-px w-6 bg-pink transition-[width] duration-200 ease-out group-hover:w-10"
      />
    </span>
  );
}

/**
 * The honest stand-in for a missing cover image.
 *
 * The first letter of the title, on the bougainvillea wash. Every card family
 * uses it, so a record without artwork still looks deliberate (C-4).
 */
export function MediaFallback({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex size-full items-center justify-center bg-pink-soft"
    >
      <span className="font-display text-4xl font-semibold text-pink-ink">
        {label.charAt(0)}
      </span>
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-warning-surface px-2.5 py-0.5 font-label text-[11px] font-medium tracking-wide text-warning",
        className,
      )}
    >
      Demo content
    </span>
  );
}
