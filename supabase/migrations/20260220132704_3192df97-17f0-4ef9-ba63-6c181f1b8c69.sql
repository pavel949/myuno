-- Fix storage policies: add foldername-based ownership validation

-- ============ booking-documents ============
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Property owners can upload booking documents" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can delete booking documents" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can view booking documents" ON storage.objects;

-- Recreate with ownership validation (files stored as {user_id}/...)
CREATE POLICY "Owners can upload booking documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can view booking documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can delete booking documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booking-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ property-care ============
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property photos" ON storage.objects;

-- Recreate with ownership (files stored as {user_id}/...)
CREATE POLICY "Users can upload property care photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-care'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update property care photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-care'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete property care photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-care'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ yacht-images ============
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated upload yacht images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update yacht images" ON storage.objects;

-- Recreate with ownership
CREATE POLICY "Users can upload own yacht images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'yacht-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own yacht images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'yacht-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ experience-images ============
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can upload experience images" ON storage.objects;

-- Recreate with ownership
CREATE POLICY "Users can upload own experience images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'experience-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ property-reports ============
-- Fix the overly permissive SELECT
DROP POLICY IF EXISTS "Users can read their own reports" ON storage.objects;

CREATE POLICY "Users can read own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-reports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
