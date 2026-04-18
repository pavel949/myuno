-- Replace each broad SELECT policy on storage.objects with one that requires
-- a non-null `name`. Postgres LIST operations send `name IS NULL`, so this
-- blocks listing while keeping direct-by-name reads working.

DROP POLICY IF EXISTS "Anyone can view company assets" ON storage.objects;
CREATE POLICY "Public read company-assets (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-assets' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Bouquet images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read bouquet images" ON storage.objects;
CREATE POLICY "Public read bouquet-images (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'bouquet-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Experience images are publicly accessible" ON storage.objects;
CREATE POLICY "Public read experience-images (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'experience-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Intake files are publicly readable" ON storage.objects;
CREATE POLICY "Public read intake-uploads (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'intake-uploads' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
CREATE POLICY "Public read property-images (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
CREATE POLICY "Public read property-care (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-care' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public logo access" ON storage.objects;
CREATE POLICY "Public read company-logos (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public read access for project images" ON storage.objects;
CREATE POLICY "Public read project-images (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public read access for vendor uploads" ON storage.objects;
CREATE POLICY "Public read vendor-uploads (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-uploads' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Public read yacht images" ON storage.objects;
CREATE POLICY "Public read yacht-images (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'yacht-images' AND name IS NOT NULL);

DROP POLICY IF EXISTS "Tour media publicly accessible" ON storage.objects;
CREATE POLICY "Public read tour-media (no list)" ON storage.objects
  FOR SELECT USING (bucket_id = 'tour-media' AND name IS NOT NULL);
