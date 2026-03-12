
-- Create storage bucket for MC backups
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mc-backups', 'mc-backups', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS for mc-backups bucket: only authenticated users can read their company's backups
CREATE POLICY "MC members can read own backups" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'mc-backups');

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
