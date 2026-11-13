"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MediaPickerDialog,
  publicMediaUrlInBrowser,
} from "@/components/admin/media-picker-dialog";
import type { MediaAsset } from "@/components/admin/field-config";
import { saveGalleryImages } from "@/lib/actions/admin-content";

/**
 * The gallery.
 *
 * The images of a project or a product, in the order they appear on the
 * public site. They are chosen from the media library and stored by their
 * storage path, the same way the cover image is.
 */

export interface GalleryImage {
  /** The row id, or a temporary one for an image that has not been saved. */
  id: string;
  path: string;
  url: string;
  altText: string;
  altTextId: string;
}

export function GalleryEditor({
  kind,
  entityId,
  images,
  assets,
}: {
  kind: "project" | "product";
  entityId: string;
  images: GalleryImage[];
  assets: MediaAsset[];
}) {
  const [list, setList] = useState<GalleryImage[]>(images);
  const [library, setLibrary] = useState<MediaAsset[]>(assets);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(asset: MediaAsset) {
    const url = asset.url;

    if (!url) {
      toast.error("That file cannot be shown on the site.");
      return;
    }

    setList((current) => [
      ...current,
      {
        id: `new-${asset.path}`,
        path: asset.path,
        url,
        altText: asset.altText ?? "",
        altTextId: "",
      },
    ]);

    setOpen(false);
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

      const path = result.path;

      const asset: MediaAsset = {
        id: `new-${path}`,
        bucket: result.bucket ?? "public-media",
        path,
        fileName: result.fileName ?? file.name,
        altText: null,
        url: publicMediaUrlInBrowser(result.bucket ?? "public-media", path),
      };

      const url = asset.url ?? "";

      setLibrary((current) => [asset, ...current]);
      setList((current) => [
        ...current,
        {
          id: `new-${path}`,
          path,
          url,
          altText: "",
          altTextId: "",
        },
      ]);
      setOpen(false);
      toast.success(`${asset.fileName} uploaded and added to the gallery.`);
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    setList((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;

      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveGalleryImages(
        kind,
        entityId,
        list.map((image) => ({
          path: image.path,
          altText: image.altText,
          altTextId: image.altTextId,
        })),
      );

      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <section className="rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Gallery</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The images on the public page, in order. The first one is the
            cover.
          </p>
        </div>

        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <ImagePlus aria-hidden="true" />
          Add image
        </Button>
      </div>

      <div className="p-5">
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No images yet. Add one from the library.
          </p>
        ) : (
          <ul className="space-y-4">
            {list.map((image, index) => (
              <li
                key={image.id}
                className="flex flex-wrap items-start gap-4 rounded-lg border border-border p-3"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface-sunken">
                  <Image
                    src={image.url}
                    alt={image.altText || ""}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-40 flex-1">
                  <label
                    htmlFor={`alt-${image.id}`}
                    className="font-label text-xs font-medium text-text"
                  >
                    Alt text
                  </label>
                  <Input
                    id={`alt-${image.id}`}
                    defaultValue={image.altText}
                    placeholder="What does this image show?"
                    className="mt-1.5 h-9 text-xs"
                    onChange={(event) =>
                      setList((current) =>
                        current.map((entry) =>
                          entry.id === image.id
                            ? { ...entry, altText: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                  <label
                    htmlFor={`alt-id-${image.id}`}
                    className="mt-3 block font-label text-xs font-medium text-text"
                  >
                    Alt text (Indonesian)
                  </label>
                  <Input
                    id={`alt-id-${image.id}`}
                    defaultValue={image.altTextId}
                    placeholder="What does this image show?"
                    className="mt-1.5 h-9 text-xs"
                    onChange={(event) =>
                      setList((current) =>
                        current.map((entry) =>
                          entry.id === image.id
                            ? { ...entry, altTextId: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                  <p className="mt-1 truncate font-label text-[11px] text-muted-foreground">
                    {image.path}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move image ${index + 1} up`}
                  >
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === list.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Move image ${index + 1} down`}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setList((current) =>
                        current.filter((entry) => entry.id !== image.id),
                      )
                    }
                    aria-label={`Remove image ${index + 1}`}
                    className="text-muted hover:bg-danger-surface hover:text-danger"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
          <Button type="button" size="sm" disabled={pending} onClick={save}>
            {pending ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : null}
            Save gallery
          </Button>
          <span className="font-label text-xs text-muted-foreground">
            {list.length} image{list.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {open ? (
        <MediaPickerDialog
          assets={library}
          onChoose={choose}
          onClose={() => setOpen(false)}
          onUpload={upload}
          uploading={uploading}
        />
      ) : null}
    </section>
  );
}
