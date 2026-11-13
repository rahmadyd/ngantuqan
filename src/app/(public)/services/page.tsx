import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { ServiceCard } from "@/components/services/service-card";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getActiveServices } from "@/lib/queries/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.nav.services,
    description: t.services.metaDescription,
  };
}

export default async function ServicesPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const services = await getActiveServices(locale);

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-16 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>{t.services.eyebrow}</Eyebrow>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance">
                {t.services.title}
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pt-12">
              <p className="prose-body">{t.services.lede}</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                className={index < 3 ? "lg:col-span-4" : "lg:col-span-6"}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
