"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { attachProductFile } from "@/lib/actions/admin-media";
import { initialAdminState } from "@/lib/actions/admin-state";

/**
 * Uploads a file to Supabase Storage.
 *
 * The upload itself goes through the existing /api/admin/media/upload route,
 * which validates the MIME type and size and generates a safe storage path.
 * When the file belongs to a product, a product_files row is registered
 * afterwards so the download endpoint can serve it.
 */
export function MediaUploader({
  productId,
  defaultBucket = "public-media",
  allowBucketChoice = true,
}: {
  productId?: string;
  defaultBucket?: "public-media" | "private-products";
  allowBucketChoice?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [bucket, setBucket] = useState(defaultBucket);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }

    startTransition(async () => {
      const body = new FormData();
      body.append("file", file);

      const params = new URLSearchParams({ bucket });
      if (productId) params.set("productId", productId);

      const response = await fetch(`/api/admin/media/upload?${params.toString()}`, {
        method: "POST",
        body,
      });

      const result = (await response.json().catch(() => ({}))) as {
        path?: string;
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        error?: string;
      };

      if (!response.ok || !result.path) {
        toast.error(result.error ?? "The upload failed.");
        return;
      }

      if (productId) {
        const formData = new FormData();
        formData.append("product_id", productId);
        formData.append("storage_path", result.path);
        formData.append("file_name", result.fileName ?? file.name);
        formData.append("file_size", String(result.fileSize ?? file.size));
        formData.append("mime_type", result.mimeType ?? file.type);

        const state = await attachProductFile(initialAdminState, formData);

        if (state.status === "error") {
          toast.error(state.message);
          return;
        }
      }

      toast.success(`${result.fileName ?? file.name} uploaded.`);
      if (inputRef.current) inputRef.current.value = "";
      setFileName("");
      // The upload went through a route handler, so the list is refreshed
      // here rather than by a revalidation inside the action.
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-admin-form
      className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border-strong bg-surface p-4"
    >
      {allowBucketChoice ? (
        <div>
          <label
            htmlFor="media-bucket"
            className="font-label text-sm font-medium text-text"
          >
            Bucket
          </label>
          <Select
            id="media-bucket"
            value={bucket}
            onChange={(event) =>
              setBucket(event.target.value as "public-media" | "private-products")
            }
            className="mt-1.5 w-56"
          >
            <option value="public-media">Public media</option>
            <option value="private-products">Private product files</option>
          </Select>
        </div>
      ) : null}

      <div className="min-w-56 flex-1">
        <span className="font-label text-sm font-medium text-text">File</span>

        {/* The browser's own file field is styled by the operating system, so
            it is hidden behind a label that follows the design system. */}
        <div className="mt-1.5 flex items-center gap-3">
          <label
            htmlFor="media-file"
            className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border bg-surface px-3 font-label text-xs font-medium text-text transition-colors hover:border-border-strong has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40"
          >
            Choose file
          </label>
          <span className="truncate font-label text-xs text-muted">
            {fileName || "No file chosen"}
          </span>
        </div>

        <input
          ref={inputRef}
          id="media-file"
          type="file"
          className="sr-only"
          onChange={(event) =>
            setFileName(event.target.files?.[0]?.name ?? "")
          }
        />
      </div>

      <Button type="submit" disabled={pending}>
        <Upload aria-hidden="true" />
        {pending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
