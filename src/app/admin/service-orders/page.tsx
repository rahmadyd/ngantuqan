import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { StatusPill } from "@/components/admin/status-pill";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Service Orders | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminServiceOrdersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("service_orders")
    .select(
      "id, order_number, customer_name, customer_email, order_status, payment_status, quoted_price, created_at, services ( title )",
    )
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Service Orders"
      description="Project briefs submitted through the order form. New inquiries appear here first."
    >
      <DataTable
        caption="Service orders"
        empty={{
          icon: Receipt,
          title: "No service orders yet",
          description: "Briefs submitted from the order form will appear here.",
        }}
        rows={rows}
        columns={[
          {
            key: "order",
            header: "Order",
            render: (row) => (
              <div className="min-w-0">
                <Link
                  href={`/admin/service-orders/${row.id}`}
                  prefetch={false}
                  className="font-label font-medium text-primary underline-offset-4 hover:underline"
                >
                  {row.order_number}
                </Link>
                <p className="truncate font-label text-xs text-muted-foreground">
                  {row.services?.title ?? "–"}
                </p>
              </div>
            ),
          },
          {
            key: "customer",
            header: "Customer",
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate">{row.customer_name}</p>
                <p className="truncate font-label text-xs text-muted-foreground">
                  {row.customer_email}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                <StatusPill value={row.order_status} />
                <StatusPill value={row.payment_status} />
              </div>
            ),
          },
          {
            key: "quoted",
            header: "Quoted",
            render: (row) => (
              <span className="tabular-nums text-muted">
                {row.quoted_price != null
                  ? formatCurrency(row.quoted_price)
                  : "–"}
              </span>
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
        ]}
      />
    </AdminPage>
  );
}
