-- =============================================================================
-- ngantuqan — 0013: the media library keeps its own index
--
-- Conflict C8 was ruled "yes — add the table": the library was meant to be
-- an index of the studio's assets, not a place to re-upload the same file.
--
-- Storage is a keyspace — a file is only a path — so what the studio knows
-- about an asset (what it is called, what it looks like, what alt text it
-- carries, who put it there) had nowhere to live. This table is that
-- knowledge, and it is what a picker will read from later.
-- =============================================================================

CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  alt_text text,
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_bucket_path_key UNIQUE (bucket, path)
);

CREATE INDEX idx_media_bucket ON public.media (bucket);
CREATE INDEX idx_media_created ON public.media (created_at DESC);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- The library is a studio tool: only an administrator may read or write it.
-- The files themselves keep their own storage policies.
CREATE POLICY media_admin_read ON public.media
  FOR SELECT USING (public.is_admin());

CREATE POLICY media_admin_write ON public.media
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_media_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.media IS
  'The studio''s index of its own files: what each asset is, and what it says.';
