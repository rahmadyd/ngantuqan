import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for the admin editor screens.
 *
 * Every editor shows where it belongs, what it is for, and a way back to the
 * list it came from.
 */
export function EditorShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  children,
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 font-label text-xs text-muted-foreground transition-colors hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          {backLabel}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em]">
          {title}
        </h1>
        {description ? (
          <p className="prose-body mt-1.5 text-sm">{description}</p>
        ) : null}
      </div>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        {children}
      </section>
    </div>
  );
}
