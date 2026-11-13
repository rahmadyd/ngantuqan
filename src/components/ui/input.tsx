import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-4 text-sm text-text shadow-xs transition-colors duration-150",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "aria-invalid:border-danger aria-invalid:outline-danger",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text shadow-xs transition-colors duration-150",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "aria-invalid:border-danger aria-invalid:outline-danger",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "font-label text-sm font-medium text-text",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-md border border-border bg-surface bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat px-4 pr-10 text-sm text-text shadow-xs transition-colors duration-150",
        "focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "aria-invalid:border-danger",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23585A69' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextareaCounter({
  value,
  max,
}: {
  value: string;
  max: number;
}) {
  const length = value.length;
  const near = length >= max * 0.9;
  return (
    <span
      className={cn(
        "font-label text-xs tabular-nums",
        near ? "text-warning" : "text-muted-foreground",
      )}
    >
      {length} / {max}
    </span>
  );
}
