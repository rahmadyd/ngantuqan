import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import {
  normaliseFieldTranslations,
  type FieldConfig,
} from "@/components/admin/field-config";
import { saveTestimonial } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { listMediaAssets } from "@/lib/queries/media";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];

const NEW = "new";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === NEW ? "New testimonial | Admin" : "Edit testimonial | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function AdminTestimonialEditorPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  // The assets the image can be chosen from.
  const assets = await listMediaAssets(supabase);
  const isNew = id === NEW;

  let testimonial: Testimonial | null = null;

  if (!isNew) {
    const { data } = await supabase
      .from("testimonials")
      .select("*, translations")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    testimonial = data;
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .order("title", { ascending: true });

  const translations = normaliseFieldTranslations(testimonial?.translations);

  const fields: FieldConfig[] = [
    {
      name: "customer_name",
      label: "Customer name",
      type: "text",
      required: true,
      value: testimonial?.customer_name ?? "",
      translatable: true,
      translations,
    },
    {
      name: "customer_role",
      label: "Role or company",
      type: "text",
      placeholder: "Founder, Aurora Coffee",
      value: testimonial?.customer_role ?? "",
      translatable: true,
      translations,
    },
    {
      name: "content",
      label: "Quote",
      type: "textarea",
      rows: 5,
      required: true,
      value: testimonial?.content ?? "",
      translatable: true,
      translations,
    },
    {
      name: "project_id",
      label: "Related project",
      type: "select",
      options: [
        { value: "", label: "No related project" },
        ...(projects ?? []).map((project) => ({
          value: project.id,
          label: project.title,
        })),
      ],
      value: testimonial?.project_id ?? "",
    },
    {
      name: "avatar_url",
      label: "Avatar",
      type: "media",
      help: "Optional portrait shown beside the quote.",
      value: testimonial?.avatar_url ?? "",
      media: assets,
    },
    {
      name: "is_featured",
      label: "Featured",
      type: "checkbox",
      value: testimonial?.is_featured ?? false,
    },
    {
      name: "is_published",
      label: "Published",
      type: "checkbox",
      help: "Unpublished testimonials are hidden from the public site.",
      value: testimonial?.is_published ?? false,
    },
  ];

  return (
    <EditorShell
      title={isNew ? "New testimonial" : `Edit ${testimonial?.customer_name ?? "testimonial"}`}
      description="Client quotes that build trust on the home page."
      backHref="/admin/testimonials"
      backLabel="Back to testimonials"
    >
      <EntityForm
        action={saveTestimonial}
        fields={fields}
        submitLabel={isNew ? "Create testimonial" : "Save changes"}
        hidden={{ id: isNew ? undefined : testimonial?.id }}
        cancelHref="/admin/testimonials"
      />
    </EditorShell>
  );
}
