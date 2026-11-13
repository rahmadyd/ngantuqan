-- =============================================================================
-- ngantuqan — 0008: guest download access + payment details
--
-- Conflict C3 was resolved as guest checkout: the customer proves ownership of
-- an order with the order number and the email address used at checkout. That
-- pair is the security boundary for the download flow.
--
-- `record_order_download` is the database-side half of that boundary: it
-- finds the order by number and email, refuses anything that is not paid,
-- counts the download, and returns the file paths. The server action that
-- calls it mints the signed URLs.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_order_download(
  p_order_number text,
  p_email text
)
RETURNS TABLE (storage_path text, file_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order uuid;
  v_status public.payment_status;
  v_item record;
BEGIN
  SELECT o.id, o.payment_status
    INTO v_order, v_status
    FROM public.digital_orders o
   WHERE o.order_number = p_order_number
     AND lower(o.customer_email) = lower(p_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status <> 'PAID' THEN
    RAISE EXCEPTION 'Payment not confirmed';
  END IF;

  FOR v_item IN
    SELECT doi.id FROM public.digital_order_items doi
     WHERE doi.digital_order_id = v_order
  LOOP
    INSERT INTO public.downloads (digital_order_item_id, download_count, last_downloaded_at)
    VALUES (v_item.id, 1, now())
    ON CONFLICT (digital_order_item_id) DO UPDATE
      SET download_count = public.downloads.download_count + 1,
          last_downloaded_at = now();
  END LOOP;

  RETURN QUERY
    SELECT pf.storage_path, pf.file_name
      FROM public.product_files pf
      JOIN public.digital_order_items doi ON doi.product_id = pf.product_id
     WHERE doi.digital_order_id = v_order;
END;
$$;

COMMENT ON FUNCTION public.record_order_download(text, text) IS
  'Records a download and returns the file paths for a paid order, proving ownership with the order number and email.';

-- ---------------------------------------------------------------------------
-- Payment details — editable by the studio in Admin → Website Content.
-- ---------------------------------------------------------------------------
INSERT INTO public.site_settings (setting_key, setting_value, is_public)
VALUES (
  'payments.details',
  '{"heading":"Pay by bank transfer","body":"We send the full payment details with your order confirmation. Reply to that email if you need them sooner, and quote your order number.","account":null}'::jsonb,
  true
)
ON CONFLICT (setting_key) DO NOTHING;
