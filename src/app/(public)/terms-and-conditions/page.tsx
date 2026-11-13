import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.legal.termsTitle,
    description:
      "The terms that apply when you use the ngantuqan website, commission design work, or buy digital products.",
  };
}

export default async function TermsPage() {
  const t = await getDictionary();

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>{t.legal.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.025em]">
            {t.legal.termsTitle}
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
                Using this site
              </h2>
              <p className="mt-3">
                You may browse, read, and share this website freely. You may
                not copy the design, the written content, or the downloadable
                products in a way that competes with us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Commissioning design work
              </h2>
              <p className="mt-3">
                Every engagement begins with a written scope stating the
                deliverables, the fixed price, the revision rounds, and the
                delivery date. Work begins once the scope is approved and
                payment is confirmed. Changes to the scope are quoted before
                they are made.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Revisions
              </h2>
              <p className="mt-3">
                Each package states how many revision rounds it includes. A
                revision round is a consolidated set of feedback on the
                delivered work. Requests outside the stated scope are quoted
                separately.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Ownership and licensing
              </h2>
              <p className="mt-3">
                On full payment, you own the final deliverables we produce for
                you, including editable source files. We keep the right to show
                the work in our portfolio unless you ask us not to.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Digital products
              </h2>
              <p className="mt-3">
                Digital products are licensed, not sold. The licence that
                applies to each product is listed on its page and set out in
                full in our{" "}
                <a
                  href="/digital-product-license"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Digital Product Licence
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Liability
              </h2>
              <p className="mt-3">
                We provide the work with reasonable skill and care. Our total
                liability for any claim relating to a project is limited to the
                fee you paid for that project. Nothing here limits liability
                that cannot lawfully be limited.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                Changes
              </h2>
              <p className="mt-3">
                We may update these terms. The version that applies to your
                purchase is the one published when you bought.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
