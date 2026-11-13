import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { publicMediaUrl } from "@/lib/supabase/storage";

/**
 * The studio's assets, for the picker.
 *
 * A media row stores the storage path; the picker shows the file and stores
 * that path, so the value survives a change of Supabase project.
 */

export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  fileName: string;
  altText: string | null;
  /** The address a browser can load, for the preview. */
  url: string | null;
}

type Db = SupabaseClient<Database>;

export async function listMediaAssets(
  supabase: Db,
  bucket = "public-media",
): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media")
    .select("id, bucket, path, file_name, alt_text")
    .eq("bucket", bucket)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[media] could not list the library:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    bucket: row.bucket,
    path: row.path,
    fileName: row.file_name,
    altText: row.alt_text,
    url:
      bucket === "public-media" ? publicMediaUrl(row.bucket, row.path) : null,
  }));
}
