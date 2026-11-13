"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * A destructive action that has to be confirmed.
 *
 * The first click arms the button, the second performs it. The arming resets
 * after a few seconds so a stray click cannot delete anything later.
 */
export function DeleteButton({
  action,
  label = "Delete",
  entityLabel = "record",
  iconOnly = false,
}: {
  action: () => Promise<{ ok: boolean; message: string }>;
  label?: string;
  entityLabel?: string;
  iconOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }

    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setArmed(false);
    });
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={armed ? `Confirm delete ${entityLabel}` : `Delete ${entityLabel}`}
        title={armed ? "Click again to confirm" : `Delete ${entityLabel}`}
        className={`inline-flex size-8 items-center justify-center rounded-md transition-colors ${
          armed
            ? "bg-danger text-white hover:bg-danger/90"
            : "text-muted hover:bg-danger-surface hover:text-danger"
        }`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex h-9 items-center gap-2 rounded-md px-4 font-label text-xs font-medium transition-colors ${
        armed
          ? "bg-danger text-white hover:bg-danger/90"
          : "border border-border bg-surface text-muted hover:border-border-strong hover:text-text"
      }`}
    >
      <Trash2 aria-hidden="true" className="size-3.5" />
      {armed ? "Confirm delete" : label}
    </button>
  );
}
