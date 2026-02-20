
-- Storage bucket for owner vault files
INSERT INTO storage.buckets (id, name, public) VALUES ('owner-vault', 'owner-vault', false)
ON CONFLICT (id) DO NOTHING;

-- Owner vault files table
CREATE TABLE public.owner_vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  doc_type TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  tags TEXT[],
  share_token UUID,
  share_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.owner_vault_files ENABLE ROW LEVEL SECURITY;

-- Owner can manage own files
CREATE POLICY "Owners manage own vault files"
ON public.owner_vault_files FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Public read via share token (for sharing)
CREATE POLICY "Public read via share token"
ON public.owner_vault_files FOR SELECT
USING (
  share_token IS NOT NULL 
  AND (share_expires_at IS NULL OR share_expires_at > now())
);

-- Storage policies for owner-vault bucket
CREATE POLICY "Owner upload vault files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner read vault files"
ON storage.objects FOR SELECT
USING (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete vault files"
ON storage.objects FOR DELETE
USING (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner update vault files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'owner-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Index for fast lookups
CREATE INDEX idx_vault_files_owner ON public.owner_vault_files(owner_id);
CREATE INDEX idx_vault_files_property ON public.owner_vault_files(property_id);
CREATE INDEX idx_vault_files_share ON public.owner_vault_files(share_token) WHERE share_token IS NOT NULL;

-- Updated at trigger
CREATE TRIGGER update_vault_files_updated_at
BEFORE UPDATE ON public.owner_vault_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
