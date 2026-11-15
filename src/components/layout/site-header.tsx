import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { Container } from "@/components/layout/primitives";
import { MobileNav, ProductSearch, SiteNav } from "@/components/layout/site-nav";
import { CartLink } from "@/components/shop/cart-link";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";
import type { SiteSettings } from "@/types/models";

export async function SiteHeader({ settings }: { settings: SiteSettings }) {
  const t = await getDictionary();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 shadow-[0_1px_3px_rgba(36,53,44,0.03)] backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-2 md:h-[4.5rem] md:gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link
            href="/"
            aria-label={t.nav.home}
            className="inline-flex min-h-11 items-center rounded-sm transition-opacity hover:opacity-80 xl:justify-self-start"
          >
            <Logo logoUrl={settings.logoUrl} size="md" />
          </Link>

          <SiteNav />

          <div className="relative flex items-center gap-2 xl:justify-self-end">
            <LocaleToggle className="hidden sm:flex" />
            <ProductSearch />
            <CartLink />
            <ButtonLink
              href="/contact"
              size="sm"
              variant="primary"
              className="hidden rounded-full border-2 border-primary px-5 font-semibold shadow-xs transition-transform duration-150 hover:scale-105 active:scale-100 sm:inline-flex"
            >
              {t.nav.startProject}
            </ButtonLink>
            <MobileNav
              logoUrl={settings.logoUrl}
              email={settings.email}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
