import Link from "next/link";
import { Container, Eyebrow, Section } from "@/components/layout/primitives";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";

export async function StudioIntro() {
  const t = await getDictionary();

  return (
    <Section>
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Eyebrow>{t.studio.eyebrow}</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(1.875rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
              {t.studio.title}
            </h2>
            <div className="prose-body mt-6 space-y-4">
              <p>{t.studio.body1}</p>
              <p>{t.studio.body2}</p>
            </div>
            <ButtonLink
              href="/about"
              variant="outline"
              size="sm"
              className="mt-8 rounded-full border-2 border-border-strong bg-surface px-6 font-semibold shadow-xs transition-transform duration-150 hover:scale-105 active:scale-100"
            >
              {t.studio.button}
            </ButtonLink>
          </div>

          <div className="lg:col-span-5 lg:pt-16">
            <div className="relative rounded-[1.5rem_1rem_1.375rem_1.125rem] border-2 border-border-strong bg-surface-warm p-8 shadow-xs">
              <div
                aria-hidden="true"
                className="absolute -top-3 -right-3 size-10 rounded-full border-2 border-border-strong bg-pink"
              />
              <blockquote className="relative">
                <p className="font-display text-2xl leading-snug font-medium text-balance text-text">
                  &ldquo;{t.studio.quote}&rdquo;
                </p>
                <footer className="mt-6 font-label text-sm font-medium text-muted">
                  {t.studio.quoteAttribution}
                </footer>
              </blockquote>
            </div>
            <p className="mt-6 font-label text-sm text-muted">
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center gap-1.5 underline-offset-4 hover:text-text hover:underline"
              >
                {t.studio.link}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
