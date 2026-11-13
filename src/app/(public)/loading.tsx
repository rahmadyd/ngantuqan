import { Container } from "@/components/layout/primitives";
import { Skeleton } from "@/components/ui/feedback";
import { getDictionary } from "@/lib/i18n/server";

/**
 * The public routes are rendered on every request, so the browser can sit on
 * an empty page while the catalogue is queried. This is the shape of what is
 * coming, at the dimensions the real page uses, so nothing jumps when the
 * content lands (R-27).
 */
export default async function PublicLoading() {
  const t = await getDictionary();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="py-16 md:py-24"
    >
      <span className="sr-only">{t.common.loading}</span>
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-5 h-11 w-full max-w-lg" />
            <Skeleton className="mt-3 h-11 w-full max-w-md" />
          </div>
          <div className="lg:col-span-5 lg:pt-12">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-3 h-4 w-3/4" />
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-surface-sunken" />
              <div className="p-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
