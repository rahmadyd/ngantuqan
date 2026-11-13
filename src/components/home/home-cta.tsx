import { Container } from "@/components/layout/primitives";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";

export async function HomeCta() {
  const t = await getDictionary();

  return (
    <section className="dark-surface bg-text py-20 text-background md:py-32">
      <Container>
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-background/70">{t.cta.eyebrow}</p>
            <h2 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] font-semibold tracking-[-0.025em] text-balance">
              {t.cta.title1}
              <br />
              {t.cta.title2}
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-background/70">
              {t.cta.lede}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/contact"
              variant="cream"
              size="lg"
              className="rounded-full border-2 border-border-strong px-8 font-display font-bold shadow-xs transition-transform duration-150 hover:scale-105 active:scale-100"
            >
              {t.cta.button}
            </ButtonLink>
            <ButtonLink
              href="/services"
              variant="ghost"
              size="lg"
              className="rounded-full border-2 border-background/25 px-8 font-display font-semibold text-background transition-colors hover:bg-background/10"
            >
              {t.cta.secondary}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
