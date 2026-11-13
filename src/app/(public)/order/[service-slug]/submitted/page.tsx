import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { StatusPill } from "@/components/admin/status-pill";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServiceBySlug } from "@/lib/queries/content";
import { formatDate } from "@/lib/utils";

type Params = Promise<{ "service-slug": string }>;
type SearchParams = Promise<{ order?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.order.briefReceived,
    // Transactional — never indexed, and never cached.
    robots: { index: false, follow: false },
  };
}

const NEXT_STEPS = [
  {
    title: "We read the brief",
    body: "A studio member goes through it and writes down what is clear and what is not.",
  },
  {
    title: "We reply with questions",
    body: "Usually within two working days, to your email address, with anything we still need.",
  },
  {
    title: "You get a fixed quote",
    body: "Scope, price, and delivery date in writing. Nothing is charged until you approve it.",
  },
];

export default async function OrderSubmittedPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  // This page must never be prerendered or cached — it is per-order.
  await connection();

  const { "service-slug": slug } = await params;
  const { order: orderNumber } = await searchParams;

  if (!orderNumber) notFound();

  const locale = await getLocale();
  const t = await getDictionary();

  const service = await getServiceBySlug(slug, locale);
  if (!service) notFound();

  // The order is read with the service-role key because a visitor is not
  // signed in, and RLS only lets the owner or an admin read service orders.
  // Only non-identifying fields are selected — the brief itself never leaves
  // this page, and a guessed order number reveals nothing about the client.
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("service_orders")
    .select("id, order_number, order_status, created_at, service_id, package_id")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order || order.service_id !== service.id) notFound();

  const { data: pkg } = order.package_id
    ? await admin
        .from("service_packages")
        .select("name")
        .eq("id", order.package_id)
        .maybeSingle()
    : { data: null };

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mx-auto max-w-2xl">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-surface">
            <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
          </span>

          <Eyebrow>{t.order.briefReceived}</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
            {t.order.thanks}
          </h1>
          <p className="prose-body-strong mt-5">
            {t.order.lede}
          </p>

          <dl className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface px-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">{t.order.reference}</dt>
              <dd className="font-label font-semibold text-text">
                {order.order_number}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">{t.services.serviceFallback}</dt>
              <dd className="font-label text-sm text-text">{service.title}</dd>
            </div>
            {pkg ? (
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="eyebrow">{t.order.form.package}</dt>
                <dd className="font-label text-sm text-text">{pkg.name}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">Status</dt>
              <dd>
                <StatusPill value={order.order_status} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="eyebrow">Received</dt>
              <dd className="font-label text-sm text-text">
                {formatDate(order.created_at)}
              </dd>
            </div>
          </dl>

          <ol className="mt-10 space-y-6">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-tint font-label text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-display text-base font-semibold">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-8">
            <p className="flex items-center gap-2 font-label text-xs text-muted">
              <Mail aria-hidden="true" className="size-4" />
              Keep the reference for your records.
            </p>
            <p className="flex items-center gap-2 font-label text-xs text-muted">
              <Clock aria-hidden="true" className="size-4" />
              {t.contact.responseValue}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/services"
              className="font-label text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t.services.allServices}
            </Link>
            <Link
              href="/contact"
              className="font-label text-sm font-medium text-muted-foreground underline-offset-4 hover:text-text hover:underline"
            >
              {t.nav.contact}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
