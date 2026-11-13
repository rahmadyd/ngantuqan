import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import type { FieldConfig } from "@/components/admin/field-config";
import { StatusPill } from "@/components/admin/status-pill";
import { updateDigitalOrderPayment } from "@/lib/actions/admin-orders";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_STATUSES } from "@/lib/validations/admin";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type OrderItem = Database["public"]["Tables"]["digital_order_items"]["Row"];

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Digital Order | Admin", robots: { index: false, follow: false } };
}

export default async function AdminDigitalOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("digital_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("digital_order_items")
    .select("*")
    .eq("digital_order_id", order.id)
    .order("created_at", { ascending: true });

  const orderItems = (items ?? []) as OrderItem[];

  const { data: downloads } = orderItems.length
    ? await supabase
        .from("downloads")
        .select("*")
        .in(
          "digital_order_item_id",
          orderItems.map((item) => item.id),
        )
    : { data: [] };

  const fields: FieldConfig[] = [
    {
      name: "payment_status",
      label: "Payment status",
      type: "select",
      required: true,
      options: PAYMENT_STATUSES.map((status) => ({
        value: status,
        label: status.toLowerCase(),
      })),
      value: order.payment_status,
    },
    {
      name: "transaction_reference",
      label: "Transaction reference",
      type: "text",
      help: "Bank transfer or receipt reference the buyer quoted.",
      value: order.transaction_reference ?? "",
    },
  ];

  return (
    <EditorShell
      title={`Order ${order.order_number}`}
      description="Marking an order as paid unlocks the buyer's downloads. The confirmation runs through the database, not the browser."
      backHref="/admin/digital-orders"
      backLabel="Back to digital orders"
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EntityForm
            action={updateDigitalOrderPayment}
            fields={fields}
            submitLabel="Update payment"
            hidden={{ id: order.id }}
            cancelHref="/admin/digital-orders"
          />
        </div>

        <aside className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-border bg-surface-sunken p-4">
            <h2 className="font-display text-sm font-semibold">Order</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="eyebrow">Customer</dt>
                <dd className="mt-0.5">
                  {order.customer_name}
                  <span className="block text-xs text-muted-foreground">
                    {order.customer_email}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Total</dt>
                <dd className="mt-0.5 tabular-nums">
                  {formatCurrency(order.total_amount)}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">Provider</dt>
                <dd className="mt-0.5">{order.payment_provider}</dd>
              </div>
              <div>
                <dt className="eyebrow">Purchased</dt>
                <dd className="mt-0.5">{formatDate(order.created_at)}</dd>
              </div>
              <div>
                <dt className="eyebrow">Status</dt>
                <dd className="mt-0.5">
                  <StatusPill value={order.payment_status} />
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="font-display text-sm font-semibold">Items</h2>
            <ul className="mt-3 space-y-3">
              {orderItems.map((item) => {
                const download = (downloads ?? []).find(
                  (row) => row.digital_order_item_id === item.id,
                );

                return (
                  <li key={item.id} className="border-b border-border pb-3 last:border-0">
                    <p className="font-label text-sm font-medium">
                      {item.quantity} × {item.product_title}
                    </p>
                    <p className="mt-0.5 font-label text-xs text-muted-foreground">
                      {formatCurrency(item.unit_price)} ·{" "}
                      {download
                        ? `${download.download_count} download${
                            download.download_count === 1 ? "" : "s"
                          }`
                        : "no downloads yet"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </EditorShell>
  );
}
