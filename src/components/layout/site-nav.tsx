"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";
import { shouldPrefetch } from "@/lib/prefetch";
import { useLocale } from "@/lib/i18n/client";

const NAV_LINKS = [
  { href: "/work", key: "work" },
  { href: "/services", key: "services" },
  { href: "/shop", key: "shop" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function ProductSearch() {
  const router = useRouter();
  const { t } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = (restoreFocus = false) => {
    setSearchOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  useEffect(() => {
    if (!searchOpen) return;

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 0);

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeSearch();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  const submitSearch = () => {
    const keyword = searchTerm.trim();
    if (!keyword) return;

    closeSearch();
    router.push(`/shop?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t.nav.search}
        aria-expanded={searchOpen}
        aria-controls="site-search-popover"
        onClick={() => {
          setSearchMounted(true);
          setSearchOpen((current) => !current);
        }}
        className="inline-flex size-11 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-sunken"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>

      <div
        id="site-search-popover"
        aria-hidden={!searchOpen}
        inert={!searchOpen}
        className={cn(
          "absolute right-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-[340px] rounded-[2rem] border-2 border-text bg-background p-2 shadow-lg ring-2 ring-text ring-offset-2 ring-offset-background transition-[opacity,transform] duration-150 ease-out",
          searchOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        {searchMounted ? (
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label htmlFor="site-search" className="sr-only">
              {t.nav.search}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="site-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.shop.searchPlaceholder}
                autoFocus
                className="h-11 w-full rounded-full border border-border-strong bg-surface pr-11 pl-4 text-sm text-text shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
              <button
                type="button"
                aria-label={t.common.clearSearch}
                onClick={() => {
                  setSearchTerm("");
                  closeSearch(true);
                }}
                className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-sunken hover:text-text"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav aria-label={t.nav.primary} className="hidden items-center gap-1 lg:flex">
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch={shouldPrefetch(link.href)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-3 py-2 font-label text-sm font-medium transition-colors duration-150",
              active ? "text-text" : "text-muted hover:text-text",
            )}
          >
            {t.nav[link.key]}
            {active ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-primary"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({
  logoUrl,
  email,
}: {
  logoUrl?: string | null;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const { t } = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close the panel when the route changes. Adjusting state during render is
  // React's documented alternative to an effect for this case.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else trigger?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label={t.nav.openMenu}
        className="inline-flex size-11 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-sunken"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-text/40"
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.siteMenu}
            className="absolute inset-y-0 right-0 flex w-[min(20rem,85vw)] flex-col bg-background shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Link href="/" onClick={() => setOpen(false)}>
                <Logo logoUrl={logoUrl} size="sm" />
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.nav.closeMenu}
                className="inline-flex size-11 items-center justify-center rounded-md text-text transition-colors hover:bg-surface-sunken"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav aria-label={t.nav.mobile} className="flex flex-1 flex-col gap-1 p-5">
              {NAV_LINKS.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={shouldPrefetch(link.href)}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-3 font-display text-xl font-semibold transition-colors",
                      active
                        ? "bg-surface-tint text-primary"
                        : "text-text hover:bg-surface-sunken",
                    )}
                  >
                    {t.nav[link.key]}
                  </Link>
                );
              })}

              <div className="mt-6 hidden max-[383px]:block">
                <LocaleToggle />
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <ButtonLink href="/contact" size="md" className="w-full">
                  {t.nav.startProject}
                </ButtonLink>
              </div>

              <a
                href={`mailto:${email}`}
                className="mt-4 font-label text-sm text-muted break-all"
              >
                {email}
              </a>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
