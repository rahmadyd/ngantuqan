import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import { AdminPage } from "@/components/admin/admin-page";
import { DeleteButton } from "@/components/admin/delete-button";
import { MediaUploader } from "@/components/admin/media-uploader";
import {
  MediaAltTextForm,
  MediaCopyUrl,
} from "@/components/admin/media-card-actions";
import { EmptyState } from "@/components/ui/feedback";
import { deleteMediaFile } from "@/lib/actions/admin-media";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { listBucketFiles, publicMediaUrl } from "@/lib/supabase/storage";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Media Library | Admin",
  robots: { index: false, follow: false },
};

const BUCKETS = ["public-media", "private-products", "private-attachments"] as const;

export default async function AdminMediaPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [results, { data: index }] = await Promise.all([
    Promise.all(
      BUCKETS.map(async (bucket) => ({
        bucket,
        files: await listBucketFiles(supabase, bucket),
      })),
    ),
    // The library's own index: what each asset is called and what it says.
    supabase
      .from("media")
      .select("id, bucket, path, file_name, alt_text, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const mediaByPath = new Map(
    (index ?? []).map((row) => [`${row.bucket}:${row.path}`, row]),
  );

  const total = results.reduce((sum, result) => sum + result.files.length, 0);

  return (
    <AdminPage
      title="Media Library"
      description="Files across all storage buckets. Public previews are world-readable; product files are private and only served through signed URLs after payment."
    >
      <MediaUploader />

      {total === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No files uploaded yet"
          description="Images and product files uploaded from the admin panel will appear here."
        />
      ) : (
        <div className="space-y-8">
          {results
            .filter((result) => result.files.length > 0)
            .map((result) => (
              <section key={result.bucket}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    {result.bucket}
                  </h2>
                  <span className="font-label text-xs text-muted-foreground">
                    {result.files.length} file
                    {result.files.length === 1 ? "" : "s"}
                  </span>
                  {result.bucket !== "public-media" ? (
                    <span className="rounded-full bg-warning-surface px-2 py-0.5 font-label text-[11px] font-medium text-warning">
                      Private
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {result.files.map((file) => {
                    const isImage = file.mimeType?.startsWith("image/") ?? false;
                    const media = mediaByPath.get(`${result.bucket}:${file.path}`);
                    const publicUrl =
                      result.bucket === "public-media"
                        ? publicMediaUrl(result.bucket, file.path)
                        : null;

                    return (
                      <div
                        key={file.path}
                        className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
                      >
                        <div className="relative aspect-square bg-surface-sunken">
                          {isImage && result.bucket === "public-media" ? (
                            // The image optimizer fetches the URL on the
                            // server without the administrator's cookies, so it
                            // cannot read an admin-only route. A plain <img>
                            // keeps the session with the request.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/admin/media/file?bucket=${result.bucket}&path=${encodeURIComponent(file.path)}`}
                              alt={file.path}
                              className="absolute inset-0 size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <ImageIcon
                                aria-hidden="true"
                                className="size-6 text-muted"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <p
                              className="truncate font-label text-xs"
                              title={file.path}
                            >
                              {file.name}
                            </p>
                            <p className="truncate font-label text-[11px] text-muted-foreground">
                              {file.updatedAt ? formatDate(file.updatedAt) : "–"}
                              {file.size
                                ? ` · ${Math.round(file.size / 1024)} KB`
                                : ""}
                            </p>
                          </div>
                          <DeleteButton
                            action={deleteMediaFile.bind(
                              null,
                              result.bucket,
                              file.path,
                            )}
                            entityLabel={file.path}
                            iconOnly
                          />
                        </div>

                        {media ? (
                          <div className="border-t border-border px-3 py-2">
                            <MediaAltTextForm
                              id={media.id}
                              altText={media.alt_text ?? ""}
                            />
                            {publicUrl ? (
                              <MediaCopyUrl url={publicUrl} />
                            ) : null}
                          </div>
                        ) : (
                          <p className="border-t border-border px-3 py-2 font-label text-[11px] text-muted-foreground">
                            Uploaded outside the library. No index row.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
    </AdminPage>
  );
}
