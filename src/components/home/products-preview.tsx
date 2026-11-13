import { Container, Section, SectionHeading } from "@/components/layout/primitives";
import { ProductCard } from "@/components/shop/product-card";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/feedback";
import { getDictionary } from "@/lib/i18n/server";
import type { Product } from "@/types/models";

export async function ProductsPreview({ products }: { products: Product[] }) {
  const t = await getDictionary();

  return (
    <Section tone="sunken">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={t.products.eyebrow}
            eyebrowRule={false}
            title={t.products.title}
            lede={t.products.lede}
          />
          <ButtonLink
            href="/shop"
            variant="outline"
            size="sm"
            className="rounded-full border-2 border-border-strong bg-surface px-5 font-semibold shadow-xs transition-transform duration-150 hover:scale-105 active:scale-100"
          >
            {t.products.button}
          </ButtonLink>
        </div>

        {products.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-12"
            title={t.products.emptyTitle}
            description={t.products.emptyDescription}
            action={
              <ButtonLink href="/shop" variant="outline">
                {t.products.button}
              </ButtonLink>
            }
          />
        )}
      </Container>
    </Section>
  );
}
