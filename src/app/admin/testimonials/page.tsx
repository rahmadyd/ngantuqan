import type { Metadata } from "next";
import { MessageSquareQuote } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { RowActions } from "@/components/admin/row-actions";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteTestimonial } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Testimonials | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminTestimonialsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("testimonials")
    .select(
      "id, customer_name, customer_role, content, is_published, is_featured, created_at, projects ( title )",
    )
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Testimonials"
      description="Client quotes shown on the home page. Only published testimonials appear publicly."
      actions={
        <ButtonLink href="/admin/testimonials/new" size="sm">
          New testimonial
        </ButtonLink>
      }
    >
      <DataTable
        caption="Testimonials"
        empty={{
          icon: MessageSquareQuote,
          title: "No testimonials yet",
          description: "Add a quote to show social proof on the home page.",
        }}
        rows={rows}
        columns={[
          {
            key: "quote",
            header: "Quote",
            render: (row) => (
              <p className="line-clamp-2 max-w-md text-muted">{row.content}</p>
            ),
          },
          {
            key: "customer",
            header: "Customer",
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-label font-medium">
                  {row.customer_name}
                </p>
                <p className="truncate font-label text-xs text-muted-foreground">
                  {row.customer_role ?? "–"}
                </p>
              </div>
            ),
          },
          {
            key: "project",
            header: "Project",
            render: (row) => {
              const project = row.projects as { title: string } | null;
              return (
                <span className="font-label text-xs text-muted">
                  {project?.title ?? "–"}
                </span>
              );
            },
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
                editHref={`/admin/testimonials/${row.id}`}
                deleteAction={deleteTestimonial.bind(null, row.id)}
                entityLabel={row.customer_name}
              />
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
