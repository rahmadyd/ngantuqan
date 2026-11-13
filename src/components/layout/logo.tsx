import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The ngantuqan wordmark.
 *
 * Typographic by default — the repository ships no logo asset. When an image
 * mark is uploaded via Admin > Settings it replaces the type lockup at the
 * same optical height, and the pink terminal dot is suppressed.
 *
 * See docs/05-design-system.md §5.2
 */
export function Logo({
  logoUrl,
  className,
  size = "md",
  inverted = false,
}: {
  logoUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-[1.375rem]",
    lg: "text-2xl",
  } as const;

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="ngantuqan"
        width={160}
        height={40}
        loading="eager"
        fetchPriority="high"
        className={cn("h-auto w-auto", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display font-semibold tracking-[-0.03em]",
        sizes[size],
        inverted ? "text-background" : "text-text",
        className,
      )}
    >
      ngantuqan
      <span
        aria-hidden="true"
        className="ml-[0.06em] inline-block size-[0.18em] rounded-full bg-pink"
      />
    </span>
  );
}