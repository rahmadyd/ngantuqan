"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaAsset } from "@/components/admin/field-config";

/**
 * The media library, as a dialog.
 *
 * A dialog and not a new page: the studio is in the middle of filling a form,
 * and the pick should not cost them their place.
 */
export function MediaPickerDialog({
  assets,
  onChoose,
  onClose,
  onUpload,
  uploading,
}: {
  assets: MediaAsset[];
  onChoose: (asset: MediaAsset) => void;
  onClose: () => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close the library"
        onClick={onClose}
        className="absolute inset-0 bg-text/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Media library"
        className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <h2 className="font-display text-lg font-semibold">Media library</h2>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              Upload
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the library"
              className="inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-text"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {assets.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No files yet. Upload one to get started.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {assets.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => onChoose(asset)}
                    className="group w-full overflow-hidden rounded-lg border border-border bg-surface text-left transition-colors hover:border-primary"
                  >
                    <span className="relative block aspect-square bg-surface-sunken">
                      {asset.url ? (
                        <Image
                          src={asset.url}
                          alt={asset.altText ?? asset.fileName}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center">
                          <ImageIcon
                            aria-hidden="true"
                            className="size-6 text-muted"
                          />
                        </span>
                      )}
                    </span>
                    <span className="block truncate px-2 py-1.5 font-label text-[11px]">
                      {asset.fileName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
    </div>
  );
}

/** The public address of a file, built in the browser from the public URL. */
export function publicMediaUrlInBrowser(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const encoded = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}
