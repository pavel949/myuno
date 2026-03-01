-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can view logos (public)
CREATE POLICY "Public logo access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- RLS: authenticated users can upload logos
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );

-- RLS: authenticated users can update their uploads
CREATE POLICY "Users can update own logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );

-- RLS: authenticated users can delete their uploads
CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );