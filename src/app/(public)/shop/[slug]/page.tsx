import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Layers, MonitorSmartphone } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/layout/primitives";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { Price } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { getProductBySlug } from "@/lib/queries/content";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const product = await getProductBySlug(slug, locale);

  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.cover_image ? [product.cover_image] : undefined,
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = await getDictionary();
  const { slug } = await params;
  const product = await getProductBySlug(slug, locale);

  if (!product) notFound();

  const gallery = product.images ?? [];
  const effectivePrice = product.discount_price ?? product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.cover_image ? [product.cover_image] : undefined,
    brand: { "@type": "Brand", name: "ngantuqan" },
    offers: {
      "@type": "Offer",
      price: effectivePrice,
      priceCurrency: "IDR",
      availability: "https://schema.org/InStock",
    },
  };

  const includes = [
    product.file_format
      ? { icon: FileText, label: t.common.fileFormat, value: product.file_format }
      : null,
    product.compatibility
      ? {
          icon: MonitorSmartphone,
          label: t.shop.compatibility,
          value: product.compatibility,
        }
      : null,
    { icon: Layers, label: t.shop.deliveryLabel, value: t.shop.instantDownload },
  ].filter(Boolean) as { icon: typeof FileText; label: string; value: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <section className="py-10 md:py-14">
          <Container>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 font-label text-sm text-muted transition-colors hover:text-text"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.shop.backToShop}
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
              {/* Gallery */}
              <div className="lg:col-span-7">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-sunken shadow-sm">
                  {product.cover_image ? (
                    <Image
                      src={product.cover_image}
                      alt={fill(t.common.previewArtwork, { title: product.title })}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                {gallery.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-4">
                    {gallery.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-sunken"
                      >
                        <Image
                          src={image.image_url}
                          alt={
                            image.alt_text ??
                            fill(t.shop.previewAlt, { title: product.title })
                          }
                          fill
                          sizes="(max-width: 640px) 33vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Buy box */}
              <div className="lg:col-span-5">
                {product.category ? (
                  <Badge variant="outline">{product.category.name}</Badge>
                ) : null}

                <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3rem)] leading-[1.08] font-semibold tracking-[-0.025em] text-balance">
                  {product.title}
                </h1>

                <p className="prose-body mt-5">{product.description}</p>

                <div className="mt-7">
                  <Price
                    amount={product.price}
                    discountAmount={product.discount_price}
                    className="text-[2rem]"
                  />
                </div>

                <div className="mt-8">
                  <AddToCartButton
                    productId={product.id}
                    title={product.title}
                    price={product.price}
                    discountPrice={product.discount_price}
                  />
                </div>

                <dl className="mt-10 space-y-4 border-t border-border pt-8">
                  {includes.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <item.icon
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      <div>
                        <dt className="eyebrow">{item.label}</dt>
                        <dd className="mt-1 text-sm text-text">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Container>
        </section>

        <Section tone="sunken">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <Eyebrow>{t.shop.license}</Eyebrow>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                  {t.shop.licenseTitle}
                </h2>
              </div>
              <div className="lg:col-span-7">
                <p className="text-sm leading-relaxed text-muted">
                  {product.license_terms ?? t.shop.licenseFallback}
                </p>
                <p className="mt-5 font-label text-sm">
                  <Link
                    href="/digital-product-license"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t.shop.licenseLink}
                  </Link>
                </p>
              </div>
            </div>
          </Container>
        </Section>

        <section className="dark-surface bg-text py-16 text-background md:py-20">
          <Container>
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
                  {t.shop.customTitle}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-background/70">
                  {t.shop.customLede}
                </p>
              </div>
              <ButtonLink
                href="/contact"
                variant="cream"
                size="lg"
                className="shrink-0"
              >
                {t.shop.customButton}
              </ButtonLink>
            </div>
          </Container>
        </section>
      </article>
    </>
  );
}
