import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-surface-sunken text-muted",
  primary: "bg-surface-tint text-primary",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  secondary: "bg-pink/15 text-pink-ink",
} as const;

/** Compact status pill for admin tables. */
export function StatusPill({
  value,
  tone,
}: {
  value: string;
  tone?: keyof typeof TONES;
}) {
  const resolved =
    tone ??
    ({
      NEW: "primary",
      NEW_INQUIRY: "primary",
      PENDING: "primary",
      CONTACTED: "secondary",
      IN_PROGRESS: "secondary",
      QUOTED: "secondary",
      WAITING_FOR_PAYMENT: "warning",
      REVISION: "warning",
      PAID: "success",
      COMPLETED: "success",
      RESOLVED: "success",
      PUBLISHED: "success",
      FAILED: "danger",
      CANCELLED: "danger",
      SPAM: "danger",
      UNPUBLISHED: "danger",
    } as Record<string, keyof typeof TONES>)[value] ??
      "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-label text-[11px] font-medium whitespace-nowrap",
        TONES[resolved],
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}
