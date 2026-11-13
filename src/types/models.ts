import type { Translations } from "@/lib/i18n/overlay";

export type ProjectCategoryType = "PORTFOLIO" | "SERVICE" | "PRODUCT";

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: ProjectCategoryType;
  description: string | null;
  translations?: Translations;
}

export interface ProjectImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  translations?: Translations;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  client_name: string | null;
  project_year: number | null;
  is_featured: boolean;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  category_id: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  images?: ProjectImage[];
  translations?: Translations;
}

export interface ServicePackage {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  price: number;
  revision_count: number;
  delivery_days: number;
  features: string[] | null;
  is_active: boolean;
  translations?: Translations;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  deliverables: string[] | null;
  turnaround_days: number;
  revision_policy: string | null;
  is_active: boolean;
  category_id?: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  packages?: ServicePackage[];
  translations?: Translations;
}

export interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  translations?: Translations;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  price: number;
  discount_price: number | null;
  file_format: string | null;
  compatibility: string | null;
  license_terms: string | null;
  is_featured: boolean;
  is_published: boolean;
  category_id: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  images?: ProductImage[];
  translations?: Translations;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_role: string | null;
  content: string;
  avatar_url: string | null;
  project_id: string | null;
  is_featured: boolean;
  is_published: boolean;
  project?: Pick<Project, "id" | "title" | "slug"> | null;
  translations?: Translations;
}

export interface SiteSettings {
  studioName: string;
  tagline: string;
  email: string;
  logoUrl: string | null;
  socials: { platform: string; url: string }[];
  footerNote: string;
  translations?: Translations;
}
