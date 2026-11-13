import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Storage listing helpers.
 *
 * Supabase Storage is a flat keyspace with optional "/" folders. The upload
 * routes write to nested folders (media/, products/<id>/, files/), so
 * listing only the bucket root would show folders instead of files. This
 * walks the folders and returns the real objects with their full paths.
 */

export interface StorageEntry {
  path: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  updatedAt: string | null;
}

type Db = SupabaseClient<Database>;

export async function listBucketFiles(
  supabase: Db,
  bucket: string,
  maxDepth = 2,
): Promise<StorageEntry[]> {
  async function walk(prefix: string, depth: number): Promise<StorageEntry[]> {
    const { data } = await supabase.storage.from(bucket).list(prefix, { limit: 200 });

    const entries: StorageEntry[] = [];

    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;

      if (item.id) {
        entries.push({
          path,
          name: item.name,
          size: toNumber(item.metadata?.size),
          mimeType: item.metadata?.mimetype ?? null,
          updatedAt: item.updated_at ?? null,
        });
      } else if (depth < maxDepth) {
        entries.push(...(await walk(path, depth + 1)));
      }
    }

    return entries;
  }

  return walk("", 0);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * The public address of a file.
 *
 * A media row stores the storage path; the address a browser can load is
 * derived from it, so the studio never has to keep a URL in step with a file
 * that was renamed or moved.
 */
export function publicMediaUrl(bucket: string, path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;

  const encoded = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

/**
 * Turns a stored image value into something a browser can load.
 *
 * The catalogue stores the storage path of an uploaded asset (so it survives
 * a change of Supabase project). A value that is already an address or a
 * local path is passed through untouched.
 */
export function resolveMediaSrc(value: string | null | undefined): string | null {
  if (!value) return null;

  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return publicMediaUrl("public-media", value) ?? value;
}
