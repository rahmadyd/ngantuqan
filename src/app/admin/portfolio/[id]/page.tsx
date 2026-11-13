import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import {
  normaliseFieldTranslations,
  type FieldConfig,
} from "@/components/admin/field-config";
import { saveProject } from "@/lib/actions/admin-content";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { listMediaAssets } from "@/lib/queries/media";
import { resolveMediaSrc } from "@/lib/supabase/storage";
import { GalleryEditor } from "@/components/admin/gallery-editor";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type Project = Database["public"]["Tables"]["projects"]["Row"];

const NEW = "new";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === NEW ? "New project | Admin" : "Edit project | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function AdminProjectEditorPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();
  const isNew = id === NEW;

  let project: Project | null = null;

  if (!isNew) {
    const { data } = await supabase
      .from("projects")
      .select("*, translations")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    project = data;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "PORTFOLIO")
    .order("name");

  // The assets the cover image can be chosen from.
  const assets = await listMediaAssets(supabase);

  // The gallery, in the order it appears on the public page.
  const { data: galleryRows } = await supabase
    .from("project_images")
    .select("id, image_url, alt_text, translations")
    .eq("project_id", id)
    .order("display_order", { ascending: true });

  const gallery = (galleryRows ?? []).map((row) => ({
    id: row.id,
    path: row.image_url,
    url: resolveMediaSrc(row.image_url) ?? row.image_url,
    altText: row.alt_text ?? "",
    altTextId: normaliseFieldTranslations(row.translations).id?.alt_text ?? "",
  }));

  const translations = normaliseFieldTranslations(project?.translations);

  const fields: FieldConfig[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "Aurora Coffee Rebrand",
      value: project?.title ?? "",
      translatable: true,
      translations,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      help: "Leave empty to generate one from the title. Lowercase letters, numbers, and dashes.",
      placeholder: "aurora-coffee-rebrand",
      value: project?.slug ?? "",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 6,
      value: project?.description ?? "",
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
      value: project?.category_id ?? "",
    },
    {
      name: "client_name",
      label: "Client",
      type: "text",
      value: project?.client_name ?? "",
      translatable: true,
      translations,
    },
    {
      name: "project_year",
      label: "Year",
      type: "number",
      min: 2000,
      step: 1,
      value: project?.project_year ?? "",
    },
    {
      name: "cover_image",
      label: "Cover image",
      type: "media",
      help: "Pick the image shown on the work grid.",
      value: project?.cover_image ?? "",
      media: assets,
    },
    {
      name: "is_featured",
      label: "Featured",
      type: "checkbox",
      help: "Featured projects appear in the highlights section on the home page.",
      value: project?.is_featured ?? false,
    },
    {
      name: "is_published",
      label: "Published",
      type: "checkbox",
      help: "Unpublished projects are hidden from the public site.",
      value: project?.is_published ?? false,
    },
    {
      name: "seo_title",
      label: "SEO title",
      type: "text",
      help: "Falls back to the project title.",
      value: project?.seo_title ?? "",
      translatable: true,
      translations,
    },
    {
      name: "seo_description",
      label: "SEO description",
      type: "textarea",
      rows: 2,
      value: project?.seo_description ?? "",
      translatable: true,
      translations,
    },
  ];

  return (
    <EditorShell
      title={isNew ? "New project" : `Edit ${project?.title ?? "project"}`}
      description="Case studies are the main proof of work on the public site."
      backHref="/admin/portfolio"
      backLabel="Back to portfolio"
    >
      <EntityForm
        action={saveProject}
        fields={fields}
        submitLabel={isNew ? "Create project" : "Save changes"}
        hidden={{ id: isNew ? undefined : project?.id }}
        cancelHref="/admin/portfolio"
      />

      {/* The gallery belongs to a saved project — a new one has no id yet. */}
      {!isNew && project ? (
        <div className="mt-6">
          <GalleryEditor
            kind="project"
            entityId={project.id}
            images={gallery}
            assets={assets}
          />
        </div>
      ) : null}
    </EditorShell>
  );
}
