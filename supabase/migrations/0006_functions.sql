-- =============================================================================
-- ngantuqan — 0006: business functions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Record a purchase. The only path that creates a digital order.
-- Prices are read from the products table server-side; a client-supplied
-- price is never trusted.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_purchase(
  p_customer_name text,
  p_customer_email text,
  p_items jsonb
)
RETURNS TABLE (order_number text, total numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_total numeric := 0;
  v_item jsonb;
  v_product record;
  v_qty integer;
  v_price numeric;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  INSERT INTO public.digital_orders (
    customer_id,
    customer_name,
    customer_email,
    subtotal,
    total_amount,
    payment_status,
    payment_provider
  )
  VALUES (
    auth.uid(),
    p_customer_name,
    p_customer_email,
    0,
    0,
    'PENDING',
    'manual'
  )
  RETURNING id, public.digital_orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT p.id, p.title, coalesce(p.discount_price, p.price)
      INTO v_product
      FROM public.products p
     WHERE p.id = (v_item ->> 'product_id')::uuid
       AND p.is_published;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not available: %', v_item ->> 'product_id';
    END IF;

    v_qty := greatest(1, coalesce((v_item ->> 'quantity')::integer, 1));
    v_price := v_product.price;

    INSERT INTO public.digital_order_items (
      digital_order_id, product_id, product_title, unit_price, quantity
    )
    VALUES (v_order_id, v_product.id, v_product.title, v_price, v_qty);

    v_total := v_total + (v_price * v_qty);
  END LOOP;

  UPDATE public.digital_orders
     SET subtotal = v_total, total_amount = v_total
   WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_number, v_total;
END;
$$;

-- ---------------------------------------------------------------------------
-- Confirm payment. Server-side only — never called with client input.
-- Admin action or verified provider webhook.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_digital_order_payment(
  p_order_number text,
  p_transaction_reference text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.digital_orders
     SET payment_status = 'PAID',
         transaction_reference = coalesce(p_transaction_reference, transaction_reference)
   WHERE order_number = p_order_number;

  RETURN FOUND;
END;
$$;

-- ---------------------------------------------------------------------------
-- Record a download and report the file paths a paid customer may fetch.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_download(p_order_item_id uuid)
RETURNS TABLE (storage_path text, file_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_status public.payment_status;
  v_customer uuid;
BEGIN
  SELECT doi.digital_order_id, o.payment_status, o.customer_id
    INTO v_order_id, v_status, v_customer
    FROM public.digital_order_items doi
    JOIN public.digital_orders o ON o.id = doi.digital_order_id
   WHERE doi.id = p_order_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item not found';
  END IF;

  IF v_status <> 'PAID' THEN
    RAISE EXCEPTION 'Payment not confirmed';
  END IF;

  IF v_customer IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized for this order';
  END IF;

  INSERT INTO public.downloads (digital_order_item_id, download_count, last_downloaded_at)
  VALUES (p_order_item_id, 1, now())
  ON CONFLICT (digital_order_item_id) DO UPDATE
    SET download_count = public.downloads.download_count + 1,
        last_downloaded_at = now();

  RETURN QUERY
    SELECT pf.storage_path, pf.file_name
    FROM public.product_files pf
    WHERE pf.product_id = (
      SELECT doi.product_id FROM public.digital_order_items doi
      WHERE doi.id = p_order_item_id
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin overview metrics. Revenue counts only PAID transactions.
-- Admin-only: these functions bypass RLS, so they gate on the role
-- themselves rather than relying on a policy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_revenue_summary()
RETURNS TABLE (
  digital_revenue numeric,
  service_revenue numeric,
  digital_orders_count bigint,
  paid_orders_count bigint,
  pending_orders_count bigint,
  completed_projects_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    coalesce((SELECT sum(total_amount) FROM public.digital_orders WHERE payment_status = 'PAID'), 0),
    coalesce((SELECT sum(quoted_price) FROM public.service_orders
               WHERE payment_status = 'PAID' AND quoted_price IS NOT NULL), 0),
    (SELECT count(*) FROM public.digital_orders),
    (SELECT count(*) FROM public.digital_orders WHERE payment_status = 'PAID'),
    (SELECT count(*) FROM public.digital_orders WHERE payment_status = 'PENDING'),
    (SELECT count(*) FROM public.service_orders WHERE order_status = 'COMPLETED');
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin overview counts (projects, services, inquiries, pending service orders)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_counts()
RETURNS TABLE (
  total_projects bigint,
  published_projects bigint,
  active_services bigint,
  total_inquiries bigint,
  unread_inquiries bigint,
  pending_service_orders bigint,
  published_products bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.projects),
    (SELECT count(*) FROM public.projects WHERE is_published),
    (SELECT count(*) FROM public.services WHERE is_active),
    (SELECT count(*) FROM public.inquiries),
    (SELECT count(*) FROM public.inquiries WHERE NOT is_read),
    (SELECT count(*) FROM public.service_orders WHERE order_status = 'NEW_INQUIRY'),
    (SELECT count(*) FROM public.products WHERE is_published);
END;
$$;

-- ---------------------------------------------------------------------------
-- Log an admin action.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.activity_logs (admin_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
END;
$$;

-- ---------------------------------------------------------------------------
-- Service orders submitted by guests can be linked to a profile later.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_guest_orders(p_email text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
BEGIN
  UPDATE public.service_orders
     SET customer_id = auth.uid()
   WHERE customer_id IS NULL AND lower(customer_email) = lower(p_email);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.digital_orders
     SET customer_id = auth.uid()
   WHERE customer_id IS NULL AND lower(customer_email) = lower(p_email);

  RETURN v_count;
END;
$$;
