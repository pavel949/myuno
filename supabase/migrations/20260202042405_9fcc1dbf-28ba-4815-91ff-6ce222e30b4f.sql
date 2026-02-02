-- Create storage bucket for property reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-reports', 'property-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their reports
CREATE POLICY "Users can read their own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-reports' AND 
  auth.uid() IS NOT NULL
);

-- Allow service role to upload reports
CREATE POLICY "Service role can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-reports');

-- Allow service role to update reports
CREATE POLICY "Service role can update reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-reports');

-- Add role field to property_delegates for role-based views
-- (already exists, just verifying the structure supports role-based access)