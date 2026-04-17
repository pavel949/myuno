-- =============================================================
-- Developer Module | Migration 13: KYC documents storage bucket + FK
--
-- Creates the kyc-documents storage bucket.
-- RLS: broker (service role) can read all; buyers can only access their own.
-- FK: unit_holds.buyer_id → buyers(id) — added now that buyers exists.
-- =============================================================

-- ── Storage bucket ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,   -- private, not public
  10485760, -- 10MB max per file
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own KYC files
CREATE POLICY IF NOT EXISTS "kyc_owner_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own KYC files
CREATE POLICY IF NOT EXISTS "kyc_owner_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Service role (broker) can read all KYC files
CREATE POLICY IF NOT EXISTS "kyc_service_read_all"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'kyc-documents');

-- ── Add FK from unit_holds.buyer_id → buyers.id ───────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unit_holds_buyer_id_fkey'
  ) THEN
    ALTER TABLE public.unit_holds
      ADD CONSTRAINT unit_holds_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES public.buyers(id);
  END IF;
END;
$$;
