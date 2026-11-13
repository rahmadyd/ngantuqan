import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import {
  normaliseFieldTranslations,
  type FieldConfig,
} from "@/components/admin/field-config";
import { saveCategory } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type Category = Database["public"]["Tables"]["categories"]["Row"];

const NEW = "new";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === NEW ? "New category | Admin" : "Edit category | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function AdminCategoryEditorPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();
  const isNew = id === NEW;

  let category: Category | null = null;

  if (!isNew) {
    const { data } = await supabase
      .from("categories")
      .select("*, translations")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    category = data;
  }

  const translations = normaliseFieldTranslations(category?.translations);

  const fields: FieldConfig[] = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      value: category?.name ?? "",
      translatable: true,
      translations,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      help: "Leave empty to generate one from the name.",
      value: category?.slug ?? "",
    },
    {
      name: "type",
      label: "Type",
      type: "select",
      required: true,
      options: [
        { value: "PORTFOLIO", label: "Portfolio" },
        { value: "SERVICE", label: "Service" },
        { value: "PRODUCT", label: "Product" },
      ],
      value: category?.type ?? "PORTFOLIO",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      value: category?.description ?? "",
      translatable: true,
      translations,
    },
  ];

  return (
    <EditorShell
      title={isNew ? "New category" : `Edit ${category?.name ?? "category"}`}
      description="Categories drive the filters on the public site."
      backHref="/admin/categories"
      backLabel="Back to categories"
    >
      <EntityForm
        action={saveCategory}
        fields={fields}
        submitLabel={isNew ? "Create category" : "Save changes"}
        hidden={{ id: isNew ? undefined : category?.id }}
        cancelHref="/admin/categories"
      />
    </EditorShell>
  );
}
