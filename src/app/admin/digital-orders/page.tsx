import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { StatusPill } from "@/components/admin/status-pill";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Digital Orders | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDigitalOrdersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("digital_orders")
    .select(
      "id, order_number, customer_name, customer_email, total_amount, payment_status, payment_provider, created_at, digital_order_items ( id, product_title, quantity )",
    )
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Digital Orders"
      description="Product purchases. Downloads unlock only once a payment is confirmed as paid."
    >
      <DataTable
        caption="Digital orders"
        empty={{
          icon: ShoppingCart,
          title: "No digital orders yet",
          description: "Purchases from the shop will appear here.",
        }}
        rows={rows}
        columns={[
          {
            key: "order",
            header: "Order",
            render: (row) => (
              <div className="min-w-0">
                <Link
                  href={`/admin/digital-orders/${row.id}`}
                  prefetch={false}
                  className="font-label font-medium text-primary underline-offset-4 hover:underline"
                >
                  {row.order_number}
                </Link>
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
            key: "items",
            header: "Items",
            render: (row) => {
              const items = (row.digital_order_items ?? []) as {
                id: string;
                product_title: string;
                quantity: number;
              }[];
              if (items.length === 0) {
                return <span className="text-muted">–</span>;
              }
              return (
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.id} className="font-label text-xs text-muted">
                      {item.quantity} × {item.product_title}
                    </li>
                  ))}
                </ul>
              );
            },
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => (
              <span className="tabular-nums font-medium">
                {formatCurrency(row.total_amount)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Payment",
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                <StatusPill value={row.payment_status} />
                <StatusPill value={row.payment_provider} tone="neutral" />
              </div>
            ),
          },
          {
            key: "created",
            header: "Purchased",
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
