import type { Metadata } from "next";
import { Package } from "lucide-react";
import { AdminPage, DataTable } from "@/components/admin/admin-page";
import { RowActions } from "@/components/admin/row-actions";
import { StatusPill } from "@/components/admin/status-pill";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteProduct } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Digital Products | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(
      "id, title, slug, price, discount_price, file_format, is_published, is_featured, product_files ( id )",
    )
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <AdminPage
      title="Digital Products"
      description="Downloadable products in the shop. Files live in private storage and are only served through signed URLs once an order is paid."
      actions={
        <ButtonLink href="/admin/products/new" size="sm">
          New product
        </ButtonLink>
      }
    >
      <DataTable
        caption="Digital products"
        empty={{
          icon: Package,
          title: "No products yet",
          description: "Add a product to start selling downloads.",
        }}
        rows={rows}
        columns={[
          {
            key: "title",
            header: "Product",
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
            key: "price",
            header: "Price",
            render: (row) => (
              <span className="tabular-nums">
                {formatCurrency(row.discount_price ?? row.price)}
                {row.discount_price != null &&
                row.discount_price < row.price ? (
                  <span className="ml-1.5 font-label text-xs text-muted-foreground line-through">
                    {formatCurrency(row.price)}
                  </span>
                ) : null}
              </span>
            ),
          },
          {
            key: "format",
            header: "Format",
            render: (row) => (
              <span className="font-label text-xs text-muted">
                {row.file_format ?? "–"}
              </span>
            ),
          },
          {
            key: "files",
            header: "Files",
            render: (row) => {
              const count = (row.product_files ?? []).length;
              return (
                <span className="font-label text-xs text-muted">
                  {count === 0 ? "None uploaded" : `${count} file${count === 1 ? "" : "s"}`}
                </span>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                <StatusPill
                  value={row.is_published ? "PUBLISHED" : "UNPUBLISHED"}
                />
                {row.is_featured ? (
                  <StatusPill value="FEATURED" tone="secondary" />
                ) : null}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-20",
            render: (row) => (
              <RowActions
                editHref={`/admin/products/${row.id}`}
                deleteAction={deleteProduct.bind(null, row.id)}
                entityLabel={row.title}
                deleteDisabledReason={
                  row.is_published
                    ? "Unpublish the product before deleting it"
                    : undefined
                }
              />
            ),
          },
        ]}
      />
    </AdminPage>
  );
}
