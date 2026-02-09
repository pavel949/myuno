
-- Create storage bucket for yacht images
INSERT INTO storage.buckets (id, name, public)
VALUES ('yacht-images', 'yacht-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read yacht images"
ON storage.objects FOR SELECT
USING (bucket_id = 'yacht-images');

-- Allow authenticated uploads (admins/system)
CREATE POLICY "Authenticated upload yacht images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'yacht-images' AND auth.role() = 'authenticated');

-- Allow authenticated updates
CREATE POLICY "Authenticated update yacht images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'yacht-images' AND auth.role() = 'authenticated');
