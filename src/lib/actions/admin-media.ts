"use server";

import {
  adminDb,
  adminSession,
  invalid,
  logActivity,
  notAuthorised,
  revalidateAdmin,
} from "@/lib/actions/admin-helpers";
import { adminError, type AdminActionState } from "@/lib/actions/admin-state";
import { clearContentCache } from "@/lib/cache";

/**
 * Media library mutations.
 *
 * Files live in Supabase Storage. Purchasable product files also have a row
 * in product_files so the download endpoint knows which file belongs to which
 * order item — the two are kept in step here.
 */

const BUCKETS = ["public-media", "private-products", "private-attachments"] as const;

type BucketName = (typeof BUCKETS)[number];

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

export async function attachProductFile(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const productId = text(formData, "product_id");
  const storagePath = text(formData, "storage_path");
  const fileName = text(formData, "file_name");
  const fileSize = Number(text(formData, "file_size") ?? 0);
  const mimeType = text(formData, "mime_type") ?? null;

  if (!productId || !storagePath || !fileName) {
    return invalid("The uploaded file could not be registered.", {
      storage_path: "Upload the file first.",
    });
  }

  const supabase = await adminDb();

  const { data, error } = await supabase
    .from("product_files")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      file_name: fileName,
      file_size: Number.isFinite(fileSize) ? fileSize : null,
      mime_type: mimeType,
    })
    .select("id")
    .single();

  if (error) return adminError(error.message);

  await logActivity(supabase, "create", "product_file", data.id, { fileName });

  revalidateAdmin("/admin/products", `/admin/products/${productId}`);

  return {
    status: "success",
    message: `${fileName} attached.`,
    fieldErrors: {},
  };
}

export async function deleteMediaFile(
  bucket: string,
  path: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  if (!BUCKETS.includes(bucket as BucketName)) {
    return { ok: false, message: "Unknown bucket." };
  }

  const supabase = await adminDb();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) return { ok: false, message: error.message };

  // Keep the product_files rows in step with the bucket.
  await supabase.from("product_files").delete().eq("storage_path", path);

  // And the library's own index.
  await supabase.from("media").delete().eq("bucket", bucket).eq("path", path);

  await logActivity(supabase, "delete", "media", null, { bucket, path });

  // A published page may be pointing at the file that was just removed.
  clearContentCache();

  revalidateAdmin("/admin/media", "/admin/products");

  return { ok: true, message: "File deleted." };
}

/**
 * Records what an asset says.
 *
 * The alt text is what a screen reader reads in place of the image, and it is
 * the one piece of information about a file that only the studio can know.
 */
export async function updateMediaAltText(
  id: string,
  altText: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();

  const { error } = await supabase
    .from("media")
    .update({ alt_text: altText.trim() || null })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  await logActivity(supabase, "update", "media", id, { altText });

  // A published page may be showing this file.
  clearContentCache();

  revalidateAdmin("/admin/media");

  return { ok: true, message: "Alt text saved." };
}
