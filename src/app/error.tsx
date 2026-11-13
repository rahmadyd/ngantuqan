"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-xl px-5 text-center">
        <p className="font-display text-[clamp(3rem,10vw,5rem)] leading-none font-semibold text-pink">
          Oops
        </p>
        <h1 className="mt-6 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
          {t.errors.notFoundHeading}
        </h1>
        <p className="prose-body mx-auto mt-4">{t.errors.notFoundBodyLong}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>{t.errors.tryAgain}</Button>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/");
            }}
          >
            {t.errors.goHome}
          </Button>
        </div>

        {error.digest ? (
          <p className="mt-8 font-label text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </section>
  );
}
