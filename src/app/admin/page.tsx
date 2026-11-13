import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Inbox, Receipt } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import {
  LazyOrdersChart,
  LazyRevenueChart,
  type OrderPoint,
  type RevenuePoint,
} from "@/components/admin/overview-charts-lazy";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview â€” Admin",
  robots: { index: false, follow: false },
};

const INQUIRY_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  DESIGN_SERVICE: "Design service",
  COLLABORATION: "Collaboration",
  PARTNERSHIP: "Partnership",
  OTHER: "Other",
};

/**
 * The audit trail is written in machine words â€” "update", "site_setting" â€”
 * because that is what a log is for. The studio reads it in sentences.
 */
const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  status_change: "Moved the status of",
  payment_update: "Updated the payment on",
  payment_confirmed: "Confirmed the payment on",
  reply: "Replied to",
};

const ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  project: "a portfolio project",
  service: "a service",
  service_package: "a package",
  product: "a digital product",
  category: "a category",
  testimonial: "a testimonial",
  site_setting: "a website content block",
  inquiry: "an inquiry",
  product_file: "a product file",
  media: "a media file",
  digital_order: "a digital order",
  service_order: "a service order",
};

interface DigitalOrderRow {
  total_amount: number | null;
  payment_status: string;
  created_at: string;
}

interface ServiceOrderRow {
  quoted_price: number | null;
  payment_status: string;
  created_at: string;
}

/**
 * Buckets orders into the last twelve months.
 *
 * Revenue counts only paid transactions â€” a pending order is not money in the
 * bank. Order counts include everything, because a pending order is still an
 * order the studio has to handle.
 */
function buildSeries(
  digitalRows: DigitalOrderRow[],
  serviceRows: ServiceOrderRow[],
): { revenue: RevenuePoint[]; orders: OrderPoint[] } {
  const now = new Date();
  const keys: string[] = [];
  const labels: string[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    keys.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
    labels.push(
      new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(
        date,
      ),
    );
  }

  const revenue = keys.map<RevenuePoint>((key, index) => ({
    month: labels[index],
    digital: 0,
    service: 0,
  }));
  const orders = keys.map<OrderPoint>((key, index) => ({
    month: labels[index],
    digital: 0,
    service: 0,
  }));

  const indexOf = (createdAt: string) => keys.indexOf(createdAt.slice(0, 7));

  for (const row of digitalRows) {
    const index = indexOf(row.created_at);
    if (index === -1) continue;
    orders[index].digital += 1;
    if (row.payment_status === "PAID") {
      revenue[index].digital += row.total_amount ?? 0;
    }
  }

  for (const row of serviceRows) {
    const index = indexOf(row.created_at);
    if (index === -1) continue;
    orders[index].service += 1;
    if (row.payment_status === "PAID") {
      revenue[index].service += row.quoted_price ?? 0;
    }
  }

  return { revenue, orders };
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [
    countsResult,
    revenueResult,
    inquiriesResult,
    ordersResult,
    activityResult,
    digitalOrdersResult,
    serviceOrdersResult,
  ] = await Promise.all([
    supabase.rpc("admin_counts"),
    supabase.rpc("admin_revenue_summary"),
    supabase
      .from("inquiries")
      .select("id, name, email, subject, inquiry_type, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("service_orders")
      .select("id, order_number, customer_name, customer_email, order_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("activity_logs")
      .select("id, action, entity_type, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("digital_orders")
      .select("total_amount, payment_status, created_at"),
    supabase
      .from("service_orders")
      .select("quoted_price, payment_status, created_at"),
  ]);

  const { revenue, orders: orderCounts } = buildSeries(
    digitalOrdersResult.data ?? [],
    serviceOrdersResult.data ?? [],
  );

  const counts = (countsResult.data?.[0] ?? {}) as Record<string, number>;
  const rev = (revenueResult.data?.[0] ?? {}) as Record<string, number>;
  const inquiries = inquiriesResult.data ?? [];
  const orders = ordersResult.data ?? [];
  const activity = activityResult.data ?? [];

  const count = (key: string) => counts[key] ?? 0;

  const digitalRevenue = rev.digital_revenue ?? 0;
  const serviceRevenue = rev.service_revenue ?? 0;
  const paidOrders = rev.paid_orders_count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
          Overview
        </h1>
        <p className="prose-body mt-1.5 text-sm">
          Everything published across the studio, and what needs your attention.
        </p>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Revenue (paid)"
          value={formatCurrency(digitalRevenue + serviceRevenue)}
          hint={`${paidOrders} paid digital ${paidOrders === 1 ? "order" : "orders"}`}
          tone="accent"
        />
        <StatCard
          label="Portfolio projects"
          value={count("total_projects")}
          hint={`${count("published_projects")} published`}
        />
        <StatCard
          label="Services"
          value={count("total_services")}
          hint={`${count("active_services")} active`}
        />
        <StatCard
          label="Inquiries"
          value={count("total_inquiries")}
          hint={`${count("unread_inquiries")} unread`}
          tone={count("unread_inquiries") > 0 ? "accent" : "default"}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Pending service orders"
          value={count("pending_service_orders")}
          hint="Waiting for a reply"
          tone="muted"
        />
        <StatCard
          label="Pending digital orders"
          value={rev?.pending_orders_count ?? 0}
          hint="Awaiting payment confirmation"
          tone="muted"
        />
        <StatCard
          label="Completed projects"
          value={rev?.completed_projects_count ?? 0}
          hint="Service orders marked complete"
          tone="muted"
        />
        <StatCard
          label="Digital orders"
          value={rev?.digital_orders_count ?? 0}
          hint="All time"
          tone="muted"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Revenue</h2>
          <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
            Paid transactions over the last twelve months.
          </p>
          <LazyRevenueChart data={revenue} />
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Orders</h2>
          <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
            Orders received over the last twelve months.
          </p>
          <LazyOrdersChart data={orderCounts} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent inquiries */}
        <section className="min-w-0 rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Inbox aria-hidden="true" className="size-4 text-primary" />
              Recent inquiries
            </h2>
            <Link
              href="/admin/inquiries"
              prefetch={false}
              className="inline-flex items-center gap-1 font-label text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
              <ArrowRight aria-hidden="true" className="size-3" />
            </Link>
          </div>

          {inquiries && inquiries.length > 0 ? (
            <ul className="divide-y divide-border">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-label text-sm font-medium text-text">
                        {inquiry.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {inquiry.name} Â§ {inquiry.email}
                      </p>
                    </div>
                    <Badge
                      variant={inquiry.is_read ? "neutral" : "primary"}
                      className="shrink-0"
                    >
                      {inquiry.is_read
                        ? "Read"
                        : (INQUIRY_TYPE_LABELS[inquiry.inquiry_type] ??
                          inquiry.inquiry_type)}
                    </Badge>
                  </div>
                  <p className="mt-1.5 font-label text-xs text-muted-foreground">
                    {formatDate(inquiry.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Inbox}
                title="No inquiries yet"
                description="Messages submitted through the contact form will appear here."
                className="border-0 bg-surface-sunken py-10"
              />
            </div>
          )}
        </section>

        {/* Recent service orders */}
        <section className="min-w-0 rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Receipt aria-hidden="true" className="size-4 text-primary" />
              Recent service orders
            </h2>
            <Link
              href="/admin/service-orders"
              prefetch={false}
              className="inline-flex items-center gap-1 font-label text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              View all
              <ArrowRight aria-hidden="true" className="size-3" />
            </Link>
          </div>

          {orders && orders.length > 0 ? (
            <ul className="divide-y divide-border">
              {orders.map((order) => (
                <li key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-label text-sm font-medium text-text">
                        {order.order_number}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {order.customer_name} Â§ {order.customer_email}
                      </p>
                    </div>
                    <Badge variant="neutral" className="shrink-0">
                      {order.order_status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="mt-1.5 font-label text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Receipt}
                title="No service orders yet"
                description="Project briefs submitted through the order form will appear here."
                className="border-0 bg-surface-sunken py-10"
              />
            </div>
          )}
        </section>
      </div>

      {/* Activity */}
      <section className="rounded-lg border border-border bg-surface shadow-sm">
        <h2 className="border-b border-border px-5 py-4 font-display text-lg font-semibold">
          Recent activity
        </h2>

        {activity && activity.length > 0 ? (
          <ul className="divide-y divide-border">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <p className="min-w-0 truncate font-label text-sm text-text">
                  <span className="font-medium">
                    {ACTIVITY_ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    {ACTIVITY_ENTITY_LABELS[entry.entity_type] ??
                      entry.entity_type}
                  </span>
                </p>
                <p className="shrink-0 font-label text-xs text-muted-foreground">
                  {formatDate(entry.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5">
            <EmptyState
              title="No activity recorded yet"
              description="Admin changes are logged here as they happen."
              className="border-0 bg-surface-sunken py-10"
            />
          </div>
        )}
      </section>
    </div>
  );
}
