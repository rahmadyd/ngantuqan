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
    <section className="relative isolate min-h-[580px] overflow-hidden bg-brand px-0 pt-24 pb-20 md:min-h-[660px] md:pt-32 md:pb-28">
      <Image
        src="/assets/hero-bg.webp"
        alt=""
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="object-cover object-[center_top_18%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/35 via-background/10 to-background/95"
      />
      {/* Gentle bottom fade into the warm cream page background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/70 to-transparent"
      />

      <Container className="relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {/* Eyebrow badge: high-contrast frosted paper pill */}
          <span className="inline-flex items-center rounded-full border-2 border-border-strong bg-surface/95 px-5 py-1.5 font-label text-xs font-bold uppercase tracking-wider text-text shadow-sm backdrop-blur-md">
            {t.hero.eyebrow}
          </span>

          <h1
            className="mt-6 max-w-4xl font-display text-[clamp(3rem,8.5vw,6.25rem)] leading-[0.98] font-bold tracking-tight text-balance text-background"
            style={{
              WebkitTextStroke: "3px var(--text)",
              textShadow:
                "0 4px 0 var(--text), 0 8px 24px rgba(36, 53, 44, 0.45)",
            }}
          >
            {t.hero.title}
          </h1>

          {/* Lede: frosted warm paper plate protecting text from the busy village houses */}
          <div className="mt-6 max-w-2xl rounded-2xl border-2 border-border-strong/70 bg-surface/90 px-6 py-4 shadow-sm backdrop-blur-md">
            <p className="text-center font-body text-base font-semibold leading-relaxed text-text md:text-lg">
              {t.hero.lede}
            </p>
          </div>

          {/* CTA & secondary contact link */}
          <div className="mt-8 flex flex-col items-center gap-3.5">
            <ButtonLink
              href="/work"
              size="lg"
              className="rounded-full border-[2.5px] border-text bg-surface px-10 py-3.5 font-display text-base font-bold tracking-wide text-text shadow-[0_4px_0_#24352c] transition-all duration-150 hover:translate-y-1 hover:shadow-none active:translate-y-1 active:shadow-none"
            >
              {t.hero.ctaDiscover}
            </ButtonLink>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center rounded-full border border-border-strong/60 bg-surface/90 px-5 font-label text-xs font-bold uppercase tracking-wider text-text shadow-xs backdrop-blur-sm transition-all hover:border-primary hover:bg-surface hover:text-primary"
            >
              {t.hero.ctaContact}
            </Link>
          </div>

          {stats.length > 0 ? (
            <dl className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-4 border-t-2 border-border-strong/60 pt-7 md:gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="eyebrow text-text">{statLabels[stat.label]}</dt>
                  <dd className="mt-1.5 font-display text-2xl font-semibold text-text md:text-3xl">
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
