import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { shouldPrefetch } from "@/lib/prefetch";

type ButtonVariant =
  | "primary"
  | "cream"
  | "outline"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  // The cream step is for dark panels: paper on cream is 12.35:1, and a forest
  // button there would lose its role as the action colour.
  cream: "bg-background text-text hover:bg-background/90",
  outline:
    "border-2 border-text bg-transparent text-text hover:bg-text hover:text-background",
  ghost: "text-text hover:bg-surface-sunken",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-xs",
  md: "h-11 px-5",
  lg: "h-13 px-7 text-base",
};

/**
 * Link styled as a button. Used for every CTA so navigation elements share
 * one visual language with <Button>.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      prefetch={shouldPrefetch(href)}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-label font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out",
        "focus-visible:outline-3 focus-visible:outline-offset-2 active:translate-y-px",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
