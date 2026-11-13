"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteButton } from "@/components/admin/delete-button";

/**
 * Row actions for the admin tables: open the editor, or delete the row.
 */
export function RowActions({
  editHref,
  deleteAction,
  entityLabel = "record",
  canDelete = true,
  deleteDisabledReason,
}: {
  editHref: string;
  deleteAction?: () => Promise<{ ok: boolean; message: string }>;
  entityLabel?: string;
  canDelete?: boolean;
  /** Why the delete is unavailable — shown on the disabled button. */
  deleteDisabledReason?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={editHref}
        // Every row in a table would otherwise pull its editor page in the
        // background — a list of twenty projects is twenty page renders.
        prefetch={false}
        onMouseEnter={() => router.prefetch(editHref)}
        onFocus={() => router.prefetch(editHref)}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-text"
        aria-label={`Edit ${entityLabel}`}
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Link>

      {canDelete && deleteAction ? (
        deleteDisabledReason ? (
          // The database refuses to delete published content, so the button
          // is disabled rather than promising a delete that cannot happen.
          <button
            type="button"
            disabled
            title={deleteDisabledReason}
            aria-label={`${deleteDisabledReason} for ${entityLabel}`}
            className="inline-flex size-8 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/40"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <DeleteButton
            action={deleteAction}
            entityLabel={entityLabel}
            iconOnly
          />
        )
      ) : null}
    </div>
  );
}
