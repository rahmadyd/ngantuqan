"use client";

import { useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateMediaAltText } from "@/lib/actions/admin-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * The alt text of one asset.
 *
 * It is the one piece of information about a file that only the studio knows:
 * what the image actually says, for the visitor who cannot see it.
 */
export function MediaAltTextForm({
  id,
  altText,
}: {
  id: string;
  altText: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updateMediaAltText(
            id,
            String(data.get("alt_text") ?? ""),
          );

          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
        });
      }}
      className="mt-2 space-y-2"
    >
      <label htmlFor={`alt-${id}`} className="sr-only">
        Alt text
      </label>
      <Input
        id={`alt-${id}`}
        name="alt_text"
        defaultValue={altText}
        placeholder="What does this image show?"
        className="h-8 text-xs"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden="true" className="animate-spin" />
        ) : null}
        Save alt text
      </Button>
    </form>
  );
}

/**
 * The public address of a file, with a button to copy it.
 *
 * Until the picker exists, this is how a file reaches a cover image field.
 */
export function MediaCopyUrl({ url }: { url: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await navigator.clipboard.writeText(url);
            toast.success("Address copied.");
          } catch {
            toast.error("The address could not be copied.");
          }
        })
      }
      className="h-7 px-2 text-[11px]"
    >
      <Copy aria-hidden="true" className="size-3" />
      Copy address
    </Button>
  );
}
