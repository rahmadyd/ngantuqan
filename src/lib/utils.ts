import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Studio currency. Sourced from site_settings at runtime; this constant is
 * the build-time fallback (see docs/02-technical-architecture.md).
 */
export const DEFAULT_CURRENCY = "IDR";
export const DEFAULT_LOCALE = "id-ID";

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "–";
  // Intl renders the id-ID currency symbol with a non-breaking space
  // ("Rp<NBSP>275.000"), which is intentional: it keeps the symbol from
  // wrapping onto its own line.
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string = DEFAULT_LOCALE,
) {
  if (!value) return "–";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * A one-line summary of a content block.
 *
 * The blocks are stored as JSON, but the studio reads words — the list shows
 * the headline, not the object. The editor still shows the JSON.
 */
export function summariseContentBlock(value: unknown): string {
  const PREFERRED_KEYS = [
    "headline",
    "title",
    "heading",
    "name",
    "label",
    "eyebrow",
    "tagline",
    "body",
    "description",
  ];

  if (typeof value === "string") return excerpt(value, 120);

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const block = value as Record<string, unknown>;

    for (const key of PREFERRED_KEYS) {
      const candidate = block[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return excerpt(candidate, 120);
      }
    }

    // A list of items — social links, packages, features — shows its names.
    for (const [key, item] of Object.entries(block)) {
      if (!Array.isArray(item) || item.length === 0) continue;

      const names = item
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object") {
            const row = entry as Record<string, unknown>;
            const label =
              row.platform ?? row.title ?? row.name ?? row.label ?? row.url;
            return typeof label === "string" ? label : null;
          }
          return null;
        })
        .filter((entry): entry is string => Boolean(entry));

      if (names.length > 0) {
        const label = key === "items" ? "" : `${key.replace(/_/g, " ")}: `;
        return `${label}${names.join(", ")}`;
      }
    }
  }

  return "–";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Shortens a text for a card.
 *
 * The cut lands on a word boundary — a card that ends in "colour…" reads
 * better than one that ends in "a colour sys…".
 */
export function excerpt(value: string, length = 160) {
  const text = value.trim();

  if (text.length <= length) return text;

  const cut = text.slice(0, length);
  const lastSpace = cut.lastIndexOf(" ");

  return `${cut.slice(0, lastSpace > 0 ? lastSpace : length).trimEnd()}…`;
}

/**
 * Parses a ?page= value into a positive integer.
 *
 * Number(undefined) is NaN, and NaN ?? 1 is still NaN — so the fallback has
 * to be explicit. Math.max(1, NaN) is NaN, which would silently produce an
 * empty result set instead of the first page.
 */
export function parsePageParam(value: string | undefined | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}
