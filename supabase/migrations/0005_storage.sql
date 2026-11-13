-- =============================================================================
-- ngantuqan — 0005: storage buckets and policies
--
-- Three buckets with different trust levels (spec §5.I, §8):
--   public-media        public read  — portfolio/product previews, avatars
--   private-products    private      — the purchasable files (signed URLs only)
--   private-attachments private      — client reference files (signed URLs only)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('public-media', 'public-media', true, 10485760, NULL),
  ('private-products', 'private-products', false, 524288000, NULL),
  ('private-attachments', 'private-attachments', false, 10485760, NULL)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit;

-- ---------------------------------------------------------------------------
-- public-media — world-readable, admin-writable
-- ---------------------------------------------------------------------------
CREATE POLICY public_media_read ON storage.objects
  FOR SELECT USING (bucket_id = 'public-media');

CREATE POLICY public_media_admin_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'public-media' AND public.is_admin());

CREATE POLICY public_media_admin_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'public-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'public-media' AND public.is_admin());

CREATE POLICY public_media_admin_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'public-media' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- private-products — no direct reads at all, not even for admins through the
-- client. Access is exclusively via short-lived signed URLs minted by the
-- server after verifying a paid order.
-- ---------------------------------------------------------------------------
CREATE POLICY private_products_admin_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'private-products' AND public.is_admin());

CREATE POLICY private_products_admin_update ON storage.objects
  FOR UPDATE USING (bucket_id = 'private-products' AND public.is_admin())
  WITH CHECK (bucket_id = 'private-products' AND public.is_admin());

CREATE POLICY private_products_admin_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'private-products' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- private-attachments — admins read via signed URL; inserts happen through the
-- server after an order is created.
-- ---------------------------------------------------------------------------
CREATE POLICY private_attachments_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'private-attachments');

CREATE POLICY private_attachments_admin_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'private-attachments' AND public.is_admin());
