import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { id } from "./dictionaries/id";
import type { Dictionary } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = { en, id };

/**
 * The visitor's language.
 *
 * Read from a cookie so the choice survives a reload, a new tab and a return
 * visit. English is the fallback: the site is always readable, even before
 * the visitor picks.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/**
 * The dictionary for the visitor's language.
 *
 * Wrapped in React's cache, so one request reads the cookie and the
 * dictionary once, however many components ask for them.
 */
export const getDictionary = cache(async (): Promise<Dictionary> => {
  const locale = await getLocale();
  return dictionaries[locale];
});
