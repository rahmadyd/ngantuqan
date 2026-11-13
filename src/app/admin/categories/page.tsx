import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { RowActions } from "@/components/admin/row-actions";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteCategory } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Categories | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, type, description, created_at")
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Categories"
      description="Shared taxonomy for portfolio projects, services, and digital products."
      actions={
        <ButtonLink href="/admin/categories/new" size="sm">
          New category
        </ButtonLink>
      }
    >
      <DataTable
        caption="Categories"
        empty={{
          icon: Tags,
          title: "No categories yet",
          description: "Categories power the filters on the public site.",
        }}
        rows={rows}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-label font-medium">{row.name}</p>
                <p className="truncate font-label text-xs text-muted-foreground">
                  /{row.slug}
                </p>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            render: (row) => (
              <StatusPill value={row.type} tone="primary" />
            ),
          },
          {
            key: "description",
            header: "Description",
            render: (row) => (
              <p className="line-clamp-1 max-w-sm text-muted">
                {row.description ?? "–"}
              </p>
            ),
          },
          {
            key: "created",
            header: "Created",
            render: (row) => (
              <span className="font-label text-xs text-muted-foreground">
                {formatDate(row.created_at)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-20",
            render: (row) => (
              <RowActions
                editHref={`/admin/categories/${row.id}`}
                deleteAction={deleteCategory.bind(null, row.id)}
                entityLabel={row.name}
              />
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
