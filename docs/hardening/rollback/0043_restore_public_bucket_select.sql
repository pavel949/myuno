-- Rollback for 0043. WARNING: this REINTRODUCES anonymous listing of these buckets.
-- Use only as an emergency restore if a flow broke after 0043 was applied.

DROP POLICY IF EXISTS "Owner or admin read bouquet-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read bouquet-images (no list)" ON storage.objects;
CREATE POLICY "Public read bouquet-images (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'bouquet-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read company-assets (no list)" ON storage.objects;
CREATE POLICY "Public read company-assets (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read company-logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read company-logos (no list)" ON storage.objects;
CREATE POLICY "Public read company-logos (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read complex-media" ON storage.objects;
DROP POLICY IF EXISTS "complex_media_public_read" ON storage.objects;
CREATE POLICY "complex_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'complex-media');

DROP POLICY IF EXISTS "Owner or admin read experience-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read experience-images (no list)" ON storage.objects;
CREATE POLICY "Public read experience-images (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'experience-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read intake-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read intake-uploads (no list)" ON storage.objects;
CREATE POLICY "Public read intake-uploads (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'intake-uploads' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read magnet-landings" ON storage.objects;
DROP POLICY IF EXISTS "Public read magnet-landings" ON storage.objects;
CREATE POLICY "Public read magnet-landings" ON storage.objects FOR SELECT USING (bucket_id = 'magnet-landings');

DROP POLICY IF EXISTS "Owner or admin read project-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read project-images (no list)" ON storage.objects;
CREATE POLICY "Public read project-images (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'project-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read property-care" ON storage.objects;
DROP POLICY IF EXISTS "Public read property-care (no list)" ON storage.objects;
CREATE POLICY "Public read property-care (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'property-care' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read property-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read property-images (no list)" ON storage.objects;
CREATE POLICY "Public read property-images (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'property-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read property-videos" ON storage.objects;
DROP POLICY IF EXISTS "property-videos public read" ON storage.objects;
CREATE POLICY "property-videos public read" ON storage.objects FOR SELECT USING (bucket_id = 'property-videos');

DROP POLICY IF EXISTS "Owner or admin read tour-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read tour-media (no list)" ON storage.objects;
CREATE POLICY "Public read tour-media (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'tour-media' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read vendor-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read vendor-uploads (no list)" ON storage.objects;
CREATE POLICY "Public read vendor-uploads (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'vendor-uploads' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Owner or admin read yacht-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read yacht-images (no list)" ON storage.objects;
CREATE POLICY "Public read yacht-images (no list)" ON storage.objects FOR SELECT USING (bucket_id = 'yacht-images' AND name IS NOT NULL);
