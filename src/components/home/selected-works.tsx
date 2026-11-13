import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/primitives";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/feedback";
import { getDictionary } from "@/lib/i18n/server";
import type { Project } from "@/types/models";

export async function SelectedWorks({ projects }: { projects: Project[] }) {
  const t = await getDictionary();

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={t.works.eyebrow}
            title={t.works.title}
            lede={t.works.lede}
          />
          <ButtonLink
            href="/work"
            variant="outline"
            size="sm"
            className="rounded-full border-2 border-border-strong bg-surface px-5 font-semibold shadow-xs transition-transform duration-150 hover:scale-105 active:scale-100"
          >
            {t.works.button}
          </ButtonLink>
        </div>

        {projects.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                priority={index < 2}
                className={
                  index === 0
                    ? "lg:col-span-7"
                    : index === 1
                      ? "lg:col-span-5"
                      : "lg:col-span-6"
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-12"
            title={t.works.emptyTitle}
            description={t.works.emptyDescription}
            action={
              <ButtonLink href="/work" variant="outline">
                {t.works.button}
              </ButtonLink>
            }
          />
        )}

        <p className="mt-8 font-label text-sm text-muted">
          <Link
            href="/work"
            className="inline-flex min-h-11 items-center gap-1.5 underline-offset-4 hover:text-text hover:underline"
          >
            {t.works.link}
          </Link>
        </p>
      </Container>
    </Section>
  );
}
