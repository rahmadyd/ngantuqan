-- =============================================================================
-- ngantuqan — 0009: fix the price lookup in record_purchase
--
-- `record_purchase` selected `coalesce(p.discount_price, p.price)` into a
-- `record` variable and then read `v_product.price`. A computed column has no
-- name, so the record's field was called "coalesce" and every purchase failed
-- with:
--
--   record "v_product" has no field "price"
--
-- The function was only reachable once guest checkout existed, which is why
-- this had not surfaced before.
--
-- The behaviour does not change: the discounted price is used when there is
-- one, the list price otherwise, and the client never supplies a price.
-- =============================================================================

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
    -- The alias matters: without it the record field is named "coalesce".
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
