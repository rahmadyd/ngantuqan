import { Container, Section, SectionHeading } from "@/components/layout/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { getDictionary } from "@/lib/i18n/server";
import type { Testimonial } from "@/types/models";

export async function Testimonials({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const t = await getDictionary();

  return (
    <Section tone="sunken">
      <Container>
        <SectionHeading
          eyebrow={t.testimonials.eyebrow}
          title={t.testimonials.title}
          align="center"
        />

        {testimonials.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 3).map((testimonial) => (
              <figure
                key={testimonial.id}
                className="flex flex-col rounded-[1.5rem_1rem_1.375rem_1.125rem] border-2 border-border-strong bg-surface-warm p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary"
              >
                {/* The quote mark is set in the display face rather than
                    borrowed from an icon library, so the identity carries it
                    (R-04). It is decorative; the words carry the meaning. */}
                <span
                  aria-hidden="true"
                  className="font-display text-5xl leading-none font-semibold text-pink"
                >
                  &ldquo;
                </span>
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-text">
                  {testimonial.content}
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-4">
                  <p className="font-display text-base font-semibold">
                    {testimonial.customer_name}
                  </p>
                  {testimonial.customer_role ? (
                    <p className="mt-0.5 font-label text-xs text-muted-foreground">
                      {testimonial.customer_role}
                    </p>
                  ) : null}
                  {testimonial.project ? (
                    <p className="mt-2 font-label text-xs text-muted">
                      {testimonial.project.title}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-12"
            title={t.testimonials.emptyTitle}
            description={t.testimonials.emptyDescription}
          />
        )}
      </Container>
    </Section>
  );
}
