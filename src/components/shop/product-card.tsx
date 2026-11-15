import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CardAffordance, MediaFallback, Price } from "@/components/common/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/models";

/**
 * A downloadable product (Sticker Packs, Posters, Tote Bags).
 *
 * Designed with warm pastel plates and organic crafted borders. The product
 * itself is the hero, with purposeful image zoom and border shift on hover.
 */
export async function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
  nature?: boolean;
}) {
  const t = await getDictionary();

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.375rem_1rem_1.25rem_1.125rem] border-2 border-border-strong bg-surface-warm shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-sunken">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={fill(t.common.previewArtwork, { title: product.title })}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <MediaFallback label={product.title} />
        )}

        {product.discount_price != null &&
        product.discount_price < product.price ? (
          <Badge variant="pink" className="absolute top-4 left-4">
            {fill(t.common.save, {
              percent: Math.round(
                ((product.price - product.discount_price) / product.price) * 100,
              ),
            })}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {product.category ? (
          <Badge variant="outline" className="self-start">
            {product.category.name}
          </Badge>
        ) : null}

        <h3 className="mt-3.5 font-display text-lg leading-snug font-semibold tracking-[-0.01em]">
          <Link
            href={`/shop/${product.slug}`}
            className="inline-flex min-h-11 items-center after:absolute after:inset-0"
          >
            {product.title}
          </Link>
        </h3>

        <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted">
          {product.description}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-5">
          <Price
            amount={product.price}
            discountAmount={product.discount_price}
            size="lg"
          />
          <CardAffordance>{t.common.view}</CardAffordance>
        </div>

        {product.file_format ? (
          <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 font-label text-xs text-muted-foreground">
            {/* Hand-drawn file icon (R-04) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0 fill-none stroke-current"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="M9 15l3 3 3-3" />
            </svg>
            {product.file_format}
          </p>
        ) : null}
      </div>
    </article>
  );
}
