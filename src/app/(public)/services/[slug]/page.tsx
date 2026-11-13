import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/layout/primitives";
import { PackageCard } from "@/components/services/package-card";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { getServiceBySlug } from "@/lib/queries/content";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const service = await getServiceBySlug(slug, locale);

  if (!service) return { title: "Service not found" };

  return {
    title: service.title,
    description: service.description,
    openGraph: {
      title: service.title,
      description: service.description,
      images: service.cover_image ? [service.cover_image] : undefined,
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = await getDictionary();
  const { slug } = await params;
  const service = await getServiceBySlug(slug, locale);

  if (!service) notFound();

  const packages = service.packages ?? [];

  const faq = t.services.faqItems;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: { "@type": "Organization", name: "ngantuqan" },
    offers: packages.map((pkg) => ({
      "@type": "Offer",
      name: pkg.name,
      price: pkg.price,
      priceCurrency: "IDR",
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article>
        <section className="border-b border-border bg-surface-sunken py-14 md:py-20">
          <Container>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 font-label text-sm text-muted transition-colors hover:text-text"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.services.allServices}
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <Eyebrow>{t.services.serviceFallback}</Eyebrow>
                <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
                  {service.title}
                </h1>
                <p className="prose-body-strong mt-6">{service.description}</p>

                <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5 border-t border-border pt-7">
                  <div>
                    <dt className="eyebrow">{t.services.turnaround}</dt>
                    <dd className="mt-1.5 flex items-center gap-2 font-display text-xl font-semibold">
                      <Clock aria-hidden="true" className="size-4 text-primary" />
                      {fill(t.services.daysValue, {
                        count: service.turnaround_days,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">{t.services.revisions}</dt>
                    <dd className="mt-1.5 flex items-center gap-2 font-display text-xl font-semibold">
                      <RefreshCw aria-hidden="true" className="size-4 text-primary" />
                      {service.revision_policy ?? t.services.roundsFallback}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="lg:col-span-5">
                {service.cover_image ? (
                  <div className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface-sunken shadow-sm">
                    <Image
                      src={service.cover_image}
                        alt={fill(t.common.coverArtwork, { title: service.title })}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </Container>
        </section>

        {service.deliverables && service.deliverables.length > 0 ? (
          <Section>
            <Container>
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <Eyebrow>{t.services.includedEyebrow}</Eyebrow>
                  <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                    {t.services.includedTitle}
                  </h2>
                  <p className="prose-body mt-4">
                    {t.services.includedLede}
                  </p>
                </div>

                <ul className="lg:col-span-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {service.deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-1 size-2 shrink-0 rounded-full bg-pink"
                      />
                      <span className="text-sm leading-relaxed text-muted">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Container>
          </Section>
        ) : null}

        {packages.length > 0 ? (
          <Section tone="sunken">
            <Container>
              <div className="max-w-2xl">
                <Eyebrow>{t.services.packages}</Eyebrow>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                  {t.services.packagesTitle}
                </h2>
                <p className="prose-body mt-4">
                  {t.services.packagesLede}
                </p>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg, index) => (
                  <PackageCard
                    key={pkg.id}
                    serviceSlug={service.slug}
                    pkg={pkg}
                    featured={index === 1}
                  />
                ))}
              </div>
            </Container>
          </Section>
        ) : null}

        <Section>
          <Container>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Eyebrow>{t.services.faq}</Eyebrow>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                  {t.services.faqTitle}
                </h2>
              </div>

              <div className="lg:col-span-8 divide-y divide-border border-y border-border">
                {faq.map((item) => (
                  <details key={item.question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold marker:hidden">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="relative size-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                      >
                        <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rounded bg-current" />
                        <span className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 rounded bg-current" />
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        <section className="dark-surface bg-text py-16 text-background md:py-20">
          <Container>
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
                  {t.services.contactTitle}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-background/70">
                  {t.services.contactLede}
                </p>
              </div>
              <ButtonLink href={`/order/${service.slug}`} variant="cream" size="lg">
                {t.services.orderThis}
              </ButtonLink>
            </div>
          </Container>
        </section>
      </article>
    </>
  );
}
