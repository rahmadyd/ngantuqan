import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  normaliseFieldTranslations,
  type FieldConfig,
} from "@/components/admin/field-config";
import { ButtonLink } from "@/components/ui/button-link";
import { deleteServicePackage, saveService } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { listMediaAssets } from "@/lib/queries/media";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type Service = Database["public"]["Tables"]["services"]["Row"];
type ServicePackage = Database["public"]["Tables"]["service_packages"]["Row"];

const NEW = "new";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === NEW ? "New service | Admin" : "Edit service | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function AdminServiceEditorPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  // The assets the image can be chosen from.
  const assets = await listMediaAssets(supabase);
  const isNew = id === NEW;

  let service: Service | null = null;
  let packages: ServicePackage[] = [];

  if (!isNew) {
    const { data } = await supabase
      .from("services")
      .select("*, translations")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    service = data;

    const { data: packageRows } = await supabase
      .from("service_packages")
      .select("*")
      .eq("service_id", id)
      .order("price", { ascending: true });

    packages = packageRows ?? [];
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "SERVICE")
    .order("name");

  const translations = normaliseFieldTranslations(service?.translations);

  const fields: FieldConfig[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      value: service?.title ?? "",
      translatable: true,
      translations,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      help: "Leave empty to generate one from the title.",
      value: service?.slug ?? "",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 5,
      value: service?.description ?? "",
      translatable: true,
      translations,
    },
    {
      name: "category_id",
      label: "Category",
      type: "select",
      options: [
        { value: "", label: "No category" },
        ...(categories ?? []).map((category) => ({
          value: category.id,
          label: category.name,
        })),
      ],
      value: service?.category_id ?? "",
    },
    {
      name: "turnaround_days",
      label: "Turnaround (days)",
      type: "number",
      required: true,
      min: 1,
      step: 1,
      value: service?.turnaround_days ?? 7,
    },
    {
      name: "revision_policy",
      label: "Revision policy",
      type: "text",
      placeholder: "Two rounds of revisions included",
      value: service?.revision_policy ?? "",
      translatable: true,
      translations,
    },
    {
      name: "cover_image",
      label: "Cover image",
      type: "media",
      help: "Pick the image shown on the work grid.",
      value: service?.cover_image ?? "",
      media: assets,
    },
    {
      name: "deliverables",
      label: "Deliverables",
      type: "lines",
      rows: 6,
      help: "One deliverable per line.",
      value: (service?.deliverables as string[] | null)?.join("\n") ?? "",
      translatable: true,
      translations,
    },
    {
      name: "is_active",
      label: "Active",
      type: "checkbox",
      help: "Inactive services are hidden from the public site.",
      value: service?.is_active ?? true,
    },
  ];

  return (
    <div className="space-y-6">
      <EditorShell
        title={isNew ? "New service" : `Edit ${service?.title ?? "service"}`}
        description="Services describe what the studio offers. Packages hold the price and the promise."
        backHref="/admin/services"
        backLabel="Back to services"
      >
        <EntityForm
          action={saveService}
          fields={fields}
          submitLabel={isNew ? "Create service" : "Save changes"}
          hidden={{ id: isNew ? undefined : service?.id }}
          cancelHref="/admin/services"
        />
      </EditorShell>

      {!isNew && service ? (
        <section className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Packages</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Each package is priced separately and can be quoted on a service
                order.
              </p>
            </div>
            <ButtonLink href={`/admin/services/${service.id}/packages/new`} size="sm">
              Add package
            </ButtonLink>
          </div>

          {packages.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No packages yet. A service without a package cannot be quoted.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-label font-medium">{pkg.name}</p>
                    <p className="mt-0.5 font-label text-xs text-muted-foreground">
                      {formatCurrency(pkg.price)} § {pkg.delivery_days} day
                      delivery § {pkg.revision_count} revision
                      {pkg.revision_count === 1 ? "" : "s"}
                      {pkg.is_active ? "" : " § inactive"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/services/${service.id}/packages/${pkg.id}`}
                      className="font-label text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteServicePackage.bind(null, pkg.id, service.id)}
                      entityLabel={pkg.name}
                      iconOnly
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
