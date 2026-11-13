import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5 shadow-sm",
        tone === "accent" && "border-primary/30 bg-surface-tint",
        tone === "muted" && "bg-surface-sunken",
      )}
    >
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 font-label text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
