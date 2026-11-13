import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CardAffordance, MediaFallback } from "@/components/common/primitives";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/models";

/**
 * A portfolio piece.
 *
 * Framed with warm pastel plates and organic crafted borders. Image-first
 * presentation where hover smoothly scales the work and warms the border.
 */
export async function ProjectCard({
  project,
  className,
  priority = false,
  featured = false,
}: {
  project: Project;
  className?: string;
  priority?: boolean;
  featured?: boolean;
  nature?: boolean;
}) {
  const t = await getDictionary();

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.375rem_1rem_1.25rem_1.125rem] border-2 border-border-strong bg-surface-warm shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-sunken",
          featured ? "aspect-[16/10]" : "aspect-[4/3]",
        )}
      >
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={fill(t.common.coverArtwork, { title: project.title })}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 60vw"
                : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <MediaFallback label={project.title} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          {project.category ? (
            <Badge variant="primary">{project.category.name}</Badge>
          ) : null}
          {project.project_year ? (
            <span className="font-label text-xs text-muted-foreground">
              {project.project_year}
            </span>
          ) : null}
        </div>

        <h3 className="mt-3.5 font-display text-xl leading-snug font-semibold tracking-[-0.01em]">
          <Link
            href={`/work/${project.slug}`}
            className="inline-flex min-h-11 items-center after:absolute after:inset-0"
          >
            {project.title}
          </Link>
        </h3>

        {project.client_name ? (
          <p className="mt-1.5 font-label text-sm text-muted-foreground">
            {project.client_name}
          </p>
        ) : null}

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {project.description}
        </p>

        <div className="mt-auto pt-5">
          <CardAffordance>{t.common.viewProject}</CardAffordance>
        </div>
      </div>
    </article>
  );
}
