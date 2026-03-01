
-- Add legal, banking, documents, and backup columns to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS swift_code text,
  ADD COLUMN IF NOT EXISTS dbd_card_url text,
  ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS backup_settings jsonb DEFAULT '{}'::jsonb;

-- Create mc-backups storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mc-backups', 'mc-backups', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for mc-backups: only company members can access
CREATE POLICY "MC members can manage backups"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'mc-backups'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = auth.uid()
    AND company_id = (storage.foldername(name))[1]::uuid
    AND is_active = true
    AND role IN ('director', 'admin')
  )
)
WITH CHECK (
  bucket_id = 'mc-backups'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.management_company_members
    WHERE user_id = auth.uid()
    AND company_id = (storage.foldername(name))[1]::uuid
    AND is_active = true
    AND role IN ('director', 'admin')
  )
);
