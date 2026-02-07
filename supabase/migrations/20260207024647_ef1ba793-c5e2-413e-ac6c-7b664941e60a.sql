-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for project images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Allow service role to manage
CREATE POLICY "Service role can manage project images"
ON storage.objects FOR ALL
USING (bucket_id = 'project-images' AND auth.role() = 'service_role');