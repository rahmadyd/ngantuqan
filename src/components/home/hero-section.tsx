import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/primitives";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Service } from "@/types/models";

type HeroStat = { label: string; value: string };

function buildHeroStats(services: Service[], t: Dictionary): HeroStat[] {
  const stats: HeroStat[] = [];

  if (services.length > 0) {
    stats.push({ label: "services", value: String(services.length) });
  }

  const turnarounds = services
    .map((service) => service.turnaround_days)
    .filter((days) => typeof days === "number" && days > 0)
    .sort((a, b) => a - b);

  if (turnarounds.length > 0) {
    const mid = Math.floor(turnarounds.length / 2);
    const median =
      turnarounds.length % 2 === 0
        ? Math.round((turnarounds[mid - 1] + turnarounds[mid]) / 2)
        : turnarounds[mid];
    stats.push({
      label: "delivery",
      value: fill(t.common.days, { count: median }),
    });
  }

  const rounds = services
    .map((service) => service.revision_policy?.match(/(\d+)/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);

  if (services.length > 0 && rounds.length === services.length) {
    const min = Math.min(...rounds);
    const max = Math.max(...rounds);
    stats.push({
      label: "revisions",
      value:
        min === max
          ? `${min}`
          : fill(t.common.range, { from: min, to: max }),
    });
  }

  return stats;
}

export async function HeroSection({ services }: { services: Service[] }) {
  const t = await getDictionary();
  const stats = buildHeroStats(services, t);
  const statLabels: Record<string, string> = {
    services: t.hero.statServices,
    delivery: t.hero.statDelivery,
    revisions: t.hero.statRevisions,
  };

  return (
    <section className="relative isolate min-h-[760px] overflow-hidden bg-background px-0 pt-0 pb-0 md:min-h-[900px] lg:min-h-[720px]">
      <div className="absolute inset-x-0 bottom-0 h-[300px] md:h-[360px] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[62%]">
        <Image
          src="/assets/hero-bg.webp"
          alt=""
          fill
          sizes="(max-width: 1023px) 100vw, 62vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover object-[center_58%] md:object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/25 lg:to-transparent"
        />
      </div>

      <Container className="relative z-10 flex min-h-[760px] items-start pb-[320px] pt-16 md:min-h-[900px] md:pb-[380px] md:pt-28 lg:min-h-[720px] lg:items-center lg:pb-24 lg:pt-28">
        <div className="w-full max-w-xl">
          <p className="eyebrow text-primary">{t.hero.eyebrow}</p>

          <h1 className="mt-5 max-w-2xl font-display text-[clamp(3.75rem,10vw,7rem)] leading-[0.9] font-bold tracking-[-0.04em] text-balance text-text">
            {t.hero.title}
          </h1>

          <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-muted md:text-xl">
            {t.hero.lede}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink
              href="/work"
              size="lg"
              className="rounded-full border-2 border-text bg-primary px-8 font-display text-base font-bold text-on-primary shadow-[0_4px_0_#24352c] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_5px_0_#24352c] active:translate-y-0.5 active:shadow-[0_2px_0_#24352c]"
            >
              {t.hero.ctaDiscover}
            </ButtonLink>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center border-b-2 border-transparent px-1 font-label text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
            >
              {t.hero.ctaContact}
            </Link>
          </div>

          {stats.length > 0 ? (
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-5 border-t border-border-strong/70 pt-6">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="eyebrow">{statLabels[stat.label]}</dt>
                  <dd className="mt-1 font-display text-2xl font-semibold text-text">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
