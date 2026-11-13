-- =============================================================================
-- ngantuqan — 0002: tables, indexes, constraints
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles — 1:1 extension of auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  email text NOT NULL,
  role public.profile_role NOT NULL DEFAULT 'CUSTOMER',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_email ON public.profiles (lower(email));
CREATE INDEX idx_profiles_role ON public.profiles (role);

-- ---------------------------------------------------------------------------
-- categories — shared taxonomy for portfolio, services, and products
-- ---------------------------------------------------------------------------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type public.category_type NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_type ON public.categories (type);

-- ---------------------------------------------------------------------------
-- projects — portfolio case studies
-- ---------------------------------------------------------------------------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  cover_image text,
  client_name text,
  project_year smallint CHECK (project_year IS NULL OR project_year BETWEEN 2000 AND 2100),
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_category_id ON public.projects (category_id);
CREATE INDEX idx_projects_published_featured
  ON public.projects (is_featured, created_at DESC) WHERE is_published;
CREATE INDEX idx_projects_created_at ON public.projects (created_at DESC);
CREATE INDEX idx_projects_search
  ON public.projects USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- project_images — gallery
-- ---------------------------------------------------------------------------
CREATE TABLE public.project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE INDEX idx_project_images_project_order
  ON public.project_images (project_id, display_order);

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  cover_image text,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb,
  turnaround_days integer NOT NULL DEFAULT 7 CHECK (turnaround_days > 0),
  revision_policy text,
  is_active boolean NOT NULL DEFAULT true,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_active ON public.services (created_at) WHERE is_active;

-- ---------------------------------------------------------------------------
-- service_packages
-- ---------------------------------------------------------------------------
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  revision_count integer NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  delivery_days integer NOT NULL DEFAULT 7 CHECK (delivery_days > 0),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_service_packages_service ON public.service_packages (service_id);
-- Composite unique target: a service order may only reference a package
-- belonging to the same service.
CREATE UNIQUE INDEX uq_service_packages_id_service
  ON public.service_packages (id, service_id);

-- ---------------------------------------------------------------------------
-- service_orders — client project briefs
-- ---------------------------------------------------------------------------
CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE RESTRICT,
  package_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  project_description text NOT NULL,
  target_audience text,
  design_references text,
  preferred_colors text,
  budget numeric(12, 2) CHECK (budget IS NULL OR budget >= 0),
  deadline date,
  quoted_price numeric(12, 2) CHECK (quoted_price IS NULL OR quoted_price >= 0),
  order_status public.service_order_status NOT NULL DEFAULT 'NEW_INQUIRY',
  payment_status public.payment_status NOT NULL DEFAULT 'PENDING',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_orders_package_matches_service
    FOREIGN KEY (package_id, service_id)
    REFERENCES public.service_packages (id, service_id)
    ON DELETE SET NULL
);

CREATE INDEX idx_service_orders_customer ON public.service_orders (customer_id);
CREATE INDEX idx_service_orders_email ON public.service_orders (customer_email);
CREATE INDEX idx_service_orders_status ON public.service_orders (order_status);
CREATE INDEX idx_service_orders_created_at ON public.service_orders (created_at DESC);

-- ---------------------------------------------------------------------------
-- order_attachments — client reference files (private storage)
-- ---------------------------------------------------------------------------
CREATE TABLE public.order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.service_orders (id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_attachments_order ON public.order_attachments (order_id);

-- ---------------------------------------------------------------------------
-- order_status_history — audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.service_orders (id) ON DELETE CASCADE,
  old_status public.service_order_status,
  new_status public.service_order_status NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_osh_order ON public.order_status_history (order_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- products — downloadable digital products
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  cover_image text,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  discount_price numeric(12, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
  file_format text,
  compatibility text,
  license_terms text,
  includes jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_discount_below_price
    CHECK (discount_price IS NULL OR discount_price < price)
);

CREATE INDEX idx_products_category_id ON public.products (category_id);
CREATE INDEX idx_products_published_featured
  ON public.products (is_featured, created_at DESC) WHERE is_published;
CREATE INDEX idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX idx_products_search
  ON public.products USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ---------------------------------------------------------------------------
-- product_images — preview gallery
-- ---------------------------------------------------------------------------
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0)
);

CREATE INDEX idx_product_images_product_order
  ON public.product_images (product_id, display_order);

-- ---------------------------------------------------------------------------
-- product_files — the actual purchasable files (private storage)
-- ---------------------------------------------------------------------------
CREATE TABLE public.product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_files_product ON public.product_files (product_id);

-- ---------------------------------------------------------------------------
-- digital_orders
-- ---------------------------------------------------------------------------
CREATE TABLE public.digital_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0),
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount >= 0),
  payment_status public.payment_status NOT NULL DEFAULT 'PENDING',
  payment_provider text NOT NULL DEFAULT 'manual',
  transaction_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_digital_orders_customer ON public.digital_orders (customer_id);
CREATE INDEX idx_digital_orders_email ON public.digital_orders (customer_email);
CREATE INDEX idx_digital_orders_payment_status ON public.digital_orders (payment_status);
CREATE INDEX idx_digital_orders_created_at ON public.digital_orders (created_at DESC);

-- ---------------------------------------------------------------------------
-- digital_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE public.digital_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_order_id uuid NOT NULL REFERENCES public.digital_orders (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_title text NOT NULL,
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX idx_doi_order ON public.digital_order_items (digital_order_id);
CREATE INDEX idx_doi_product ON public.digital_order_items (product_id);

-- ---------------------------------------------------------------------------
-- downloads — per-item download tracking
-- ---------------------------------------------------------------------------
CREATE TABLE public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_order_item_id uuid NOT NULL UNIQUE
    REFERENCES public.digital_order_items (id) ON DELETE CASCADE,
  download_count integer NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  last_downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_downloads_item ON public.downloads (digital_order_item_id);

-- ---------------------------------------------------------------------------
-- inquiries — contact form submissions
-- ---------------------------------------------------------------------------
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  inquiry_type public.inquiry_type NOT NULL DEFAULT 'GENERAL',
  subject text NOT NULL,
  message text NOT NULL,
  status public.inquiry_status NOT NULL DEFAULT 'NEW',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_email ON public.inquiries (email);
CREATE INDEX idx_inquiries_status ON public.inquiries (status);
CREATE INDEX idx_inquiries_created_at ON public.inquiries (created_at DESC);

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_role text,
  content text NOT NULL,
  avatar_url text,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_project_id ON public.testimonials (project_id);
CREATE INDEX idx_testimonials_published_featured
  ON public.testimonials (is_featured, created_at DESC) WHERE is_published;

-- ---------------------------------------------------------------------------
-- site_settings — key/value configuration
-- ---------------------------------------------------------------------------
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_settings_key ON public.site_settings (setting_key);

-- ---------------------------------------------------------------------------
-- activity_logs — admin audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_admin ON public.activity_logs (admin_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id);
