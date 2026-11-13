-- =============================================================================
-- ngantuqan — 0003: triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'projects', 'services', 'service_orders', 'products',
    'inquiries', 'testimonials', 'site_settings', 'digital_orders'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Profile creation on signup, and sync of name/email on user update
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'CUSTOMER'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = coalesce(EXCLUDED.full_name, public.profiles.full_name);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      full_name = coalesce(NEW.raw_user_meta_data ->> 'full_name', public.profiles.full_name)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ---------------------------------------------------------------------------
-- Order number generation — clients never supply these
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.service_order_number_seq;
CREATE SEQUENCE IF NOT EXISTS public.digital_order_number_seq;

CREATE OR REPLACE FUNCTION public.generate_service_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.order_number := 'SO-' || to_char(now(), 'YYMM') || '-' ||
    lpad(nextval('public.service_order_number_seq')::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_orders_number
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_service_order_number();

CREATE OR REPLACE FUNCTION public.generate_digital_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.order_number := 'DO-' || to_char(now(), 'YYMM') || '-' ||
    lpad(nextval('public.digital_order_number_seq')::text, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_digital_orders_number
  BEFORE INSERT ON public.digital_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_digital_order_number();

-- ---------------------------------------------------------------------------
-- Service order status history — written automatically on every change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (
      NEW.id,
      OLD.order_status,
      NEW.order_status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_orders_status_history
  AFTER UPDATE OF order_status ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Insert an initial history row when an order is created.
CREATE OR REPLACE FUNCTION public.log_order_status_created()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by, note)
  VALUES (NEW.id, NULL, NEW.order_status, auth.uid(), 'Order submitted');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_orders_status_created
  AFTER INSERT ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_created();

-- ---------------------------------------------------------------------------
-- Guard: refuse to delete published content without unpublishing first
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_published_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_published THEN
    RAISE EXCEPTION 'Cannot delete published content. Unpublish it first.';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_projects_delete_guard
  BEFORE DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.guard_published_delete();

CREATE TRIGGER trg_products_delete_guard
  BEFORE DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_published_delete();
