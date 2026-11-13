"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function ProjectFilters({
  categories,
  activeCategory,
  activeSearch,
}: {
  categories: { id: string; name: string; slug: string }[];
  activeCategory?: string;
  activeSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(activeSearch ?? "");
  const [lastAppliedSearch, setLastAppliedSearch] = useState(activeSearch);

  // Reset the field when the URL changes from outside (back button, a link).
  // Adjusting state during render is React's documented alternative to an
  // effect for this case.
  if (activeSearch !== lastAppliedSearch) {
    setLastAppliedSearch(activeSearch);
    setTerm(activeSearch ?? "");
  }

  const apply = useCallback(
    (next: { category?: string; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.category === undefined) {
        params.delete("category");
      } else if (next.category) {
        params.set("category", next.category);
      }

      if (next.q === undefined) {
        params.delete("q");
      } else if (next.q) {
        params.set("q", next.q);
      }

      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/work?${query}` : "/work", { scroll: false });
      });
    },
    [router, searchParams],
  );

  // Debounced search — the URL is the source of truth, so results are shareable
  useEffect(() => {
    const current = activeSearch ?? "";
    if (term === current) return;

    const timer = setTimeout(() => {
      apply({ q: term.trim() });
    }, 350);

    return () => clearTimeout(timer);
  }, [term, activeSearch, apply]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => apply({ category: undefined })}
          aria-pressed={!activeCategory}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full border-2 px-4 font-label text-sm font-medium transition-all duration-150",
            !activeCategory
              ? "border-primary bg-primary text-on-primary font-semibold shadow-xs"
              : "border-border-strong/60 bg-surface text-muted hover:border-primary hover:text-text",
          )}
        >
          {t.work.filterAll}
        </button>

        {categories.map((category) => {
          const active = activeCategory === category.slug;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => apply({ category: category.slug })}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border-2 px-4 font-label text-sm font-medium transition-all duration-150",
                active
                  ? "border-primary bg-primary text-on-primary font-semibold shadow-xs"
                  : "border-border-strong/60 bg-surface text-muted hover:border-primary hover:text-text",
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t.work.searchPlaceholder}
          aria-label={t.work.searchLabel}
          className={cn(
            "h-11 w-full rounded-md border border-border bg-surface pr-10 pl-10 text-sm text-text shadow-xs transition-colors duration-150",
            "placeholder:text-muted-foreground/70",
            "focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary",
          )}
        />
        {term ? (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label={t.common.clearSearch}
            className="absolute top-1/2 right-3 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-text"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
        {isPending ? (
          <span className="sr-only" role="status">
            {t.common.updatingResults}
          </span>
        ) : null}
      </div>
    </div>
  );
}
