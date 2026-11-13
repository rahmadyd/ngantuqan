-- =============================================================================
-- ngantuqan — 0010: rate limiting for the public forms
--
-- Conflict C6 was resolved with a Postgres-backed limiter: §7 requires rate
-- limiting on the public forms, and §2 lists no rate-limit service, so the
-- counter lives in the database the project already has. No new vendor, no new
-- credentials, and it works across every serverless instance because the
-- count is not held in memory.
--
-- The check is one atomic statement — an upsert that increments the counter
-- and returns the new count — so two simultaneous requests cannot both slip
-- through the limit.
--
-- The identifier is a hash of the client IP. The raw address never reaches
-- the database.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  CONSTRAINT rate_limits_bucket_identifier_window_key
    UNIQUE (bucket, identifier, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx
  ON public.rate_limits (expires_at);

-- The table is written only by the function below. RLS with no policies keeps
-- the browser away from it: the SECURITY DEFINER function runs as the owner
-- and bypasses the policy layer.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- The check.
--
-- Fixed window: the counter is aligned to the wall clock, so the window ends
-- on a round boundary and the counter restarts. A caller that sits just
-- before the boundary gets a fresh window — the accepted trade-off of a
-- fixed window, and far cheaper than a sliding one.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket text,
  p_identifier text,
  p_max_requests integer DEFAULT 5,
  p_window_seconds integer DEFAULT 600
)
RETURNS TABLE (allowed boolean, remaining integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_expires_at timestamptz;
  v_count integer;
BEGIN
  IF p_bucket IS NULL OR btrim(p_bucket) = ''
     OR p_identifier IS NULL OR btrim(p_identifier) = '' THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  p_max_requests := greatest(1, coalesce(p_max_requests, 5));
  p_window_seconds := greatest(1, coalesce(p_window_seconds, 600));

  v_window_start := to_timestamp(
    (floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds)::double precision
  );
  v_expires_at := v_window_start + make_interval(secs => p_window_seconds);

  -- The whole check is one statement: insert, or increment on conflict.
  INSERT INTO public.rate_limits AS rl (
    bucket, identifier, window_start, request_count, expires_at
  )
  VALUES (p_bucket, p_identifier, v_window_start, 1, v_expires_at)
  ON CONFLICT (bucket, identifier, window_start)
  DO UPDATE SET request_count = rl.request_count + 1
  RETURNING rl.request_count INTO v_count;

  -- Expired rows are swept as traffic arrives, so the table stays small
  -- without a scheduled job.
  DELETE FROM public.rate_limits
   WHERE id IN (
     SELECT id FROM public.rate_limits
      WHERE expires_at < now()
      ORDER BY expires_at
      LIMIT 200
   );

  RETURN QUERY SELECT
    v_count <= p_max_requests,
    greatest(p_max_requests - v_count, 0),
    greatest(ceil(extract(epoch FROM (v_expires_at - now()))), 0)::integer;
END;
$$;

COMMENT ON FUNCTION public.check_rate_limit(text, text, integer, integer) IS
  'Counts one request against a bucket and reports whether it is within the limit.';

-- Supabase grants new functions to anon and authenticated by default, so the
-- browser could otherwise count requests for itself and fill the table. Only
-- the application calls this, with the service role.
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer)
  TO service_role;
