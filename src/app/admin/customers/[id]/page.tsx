import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { StatusPill } from "@/components/admin/status-pill";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Customer | Admin", robots: { index: false, follow: false } };
}

/**
 * Customer history.
 *
 * The id is either a profile id or `guest-<email>` — guests never have a
 * profile row, so their history is looked up by the email they left behind.
 */
export default async function AdminCustomerPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  const isGuest = id.startsWith("guest-");
  const email = isGuest ? decodeURIComponent(id.slice("guest-".length)) : null;

  let profile = null;
  let customerEmail = email ?? "";

  if (!isGuest) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    profile = data;
    customerEmail = data.email;
  }

  const [{ data: serviceOrders }, { data: digitalOrders }] = await Promise.all([
    supabase
      .from("service_orders")
      .select("id, order_number, order_status, payment_status, quoted_price, created_at")
      .ilike("customer_email", customerEmail)
      .order("created_at", { ascending: false }),
    supabase
      .from("digital_orders")
      .select("id, order_number, payment_status, total_amount, created_at")
      .ilike("customer_email", customerEmail)
      .order("created_at", { ascending: false }),
  ]);

  const displayName = profile?.full_name ?? customerEmail.split("@")[0];

  return (
    <EditorShell
      title={displayName}
      description={customerEmail}
      backHref="/admin/customers"
      backLabel="Back to customers"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Service orders</h2>
          {(serviceOrders ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No service orders from this customer.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {(serviceOrders ?? []).map((order) => (
                <li key={order.id} className="py-3 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/admin/service-orders/${order.id}`}
                      className="font-label text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <div className="flex gap-1.5">
                      <StatusPill value={order.order_status} />
                      <StatusPill value={order.payment_status} />
                    </div>
                  </div>
                  <p className="mt-1 font-label text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                    {order.quoted_price != null
                      ? ` · ${formatCurrency(order.quoted_price)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Digital orders</h2>
          {(digitalOrders ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No digital orders from this customer.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {(digitalOrders ?? []).map((order) => (
                <li key={order.id} className="py-3 first:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/admin/digital-orders/${order.id}`}
                      className="font-label text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusPill value={order.payment_status} />
                      <span className="font-label text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 font-label text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </EditorShell>
  );
}
