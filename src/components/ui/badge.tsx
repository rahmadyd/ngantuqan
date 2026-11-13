import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-label text-xs font-semibold tracking-wide whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        neutral: "border border-border/80 bg-surface-sunken text-muted",
        primary: "border border-primary/20 bg-surface-tint text-primary",
        pink: "border border-pink/25 bg-pink/15 text-pink-ink",
        outline: "border-2 border-border-strong bg-surface-warm/60 text-text",
        success: "bg-success-surface text-success",
        warning: "bg-warning-surface text-warning",
        danger: "bg-danger-surface text-danger",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[11px]",
        md: "px-3.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { badgeVariants };
