import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.legal.refundTitle,
    description:
      "The refund policy for digital products purchased from ngantuqan, and how refunds work on commissioned design work.",
  };
}

export default async function RefundPolicyPage() {
  const t = await getDictionary();

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>{t.legal.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.025em]">
            {t.legal.refundTitle}
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
                Digital products
              </h2>
              <p className="mt-3">
                Because digital products are delivered instantly and cannot be
                returned, we cannot offer refunds once a download link has
                been issued. If a file is broken, corrupted, or materially
                different from its description, contact us within 14 days and
                we will replace it or refund it.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Commissioned design work
              </h2>
              <p className="mt-3">
                If we cannot deliver the agreed scope by the agreed date, you
                are entitled to a full refund. If you cancel before work
                begins, we refund the deposit less any work already completed
                and approved.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                How to raise a refund request
              </h2>
              <p className="mt-3">
                Email{" "}
                <a
                  href="mailto:hello@ngantuqan.studio"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  hello@ngantuqan.studio
                </a>{" "}
                with your order number and the reason. We respond within five
                working days.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
