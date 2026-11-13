import Image from "next/image";
import Link from "next/link";
import { Clock, RefreshCw } from "lucide-react";
import { CardAffordance, MediaFallback } from "@/components/common/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { cn, formatCurrency } from "@/lib/utils";
import type { Service } from "@/types/models";

/**
 * A bookable service.
 *
 * The thing a visitor needs before they enquire is the practical detail:
 * how long it takes, how many rounds it includes, and what it costs to
 * start. So the meta row and the starting price carry this card, and the
 * cover art is the decoration.
 *
 * The two icons stay because they name real things: the clock is the
 * turnaround, the refresh arrow is the revision rounds (R-04).
 */
export async function ServiceCard({
  service,
  className,
}: {
  service: Service;
  className?: string;
}) {
  const t = await getDictionary();
  const startingPrice = service.packages?.length
    ? Math.min(...service.packages.map((p) => p.price))
    : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.375rem_1rem_1.25rem_1.125rem] border-2 border-border-strong bg-surface-warm shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-sunken">
        {service.cover_image ? (
          <Image
            src={service.cover_image}
            alt={fill(t.common.coverArtwork, { title: service.title })}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <MediaFallback label={service.title} />
        )}
        <span
          aria-hidden="true"
          className="absolute top-4 left-4 size-3 rounded-full bg-pink"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl leading-snug font-semibold tracking-[-0.01em]">
          <Link
            href={`/services/${service.slug}`}
            className="inline-flex min-h-11 items-center after:absolute after:inset-0"
          >
            {service.title}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {service.description}
        </p>

        <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 font-label text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-3.5" />
            <dt className="sr-only">{t.common.typicalTurnaround}</dt>
            <dd>{fill(t.common.dayTurnaround, { count: service.turnaround_days })}</dd>
          </div>
          {service.revision_policy ? (
            <div className="flex items-center gap-1.5">
              <RefreshCw aria-hidden="true" className="size-3.5" />
              <dt className="sr-only">{t.common.revisionPolicy}</dt>
              <dd>{service.revision_policy}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          {startingPrice != null ? (
            <p className="font-label text-xs text-muted-foreground">
              {t.common.from}{" "}
              <span className="font-display text-base font-semibold text-text">
                {formatCurrency(startingPrice)}
              </span>
            </p>
          ) : (
            <span />
          )}
          <CardAffordance>{t.common.details}</CardAffordance>
        </div>
      </div>
    </article>
  );
}
