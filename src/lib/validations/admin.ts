import { z } from "zod";

/**
 * Server-side validation for every admin mutation.
 *
 * The admin panel is the only place that writes to the catalogue, so these
 * schemas are the contract between the forms and the database. They mirror
 * the column constraints in supabase/migrations/0002_tables.sql — the
 * database still enforces them, this layer just reports them nicely.
 */

const trimmed = z.string().trim();

const optionalText = trimmed
  .optional()
  .transform((value) => (value ? value : null));

const optionalNumber = z
  .union([z.literal(""), z.coerce.number().finite()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

const uuidOrEmpty = z
  .union([z.literal(""), z.string().uuid("Please choose a valid option.")])
  .optional()
  .transform((value) => (value ? value : null));

const slugField = trimmed
  .max(120, "Keep the slug under 120 characters.")
  .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and dashes only.");

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((value) => value === "on" || value === "true");

/** A textarea of one item per line becomes a jsonb string array. */
const lineList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );

export const projectSchema = z.object({
  id: z.string().optional(),
  title: trimmed.min(1, "A title is required.").max(160),
  slug: slugField,
  description: z.string().optional().default(""),
  category_id: uuidOrEmpty,
  cover_image: optionalText,
  client_name: optionalText,
  project_year: z
    .union([z.literal(""), z.coerce.number().int().min(2000).max(2100)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
  is_featured: checkbox,
  is_published: checkbox,
  seo_title: optionalText,
  seo_description: optionalText,
});

export const serviceSchema = z.object({
  id: z.string().optional(),
  title: trimmed.min(1, "A title is required.").max(160),
  slug: slugField,
  description: z.string().optional().default(""),
  cover_image: optionalText,
  category_id: uuidOrEmpty,
  turnaround_days: z.coerce.number().int().min(1, "Turnaround is at least 1 day."),
  revision_policy: optionalText,
  deliverables: lineList,
  is_active: checkbox,
});

export const servicePackageSchema = z.object({
  id: z.string().optional(),
  service_id: z.string().uuid(),
  name: trimmed.min(1, "A package name is required.").max(120),
  description: optionalText,
  price: z.coerce.number().min(0, "Price cannot be negative."),
  revision_count: z.coerce.number().int().min(0).default(0),
  delivery_days: z.coerce.number().int().min(1, "Delivery is at least 1 day."),
  features: lineList,
  is_active: checkbox,
});

export const productSchema = z.object({
  id: z.string().optional(),
  title: trimmed.min(1, "A title is required.").max(160),
  slug: slugField,
  description: z.string().optional().default(""),
  category_id: uuidOrEmpty,
  cover_image: optionalText,
  price: z.coerce.number().min(0, "Price cannot be negative."),
  discount_price: z
    .union([z.literal(""), z.coerce.number().min(0)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
  file_format: optionalText,
  compatibility: optionalText,
  license_terms: optionalText,
  includes: lineList,
  is_featured: checkbox,
  is_published: checkbox,
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: trimmed.min(1, "A name is required.").max(80),
  slug: slugField,
  type: z.enum(["PORTFOLIO", "SERVICE", "PRODUCT"], {
    message: "Choose where this category is used.",
  }),
  description: optionalText,
});

export const testimonialSchema = z.object({
  id: z.string().optional(),
  customer_name: trimmed.min(1, "A name is required.").max(120),
  customer_role: optionalText,
  content: trimmed.min(1, "The quote cannot be empty.").max(2000),
  avatar_url: optionalText,
  project_id: uuidOrEmpty,
  is_featured: checkbox,
  is_published: checkbox,
});

export const SERVICE_ORDER_STATUSES = [
  "NEW_INQUIRY",
  "CONTACTED",
  "QUOTED",
  "WAITING_FOR_PAYMENT",
  "IN_PROGRESS",
  "REVISION",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

export const INQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"] as const;

export const serviceOrderSchema = z.object({
  id: z.string().uuid(),
  order_status: z.enum(SERVICE_ORDER_STATUSES),
  payment_status: z.enum(PAYMENT_STATUSES),
  quoted_price: optionalNumber,
  package_id: uuidOrEmpty,
  deadline: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .optional()
    .transform((value) => (value ? value : null)),
  admin_notes: z.string().optional().default(""),
});

export const digitalOrderPaymentSchema = z.object({
  id: z.string().uuid(),
  payment_status: z.enum(PAYMENT_STATUSES),
  transaction_reference: optionalText,
});

export const inquiryUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(INQUIRY_STATUSES),
  is_read: checkbox,
});

export const inquiryReplySchema = z.object({
  id: z.string().uuid(),
  reply: trimmed.min(1, "Write a reply before sending.").max(5000),
});

/**
 * A gallery.
 *
 * The images are stored by their storage path, the same way the cover image
 * is, so the address a browser loads is derived from it.
 */
export const galleryImagesSchema = z.object({
  kind: z.enum(["project", "product"]),
  entityId: z.string().uuid(),
  images: z
    .array(
      z.object({
        path: trimmed
          .min(1, "An image needs a path.")
          .max(500, "That path is too long."),
        altText: trimmed.max(300, "That alt text is too long."),
        altTextId: trimmed.max(300, "That alt text is too long."),
      }),
    )
    .max(12, "A gallery holds up to twelve images."),
});

export const siteSettingSchema = z.object({
  id: z.string().uuid(),
  setting_value: z
    .string()
    .min(2, "A value is required.")
    .refine(
      (value) => {
        try {
          return JSON.parse(value) !== null;
        } catch {
          return false;
        }
      },
      { message: "The value must be valid JSON." },
    ),
  is_public: checkbox,
});

export const studioSettingsSchema = z.object({
  name: trimmed.min(1, "A studio name is required.").max(80),
  tagline: trimmed.min(1, "A tagline is required.").max(200),
  email: z.string().trim().email("Enter a valid email address."),
  logoUrl: optionalText,
  footerNote: z.string().optional().default(""),
});

export type ProjectInput = z.input<typeof projectSchema>;
export type ServiceInput = z.input<typeof serviceSchema>;
export type ServicePackageInput = z.input<typeof servicePackageSchema>;
export type ProductInput = z.input<typeof productSchema>;
export type CategoryInput = z.input<typeof categorySchema>;
export type TestimonialInput = z.input<typeof testimonialSchema>;
export type ServiceOrderInput = z.input<typeof serviceOrderSchema>;
export type InquiryUpdateInput = z.input<typeof inquiryUpdateSchema>;
