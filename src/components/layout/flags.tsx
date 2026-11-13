import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The two flags the language toggle offers.
 *
 * Drawn as inline SVG rather than shipped as image files: two small vectors
 * cost nothing to load, stay sharp at any size, and take the site's colours
 * without a second request.
 */

/** Indonesia. Red over white, three to two. */
export function IndonesiaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full", className)}
    >
      <rect width="24" height="8" fill="#CE1126" />
      <rect y="8" width="24" height="8" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * The United States.
 *
 * Thirteen stripes and a canton with a grid of stars. The stars are drawn
 * once and repeated with use, so the flag stays a single readable shape at
 * the size it is shown.
 */
export function UnitedStatesFlag({ className }: { className?: string }) {
  const raw = useId();
  const starId = `flag-star-${raw.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 24 16"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full", className)}
    >
      <defs>
        <path
          id={starId}
          d="M0 -1 L0.225 -0.309 L0.951 -0.309 L0.363 0.118 L0.588 0.809 L0 0.382 L-0.588 0.809 L-0.363 0.118 L-0.951 -0.309 L-0.225 -0.309 Z"
        />
      </defs>

      <rect width="24" height="16" fill="#FFFFFF" />
      <g fill="#B22234">
        <rect width="24" height="1.23" />
        <rect y="2.46" width="24" height="1.23" />
        <rect y="4.92" width="24" height="1.23" />
        <rect y="7.38" width="24" height="1.23" />
        <rect y="9.85" width="24" height="1.23" />
        <rect y="12.31" width="24" height="1.23" />
        <rect y="14.77" width="24" height="1.23" />
      </g>

      <rect width="10" height="8.62" fill="#3C3B6E" />
      <g fill="#FFFFFF">
        <use href={`#${starId}`} x="1.3" y="1.2" />
        <use href={`#${starId}`} x="2.9" y="1.2" />
        <use href={`#${starId}`} x="4.5" y="1.2" />
        <use href={`#${starId}`} x="6.1" y="1.2" />
        <use href={`#${starId}`} x="7.7" y="1.2" />
        <use href={`#${starId}`} x="2.1" y="2.7" />
        <use href={`#${starId}`} x="3.7" y="2.7" />
        <use href={`#${starId}`} x="5.3" y="2.7" />
        <use href={`#${starId}`} x="6.9" y="2.7" />
        <use href={`#${starId}`} x="1.3" y="4.2" />
        <use href={`#${starId}`} x="2.9" y="4.2" />
        <use href={`#${starId}`} x="4.5" y="4.2" />
        <use href={`#${starId}`} x="6.1" y="4.2" />
        <use href={`#${starId}`} x="7.7" y="4.2" />
        <use href={`#${starId}`} x="2.1" y="5.7" />
        <use href={`#${starId}`} x="3.7" y="5.7" />
        <use href={`#${starId}`} x="5.3" y="5.7" />
        <use href={`#${starId}`} x="6.9" y="5.7" />
      </g>
    </svg>
  );
}
