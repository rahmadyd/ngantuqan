import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/admin/editor-shell";
import { EntityForm } from "@/components/admin/entity-form";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  normaliseFieldTranslations,
  type FieldConfig,
} from "@/components/admin/field-config";
import { MediaUploader } from "@/components/admin/media-uploader";
import { saveProduct } from "@/lib/actions/admin-content";
import { deleteMediaFile } from "@/lib/actions/admin-media";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { listMediaAssets } from "@/lib/queries/media";
import { resolveMediaSrc } from "@/lib/supabase/storage";
import { GalleryEditor } from "@/components/admin/gallery-editor";
import type { Database } from "@/types/database.types";

type Params = Promise<{ id: string }>;
type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductFile = Database["public"]["Tables"]["product_files"]["Row"];

const NEW = "new";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: id === NEW ? "New product | Admin" : "Edit product | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function AdminProductEditorPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireAdmin();

  const supabase = await createClient();

  // The assets the image can be chosen from.
  const assets = await listMediaAssets(supabase);
  const isNew = id === NEW;

  let product: Product | null = null;
  let files: ProductFile[] = [];

  if (!isNew) {
    const { data } = await supabase
      .from("products")
      .select("*, translations")
      .eq("id", id)
      .maybeSingle();

    if (!data) notFound();
    product = data;

    const { data: fileRows } = await supabase
      .from("product_files")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    files = fileRows ?? [];
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "PRODUCT")
    .order("name");

  // The gallery, in the order it appears on the public page.
  const { data: galleryRows } = await supabase
    .from("product_images")
    .select("id, image_url, alt_text, translations")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  const gallery = (galleryRows ?? []).map((row) => ({
    id: row.id,
    path: row.image_url,
    url: resolveMediaSrc(row.image_url) ?? row.image_url,
    altText: row.alt_text ?? "",
    altTextId: normaliseFieldTranslations(row.translations).id?.alt_text ?? "",
  }));

  const translations = normaliseFieldTranslations(product?.translations);

  const fields: FieldConfig[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      value: product?.title ?? "",
      translatable: true,
      translations,
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      help: "Leave empty to generate one from the title.",
      value: product?.slug ?? "",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 5,
      value: product?.description ?? "",
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
      value: product?.category_id ?? "",
    },
    {
      name: "price",
      label: "Price",
      type: "number",
      required: true,
      min: 0,
      step: 1000,
      value: product?.price ?? 0,
    },
    {
      name: "discount_price",
      label: "Discounted price",
      type: "number",
      min: 0,
      step: 1000,
      help: "Must be lower than the price. Leave empty for no discount.",
      value: product?.discount_price ?? "",
    },
    {
      name: "file_format",
      label: "File format",
      type: "text",
      placeholder: "PSD, FIG, PDF",
      value: product?.file_format ?? "",
      translatable: true,
      translations,
    },
    {
      name: "compatibility",
      label: "Compatibility",
      type: "text",
      placeholder: "Adobe CC 2024, Figma",
      value: product?.compatibility ?? "",
      translatable: true,
      translations,
    },
    {
      name: "license_terms",
      label: "Licence terms",
      type: "textarea",
      rows: 3,
      value: product?.license_terms ?? "",
      translatable: true,
      translations,
    },
    {
      name: "cover_image",
      label: "Cover image",
      type: "media",
      help: "Pick the image shown on the shop grid.",
      value: product?.cover_image ?? "",
      media: assets,
    },
    {
      name: "includes",
      label: "What is included",
      type: "lines",
      rows: 5,
      help: "One item per line.",
      value: (product?.includes as string[] | null)?.join("\n") ?? "",
    },
    {
      name: "is_featured",
      label: "Featured",
      type: "checkbox",
      value: product?.is_featured ?? false,
    },
    {
      name: "is_published",
      label: "Published",
      type: "checkbox",
      help: "Unpublished products are hidden from the shop.",
      value: product?.is_published ?? false,
    },
  ];

  return (
    <div className="space-y-6">
      <EditorShell
        title={isNew ? "New product" : `Edit ${product?.title ?? "product"}`}
        description="Digital products are sold in the shop. Their files stay private until an order is paid."
        backHref="/admin/products"
        backLabel="Back to products"
      >
        <EntityForm
          action={saveProduct}
          fields={fields}
          submitLabel={isNew ? "Create product" : "Save changes"}
          hidden={{ id: isNew ? undefined : product?.id }}
          cancelHref="/admin/products"
        />

        {/* The gallery belongs to a saved product  a new one has no id yet. */}
        {!isNew && product ? (
          <div className="mt-6">
            <GalleryEditor
              kind="product"
              entityId={product.id}
              images={gallery}
              assets={assets}
            />
          </div>
        ) : null}
      </EditorShell>

      {!isNew && product ? (
        <section className="rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-display text-lg font-semibold">Product files</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Uploaded to private storage. Buyers receive a short-lived signed
              URL after payment is confirmed.
            </p>
          </div>

          <div className="px-6 py-5">
            <MediaUploader
              productId={product.id}
              defaultBucket="private-products"
              allowBucketChoice={false}
            />
          </div>

          {files.length === 0 ? (
            <p className="px-6 pb-8 text-center text-sm text-muted-foreground">
              No files attached yet. A product without a file cannot be
              downloaded.
            </p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-label font-medium">
                      {file.file_name}
                    </p>
                    <p className="mt-0.5 font-label text-xs text-muted-foreground">
                      {file.mime_type ?? "unknown type"}
                      {file.file_size
                        ? ` § ${Math.round(file.file_size / 1024)} KB`
                        : ""}
                    </p>
                  </div>
                  <DeleteButton
                    action={deleteMediaFile.bind(
                      null,
                      "private-products",
                      file.storage_path,
                    )}
                    entityLabel={file.file_name}
                    iconOnly
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
