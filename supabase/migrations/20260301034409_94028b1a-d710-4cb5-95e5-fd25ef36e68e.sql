-- Create storage bucket for company assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for company-assets bucket
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can update own company assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-assets');