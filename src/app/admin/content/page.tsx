import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate, summariseContentBlock } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Website Content | Admin",
  robots: { index: false, follow: false },
};

/**
 * Website content is stored as structured JSON in site_settings. Each key
 * holds one editable block — hero copy, legal page bodies, and so on.
 */
export default async function AdminContentPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_settings")
    .select("id, setting_key, setting_value, is_public, updated_at")
    .order("setting_key", { ascending: true });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Website Content"
      description="Editable copy blocks used across the public site. Public blocks are readable without a session."
    >
      <DataTable
        caption="Content blocks"
        empty={{
          icon: BarChart3,
          title: "No content blocks yet",
          description: "Content blocks define the editable copy on the public site.",
        }}
        rows={rows}
        columns={[
          {
            key: "key",
            header: "Key",
            render: (row) => (
              <Link
                href={`/admin/content/${row.id}`}
                prefetch={false}
                className="font-label text-xs text-primary underline-offset-4 hover:underline"
              >
                <code className="rounded-sm bg-surface-sunken px-1.5 py-0.5">
                  {row.setting_key}
                </code>
              </Link>
            ),
          },
          {
            key: "visibility",
            header: "Visibility",
            render: (row) => (
              <span className="font-label text-xs text-muted">
                {row.is_public ? "Public" : "Admin only"}
              </span>
            ),
          },
          {
            key: "preview",
            header: "Preview",
            render: (row) => (
              <span className="line-clamp-2 font-label text-xs text-muted">
                {summariseContentBlock(row.setting_value)}
              </span>
            ),
          },
          {
            key: "updated",
            header: "Updated",
            render: (row) => (
              <span className="font-label text-xs text-muted-foreground">
                {formatDate(row.updated_at)}
              </span>
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
