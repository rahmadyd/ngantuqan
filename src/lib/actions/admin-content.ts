"use server";

import { redirect } from "next/navigation";
import {
  adminDb,
  adminSession,
  fieldErrors,
  invalid,
  logActivity,
  notAuthorised,
  revalidateAdmin,
  revalidatePublic,
} from "@/lib/actions/admin-helpers";
import { adminError, type AdminActionState } from "@/lib/actions/admin-state";
import { clearContentCache } from "@/lib/cache";
import {
  categorySchema,
  galleryImagesSchema,
  productSchema,
  projectSchema,
  servicePackageSchema,
  serviceSchema,
  siteSettingSchema,
  studioSettingsSchema,
  testimonialSchema,
} from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";
import type { Json } from "@/types/database.types";

/**
 * Catalogue mutations.
 *
 * Every action follows the same shape: authenticate, validate, write, log,
 * revalidate. The client only ever supplies field values and an id — the row
 * itself is always resolved from the database.
 */

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  return value;
}

type TranslationValue = string | string[];

function readIndonesianTranslations(
  formData: FormData,
  fields: Record<string, "text" | "lines">,
): Record<string, TranslationValue> {
  const translations: Record<string, TranslationValue> = {};

  for (const [field, type] of Object.entries(fields)) {
    const value = text(formData, `tr_id_${field}`)?.trim();
    if (!value) continue;

    translations[field] =
      type === "lines"
        ? value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : value;
  }

  return translations;
}

function mergeTranslations(
  existing: unknown,
  submitted: Record<string, TranslationValue>,
): Json {
  const merged: Record<string, Record<string, Json | undefined>> = {};

  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    for (const [locale, fields] of Object.entries(existing)) {
      if (!fields || typeof fields !== "object" || Array.isArray(fields)) continue;

      merged[locale] = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined),
      ) as Record<string, Json | undefined>;
    }
  }

  const indonesian = merged.id ?? {};

  for (const [field, value] of Object.entries(submitted)) {
    indonesian[field] = value;
  }

  if (Object.keys(indonesian).length > 0) {
    merged.id = indonesian;
  } else {
    delete merged.id;
  }

  return merged as unknown as Json;
}

/** Uses the submitted slug, or derives one from the title. */
function resolveSlug(slug: string | undefined, title: string) {
  const trimmed = (slug ?? "").trim();
  return trimmed ? trimmed : slugify(title);
}

function isUniqueViolation(message: string) {
  return message.includes("duplicate key") || message.includes("unique constraint");
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

export async function saveProject(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = projectSchema.safeParse({
    id: text(formData, "id"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    category_id: text(formData, "category_id"),
    cover_image: text(formData, "cover_image"),
    client_name: text(formData, "client_name"),
    project_year: text(formData, "project_year"),
    is_featured: text(formData, "is_featured"),
    is_published: text(formData, "is_published"),
    seo_title: text(formData, "seo_title"),
    seo_description: text(formData, "seo_description"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    title: "text",
    description: "text",
    client_name: "text",
    seo_title: "text",
    seo_description: "text",
  });
  let existingTranslations: unknown = null;

  if (input.id) {
    const { data: existing, error } = await supabase
      .from("projects")
      .select("translations")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!existing) return adminError("That project no longer exists.");

    existingTranslations = existing.translations;
  }

  const payload = {
    title: input.title,
    slug: resolveSlug(input.slug, input.title),
    description: input.description ?? "",
    category_id: input.category_id,
    cover_image: input.cover_image,
    client_name: input.client_name,
    project_year: input.project_year,
    is_featured: input.is_featured,
    is_published: input.is_published,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    translations: mergeTranslations(existingTranslations, submittedTranslations),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another project."
          : error.message,
      );
    }

    if (!data) return adminError("That project no longer exists.");

    await logActivity(supabase, "update", "project", input.id, { title: input.title });
  } else {
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another project."
          : error.message,
      );
    }

    await logActivity(supabase, "create", "project", data.id, { title: input.title });
  }

  revalidateAdmin("/admin/portfolio");
  revalidatePublic();

  redirect("/admin/portfolio");
}

export async function deleteProject(id: string): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id, title")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message.includes("Cannot delete published content")
        ? "Unpublish the project before deleting it."
        : error.message,
    };
  }

  if (!data) return { ok: false, message: "That project no longer exists." };

  await logActivity(supabase, "delete", "project", id, { title: data.title });

  revalidateAdmin("/admin/portfolio");
  revalidatePublic();

  return { ok: true, message: "Project deleted." };
}

/* ------------------------------------------------------------------ */
/* Services and packages                                               */
/* ------------------------------------------------------------------ */

export async function saveService(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = serviceSchema.safeParse({
    id: text(formData, "id"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    cover_image: text(formData, "cover_image"),
    category_id: text(formData, "category_id"),
    turnaround_days: text(formData, "turnaround_days"),
    revision_policy: text(formData, "revision_policy"),
    deliverables: text(formData, "deliverables"),
    is_active: text(formData, "is_active"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    title: "text",
    description: "text",
    deliverables: "lines",
    revision_policy: "text",
  });
  let existingTranslations: unknown = null;

  if (input.id) {
    const { data: existing, error } = await supabase
      .from("services")
      .select("translations")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!existing) return adminError("That service no longer exists.");

    existingTranslations = existing.translations;
  }

  const payload = {
    title: input.title,
    slug: resolveSlug(input.slug, input.title),
    description: input.description ?? "",
    cover_image: input.cover_image,
    category_id: input.category_id,
    turnaround_days: input.turnaround_days,
    revision_policy: input.revision_policy,
    deliverables: input.deliverables,
    is_active: input.is_active,
    translations: mergeTranslations(existingTranslations, submittedTranslations),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another service."
          : error.message,
      );
    }

    if (!data) return adminError("That service no longer exists.");

    await logActivity(supabase, "update", "service", input.id, { title: input.title });
  } else {
    const { data, error } = await supabase
      .from("services")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another service."
          : error.message,
      );
    }

    await logActivity(supabase, "create", "service", data.id, { title: input.title });
  }

  revalidateAdmin("/admin/services");
  revalidatePublic();

  redirect("/admin/services");
}

export async function deleteService(id: string): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .select("id, title")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) return { ok: false, message: "That service no longer exists." };

  await logActivity(supabase, "delete", "service", id, { title: data.title });

  revalidateAdmin("/admin/services");
  revalidatePublic();

  return { ok: true, message: "Service deleted." };
}

export async function saveServicePackage(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = servicePackageSchema.safeParse({
    id: text(formData, "id"),
    service_id: text(formData, "service_id"),
    name: text(formData, "name"),
    description: text(formData, "description"),
    price: text(formData, "price"),
    revision_count: text(formData, "revision_count"),
    delivery_days: text(formData, "delivery_days"),
    features: text(formData, "features"),
    is_active: text(formData, "is_active"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    name: "text",
    description: "text",
    features: "lines",
  });
  let existingTranslations: unknown = null;

  if (input.id) {
    const { data: existing, error } = await supabase
      .from("service_packages")
      .select("translations")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!existing) return adminError("That package no longer exists.");

    existingTranslations = existing.translations;
  }

  const payload = {
    service_id: input.service_id,
    name: input.name,
    description: input.description,
    price: input.price,
    revision_count: input.revision_count,
    delivery_days: input.delivery_days,
    features: input.features,
    is_active: input.is_active,
    translations: mergeTranslations(existingTranslations, submittedTranslations),
  };

  if (input.id) {
    const { error } = await supabase
      .from("service_packages")
      .update(payload)
      .eq("id", input.id);

    if (error) return adminError(error.message);

    await logActivity(supabase, "update", "service_package", input.id, {
      name: input.name,
    });
  } else {
    const { data, error } = await supabase
      .from("service_packages")
      .insert(payload)
      .select("id")
      .single();

    if (error) return adminError(error.message);

    await logActivity(supabase, "create", "service_package", data.id, {
      name: input.name,
    });
  }

  revalidateAdmin("/admin/services", `/admin/services/${input.service_id}`);
  revalidatePublic();

  redirect(`/admin/services/${input.service_id}`);
}

export async function deleteServicePackage(
  id: string,
  serviceId: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { error } = await supabase.from("service_packages").delete().eq("id", id);

  if (error) return { ok: false, message: error.message };

  await logActivity(supabase, "delete", "service_package", id);

  revalidateAdmin("/admin/services", `/admin/services/${serviceId}`);
  revalidatePublic();

  return { ok: true, message: "Package deleted." };
}

/* ------------------------------------------------------------------ */
/* Digital products                                                    */
/* ------------------------------------------------------------------ */

export async function saveProduct(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = productSchema.safeParse({
    id: text(formData, "id"),
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    category_id: text(formData, "category_id"),
    cover_image: text(formData, "cover_image"),
    price: text(formData, "price"),
    discount_price: text(formData, "discount_price"),
    file_format: text(formData, "file_format"),
    compatibility: text(formData, "compatibility"),
    license_terms: text(formData, "license_terms"),
    includes: text(formData, "includes"),
    is_featured: text(formData, "is_featured"),
    is_published: text(formData, "is_published"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;

  if (
    input.discount_price !== null &&
    input.discount_price !== undefined &&
    input.discount_price >= input.price
  ) {
    return invalid("The discounted price must be lower than the price.", {
      discount_price: "Must be lower than the price.",
    });
  }

  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    title: "text",
    description: "text",
    file_format: "text",
    compatibility: "text",
    license_terms: "text",
  });
  let existingTranslations: unknown = null;

  if (input.id) {
    const { data: existing, error } = await supabase
      .from("products")
      .select("translations")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!existing) return adminError("That product no longer exists.");

    existingTranslations = existing.translations;
  }

  const payload = {
    title: input.title,
    slug: resolveSlug(input.slug, input.title),
    description: input.description ?? "",
    category_id: input.category_id,
    cover_image: input.cover_image,
    price: input.price,
    discount_price: input.discount_price,
    file_format: input.file_format,
    compatibility: input.compatibility,
    license_terms: input.license_terms,
    includes: input.includes,
    is_featured: input.is_featured,
    is_published: input.is_published,
    translations: mergeTranslations(existingTranslations, submittedTranslations),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another product."
          : error.message,
      );
    }

    if (!data) return adminError("That product no longer exists.");

    await logActivity(supabase, "update", "product", input.id, { title: input.title });
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another product."
          : error.message,
      );
    }

    await logActivity(supabase, "create", "product", data.id, { title: input.title });
  }

  revalidateAdmin("/admin/products");
  revalidatePublic();

  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id, title")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: error.message.includes("Cannot delete published content")
        ? "Unpublish the product before deleting it."
        : error.message,
    };
  }

  if (!data) return { ok: false, message: "That product no longer exists." };

  await logActivity(supabase, "delete", "product", id, { title: data.title });

  revalidateAdmin("/admin/products");
  revalidatePublic();

  return { ok: true, message: "Product deleted." };
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function saveCategory(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = categorySchema.safeParse({
    id: text(formData, "id"),
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    type: text(formData, "type"),
    description: text(formData, "description"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    name: "text",
    description: "text",
  });
  let existingTranslations: unknown = null;

  if (input.id) {
    const { data: existing, error } = await supabase
      .from("categories")
      .select("translations")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!existing) return adminError("That category no longer exists.");

    existingTranslations = existing.translations;
  }

  const payload = {
    name: input.name,
    slug: resolveSlug(input.slug, input.name),
    type: input.type,
    description: input.description,
    translations: mergeTranslations(existingTranslations, submittedTranslations),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another category."
          : error.message,
      );
    }

    if (!data) return adminError("That category no longer exists.");

    await logActivity(supabase, "update", "category", input.id, { name: input.name });
  } else {
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return adminError(
        isUniqueViolation(error.message)
          ? "That slug is already taken by another category."
          : error.message,
      );
    }

    await logActivity(supabase, "create", "category", data.id, { name: input.name });
  }

  revalidateAdmin("/admin/categories");
  revalidatePublic();

  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id, name")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };

  if (!data) return { ok: false, message: "That category no longer exists." };

  await logActivity(supabase, "delete", "category", id, { name: data.name });

  revalidateAdmin("/admin/categories");
  revalidatePublic();

  return { ok: true, message: "Category deleted." };
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

export async function saveTestimonial(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = testimonialSchema.safeParse({
    id: text(formData, "id"),
    customer_name: text(formData, "customer_name"),
    customer_role: text(formData, "customer_role"),
    content: text(formData, "content"),
    avatar_url: text(formData, "avatar_url"),
    project_id: text(formData, "project_id"),
    is_featured: text(formData, "is_featured"),
    is_published: text(formData, "is_published"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    customer_name: "text",
    customer_role: "text",
    content: "text",
  });
  let existingTranslations: unknown = null;

  if (input.id) {
    const { data: existing, error } = await supabase
      .from("testimonials")
      .select("translations")
      .eq("id", input.id)
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!existing) return adminError("That testimonial no longer exists.");

    existingTranslations = existing.translations;
  }

  const payload = {
    customer_name: input.customer_name,
    customer_role: input.customer_role,
    content: input.content,
    avatar_url: input.avatar_url,
    project_id: input.project_id,
    is_featured: input.is_featured,
    is_published: input.is_published,
    translations: mergeTranslations(existingTranslations, submittedTranslations),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("testimonials")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();

    if (error) return adminError(error.message);
    if (!data) return adminError("That testimonial no longer exists.");

    await logActivity(supabase, "update", "testimonial", input.id, {
      name: input.customer_name,
    });
  } else {
    const { data, error } = await supabase
      .from("testimonials")
      .insert(payload)
      .select("id")
      .single();

    if (error) return adminError(error.message);

    await logActivity(supabase, "create", "testimonial", data.id, {
      name: input.customer_name,
    });
  }

  revalidateAdmin("/admin/testimonials");
  revalidatePublic();

  redirect("/admin/testimonials");
}

export async function deleteTestimonial(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const supabase = await adminDb();
  const { data, error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", id)
    .select("id, customer_name")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "That testimonial no longer exists." };

  await logActivity(supabase, "delete", "testimonial", id, { name: data.customer_name });

  revalidateAdmin("/admin/testimonials");
  revalidatePublic();

  return { ok: true, message: "Testimonial deleted." };
}

/* ------------------------------------------------------------------ */
/* Content blocks and studio settings                                  */
/* ------------------------------------------------------------------ */

export async function saveSiteSetting(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = siteSettingSchema.safeParse({
    id: text(formData, "id"),
    setting_value: text(formData, "setting_value"),
    is_public: text(formData, "is_public"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();

  let value: unknown;
  try {
    value = JSON.parse(input.setting_value);
  } catch {
    return invalid("The value must be valid JSON.", {
      setting_value: "The value must be valid JSON.",
    });
  }

  const { data, error } = await supabase
    .from("site_settings")
    .update({ setting_value: value as NonNullable<Json>, is_public: input.is_public })
    .eq("id", input.id)
    .select("id, setting_key")
    .maybeSingle();

  if (error) return adminError(error.message);
  if (!data) return adminError("That content block no longer exists.");

  await logActivity(supabase, "update", "site_setting", input.id, {
    key: data.setting_key,
  });

  revalidateAdmin("/admin/content");
  revalidatePublic();

  redirect("/admin/content");
}

export async function saveStudioSettings(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await adminSession();
  if (!session) return notAuthorised();

  const parsed = studioSettingsSchema.safeParse({
    name: text(formData, "name"),
    tagline: text(formData, "tagline"),
    email: text(formData, "email"),
    logoUrl: text(formData, "logoUrl"),
    footerNote: text(formData, "footerNote"),
  });

  if (!parsed.success) {
    return invalid("Please check the highlighted fields.", fieldErrors(parsed.error));
  }

  const input = parsed.data;
  const supabase = await adminDb();
  const submittedTranslations = readIndonesianTranslations(formData, {
    tagline: "text",
    footerNote: "text",
  });

  const { data: existing, error: existingError } = await supabase
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", "studio")
    .maybeSingle();

  if (existingError) return adminError(existingError.message);
  if (!existing) return adminError("The studio settings row is missing. Run the seed script.");

  const studio =
    existing.setting_value &&
    typeof existing.setting_value === "object" &&
    !Array.isArray(existing.setting_value)
      ? (existing.setting_value as Record<string, unknown>)
      : {};
  const settingValue = {
    ...studio,
    ...input,
    translations: mergeTranslations(studio.translations, submittedTranslations),
  } as unknown as NonNullable<Json>;

  const { data, error } = await supabase
    .from("site_settings")
    .update({ setting_value: settingValue })
    .eq("setting_key", "studio")
    .select("id")
    .maybeSingle();

  if (error) return adminError(error.message);
  if (!data) return adminError("The studio settings row is missing. Run the seed script.");

  await logActivity(supabase, "update", "site_setting", data.id, { key: "studio" });

  revalidateAdmin("/admin/settings");
  revalidatePublic();

  redirect("/admin/settings");
}

/**
 * Saves the gallery of a project or a product.
 *
 * The gallery is its own thing with its own save: the images belong to the
 * page, not to the catalogue fields, and they are usually finished after the
 * title is.
 */
export async function saveGalleryImages(
  kind: "project" | "product",
  entityId: string,
  images: { path: string; altText: string; altTextId: string }[],
): Promise<{ ok: boolean; message: string }> {
  const session = await adminSession();
  if (!session) return { ok: false, message: "Not authorised." };

  const parsed = galleryImagesSchema.safeParse({ kind, entityId, images });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "The gallery could not be read." };
  }

  const input = parsed.data;
  const supabase = await adminDb();

  const rows = input.images.map((image, index) => ({
    image_url: image.path,
    alt_text: image.altText || null,
    display_order: index,
    translations: mergeTranslations(
      null,
      image.altTextId ? { alt_text: image.altTextId } : {},
    ),
  }));

  if (input.kind === "project") {
    const { error: deleteError } = await supabase
      .from("project_images")
      .delete()
      .eq("project_id", input.entityId);

    if (deleteError) return { ok: false, message: deleteError.message };

    if (rows.length > 0) {
      const { error } = await supabase
        .from("project_images")
        .insert(rows.map((row) => ({ ...row, project_id: input.entityId })));

      if (error) return { ok: false, message: error.message };
    }
  } else {
    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", input.entityId);

    if (deleteError) return { ok: false, message: deleteError.message };

    if (rows.length > 0) {
      const { error } = await supabase
        .from("product_images")
        .insert(rows.map((row) => ({ ...row, product_id: input.entityId })));

      if (error) return { ok: false, message: error.message };
    }
  }

  await logActivity(
    supabase,
    "update",
    input.kind === "project" ? "project_images" : "product_images",
    input.entityId,
    { count: rows.length },
  );

  // A published page is showing these images.
  clearContentCache();

  revalidateAdmin(
    input.kind === "project"
      ? `/admin/portfolio/${input.entityId}`
      : `/admin/products/${input.entityId}`,
  );
  revalidatePublic();

  return { ok: true, message: "Gallery saved." };
}
