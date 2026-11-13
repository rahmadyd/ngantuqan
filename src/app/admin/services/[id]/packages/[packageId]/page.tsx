import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import type { FieldConfig } from "@/components/admin/field-config";
import { saveServicePackage } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string; packageId: string }>;
type ServicePackage = Database["public"]["Tables"]["service_packages"]["Row"];

const NEW = "new";

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Package | Admin", robots: { index: false, follow: false } };
}

export default async function AdminServicePackageEditorPage({
  params,
}: {
  params: Params;
}) {
  const { id, packageId } = await params;
  await requireAdmin();

  const supabase = await createClient();
  const isNew = packageId === NEW;

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();

  if (!service) notFound();

  let pkg: ServicePackage | null = null;

  if (!isNew) {
    const { data } = await supabase
      .from("service_packages")
      .select("*")
      .eq("id", packageId)
      .maybeSingle();

    if (!data || data.service_id !== id) notFound();
    pkg = data;
  }

  const fields: FieldConfig[] = [
    {
      name: "name",
      label: "Package name",
      type: "text",
      required: true,
      placeholder: "Full Identity",
      value: pkg?.name ?? "",
      translatable: true,
      translations: (pkg?.translations as Record<string, Record<string, string>> | null) ?? undefined,
    },
    {
      name: "price",
      label: "Price",
      type: "number",
      required: true,
      min: 0,
      step: 1000,
      value: pkg?.price ?? 0,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      value: pkg?.description ?? "",
      translatable: true,
      translations: (pkg?.translations as Record<string, Record<string, string>> | null) ?? undefined,
    },
    {
      name: "delivery_days",
      label: "Delivery (days)",
      type: "number",
      required: true,
      min: 1,
      step: 1,
      value: pkg?.delivery_days ?? 7,
    },
    {
      name: "revision_count",
      label: "Revisions included",
      type: "number",
      min: 0,
      step: 1,
      value: pkg?.revision_count ?? 0,
    },
    {
      name: "features",
      label: "Features",
      type: "lines",
      rows: 6,
      help: "One feature per line.",
      value: (pkg?.features as string[] | null)?.join("\n") ?? "",
      translatable: true,
      translations: (pkg?.translations as Record<string, Record<string, string>> | null) ?? undefined,
    },
    {
      name: "is_active",
      label: "Active",
      type: "checkbox",
      help: "Inactive packages are hidden from the public site.",
      value: pkg?.is_active ?? true,
    },
  ];

  return (
    <EditorShell
      title={isNew ? "New package" : `Edit ${pkg?.name ?? "package"}`}
      description={`A package of ${service.title}.`}
      backHref={`/admin/services/${id}`}
      backLabel="Back to service"
    >
      <EntityForm
        action={saveServicePackage}
        fields={fields}
        submitLabel={isNew ? "Create package" : "Save changes"}
        hidden={{ id: isNew ? undefined : pkg?.id, service_id: service.id }}
        cancelHref={`/admin/services/${id}`}
      />
    </EditorShell>
  );
}
