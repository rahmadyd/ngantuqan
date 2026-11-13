import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { Suspense } from "react";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ProjectFilters } from "@/components/portfolio/project-filters";
import { Container, Eyebrow } from "@/components/layout/primitives";
import { EmptyState, FilterSkeleton } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button-link";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { getCategories, getPublishedProjects } from "@/lib/queries/content";
import { parsePageParam } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();

  return {
    title: t.nav.work,
    description: t.work.metaDescription,
  };
}

const PAGE_SIZE = 9;

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const t = await getDictionary();
  const params = await searchParams;
  const category = params.category;
  const search = params.q;
  const page = parsePageParam(params.page);

  const [categories, projects] = await Promise.all([
    getCategories("PORTFOLIO", locale),
    getPublishedProjects({
      categorySlug: category,
      search,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      locale,
    }),
  ]);

  return (
    <>
      <section className="border-b border-border bg-surface-sunken py-16 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>{t.work.eyebrow}</Eyebrow>
              <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance">
                {t.work.title}
              </h1>
            </div>
            <div className="lg:col-span-5 lg:pt-12">
              <p className="prose-body">{t.work.lede}</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <Suspense fallback={<FilterSkeleton />}>
            <ProjectFilters
              categories={categories}
              activeCategory={category}
              activeSearch={search}
            />
          </Suspense>

          {projects.length === 0 ? (
            <EmptyState
              className="mt-12"
              icon={FolderOpen}
              title={t.work.emptyTitle}
              description={t.work.emptyDescription}
              action={
                <ButtonLink href="/work" variant="outline" size="sm">
                  {t.work.clearFilters}
                </ButtonLink>
              }
            />
          ) : (
            <>
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    priority={index < 3}
                  />
                ))}
              </div>

              {projects.length === PAGE_SIZE ? (
                <nav
                  aria-label="Pagination"
                  className="mt-14 flex items-center justify-center gap-3"
                >
                  {page > 1 ? (
                    <ButtonLink
                      href={`/work?${new URLSearchParams(
                        Object.entries({ category, q: search }).filter(
                          ([, value]) => value,
                        ) as [string, string][],
                      ).toString()}&page=${page - 1}`}
                      variant="outline"
                      size="sm"
                    >
                      {t.common.previous}
                    </ButtonLink>
                  ) : null}
                  <span className="font-label text-sm text-muted">
                    {fill(t.common.page, { number: page })}
                  </span>
                  <ButtonLink
                    href={`/work?${new URLSearchParams(
                      Object.entries({ category, q: search }).filter(
                        ([, value]) => value,
                      ) as [string, string][],
                    ).toString()}&page=${page + 1}`}
                    variant="outline"
                    size="sm"
                  >
                    {t.common.next}
                  </ButtonLink>
                </nav>
              ) : null}
            </>
          )}
        </Container>
      </section>
    </>
  );
}
