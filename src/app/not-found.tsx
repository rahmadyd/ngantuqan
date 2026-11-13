import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/primitives";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.errors.notFoundTitle,
  };
}

export default async function NotFound() {
  const t = await getDictionary();

  const links = [
    { href: "/services", label: t.nav.services },
    { href: "/shop", label: t.nav.shop },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <section className="py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="font-display text-[clamp(4rem,14vw,8rem)] leading-none font-semibold text-pink">
            404
          </p>
          <h1 className="mt-6 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
            {t.errors.notFoundTitle}
          </h1>
          <p className="prose-body mx-auto mt-4">{t.errors.notFoundBody}</p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/">{t.errors.notFoundHome}</ButtonLink>
            <ButtonLink href="/work" variant="outline">
              {t.errors.notFoundWork}
            </ButtonLink>
          </div>

          <nav aria-label={t.errors.suggestedPages} className="mt-10">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-label text-sm text-muted">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="underline-offset-4 hover:text-text hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </section>
  );
}
