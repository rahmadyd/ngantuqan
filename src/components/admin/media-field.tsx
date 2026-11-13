"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import {
  MediaPickerDialog,
  publicMediaUrlInBrowser,
} from "@/components/admin/media-picker-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import type { MediaAsset } from "@/components/admin/field-config";

/**
 * The image field.
 *
 * The studio picks a file from its own library instead of typing a path: the
 * file is uploaded once and reused everywhere. The value stored is the
 * storage path, so it survives a change of Supabase project — the address a
 * browser loads is derived from it (see resolveMediaSrc).
 */
export function MediaField({
  id,
  name,
  label,
  help,
  value,
  assets,
  error,
}: {
  id: string;
  name: string;
  label: string;
  help?: string;
  value: string;
  assets: MediaAsset[];
  error?: string;
}) {
  const [current, setCurrent] = useState(value);
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<MediaAsset[]>(assets);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = library.find((asset) => asset.path === current);

  function choose(asset: MediaAsset) {
    setCurrent(asset.path);
    setOpen(false);
    toast.success(`${asset.fileName} chosen.`);
  }

  async function upload(file: File) {
    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(
        "/api/admin/media/upload?bucket=public-media",
        { method: "POST", body },
      );

      const result = (await response.json().catch(() => ({}))) as {
        path?: string;
        bucket?: string;
        fileName?: string;
        error?: string;
      };

      if (!response.ok || !result.path) {
        toast.error(result.error ?? "The upload failed.");
        return;
      }

      const asset: MediaAsset = {
        id: `new-${result.path}`,
        bucket: result.bucket ?? "public-media",
        path: result.path,
        fileName: result.fileName ?? file.name,
        altText: null,
        url: publicMediaUrlInBrowser(result.bucket ?? "public-media", result.path),
      };

      setLibrary((current) => [asset, ...current]);
      setCurrent(asset.path);
      setOpen(false);
      toast.success(`${asset.fileName} uploaded and chosen.`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="md:col-span-2">
      <Label htmlFor={id}>{label}</Label>

      {/* The value goes to the server in this hidden field. */}
      <input type="hidden" id={id} name={name} value={current} />

      <div className="mt-1.5 flex flex-wrap items-start gap-4">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-sunken">
          {selected?.url ? (
            <Image
              src={selected.url}
              alt={selected.altText ?? selected.fileName}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="size-6 text-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
              Choose from library
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              Upload new
            </Button>

            {current ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setCurrent("")}
              >
                <X aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>

          <p className="mt-2 truncate font-label text-xs text-muted-foreground">
            {current || "No image chosen"}
          </p>

          {help ? (
            <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
              {help}
            </p>
          ) : null}
          {error ? (
            <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {open ? (
        <MediaPickerDialog
          assets={library}
          onChoose={choose}
          onClose={() => setOpen(false)}
          onUpload={upload}
          uploading={uploading}
        />
      ) : null}
    </div>
  );
}
