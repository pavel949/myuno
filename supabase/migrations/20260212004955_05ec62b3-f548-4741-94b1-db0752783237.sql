
-- Create storage bucket for bouquet images
INSERT INTO storage.buckets (id, name, public) VALUES ('bouquet-images', 'bouquet-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Bouquet images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'bouquet-images');

-- Allow authenticated users to upload
CREATE POLICY "Admins can upload bouquet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bouquet-images' AND auth.role() = 'authenticated');
