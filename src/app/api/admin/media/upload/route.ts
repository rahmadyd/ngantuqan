import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionRole } from "@/lib/supabase/server";

/**
 * Admin media upload.
 *
 * The file is validated server-side (MIME allow-list, size limit, extension)
 * and stored under a generated path — the client-supplied filename is never
 * used as a path segment, so a crafted name cannot escape the bucket.
 *
 * Public preview images go to `public-media`; purchasable product files go to
 * `private-products` and are only ever served through short-lived signed URLs.
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500 MB

const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

const BUCKETS = {
  "public-media": { maxBytes: MAX_IMAGE_BYTES, mimeTypes: IMAGE_MIME },
  "private-products": {
    maxBytes: MAX_FILE_BYTES,
    mimeTypes: null,
  },
} as const;

type BucketName = keyof typeof BUCKETS;

const querySchema = z.object({
  bucket: z.enum(["public-media", "private-products"]),
  productId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  // Layer 2 authorization — the proxy already redirects, but a route handler
  // can be called directly, so it verifies the role itself.
  const session = await getSessionRole();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bucket or product id" },
      { status: 400 },
    );
  }

  const bucket = parsed.data.bucket as BucketName;
  const rules = BUCKETS[bucket];

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  if (file.size > rules.maxBytes) {
    return NextResponse.json(
      {
        error: `File is larger than ${Math.floor(
          rules.maxBytes / 1024 / 1024,
        )} MB`,
      },
      { status: 413 },
    );
  }

  if (rules.mimeTypes && !rules.mimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 415 },
    );
  }

  // Generated path — the original name is only kept as metadata.
  const extension = (file.name.split(".").pop() ?? "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  const uuid = crypto.randomUUID();

  const folder = parsed.data.productId
    ? `products/${parsed.data.productId}`
    : bucket === "public-media"
      ? "media"
      : "files";

  const path = `${folder}/${uuid}.${extension}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The library keeps its own index, so the studio knows what it has without
  // walking the bucket (see migration 0013).
  const { error: indexError } = await admin.from("media").upsert(
    {
      bucket,
      path,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      uploaded_by: session.userId,
    },
    { onConflict: "bucket,path" },
  );

  if (indexError) {
    // The file is stored either way — the index can be repaired later.
    console.error("[media] could not index the upload:", indexError.message);
  }

  return NextResponse.json({
    path,
    bucket,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
}
