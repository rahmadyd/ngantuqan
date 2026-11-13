-- =============================================================================
-- ngantuqan — 0012: the admin overview counts every service
--
-- The "Services" card on the overview needs two numbers: how many services the
-- studio has, and how many of them are live. `admin_counts` returned only the
-- active ones, so the card had nothing to compare them with.
--
-- The return type changed, so the old function goes first — otherwise
-- PostgREST would find two functions with the same name and no arguments.
-- =============================================================================

DROP FUNCTION IF EXISTS public.admin_counts();

CREATE OR REPLACE FUNCTION public.admin_counts()
RETURNS TABLE (
  total_projects bigint,
  published_projects bigint,
  active_services bigint,
  total_services bigint,
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
    (SELECT count(*) FROM public.services),
    (SELECT count(*) FROM public.inquiries),
    (SELECT count(*) FROM public.inquiries WHERE NOT is_read),
    (SELECT count(*) FROM public.service_orders WHERE order_status = 'NEW_INQUIRY'),
    (SELECT count(*) FROM public.products WHERE is_published);
END;
$$;

COMMENT ON FUNCTION public.admin_counts() IS
  'Counts for the admin overview. Admin only.';
