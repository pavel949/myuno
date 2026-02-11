-- Create storage bucket for processed bouquet images
INSERT INTO storage.buckets (id, name, public) VALUES ('bouquet-images', 'bouquet-images', true);

-- Allow public read access
CREATE POLICY "Public read bouquet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bouquet-images');

-- Allow service role to upload
CREATE POLICY "Service upload bouquet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bouquet-images');