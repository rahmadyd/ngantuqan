import { Container, Section, SectionHeading } from "@/components/layout/primitives";
import { getDictionary } from "@/lib/i18n/server";

export async function WhyWorkWithUs() {
  const t = await getDictionary();

  return (
    <Section tone="sunken">
      <Container>
        <SectionHeading
          eyebrow={t.why.eyebrow}
          title={t.why.title}
          align="center"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.reasons.map((reason, index) => (
            <div
              key={reason.title}
              className="rounded-[1.375rem_1rem_1.25rem_1.125rem] border-2 border-border-strong bg-surface-warm p-6 shadow-sm transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary"
            >
              <p className="font-display text-3xl font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-lg font-semibold">
                {reason.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">
                {reason.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
