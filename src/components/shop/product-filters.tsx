"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const SORTS = ["newest", "price-asc", "price-desc"] as const;

export function ProductFilters({
  categories,
  activeCategory,
  activeSearch,
  activeSort,
}: {
  categories: { id: string; name: string; slug: string }[];
  activeCategory?: string;
  activeSearch?: string;
  activeSort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [, startTransition] = useTransition();
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
    (next: { category?: string; q?: string; sort?: string }) => {
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

      if (next.sort === undefined) {
        params.delete("sort");
      } else if (next.sort) {
        params.set("sort", next.sort);
      }

      params.delete("page");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/shop?${query}` : "/shop", { scroll: false });
      });
    },
    [router, searchParams],
  );

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
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            {t.shop.filterAll}
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

        <label className="flex items-center gap-2">
          <span className="font-label text-xs text-muted-foreground">
            {t.shop.sort}
          </span>
          <select
            value={activeSort ?? "newest"}
            onChange={(event) => apply({ sort: event.target.value })}
            className="h-10 rounded-md border border-border bg-surface px-3 pr-8 font-label text-sm text-text transition-colors focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {t.shop[`sort${sort === "newest" ? "Newest" : sort === "price-asc" ? "PriceAsc" : "PriceDesc"}`]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="product-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t.shop.searchPlaceholder}
          aria-label={t.shop.searchLabel}
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
      </div>
    </div>
  );
}
