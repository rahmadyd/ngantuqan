import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.legal.privacyTitle,
    description:
      "How ngantuqan collects, uses, and protects the information you share through this website.",
  };
}

export default async function PrivacyPolicyPage() {
  const t = await getDictionary();

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>{t.legal.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.025em]">
            {t.legal.privacyTitle}
          </h1>
          <p className="mt-4 font-label text-sm text-muted-foreground">
            {fill(t.common.lastUpdated, { date: formatDate("2026-01-01") })}
          </p>
          <p className="font-label text-xs text-muted-foreground">
            {t.common.notTranslated}
          </p>

          <div className="prose-body mt-10 space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                What we collect
              </h2>
              <p className="mt-3">
                When you send us an inquiry, request a service, or buy a digital
                product, we collect the name, email address, and details you
                provide. We also record which pages you visit so we can see
                what content is useful.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                How we use it
              </h2>
              <p className="mt-3">
                We use your information to respond to your enquiry, deliver the
                work you have commissioned, deliver products you have bought,
                and improve this website. We do not sell it, and we do not use
                it for third-party advertising.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                How long we keep it
              </h2>
              <p className="mt-3">
                Inquiries are kept for two years so we can pick up a
                conversation where we left it. Orders and their records are
                kept for as long as tax and accounting rules require.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Downloads
              </h2>
              <p className="mt-3">
                Download links for purchased products are signed and short-lived.
                We record the number of times a file has been downloaded against
                your order so we can support you if something goes wrong.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Your rights
              </h2>
              <p className="mt-3">
                You can ask to see the information we hold about you, ask us to
                correct it, or ask us to delete it. Write to us and we will
                action it.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Contact
              </h2>
              <p className="mt-3">
                Questions about this policy go to{" "}
                <a
                  href="mailto:hello@ngantuqan.studio"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  hello@ngantuqan.studio
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
