import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { RowActions } from "@/components/admin/row-actions";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteService } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Services | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminServicesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("services")
    .select(
      "id, title, slug, turnaround_days, is_active, service_packages ( id, name, price, is_active )",
    )
    .order("created_at", { ascending: true });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Services"
      description="The services offered on the public site, with their packages and pricing. Inactive services are hidden."
      actions={
        <ButtonLink href="/admin/services/new" size="sm">
          New service
        </ButtonLink>
      }
    >
      <DataTable
        caption="Services and packages"
        empty={{
          icon: Wrench,
          title: "No services yet",
          description: "Add a service to describe what the studio offers.",
        }}
        rows={rows}
        columns={[
          {
            key: "title",
            header: "Service",
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-label font-medium">{row.title}</p>
                <p className="truncate font-label text-xs text-muted-foreground">
                  /{row.slug}
                </p>
              </div>
            ),
          },
          {
            key: "packages",
            header: "Packages",
            render: (row) => {
              const packages = (row.service_packages ?? []) as {
                id: string;
                name: string;
                price: number;
                is_active: boolean;
              }[];
              if (packages.length === 0) {
                return <span className="text-muted">–</span>;
              }
              return (
                <ul className="space-y-1">
                  {packages.map((pkg) => (
                    <li key={pkg.id} className="font-label text-xs">
                      <span className={pkg.is_active ? "text-text" : "text-muted-foreground line-through"}>
                        {pkg.name}
                      </span>
                      <span className="ml-1.5 tabular-nums text-muted">
                        {formatCurrency(pkg.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            },
          },
          {
            key: "turnaround",
            header: "Turnaround",
            render: (row) => (
              <span className="tabular-nums text-muted">
                {row.turnaround_days} days
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusPill
                value={row.is_active ? "PUBLISHED" : "UNPUBLISHED"}
              />
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-20",
            render: (row) => (
              <RowActions
                editHref={`/admin/services/${row.id}`}
                deleteAction={deleteService.bind(null, row.id)}
                entityLabel={row.title}
              />
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
