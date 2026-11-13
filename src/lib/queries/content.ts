import { createPublicClient } from "@/lib/supabase/public";
import { resolveMediaSrc } from "@/lib/supabase/storage";
import { cached } from "@/lib/cache";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { applyTranslations } from "@/lib/i18n/overlay";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_PROJECTS,
  DEMO_SERVICES,
  DEMO_SETTINGS,
  DEMO_TESTIMONIALS,
} from "@/lib/data/demo";
import type {
  Category,
  Product,
  ProductImage,
  Project,
  ProjectImage,
  Service,
  SiteSettings,
  Testimonial,
} from "@/types/models";

/**
 * Read layer.
 *
 * Every function queries Supabase when credentials exist and falls back to the
 * clearly-labelled demonstration data in src/lib/data/demo.ts when they do not.
 * The fallback exists so the site can be reviewed and built without a live
 * project — it is never the production data source.
 *
 * The reads use the public client (no session, no cookies) and are cached for
 * a minute (see src/lib/cache.ts): the catalogue is read on every page
 * render, and a hosted database is a network hop away. An admin write clears
 * the cache, so the studio never sees a stale edit.
 *
 * Every read takes the visitor's language. The English text stays on the
 * record and the translated wording sits beside it in a JSONB column, so a
 * record that has not been translated yet still reads in English rather than
 * disappearing from the Indonesian page.
 *
 * See docs/02-technical-architecture.md §2.4
 */

async function db() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

/** The fields of a category that carry a translation. */
const CATEGORY_FIELDS = ["name", "description"] as const;

/** The fields of a project that carry a translation. */
const PROJECT_FIELDS = [
  "title",
  "description",
  "client_name",
  "seo_title",
  "seo_description",
] as const;

/** The fields of a service that carry a translation. */
const SERVICE_FIELDS = [
  "title",
  "description",
  "deliverables",
  "revision_policy",
] as const;

/** The fields of a product that carry a translation. */
const PRODUCT_FIELDS = [
  "title",
  "description",
  "file_format",
  "compatibility",
  "license_terms",
] as const;

/** The fields of a gallery image that carry a translation. */
const IMAGE_FIELDS = ["alt_text"] as const;

/** The fields of a service package that carry a translation. */
const PACKAGE_FIELDS = ["name", "description", "features"] as const;

/** The fields of a testimonial that carry a translation. */
const TESTIMONIAL_FIELDS = [
  "customer_name",
  "customer_role",
  "content",
] as const;

function toCategory(c: {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  translations?: unknown;
}, locale: Locale = DEFAULT_LOCALE): Category {
  const base = {
    id: c.id,
    name: c.name,
    slug: c.slug,
    type: c.type as Category["type"],
    description: c.description,
  };
  return applyTranslations(base, c.translations, locale, CATEGORY_FIELDS);
}

/** The category a project or a product points at, in the visitor's language. */
function toCategoryRef(
  row:
    | { id: string; name: string; slug: string; translations?: unknown }
    | null
    | undefined,
  locale: Locale,
): { id: string; name: string; slug: string } | null {
  if (!row) return null;
  const base = { id: row.id, name: row.name, slug: row.slug };
  return applyTranslations(base, row.translations, locale, ["name"]);
}

/* ------------------------------------------------------------------ */
/* Projects                                                           */
/* ------------------------------------------------------------------ */

const PROJECT_SELECT = `
  id, title, slug, description, cover_image, client_name, project_year,
  is_featured, is_published, seo_title, seo_description, category_id,
  translations,
  categories ( id, name, slug, translations )
`;

function mapProject(
  row: Record<string, unknown>,
  locale: Locale = DEFAULT_LOCALE,
): Project {
  const category = row.categories as
    | { id: string; name: string; slug: string; translations?: unknown }
    | null
    | undefined;
  const base = {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    cover_image: resolveMediaSrc(row.cover_image as string | null),
    client_name: (row.client_name as string | null) ?? null,
    project_year: (row.project_year as number | null) ?? null,
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    category_id: (row.category_id as string | null) ?? null,
    category: toCategoryRef(category, locale),
  };
  return applyTranslations(base, row.translations, locale, PROJECT_FIELDS);
}

export async function getPublishedProjects(options?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
  locale?: Locale;
}): Promise<Project[]> {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const key = `projects:${locale}:${options?.categorySlug ?? ""}:${options?.search ?? ""}:${options?.limit ?? ""}:${options?.offset ?? ""}`;

  return cached(key, async () => {
    const supabase = await db();

    if (!supabase) {
      let rows = [...DEMO_PROJECTS];
      if (options?.categorySlug) {
        rows = rows.filter((p) => p.category?.slug === options.categorySlug);
      }
      if (options?.search) {
        const q = options.search.toLowerCase();
        rows = rows.filter((p) => p.title.toLowerCase().includes(q));
      }
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? rows.length;
      return rows
        .slice(offset, offset + limit)
        .map((row) => mapProject(row as unknown as Record<string, unknown>, locale));
    }

    let query = supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.categorySlug) {
      // The category list is cached, so this lookup costs nothing extra.
      const categories = await getCategories("PORTFOLIO", locale);
      const category = categories.find((c) => c.slug === options.categorySlug);
      if (category) query = query.eq("category_id", category.id);
    }

    if (options?.search) {
      query = query.ilike("title", `%${options.search}%`);
    }

    if (options?.limit !== undefined) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load projects: ${error.message}`);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      mapProject(row, locale),
    );
  });
}

export async function getFeaturedProjects(
  limit = 4,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Project[]> {
  return cached(`projects:featured:${locale}:${limit}`, async () => {
    const supabase = await db();

    if (!supabase) {
      return DEMO_PROJECTS.filter((p) => p.is_featured)
        .slice(0, limit)
        .map((row) => mapProject(row as unknown as Record<string, unknown>, locale));
    }

    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to load featured projects: ${error.message}`);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      mapProject(row, locale),
    );
  });
}

export async function getProjectBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<(Project & { images: Project["images"] }) | null> {
  return cached(`project:${locale}:${slug}`, async () => {
    const supabase = await db();

    if (!supabase) {
      const found = DEMO_PROJECTS.find((p) => p.slug === slug) ?? null;
      if (!found) return null;
      return {
        ...mapProject(found as unknown as Record<string, unknown>, locale),
        images: (found.images ?? []).map((image) =>
          applyTranslations(
            image as unknown as Record<string, unknown>,
            image.translations,
            locale,
            IMAGE_FIELDS,
          ) as unknown as ProjectImage,
        ),
      } as (Project & { images: Project["images"] });
    }

    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw new Error(`Failed to load project: ${error.message}`);
    if (!data) return null;
    const row = data as unknown as Record<string, unknown>;
    const project = mapProject(row, locale);

    const { data: images } = await supabase
      .from("project_images")
      .select("id, image_url, alt_text, display_order, translations")
      .eq("project_id", project.id)
      .order("display_order", { ascending: true });

    const list = (images ?? []) as NonNullable<Project["images"]>;

    return {
      ...project,
      images: list.map((image) =>
        applyTranslations(
          {
            ...image,
            image_url: resolveMediaSrc(image.image_url) ?? image.image_url,
          },
          image.translations,
          locale,
          IMAGE_FIELDS,
        ),
      ),
    };
  });
}

/**
 * Related projects for a case study.
 *
 * Prefers projects in the same category, then fills the remaining slots with
 * other published projects. Without the fallback, a portfolio with one project
 * per discipline would show no related work at all.
 */
export async function getRelatedProjects(
  project: Pick<Project, "id" | "category_id">,
  limit = 3,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Project[]> {
  return cached(
    `projects:related:${locale}:${project.category_id ?? ""}:${limit}`,
    async () => {
      const supabase = await db();

      if (!supabase) {
        const others = DEMO_PROJECTS.filter((p) => p.id !== project.id);
        const sameCategory = others.filter(
          (p) => p.category_id && p.category_id === project.category_id,
        );
        const fallback = others.filter(
          (p) => !sameCategory.includes(p),
        );
        return [...sameCategory, ...fallback]
          .slice(0, limit)
          .map((row) => mapProject(row as unknown as Record<string, unknown>, locale));
      }

      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_SELECT)
        .eq("is_published", true)
        .neq("id", project.id)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit * 3);

      if (error) return [];

      const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (row) => mapProject(row, locale),
      );

      const sameCategory = rows.filter(
        (p) => p.category_id && p.category_id === project.category_id,
      );
      const fallback = rows.filter((p) => !sameCategory.includes(p));

      return [...sameCategory, ...fallback].slice(0, limit);
    },
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                         */
/* ------------------------------------------------------------------ */

export async function getCategories(
  type: Category["type"],
  locale: Locale = DEFAULT_LOCALE,
): Promise<Category[]> {
  return cached(`categories:${locale}:${type}`, async () => {
    const supabase = await db();

    if (!supabase) {
      return DEMO_CATEGORIES.filter((c) => c.type === type).map((c) =>
        toCategory(c, locale),
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, type, description, translations")
      .eq("type", type)
      .order("name", { ascending: true });

    if (error) throw new Error(`Failed to load categories: ${error.message}`);
    return (
      (data ?? []) as unknown as Parameters<typeof toCategory>[0][]
    ).map((row) => toCategory(row, locale));
  });
}

/* ------------------------------------------------------------------ */
/* Services                                                           */
/* ------------------------------------------------------------------ */

const SERVICE_SELECT = `
  id, title, slug, description, cover_image, deliverables,
  turnaround_days, revision_policy, is_active, category_id, translations
`;

function mapService(
  row: Record<string, unknown>,
  locale: Locale = DEFAULT_LOCALE,
): Service {
  const base = {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    cover_image: resolveMediaSrc(row.cover_image as string | null),
    deliverables: (row.deliverables as string[] | null) ?? null,
    turnaround_days: (row.turnaround_days as number | null) ?? 0,
    revision_policy: (row.revision_policy as string | null) ?? null,
    is_active: Boolean(row.is_active),
    category_id: (row.category_id as string | null) ?? null,
  };
  return applyTranslations(base, row.translations, locale, SERVICE_FIELDS);
}

export async function getActiveServices(
  locale: Locale = DEFAULT_LOCALE,
): Promise<Service[]> {
  return cached(`services:active:${locale}`, async () => {
    const supabase = await db();

    if (!supabase) {
      return DEMO_SERVICES.filter((s) => s.is_active).map((row) =>
        mapService(row as unknown as Record<string, unknown>, locale),
      );
    }

    const { data, error } = await supabase
      .from("services")
      .select(SERVICE_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to load services: ${error.message}`);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      mapService(row, locale),
    );
  });
}

export async function getServiceBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<(Service & { packages: NonNullable<Service["packages"]> }) | null> {
  return cached(`service:${locale}:${slug}`, async () => {
    const supabase = await db();

    if (!supabase) {
      const service = DEMO_SERVICES.find((s) => s.slug === slug);
      if (!service) return null;
      return {
        ...mapService(service as unknown as Record<string, unknown>, locale),
        packages: (service.packages?.filter((p) => p.is_active) ?? []).map(
          (pkg) =>
            applyTranslations(
              pkg as unknown as Record<string, unknown>,
              pkg.translations,
              locale,
              PACKAGE_FIELDS,
            ) as unknown as NonNullable<Service["packages"]>[number],
        ),
      };
    }

    const { data, error } = await supabase
      .from("services")
      .select(SERVICE_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(`Failed to load service: ${error.message}`);
    if (!data) return null;
    const service = mapService(data as unknown as Record<string, unknown>, locale);

    const { data: packages } = await supabase
      .from("service_packages")
      .select(
        "id, service_id, name, description, price, revision_count, delivery_days, features, is_active, translations",
      )
      .eq("service_id", service.id)
      .eq("is_active", true)
      .order("price", { ascending: true });

    return {
      ...service,
      packages: ((packages ?? []) as unknown as Record<string, unknown>[]).map(
        (row) =>
          applyTranslations(
            {
              id: row.id as string,
              service_id: row.service_id as string,
              name: row.name as string,
              description: (row.description as string | null) ?? null,
              price: Number(row.price ?? 0),
              revision_count: Number(row.revision_count ?? 0),
              delivery_days: Number(row.delivery_days ?? 0),
              features: (row.features as string[] | null) ?? null,
              is_active: Boolean(row.is_active),
            },
            row.translations,
            locale,
            PACKAGE_FIELDS,
          ),
      ) as NonNullable<Service["packages"]>,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Products                                                           */
/* ------------------------------------------------------------------ */

const PRODUCT_SELECT = `
  id, title, slug, description, cover_image, price, discount_price,
  file_format, compatibility, license_terms, is_featured, is_published,
  category_id, translations,
  categories ( id, name, slug, translations )
`;

function mapProduct(
  row: Record<string, unknown>,
  locale: Locale = DEFAULT_LOCALE,
): Product {
  const category = row.categories as
    | { id: string; name: string; slug: string; translations?: unknown }
    | null
    | undefined;
  const base = {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: row.description as string,
    cover_image: resolveMediaSrc(row.cover_image as string | null),
    price: (row.price as number | null) ?? 0,
    discount_price: (row.discount_price as number | null) ?? null,
    file_format: (row.file_format as string | null) ?? null,
    compatibility: (row.compatibility as string | null) ?? null,
    license_terms: (row.license_terms as string | null) ?? null,
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    category_id: (row.category_id as string | null) ?? null,
    category: toCategoryRef(category, locale),
  };
  return applyTranslations(base, row.translations, locale, PRODUCT_FIELDS);
}

export async function getPublishedProducts(options?: {
  categorySlug?: string;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc";
  limit?: number;
  offset?: number;
  locale?: Locale;
}): Promise<Product[]> {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const key = `products:${locale}:${options?.categorySlug ?? ""}:${options?.search ?? ""}:${options?.sort ?? ""}:${options?.limit ?? ""}:${options?.offset ?? ""}`;

  return cached(key, async () => {
    const supabase = await db();

    if (!supabase) {
      let rows = [...DEMO_PRODUCTS];
      if (options?.categorySlug) {
        rows = rows.filter((p) => p.category?.slug === options.categorySlug);
      }
      if (options?.search) {
        const q = options.search.toLowerCase();
        rows = rows.filter((p) => p.title.toLowerCase().includes(q));
      }
      if (options?.sort === "price-asc") {
        rows.sort((a, b) => a.price - b.price);
      } else if (options?.sort === "price-desc") {
        rows.sort((a, b) => b.price - a.price);
      }
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? rows.length;
      return rows
        .slice(offset, offset + limit)
        .map((row) => mapProduct(row as unknown as Record<string, unknown>, locale));
    }

    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_published", true);

    if (options?.categorySlug) {
      // The category list is cached, so this lookup costs nothing extra.
      const categories = await getCategories("PRODUCT", locale);
      const category = categories.find((c) => c.slug === options.categorySlug);
      if (category) query = query.eq("category_id", category.id);
    }

    if (options?.search) query = query.ilike("title", `%${options.search}%`);

    if (options?.sort === "price-asc") {
      query = query.order("price", { ascending: true });
    } else if (options?.sort === "price-desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    if (options?.limit !== undefined) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load products: ${error.message}`);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      mapProduct(row, locale),
    );
  });
}

export async function getFeaturedProducts(
  limit = 3,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Product[]> {
  return cached(`products:featured:${locale}:${limit}`, async () => {
    const supabase = await db();

    if (!supabase) {
      return DEMO_PRODUCTS.filter((p) => p.is_featured)
        .slice(0, limit)
        .map((row) => mapProduct(row as unknown as Record<string, unknown>, locale));
    }

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to load featured products: ${error.message}`);
    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      mapProduct(row, locale),
    );
  });
}

export async function getProductBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<(Product & { images: Product["images"] }) | null> {
  return cached(`product:${locale}:${slug}`, async () => {
    const supabase = await db();

    if (!supabase) {
      const found = DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
      if (!found) return null;
      return {
        ...mapProduct(found as unknown as Record<string, unknown>, locale),
        images: (found.images ?? []).map((image) =>
          applyTranslations(
            image as unknown as Record<string, unknown>,
            image.translations,
            locale,
            IMAGE_FIELDS,
          ) as unknown as ProductImage,
        ),
      } as (Product & { images: Product["images"] });
    }

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw new Error(`Failed to load product: ${error.message}`);
    if (!data) return null;

    const product = mapProduct(data as unknown as Record<string, unknown>, locale);

    const { data: images } = await supabase
      .from("product_images")
      .select("id, image_url, alt_text, display_order, translations")
      .eq("product_id", product.id)
      .order("display_order", { ascending: true });

    const list = (images ?? []) as NonNullable<Product["images"]>;

    return {
      ...product,
      images: list.map((image) =>
        applyTranslations(
          {
            ...image,
            image_url: resolveMediaSrc(image.image_url) ?? image.image_url,
          },
          image.translations,
          locale,
          IMAGE_FIELDS,
        ),
      ),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                       */
/* ------------------------------------------------------------------ */

export async function getPublishedTestimonials(
  limit?: number,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Testimonial[]> {
  return cached(`testimonials:${locale}:${limit ?? "all"}`, async () => {
    const supabase = await db();

    if (!supabase) {
      const rows = DEMO_TESTIMONIALS.filter((t) => t.is_published);
      return (limit ? rows.slice(0, limit) : rows).map((row) =>
        applyTranslations(
          {
            id: row.id,
            customer_name: row.customer_name,
            customer_role: row.customer_role,
            content: row.content,
            avatar_url: row.avatar_url,
            project_id: row.project_id,
            is_featured: row.is_featured,
            is_published: row.is_published,
            project: row.project
              ? {
                  id: row.project.id,
                  title: row.project.title,
                  slug: row.project.slug,
                }
              : null,
          },
          row.translations,
          locale,
          TESTIMONIAL_FIELDS,
        ),
      );
    }

    let query = supabase
      .from("testimonials")
      .select(
        "id, customer_name, customer_role, content, avatar_url, project_id, is_featured, is_published, translations, projects ( id, title, slug )",
      )
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load testimonials: ${error.message}`);

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
      const project = row.projects as
        | { id: string; title: string; slug: string }
        | null
        | undefined;
      const base = {
        id: row.id as string,
        customer_name: row.customer_name as string,
        customer_role: (row.customer_role as string | null) ?? null,
        content: row.content as string,
        avatar_url: resolveMediaSrc(row.avatar_url as string | null),
        project_id: (row.project_id as string | null) ?? null,
        is_featured: Boolean(row.is_featured),
        is_published: Boolean(row.is_published),
        project: project
          ? { id: project.id, title: project.title, slug: project.slug }
          : null,
      };
      return applyTranslations(
        base,
        row.translations,
        locale,
        TESTIMONIAL_FIELDS,
      );
    });
  });
}

/* ------------------------------------------------------------------ */
/* Site settings                                                      */
/* ------------------------------------------------------------------ */

export async function getSiteSettings(
  locale: Locale = DEFAULT_LOCALE,
): Promise<SiteSettings> {
  return cached(`site-settings:${locale}`, async () => {
    const supabase = await db();

    if (!supabase) {
      const demo = DEMO_SETTINGS;
      const translated = (
        demo.translations as Record<string, Record<string, unknown>> | undefined
      )?.[locale];
      const pick = (key: string, fallback: string) => {
        const value = translated?.[key];
        return typeof value === "string" && value.trim() !== ""
          ? value
          : fallback;
      };
      return {
        ...demo,
        tagline: pick("tagline", demo.tagline),
        footerNote: pick("footerNote", demo.footerNote),
      };
    }

    const { data } = await supabase
      .from("site_settings")
      .select("setting_key, setting_value");

    const map = new Map(
      ((data ?? []) as unknown as { setting_key: string; setting_value: unknown }[]).map(
        (row) => [row.setting_key, row.setting_value],
      ),
    );

    const studio = (map.get("studio") ?? {}) as Record<string, unknown>;
    const socials = (map.get("studio.socials") ?? {}) as {
      items?: { platform: string; url: string }[];
    };
    const studioTranslations = (studio.translations ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const translated = studioTranslations[locale];

    const pick = (key: string, fallback: string) => {
      const value = translated?.[key];
      return typeof value === "string" && value.trim() !== ""
        ? value
        : fallback;
    };

    return {
      studioName: (studio.name as string) ?? DEMO_SETTINGS.studioName,
      tagline: pick("tagline", (studio.tagline as string) ?? DEMO_SETTINGS.tagline),
      email: (studio.email as string) ?? DEMO_SETTINGS.email,
      logoUrl: resolveMediaSrc(studio.logoUrl as string | null),
      socials: socials.items ?? DEMO_SETTINGS.socials,
      footerNote: pick(
        "footerNote",
        (studio.footerNote as string) ?? DEMO_SETTINGS.footerNote,
      ),
    };
  });
}
