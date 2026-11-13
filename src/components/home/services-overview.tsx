import { Container, Section, SectionHeading } from "@/components/layout/primitives";
import { ServiceCard } from "@/components/services/service-card";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/feedback";
import { getDictionary } from "@/lib/i18n/server";
import type { Service } from "@/types/models";

export async function ServicesOverview({ services }: { services: Service[] }) {
  const t = await getDictionary();

  return (
    <Section tone="sunken">
      <Container>
        <SectionHeading
          eyebrow={t.servicesOverview.eyebrow}
          title={t.servicesOverview.title}
          lede={t.servicesOverview.lede}
        />

        {services.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
            {services.slice(0, 5).map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                // Three across, then two across. Five cards in three columns
                // used to leave an empty cell the width of a whole card.
                className={index < 3 ? "lg:col-span-4" : "lg:col-span-6"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-12"
            title={t.servicesOverview.emptyTitle}
            description={t.servicesOverview.emptyDescription}
            action={
              <ButtonLink href="/services" variant="outline">
                {t.nav.services}
              </ButtonLink>
            }
          />
        )}
      </Container>
    </Section>
  );
}
