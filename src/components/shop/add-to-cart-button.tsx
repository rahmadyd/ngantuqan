"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useLocale } from "@/lib/i18n/client";

export function AddToCartButton({
  productId,
  title,
  price,
  discountPrice,
}: {
  productId: string;
  title: string;
  price: number;
  discountPrice: number | null;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const { t } = useLocale();
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const effectivePrice = discountPrice ?? price;

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        disabled={isPending}
        onClick={() => {
          addItem({ productId, title, price: effectivePrice });
          setAdded(true);
          startTransition(() => {
            setTimeout(() => setAdded(false), 2000);
          });
        }}
        className="w-full"
      >
        <ShoppingBag aria-hidden="true" />
        {added ? t.shop.addedToCart : t.shop.addToCart}
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="w-full"
        onClick={() => {
          addItem({ productId, title, price: effectivePrice });
          router.push("/checkout");
        }}
      >
        {t.shop.buyNow}
      </Button>

      <p className="text-center font-label text-xs text-muted-foreground">
        {t.shop.downloadNote}
      </p>
    </div>
  );
}
