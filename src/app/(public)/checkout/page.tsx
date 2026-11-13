import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.checkout.title,
    description: "Review your cart and place the order.",
    // Transactional, never indexed.
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const t = await getDictionary();

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-14 md:py-16">
        <Container>
          <Eyebrow>{t.checkout.eyebrow}</Eyebrow>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
            {t.checkout.heading}
          </h1>
          <p className="prose-body-strong mt-5 max-w-xl">{t.checkout.lede}</p>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <CheckoutForm />
        </Container>
      </section>
    </>
  );
}
