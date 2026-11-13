"use client";

import dynamic from "next/dynamic";
import type { OrderPoint, RevenuePoint } from "@/components/admin/overview-charts";

export type { OrderPoint, RevenuePoint };

/**
 * The charts arrive after the page.
 *
 * The charting library is the heaviest thing the dashboard ships — around
 * 400 KB — and the studio reads the numbers above the charts first. The
 * skeleton holds the space, so nothing moves when the chart turns up.
 */

function ChartSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-64 w-full animate-pulse rounded-md bg-surface-sunken"
    />
  );
}

const RevenueChart = dynamic(
  () =>
    import("@/components/admin/overview-charts").then(
      (module) => module.RevenueChart,
    ),
  { ssr: false, loading: ChartSkeleton },
);

const OrdersChart = dynamic(
  () =>
    import("@/components/admin/overview-charts").then(
      (module) => module.OrdersChart,
    ),
  { ssr: false, loading: ChartSkeleton },
);

export function LazyRevenueChart({ data }: { data: RevenuePoint[] }) {
  return <RevenueChart data={data} />;
}

export function LazyOrdersChart({ data }: { data: OrderPoint[] }) {
  return <OrdersChart data={data} />;
}
