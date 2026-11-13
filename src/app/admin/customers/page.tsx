import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { StatusPill } from "@/components/admin/status-pill";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customers | Admin",
  robots: { index: false, follow: false },
};

interface CustomerRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  order_count: number;
  source: "account" | "guest";
}

/**
 * Customers combines registered profiles with guest buyers who left an email
 * on an order or inquiry — a guest never has a profile row, so a profiles-only
 * list would hide them entirely.
 */
export default async function AdminCustomersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: serviceOrders }, { data: digitalOrders }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("service_orders")
        .select("customer_email, customer_name"),
      supabase
        .from("digital_orders")
        .select("customer_email, customer_name"),
    ]);

  const orderCounts = new Map<string, number>();
  const guestNames = new Map<string, string>();

  for (const order of [...(serviceOrders ?? []), ...(digitalOrders ?? [])]) {
    const email = order.customer_email.toLowerCase();
    orderCounts.set(email, (orderCounts.get(email) ?? 0) + 1);

    // A guest has no profile, so the name they typed on the order is the
    // only name the studio has.
    if (!guestNames.has(email) && order.customer_name?.trim()) {
      guestNames.set(email, order.customer_name.trim());
    }
  }

  const rows: CustomerRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    created_at: profile.created_at,
    order_count: orderCounts.get(profile.email.toLowerCase()) ?? 0,
    source: "account",
  }));

  // Guest buyers — emails seen on orders but without a profile.
  const known = new Set(rows.map((row) => row.email.toLowerCase()));
  for (const [email, count] of orderCounts) {
    if (known.has(email)) continue;
    rows.push({
      id: `guest-${email}`,
      email,
      full_name: guestNames.get(email) ?? null,
      role: "CUSTOMER",
      created_at: "",
      order_count: count,
      source: "guest",
    });
  }

  return (
    <AdminPage
      title="Customers"
      description="Everyone who has ordered or enquired. Guest buyers are matched to their accounts by email."
    >
      <DataTable
        caption="Customers"
        empty={{
          icon: Users,
          title: "No customers yet",
          description: "Customers appear here once they order or enquire.",
        }}
        rows={rows}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <span className="font-label font-medium">
                {row.full_name ??
                  (row.source === "guest" ? "Guest buyer" : "No name given")}
              </span>
            ),
          },
          {
            key: "email",
            header: "Email",
            render: (row) => (
              <Link
                href={`/admin/customers/${encodeURIComponent(row.id)}`}
                prefetch={false}
                className="text-muted underline-offset-4 hover:text-text hover:underline"
              >
                {row.email}
              </Link>
            ),
          },
          {
            key: "type",
            header: "Type",
            render: (row) => (
              <StatusPill
                value={row.source === "account" ? "ACCOUNT" : "GUEST"}
                tone={row.source === "account" ? "primary" : "neutral"}
              />
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (row) => (
              <StatusPill
                value={row.role}
                tone={row.role === "ADMIN" ? "warning" : "neutral"}
              />
            ),
          },
          {
            key: "orders",
            header: "Orders",
            render: (row) => (
              <span className="tabular-nums text-muted">{row.order_count}</span>
            ),
          },
          {
            key: "created",
            header: "Joined",
            render: (row) => (
              <span className="font-label text-xs text-muted-foreground">
                {row.created_at ? formatDate(row.created_at) : "–"}
              </span>
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
