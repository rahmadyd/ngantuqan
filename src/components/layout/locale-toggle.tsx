"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALE_COOKIE,
  LOCALE_LABELS,
  LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { IndonesiaFlag, UnitedStatesFlag } from "@/components/layout/flags";

const FLAGS: Record<Locale, (props: { className?: string }) => React.ReactElement> = {
  id: IndonesiaFlag,
  en: UnitedStatesFlag,
};

/**
 * The language toggle.
 *
 * Two flags, one for each language the studio publishes in. Choosing a
 * language writes a cookie and asks the server to render again, so the whole
 * page, including the content from the database, arrives in that language.
 *
 * The flags are decorative: each button carries the language name in its
 * accessible label, which is what a screen reader announces.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { locale, t } = useLocale();
  const [requested, setRequested] = useState<Locale | null>(null);

  // The cookie is written in an effect rather than in the click handler: the
  // handler records the choice, and the effect is what puts it on the page.
  useEffect(() => {
    if (!requested || requested === locale) return;

    document.cookie = `${LOCALE_COOKIE}=${requested}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }, [requested, locale, router]);

  function choose(next: Locale) {
    if (next === locale) return;
    setRequested(next);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5",
        pending && "opacity-60",
        className,
      )}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        const Flag = FLAGS[code];

        return (
          <button
            key={code}
            type="button"
            onClick={() => choose(code)}
            aria-pressed={active}
            aria-label={fill(t.nav.switchTo, {
              language: LOCALE_LABELS[code],
            })}
            lang={code}
            className={cn(
              "flex size-11 items-center justify-center overflow-hidden rounded-sm transition-opacity duration-150",
              active
                ? "opacity-100 ring-1 ring-primary"
                : "opacity-50 hover:opacity-100",
            )}
          >
            <Flag className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
