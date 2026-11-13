/**
 * The languages the studio publishes in.
 *
 * English is the source: every record and every string starts in English, and
 * a locale falls back to English when a translation does not exist yet.
 */
export const LOCALES = ["en", "id"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** The cookie that remembers the visitor's language. */
export const LOCALE_COOKIE = "ngantuqan_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

/** The language tag written into the html element. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  id: "id",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
