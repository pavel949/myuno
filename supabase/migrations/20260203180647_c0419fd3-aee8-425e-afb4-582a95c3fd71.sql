-- Create storage bucket for booking documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('booking-documents', 'booking-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for booking-documents bucket
-- Property owners can upload documents
CREATE POLICY "Property owners can upload booking documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'booking-documents' 
  AND auth.role() = 'authenticated'
);

-- Property owners can view their documents
CREATE POLICY "Property owners can view booking documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-documents' 
  AND auth.role() = 'authenticated'
);

-- Property owners can delete their documents
CREATE POLICY "Property owners can delete booking documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'booking-documents' 
  AND auth.role() = 'authenticated'
);