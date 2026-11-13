-- =============================================================================
-- ngantuqan — 0011: the payment provider is chosen by the application
--
-- Conflict C7: the spec wants a purchasing architecture that can support a
-- payment provider later, and it refuses to simulate a successful payment.
-- So the provider is an interface with one real implementation, and the order
-- records which provider handled it.
--
-- Two paths may mark an order PAID, and only two:
--   1. The studio confirming the payment in the admin dashboard
--      (`confirm_digital_order_payment`, admin-gated).
--   2. A provider callback that verified its own signature
--      (`confirm_digital_order_payment_from_provider`, service role only).
--
-- The second function is granted to the service role alone, so a request
-- nobody signed can never mark an order paid.
-- =============================================================================

-- The signature changes, so the old function goes first.
DROP FUNCTION IF EXISTS public.record_purchase(text, text, jsonb);

CREATE OR REPLACE FUNCTION public.record_purchase(
  p_customer_name text,
  p_customer_email text,
  p_items jsonb,
  p_payment_provider text DEFAULT 'manual'
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
    coalesce(nullif(btrim(p_payment_provider), ''), 'manual')
  )
  RETURNING id, public.digital_orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- The alias matters: without it the record field is named "coalesce"
    -- (migration 0009).
    SELECT p.id, p.title, coalesce(p.discount_price, p.price) AS price
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

COMMENT ON FUNCTION public.record_purchase(text, text, jsonb, text) IS
  'Creates a digital order in PENDING with the price read from the products table.';

-- ---------------------------------------------------------------------------
-- Confirm a payment from a provider callback.
--
-- The caller is the application, holding the service role, and only after the
-- provider verified its own signature. The row it writes is the audit trail:
-- the studio did not click anything, so there is no admin to name.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_digital_order_payment_from_provider(
  p_order_number text,
  p_transaction_reference text DEFAULT NULL,
  p_provider text DEFAULT 'manual'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_status public.payment_status;
BEGIN
  SELECT id, payment_status
    INTO v_order_id, v_status
    FROM public.digital_orders
   WHERE order_number = p_order_number
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already confirmed — the callback may be retried, and the audit row is
  -- written once.
  IF v_status = 'PAID' THEN
    RETURN TRUE;
  END IF;

  UPDATE public.digital_orders
     SET payment_status = 'PAID',
         transaction_reference = coalesce(p_transaction_reference, transaction_reference)
   WHERE id = v_order_id;

  INSERT INTO public.activity_logs (admin_id, action, entity_type, entity_id, metadata)
  VALUES (
    NULL,
    'payment_confirmed',
    'digital_order',
    v_order_id,
    jsonb_build_object(
      'provider', coalesce(nullif(btrim(p_provider), ''), 'manual'),
      'reference', p_transaction_reference,
      'source', 'provider_callback'
    )
  );

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.confirm_digital_order_payment_from_provider(text, text, text) IS
  'Marks an order paid from a verified provider callback. Service role only.';

REVOKE ALL ON FUNCTION public.confirm_digital_order_payment_from_provider(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_digital_order_payment_from_provider(text, text, text)
  TO service_role;
