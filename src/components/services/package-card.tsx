import { Check, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { formatCurrency } from "@/lib/utils";
import type { ServicePackage } from "@/types/models";

export async function PackageCard({
  serviceSlug,
  pkg,
  featured = false,
}: {
  serviceSlug: string;
  pkg: ServicePackage;
  featured?: boolean;
}) {
  const t = await getDictionary();

  return (
    <div
      className={
        featured
          ? "relative flex flex-col rounded-xl border-2 border-text bg-surface p-6 shadow-md"
          : "relative flex flex-col rounded-lg border border-border bg-surface p-6 shadow-sm"
      }
    >
      {featured ? (
        <Badge variant="pink" className="absolute -top-3 left-6">
          {t.services.mostPopular}
        </Badge>
      ) : null}

      <h3 className="font-display text-xl font-semibold">{pkg.name}</h3>
      {pkg.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {pkg.description}
        </p>
      ) : null}

      <p className="mt-6 font-display text-[2rem] leading-none font-semibold">
        {formatCurrency(pkg.price)}
      </p>
      <p className="mt-1.5 font-label text-xs text-muted-foreground">
        {t.services.fixedPrice}
      </p>

      <ul className="mt-6 space-y-3 border-t border-border pt-6">
        {pkg.features?.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary"
            />
            <span className="text-muted">{feature}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2.5 border-t border-border pt-5 font-label text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <RefreshCw aria-hidden="true" className="size-3.5" />
            {t.services.revisions}
          </dt>
          <dd className="font-medium text-text">
            {pkg.revision_count}{" "}
            {pkg.revision_count === 1 ? t.services.round : t.services.rounds}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Clock aria-hidden="true" className="size-3.5" />
            {t.services.delivery}
          </dt>
          <dd className="font-medium text-text">
            {fill(t.services.daysValue, { count: pkg.delivery_days })}
          </dd>
        </div>
      </dl>

      <div className="mt-7 pt-2">
        <ButtonLink
          href={`/order/${serviceSlug}?package=${pkg.id}`}
          variant={featured ? "primary" : "outline"}
          size="md"
          className="w-full"
        >
          {t.services.orderPackage}
        </ButtonLink>
      </div>
    </div>
  );
}
