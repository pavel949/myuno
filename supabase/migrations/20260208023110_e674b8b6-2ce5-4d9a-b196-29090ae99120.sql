
-- Create bucket for experience cover images
INSERT INTO storage.buckets (id, name, public) VALUES ('experience-images', 'experience-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Experience images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'experience-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload experience images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'experience-images' AND auth.role() = 'authenticated');
