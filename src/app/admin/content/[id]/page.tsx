import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import type { FieldConfig } from "@/components/admin/field-config";
import { saveSiteSetting } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Content Block | Admin", robots: { index: false, follow: false } };
}

export default async function AdminContentEditorPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  const { data: setting } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!setting) notFound();

  const fields: FieldConfig[] = [
    {
      name: "setting_value",
      label: "Value (JSON)",
      type: "textarea",
      rows: 14,
      required: true,
      help: "The block is stored as JSON. Invalid JSON is rejected before anything is written.",
      value: JSON.stringify(setting.setting_value, null, 2),
    },
    {
      name: "is_public",
      label: "Public",
      type: "checkbox",
      help: "Public blocks are readable by the website without a session.",
      value: setting.is_public,
    },
  ];

  return (
    <EditorShell
      title={setting.setting_key}
      description="One editable block of website copy."
      backHref="/admin/content"
      backLabel="Back to content"
    >
      <EntityForm
        action={saveSiteSetting}
        fields={fields}
        submitLabel="Save block"
        hidden={{ id: setting.id }}
        cancelHref="/admin/content"
      />
    </EditorShell>
  );
}
