import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MessageSquare } from "lucide-react";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { ContactForm } from "@/components/forms/contact-form";
import { getDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.nav.contact,
    description:
      "Get in touch with ngantuqan about brand identity, content systems, presentation, UI/UX, or digital products.",
  };
}

export default async function ContactPage() {
  const t = await getDictionary();
  const settings = await getSiteSettings();

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-16 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>{t.contact.eyebrow}</Eyebrow>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance">
                {t.contact.title}
              </h1>
              <p className="prose-body-strong mt-6 max-w-xl">
                {t.contact.lede}
              </p>
            </div>

            <div className="lg:col-span-5 lg:pt-14">
              <dl className="space-y-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <Mail aria-hidden="true" className="size-4 text-primary" />
                  </span>
                  <div>
                    <dt className="eyebrow">{t.contact.email}</dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${settings.email}`}
                        className="font-display text-lg font-semibold text-text underline-offset-4 hover:underline"
                      >
                        {settings.email}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <Clock aria-hidden="true" className="size-4 text-primary" />
                  </span>
                  <div>
                    <dt className="eyebrow">{t.contact.responseTime}</dt>
                    <dd className="mt-1 font-display text-lg font-semibold">
                      {t.contact.responseValue}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-tint">
                    <MessageSquare aria-hidden="true" className="size-4 text-primary" />
                  </span>
                  <div>
                    <dt className="eyebrow">{t.contact.goodToInclude}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted">
                      {t.contact.goodToIncludeBody}
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
                <ContactForm />
              </div>
            </div>

            <aside className="lg:col-span-5 lg:pt-2">
              <div className="rounded-xl bg-pink-soft p-7">
                <h2 className="font-display text-xl font-semibold text-text">
                  {t.contact.packageTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t.contact.packageBody}
                </p>
                <Link
                  href="/services"
                  className="mt-5 inline-flex items-center gap-1.5 font-label text-sm font-medium text-text underline decoration-pink decoration-2 underline-offset-4 hover:underline"
                >
                  {t.contact.packageLink}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-surface p-7">
                <h2 className="font-display text-xl font-semibold">
                  {t.contact.templateTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t.contact.templateBody}
                </p>
                <Link
                  href="/shop"
                  className="mt-5 inline-flex items-center gap-1.5 font-label text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t.contact.templateLink}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
