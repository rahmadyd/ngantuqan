import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * The translated wording of a record, keyed by language.
 *
 * Only the fields the studio has translated are present. Everything else
 * falls back to the English text on the row itself.
 */
export type Translations = Record<string, Record<string, unknown>>;

/**
 * Applies the visitor's language to a record.
 *
 * The row is copied, never mutated: the same record is read for many
 * visitors, and the cache hands the same object to every one of them.
 */
export function applyTranslations<T extends Record<string, unknown>>(
  row: T,
  translations: unknown,
  locale: Locale,
  fields: readonly (keyof T)[],
): T {
  if (locale === DEFAULT_LOCALE) return row;

  const table = (translations as Translations | null | undefined)?.[locale];
  if (!table) return row;

  const next: T = { ...row };

  for (const field of fields) {
    const value = table[field as string];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    next[field] = value as T[keyof T];
  }

  return next;
}
