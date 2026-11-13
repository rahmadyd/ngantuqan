"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLocale } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/format";

/**
 * The cart link in the header.
 *
 * The cart lives in sessionStorage, so the count is only known on the
 * client. The link is rendered on the server without a count and fills in
 * after hydration.
 */
export function CartLink() {
  const { count } = useCart();
  const { t } = useLocale();

  return (
    <Link
      href="/checkout"
      // The checkout carries the whole form island — prefetching it would
      // pull the validation library into every page.
      prefetch={false}
      aria-label={
        count > 0
          ? fill(t.cart.count, { count })
          : t.cart.label
      }
      className="relative inline-flex size-11 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-sunken"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-pink-ink font-label text-[11px] font-semibold text-background">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
