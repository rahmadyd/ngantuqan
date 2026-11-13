import Link from "next/link";
import { Container } from "@/components/layout/primitives";
import { Logo } from "@/components/layout/logo";
import { shouldPrefetch } from "@/lib/prefetch";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import type { SiteSettings } from "@/types/models";

const FOOTER_LINKS = [
  { href: "/work", key: "work" },
  { href: "/services", key: "services" },
  { href: "/shop", key: "shop" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy-policy", key: "privacyTitle" },
  { href: "/terms-and-conditions", key: "termsTitle" },
  { href: "/refund-policy", key: "refundTitle" },
  { href: "/digital-product-license", key: "licenseTitle" },
] as const;

/**
 * The footer.
 *
 * It sits on warm cream rather than on the deep ink panel. The CTA above it
 * is the last dark block on the page, and the closing panel returns to the
 * brand canvas so the two read as two moments instead of one long slab.
 */
export async function SiteFooter({ settings }: { settings: SiteSettings }) {
  const t = await getDictionary();

  return (
    <footer className="mt-auto border-t border-border bg-surface-sunken py-16 text-text md:py-20">
      <Container>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo logoUrl={settings.logoUrl} size="lg" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {settings.footerNote}
            </p>
            <a
              href={`mailto:${settings.email}`}
              className="mt-5 inline-flex min-h-11 items-center font-label text-sm text-text underline decoration-pink decoration-2 underline-offset-4 hover:text-pink-ink"
            >
              {settings.email}
            </a>
          </div>

          <nav aria-label={t.footer.navigate} className="md:col-span-3">
            <p className="font-label text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {t.footer.navigate}
            </p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={shouldPrefetch(link.href)}
                    className="inline-flex min-h-11 min-w-11 items-center font-label text-sm text-text transition-colors hover:text-pink-ink"
                  >
                    {t.nav[link.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="font-label text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {t.footer.elsewhere}
            </p>
            <ul className="mt-4 space-y-2.5">
              {settings.socials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 min-w-11 items-center font-label text-sm text-text transition-colors hover:text-pink-ink"
                  >
                    {social.platform}
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-8 font-label text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {t.footer.legal}
            </p>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 min-w-11 items-center font-label text-sm text-muted transition-colors hover:text-pink-ink"
                  >
                    {t.legal[link.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label text-xs text-muted-foreground">
            {fill(t.footer.rights, { year: new Date().getFullYear() })}
          </p>
          <p className="font-label text-xs text-muted-foreground">
            {settings.tagline}
          </p>
        </div>
      </Container>
    </footer>
  );
}
