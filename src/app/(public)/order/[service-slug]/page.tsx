import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { OrderBriefForm } from "@/components/forms/order-brief-form";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { getServiceBySlug } from "@/lib/queries/content";
import { getSession } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type Params = Promise<{ "service-slug": string }>;
type SearchParams = Promise<{ package?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { "service-slug": slug } = await params;
  const locale = await getLocale();
  const t = await getDictionary();
  const service = await getServiceBySlug(slug, locale);

  if (!service) return { title: t.order.notFound };

  return {
    title: fill(t.order.pageTitle, { service: service.title }),
    description: `Send a project brief for ${service.title}. Get a fixed quote and a timeline back within two working days.`,
    // Transactional — thin content, one page per service.
    robots: { index: false, follow: true },
  };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { "service-slug": slug } = await params;
  const { package: packageId } = await searchParams;

  const locale = await getLocale();
  const t = await getDictionary();

  const service = await getServiceBySlug(slug, locale);
  if (!service) notFound();

  const packages = service.packages ?? [];

  // Only a package that belongs to this service can be pre-selected.
  const selectedPackage =
    packages.find((pkg) => pkg.id === packageId) ?? null;

  // A signed-in customer does not retype their details.
  const session = await getSession();
  let defaultName = "";
  let defaultEmail = "";

  if (session) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", session.userId)
      .maybeSingle();

    defaultName = profile?.full_name ?? "";
    defaultEmail = profile?.email ?? "";
  }

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-14 md:py-16">
        <Container>
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex items-center gap-1.5 font-label text-sm text-muted transition-colors hover:text-text"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {fill(t.order.backToService, { service: service.title })}
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Eyebrow>{t.order.projectBrief}</Eyebrow>
                <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
                  {fill(t.services.orderTitle, {
                    title: service.title.toLowerCase(),
                  })}
                </h1>
                <p className="prose-body-strong mt-5 max-w-xl">
                  {t.services.orderLede}
                </p>
              </div>

            <div className="lg:col-span-5 lg:pt-12">
              <dl className="space-y-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <Clock aria-hidden="true" className="size-4 text-primary" />
                  </span>
                  <div>
                    <dt className="eyebrow">{t.services.turnaround}</dt>
                    <dd className="mt-1 font-display text-lg font-semibold">
                      {fill(t.services.daysValue, {
                        count: service.turnaround_days,
                      })}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                  </span>
                  <div>
                    <dt className="eyebrow">{t.order.noPaymentYet}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted">
                      {t.order.form.noPayment}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-border bg-surface p-6 shadow-sm md:p-8">
                <OrderBriefForm
                  serviceId={service.id}
                  serviceTitle={service.title}
                  packages={packages}
                  selectedPackageId={selectedPackage?.id ?? null}
                  defaultName={defaultName}
                  defaultEmail={defaultEmail}
                />
              </div>
            </div>

            {/* The brief is a long form — the summary stays in view while it
                is being filled in. */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start lg:pt-2">
              <div className="rounded-xl border border-border bg-surface p-7 shadow-sm">
                <h2 className="font-display text-xl font-semibold">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>

                {packages.length > 0 ? (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="eyebrow">{t.services.packages}</p>
                    <ul className="mt-3 space-y-3">
                      {packages.map((pkg) => (
                        <li
                          key={pkg.id}
                          className="flex items-baseline justify-between gap-4 text-sm"
                        >
                          <span className="text-muted">{pkg.name}</span>
                          <span className="font-label font-medium tabular-nums text-text">
                            {formatCurrency(pkg.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted">
                      {t.order.form.packageUnsure}
                    </p>
                  </div>
                ) : null}

                {service.deliverables && service.deliverables.length > 0 ? (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="eyebrow">{t.order.requiredDeliverables}</p>
                    <ul className="mt-3 space-y-2">
                      {service.deliverables.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-sm text-muted"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pink"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
