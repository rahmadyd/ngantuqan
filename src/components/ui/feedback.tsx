import * as React from "react";
import { cn } from "@/lib/utils";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  );
}

/**
 * The placeholder for the filter bar while the catalogue is queried.
 *
 * It copies the real bar's dimensions, the chip row and the search field, so
 * the page does not jump when the filters land.
 */
export function FilterSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-36 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full max-w-sm" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-tint">
          <Icon className="size-6 text-primary" />
        </div>
      ) : null}
      <p className="font-display text-lg font-semibold text-text">{title}</p>
      <p className="prose-body mt-1.5 text-sm">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-primary/30 bg-surface-tint text-text",
    success: "border-success/30 bg-success-surface text-text",
    warning: "border-warning/30 bg-warning-surface text-text",
    danger: "border-danger/30 bg-danger-surface text-text",
  } as const;

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm leading-relaxed",
        styles[variant],
        className,
      )}
    >
      {title ? (
        <p className="font-label font-medium">{title}</p>
      ) : null}
      <div className={cn(title && "mt-1")}>{children}</div>
    </div>
  );
}
