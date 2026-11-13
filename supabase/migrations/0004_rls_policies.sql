-- =============================================================================
-- ngantuqan — 0004: Row Level Security
--
-- Three independent layers protect the admin area (spec §7):
--   1. proxy.ts route gate      (UX + enumeration)
--   2. server-side requireAdmin / requireCustomer  (real authorization)
--   3. these policies            (data isolation)
--
-- Helper functions are SECURITY DEFINER so a policy on `profiles` can read
-- `profiles` without recursing infinitely.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the current request is authenticated as an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- The current user's profile id (nullable when anonymous).
CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'categories', 'projects', 'project_images', 'services',
    'service_packages', 'service_orders', 'order_attachments',
    'order_status_history', 'products', 'product_images', 'product_files',
    'digital_orders', 'digital_order_items', 'downloads', 'inquiries',
    'testimonials', 'site_settings', 'activity_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Role escalation is forbidden: an admin may not demote or promote anyone.
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories — readable by everyone, writable by admins
-- ---------------------------------------------------------------------------
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT USING (true);

CREATE POLICY categories_admin_write ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- projects / project_images — public sees published only
-- ---------------------------------------------------------------------------
CREATE POLICY projects_public_read ON public.projects
  FOR SELECT USING (is_published OR public.is_admin());

CREATE POLICY projects_admin_write ON public.projects
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY project_images_read ON public.project_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_images.project_id
        AND (p.is_published OR public.is_admin())
    )
  );

CREATE POLICY project_images_admin_write ON public.project_images
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- services / service_packages
-- ---------------------------------------------------------------------------
CREATE POLICY services_public_read ON public.services
  FOR SELECT USING (is_active OR public.is_admin());

CREATE POLICY services_admin_write ON public.services
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY service_packages_read ON public.service_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_packages.service_id
        AND (s.is_active OR public.is_admin())
    )
  );

CREATE POLICY service_packages_admin_write ON public.service_packages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- service_orders — public may insert; only the owner or an admin may read
-- ---------------------------------------------------------------------------
CREATE POLICY service_orders_insert ON public.service_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY service_orders_owner_read ON public.service_orders
  FOR SELECT USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY service_orders_owner_update ON public.service_orders
  FOR UPDATE USING (customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY service_orders_admin_write ON public.service_orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_attachments
-- ---------------------------------------------------------------------------
CREATE POLICY order_attachments_insert ON public.order_attachments
  FOR INSERT WITH CHECK (true);

CREATE POLICY order_attachments_read ON public.order_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_orders o
      WHERE o.id = order_attachments.order_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY order_attachments_admin_write ON public.order_attachments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_status_history — owner may read their own order's timeline
-- ---------------------------------------------------------------------------
CREATE POLICY order_status_history_read ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_orders o
      WHERE o.id = order_status_history.order_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY order_status_history_admin_write ON public.order_status_history
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- products / product_images
-- ---------------------------------------------------------------------------
CREATE POLICY products_public_read ON public.products
  FOR SELECT USING (is_published OR public.is_admin());

CREATE POLICY products_admin_write ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY product_images_read ON public.product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND (p.is_published OR public.is_admin())
    )
  );

CREATE POLICY product_images_admin_write ON public.product_images
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_files — NEVER selectable directly. Access is via signed URLs only,
-- minted server-side after verifying a paid order.
-- ---------------------------------------------------------------------------
CREATE POLICY product_files_admin_read ON public.product_files
  FOR SELECT USING (public.is_admin());

CREATE POLICY product_files_admin_write ON public.product_files
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- digital_orders
-- ---------------------------------------------------------------------------
CREATE POLICY digital_orders_insert ON public.digital_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY digital_orders_owner_read ON public.digital_orders
  FOR SELECT USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY digital_orders_admin_write ON public.digital_orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY digital_order_items_insert ON public.digital_order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY digital_order_items_read ON public.digital_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.digital_orders o
      WHERE o.id = digital_order_items.digital_order_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY digital_order_items_admin_write ON public.digital_order_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- downloads
-- ---------------------------------------------------------------------------
CREATE POLICY downloads_read ON public.downloads
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.digital_order_items doi
      JOIN public.digital_orders o ON o.id = doi.digital_order_id
      WHERE doi.id = downloads.digital_order_item_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY downloads_admin_write ON public.downloads
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- inquiries — anyone may submit; only admins may read
-- ---------------------------------------------------------------------------
CREATE POLICY inquiries_insert ON public.inquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY inquiries_admin_read ON public.inquiries
  FOR SELECT USING (public.is_admin());

CREATE POLICY inquiries_admin_write ON public.inquiries
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
CREATE POLICY testimonials_public_read ON public.testimonials
  FOR SELECT USING (is_published OR public.is_admin());

CREATE POLICY testimonials_admin_write ON public.testimonials
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_settings — public may read only rows flagged is_public
-- ---------------------------------------------------------------------------
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT USING (is_public OR public.is_admin());

CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- activity_logs — admin only
-- ---------------------------------------------------------------------------
CREATE POLICY activity_logs_admin_read ON public.activity_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY activity_logs_admin_write ON public.activity_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
