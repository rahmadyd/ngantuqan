import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container, Eyebrow, Section } from "@/components/layout/primitives";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { getProjectBySlug, getRelatedProjects } from "@/lib/queries/content";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const project = await getProjectBySlug(slug, locale);

  if (!project) {
    return { title: "Project not found" };
  }

  return {
    title: project.seo_title ?? project.title,
    description: project.seo_description ?? project.description,
    openGraph: {
      title: project.seo_title ?? project.title,
      description: project.seo_description ?? project.description,
      images: project.cover_image ? [project.cover_image] : undefined,
      type: "article",
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = await getDictionary();
  const { slug } = await params;
  const project = await getProjectBySlug(slug, locale);

  if (!project) notFound();

  const related = await getRelatedProjects(project, 3, locale);
  const gallery = project.images ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    dateCreated: project.project_year
      ? `${project.project_year}-01-01`
      : undefined,
    creator: {
      "@type": "Organization",
      name: "ngantuqan",
    },
    image: project.cover_image ? [project.cover_image] : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <section className="border-b border-border bg-surface-sunken py-14 md:py-20">
          <Container>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 font-label text-sm text-muted transition-colors hover:text-text"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.work.filterAll}
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <Eyebrow>
                  {project.category?.name ?? t.work.projectFallback}
                </Eyebrow>
                <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">
                  {project.title}
                </h1>
                <p className="prose-body-strong mt-6">{project.description}</p>
              </div>

              <div className="lg:col-span-5 lg:pt-16">
                <dl className="space-y-5 border-t border-border pt-6">
                  {project.client_name ? (
                    <div>
                      <dt className="eyebrow">{t.work.client}</dt>
                      <dd className="mt-1 font-display text-lg font-semibold">
                        {project.client_name}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="eyebrow">{t.work.year}</dt>
                    <dd className="mt-1 font-display text-lg font-semibold">
                      {project.project_year ?? t.work.inProgress}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">{t.work.discipline}</dt>
                    <dd className="mt-1">
                      <Badge variant="primary">
                        {project.category?.name ?? t.work.designFallback}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Container>
        </section>

        {project.cover_image ? (
          <div className="mx-auto w-full max-w-[1320px] px-5 md:px-10 lg:px-12 xl:px-16">
            <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-xl bg-surface-sunken shadow-sm md:mt-14">
              <Image
                src={project.cover_image}
                alt={fill(t.common.coverArtwork, { title: project.title })}
                fill
                priority
                sizes="(max-width: 1320px) 100vw, 1320px"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        {gallery.length > 0 ? (
          <Section>
            <Container>
              <Eyebrow>{t.work.galleryEyebrow}</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                {t.work.galleryTitle}
              </h2>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {gallery.map((image) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-lg border border-border bg-surface-sunken"
                  >
                    <div className="relative aspect-[3/2]">
                      <Image
                        src={image.image_url}
                        alt={
                          image.alt_text ??
                          fill(t.work.galleryAlt, { title: project.title })
                        }
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    {image.alt_text ? (
                      <figcaption className="px-5 py-3 font-label text-xs text-muted-foreground">
                        {image.alt_text}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </Container>
          </Section>
        ) : null}

        <section className="dark-surface bg-text py-16 text-background md:py-20">
          <Container>
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="eyebrow text-background/70">{t.work.ctaEyebrow}</p>
                <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance">
                  {t.work.ctaTitle}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-background/70">
                  {t.work.contactLede}
                </p>
              </div>
              <ButtonLink href="/contact" variant="cream" size="lg">
                {t.work.contactButton}
              </ButtonLink>
            </div>
          </Container>
        </section>

        {related.length > 0 ? (
          <Section>
            <Container>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <Eyebrow>{t.work.relatedEyebrow}</Eyebrow>
                  <h2 className="mt-4 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                    {t.work.relatedTitle}
                  </h2>
                </div>
                <ButtonLink href="/work" variant="outline" size="sm">
                  {t.work.filterAll}
                </ButtonLink>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ProjectCard key={item.id} project={item} />
                ))}
              </div>
            </Container>
          </Section>
        ) : null}
      </article>
    </>
  );
}
