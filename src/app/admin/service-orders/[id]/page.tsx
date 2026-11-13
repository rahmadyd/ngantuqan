import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import type { FieldConfig } from "@/components/admin/field-config";
import { StatusPill } from "@/components/admin/status-pill";
import { updateServiceOrder } from "@/lib/actions/admin-orders";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  PAYMENT_STATUSES,
  SERVICE_ORDER_STATUSES,
} from "@/lib/validations/admin";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type StatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Service Order | Admin", robots: { index: false, follow: false } };
}

export default async function AdminServiceOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("service_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: packages }, { data: history }, { data: attachments }] =
    await Promise.all([
      supabase
        .from("service_packages")
        .select("id, name, price")
        .eq("service_id", order.service_id)
        .order("price", { ascending: true }),
      supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("order_attachments")
        .select("*")
        .eq("order_id", order.id),
    ]);

  const fields: FieldConfig[] = [
    {
      name: "order_status",
      label: "Order status",
      type: "select",
      required: true,
      options: SERVICE_ORDER_STATUSES.map((status) => ({
        value: status,
        label: status.replace(/_/g, " ").toLowerCase(),
      })),
      value: order.order_status,
    },
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
      name: "quoted_price",
      label: "Quoted price",
      type: "number",
      min: 0,
      step: 1000,
      help: "Leave empty until the quote is agreed.",
      value: order.quoted_price ?? "",
    },
    {
      name: "package_id",
      label: "Package",
      type: "select",
      options: [
        { value: "", label: "No package" },
        ...(packages ?? []).map((pkg) => ({
          value: pkg.id,
          label: `${pkg.name}, ${formatCurrency(pkg.price)}`,
        })),
      ],
      value: order.package_id ?? "",
    },
    {
      name: "deadline",
      label: "Deadline",
      type: "text",
      help: "Format: YYYY-MM-DD",
      value: order.deadline ?? "",
    },
    {
      name: "admin_notes",
      label: "Internal notes",
      type: "textarea",
      rows: 5,
      help: "Only visible in the admin panel.",
      value: order.admin_notes ?? "",
    },
  ];

  const historyRows = (history ?? []) as StatusHistory[];

  return (
    <div className="space-y-6">
      <EditorShell
        title={`Order ${order.order_number}`}
        description="Project brief submitted by the client. Every status change is recorded in the history below."
        backHref="/admin/service-orders"
        backLabel="Back to service orders"
      >
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <EntityForm
              action={updateServiceOrder}
              fields={fields}
              submitLabel="Save order"
              hidden={{ id: order.id }}
              cancelHref="/admin/service-orders"
            />
          </div>

          <aside className="space-y-4 lg:col-span-2">
            <section className="rounded-lg border border-border bg-surface-sunken p-4">
              <h2 className="font-display text-sm font-semibold">Brief</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <Detail label="Client">
                  {order.customer_name}
                  <span className="block text-xs text-muted-foreground">
                    {order.customer_email}
                  </span>
                </Detail>
                <Detail label="Received">{formatDate(order.created_at)}</Detail>
                <Detail label="Budget">
                  {order.budget != null ? formatCurrency(order.budget) : "–"}
                </Detail>
                <Detail label="Target audience">
                  {order.target_audience ?? "–"}
                </Detail>
                <Detail label="Preferred colours">
                  {order.preferred_colors ?? "–"}
                </Detail>
                <Detail label="References">
                  {order.design_references ?? "–"}
                </Detail>
              </dl>
              <div className="mt-4 border-t border-border pt-3">
                <p className="eyebrow">Description</p>
                <p className="mt-1.5 text-sm whitespace-pre-wrap text-text">
                  {order.project_description}
                </p>
              </div>
              {(attachments ?? []).length > 0 ? (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="eyebrow">Attachments</p>
                  <ul className="mt-1.5 space-y-1 text-sm">
                    {(attachments ?? []).map((attachment) => (
                      <li
                        key={attachment.id}
                        className="truncate font-label text-xs text-muted-foreground"
                      >
                        {attachment.file_name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="font-display text-sm font-semibold">History</h2>
              {historyRows.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No status changes recorded.
                </p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {historyRows.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-border pl-3">
                      <p className="font-label text-xs">
                        <StatusPill value={entry.new_status} />
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.old_status
                          ? `${entry.old_status.replace(/_/g, " ").toLowerCase()} → `
                          : ""}
                        {formatDate(entry.created_at)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </EditorShell>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{children}</dd>
    </div>
  );
}
