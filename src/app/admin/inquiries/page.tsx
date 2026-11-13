import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusPill } from "@/components/admin/status-pill";
import { deleteInquiry } from "@/lib/actions/admin-inquiries";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inquiries | Admin",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  DESIGN_SERVICE: "Design service",
  COLLABORATION: "Collaboration",
  PARTNERSHIP: "Partnership",
  OTHER: "Other",
};

export default async function AdminInquiriesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("inquiries")
    .select(
      "id, name, email, company, subject, inquiry_type, status, is_read, created_at",
    )
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Inquiries"
      description="Messages submitted through the contact form. Unread messages are flagged for attention."
    >
      <DataTable
        caption="Contact inquiries"
        empty={{
          icon: Inbox,
          title: "No inquiries yet",
          description: "Contact form submissions will appear here.",
        }}
        rows={rows}
        columns={[
          {
            key: "subject",
            header: "Subject",
            render: (row) => (
              <div className="min-w-0">
                <Link
                  href={`/admin/inquiries/${row.id}`}
                  prefetch={false}
                  className="truncate font-label font-medium text-primary underline-offset-4 hover:underline"
                >
                  {row.subject}
                </Link>
                <p className="truncate font-label text-xs text-muted-foreground">
                  {TYPE_LABELS[row.inquiry_type] ?? row.inquiry_type}
                  {row.company ? ` · ${row.company}` : ""}
                </p>
              </div>
            ),
          },
          {
            key: "from",
            header: "From",
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate">{row.name}</p>
                <p className="truncate font-label text-xs text-muted-foreground">
                  {row.email}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                <StatusPill value={row.status} />
                {!row.is_read ? (
                  <StatusPill value="UNREAD" tone="primary" />
                ) : null}
              </div>
            ),
          },
          {
            key: "created",
            header: "Received",
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
              <div className="flex items-center justify-end">
                <DeleteButton
                  action={deleteInquiry.bind(null, row.id)}
                  entityLabel={row.subject}
                  iconOnly
                />
              </div>
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
