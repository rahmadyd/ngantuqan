import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.legal.licenseTitle,
    description:
      "The licence that applies to every digital product purchased from ngantuqan.",
  };
}

export default async function LicensePage() {
  const t = await getDictionary();

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>{t.legal.eyebrow}</Eyebrow>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.025em]">
            {t.legal.licenseTitle}
          </h1>
          <p className="mt-4 font-label text-sm text-muted-foreground">
            {fill(t.common.lastUpdated, { date: formatDate("2026-01-01") })}
          </p>
          <p className="font-label text-xs text-muted-foreground">
            {t.common.notTranslated}
          </p>

          <div className="prose-body mt-10 space-y-8">
            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                1. What you get
              </h2>
              <p className="mt-3">
                When you buy a digital product, you receive a non-exclusive,
                non-transferable licence to use and edit the template files for
                your own or your employer&rsquo;s brand.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                2. What you can do
              </h2>
              <ul className="mt-3 space-y-2">
                {[
                  "Edit the templates freely and publish the resulting designs.",
                  "Use them across your brand's own channels: web, social, print, or internal documents.",
                  "Include them in work you produce for your clients, provided the client does not resell or redistribute the source files.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-pink"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                3. What you cannot do
              </h2>
              <ul className="mt-3 space-y-2">
                {[
                  "Resell, sublicense, or redistribute the source files, whether modified or unmodified.",
                  "Include the templates in a competing template pack, course, or template marketplace.",
                  "Publish the unedited template itself as free or paid content.",
                  "Register the source files, unmodified, as your own design asset.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-pink"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                4. Font and asset licences
              </h2>
              <p className="mt-3">
                Some products reference third-party fonts or stock assets that
                are not included in the download. Those carry their own
                licences, and it is your responsibility to hold a suitable
                licence for them. The product page lists any known
                dependencies.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-text">
                5. Term
              </h2>
              <p className="mt-3">
                This licence applies for as long as you legally own the
                product. It ends immediately if you redistribute the source
                files in breach of this agreement.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </section>
  );
}
