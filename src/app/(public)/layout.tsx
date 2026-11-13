import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/queries/content";

/**
 * The public pages are rendered on every request.
 *
 * The catalogue changes whenever the studio edits it, so the pages must not
 * be frozen into the build. The data itself is cached for a minute and
 * dropped by an admin write, which keeps a render cheap without making it
 * stale.
 */
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dictionary = await getDictionary();
  const settings = await getSiteSettings(locale);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-label focus:text-sm focus:text-on-primary"
      >
        {dictionary.nav.skipToContent}
      </a>
      <SiteHeader settings={settings} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
