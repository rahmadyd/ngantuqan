import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { RowActions } from "@/components/admin/row-actions";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteProject } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Portfolio | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPortfolioPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select(
      "id, title, slug, client_name, project_year, is_published, is_featured, created_at, categories ( name )",
    )
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Portfolio"
      description="Case studies shown in the work section. Unpublished projects stay hidden from the public site."
      actions={
        <ButtonLink href="/admin/portfolio/new" size="sm">
          New project
        </ButtonLink>
      }
    >
      <DataTable
        caption="Portfolio projects"
        empty={{
          icon: FolderOpen,
          title: "No projects yet",
          description: "Create your first case study to fill the portfolio.",
        }}
        rows={rows}
        columns={[
          {
            key: "title",
            header: "Project",
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-label font-medium">{row.title}</p>
                <p className="truncate font-label text-xs text-muted-foreground">
                  /{row.slug}
                </p>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (row) => {
              const category = row.categories as { name: string } | null;
              return (
                <span className="text-muted">{category?.name ?? "–"}</span>
              );
            },
          },
          {
            key: "client",
            header: "Client",
            render: (row) => (
              <span className="text-muted">{row.client_name ?? "–"}</span>
            ),
          },
          {
            key: "year",
            header: "Year",
            render: (row) => (
              <span className="tabular-nums text-muted">
                {row.project_year ?? "–"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                <StatusPill
                  value={row.is_published ? "PUBLISHED" : "UNPUBLISHED"}
                />
                {row.is_featured ? (
                  <StatusPill value="FEATURED" tone="secondary" />
                ) : null}
              </div>
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
                editHref={`/admin/portfolio/${row.id}`}
                deleteAction={deleteProject.bind(null, row.id)}
                entityLabel={row.title}
                deleteDisabledReason={
                  row.is_published
                    ? "Unpublish the project before deleting it"
                    : undefined
                }
              />
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
