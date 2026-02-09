-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Property images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Service role can upload (edge functions use service role)
CREATE POLICY "Service role can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Service role can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images');
