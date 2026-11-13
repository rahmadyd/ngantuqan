import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { Suspense } from "react";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState, FilterSkeleton } from "@/components/ui/feedback";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { getCategories, getPublishedProducts } from "@/lib/queries/content";
import { parsePageParam } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.nav.shop,
    description: t.shop.metaDescription,
  };
}

const PAGE_SIZE = 9;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const locale = await getLocale();
  const t = await getDictionary();
  const params = await searchParams;
  const category = params.category;
  const search = params.q;
  const sort = params.sort as "newest" | "price-asc" | "price-desc" | undefined;
  const page = parsePageParam(params.page);

  const [categories, products] = await Promise.all([
    getCategories("PRODUCT", locale),
    getPublishedProducts({
      categorySlug: category,
      search,
      sort,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      locale,
    }),
  ]);

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-16 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>{t.shop.eyebrow}</Eyebrow>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance">
                {t.shop.title}
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pt-12">
              <p className="prose-body">{t.shop.lede}</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <Suspense fallback={<FilterSkeleton />}>
            <ProductFilters
              categories={categories}
              activeCategory={category}
              activeSearch={search}
              activeSort={sort}
            />
          </Suspense>

          {products.length === 0 ? (
            <EmptyState
              className="mt-12"
              icon={PackageOpen}
              title={t.shop.emptyTitle}
              description={t.shop.emptyDescription}
              action={
                <ButtonLink href="/shop" variant="outline" size="sm">
                  {t.shop.clearFilters}
                </ButtonLink>
              }
            />
          ) : (
            <>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 3}
                  />
                ))}
              </div>

              {products.length === PAGE_SIZE ? (
                <nav
                  aria-label="Pagination"
                  className="mt-14 flex items-center justify-center gap-3"
                >
                  {page > 1 ? (
                    <ButtonLink
                      href={`/shop?${new URLSearchParams(
                        Object.entries({ category, q: search, sort }).filter(
                          ([, value]) => value,
                        ) as [string, string][],
                      ).toString()}&page=${page - 1}`}
                      variant="outline"
                      size="sm"
                    >
                      {t.common.previous}
                    </ButtonLink>
                  ) : null}
                  <span className="font-label text-sm text-muted">
                    {fill(t.common.page, { number: page })}
                  </span>
                  <ButtonLink
                    href={`/shop?${new URLSearchParams(
                      Object.entries({ category, q: search, sort }).filter(
                        ([, value]) => value,
                      ) as [string, string][],
                    ).toString()}&page=${page + 1}`}
                    variant="outline"
                    size="sm"
                  >
                    {t.common.next}
                  </ButtonLink>
                </nav>
              ) : null}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
