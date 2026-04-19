-- ============================================
-- Phase 2: Owner Portal v2
-- ============================================

-- Statement approval status enum
DO $$ BEGIN
  CREATE TYPE public.statement_approval_status AS ENUM ('pending','approved','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Signature request status enum
DO $$ BEGIN
  CREATE TYPE public.signature_request_status AS ENUM ('draft','sent','partially_signed','completed','declined','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Signer status enum
DO $$ BEGIN
  CREATE TYPE public.signer_status AS ENUM ('pending','signed','declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 1) owner_statement_approvals
-- ============================================
CREATE TABLE IF NOT EXISTS public.owner_statement_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  payout_id uuid REFERENCES public.owner_payouts(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  statement_url text,
  net_amount numeric(14,2),
  currency text DEFAULT 'THB',
  status public.statement_approval_status NOT NULL DEFAULT 'pending',
  signature_image_url text,
  signed_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  comment text,
  signer_ip text,
  signer_user_agent text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_osa_company ON public.owner_statement_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_osa_property ON public.owner_statement_approvals(property_id);
CREATE INDEX IF NOT EXISTS idx_osa_owner ON public.owner_statement_approvals(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_osa_status ON public.owner_statement_approvals(status);

ALTER TABLE public.owner_statement_approvals ENABLE ROW LEVEL SECURITY;

-- Helper: owner of property check (uses existing property_owner_links if present)
-- Owners can view their own approvals
CREATE POLICY "Owners view own approvals" ON public.owner_statement_approvals
  FOR SELECT USING (owner_user_id = auth.uid());

-- Owners can update (sign) their own pending approvals
CREATE POLICY "Owners sign own approvals" ON public.owner_statement_approvals
  FOR UPDATE USING (owner_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (owner_user_id = auth.uid());

-- MC members can view all for their company
CREATE POLICY "MC members view company approvals" ON public.owner_statement_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = owner_statement_approvals.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- MC members can create approval requests
CREATE POLICY "MC members create approvals" ON public.owner_statement_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = owner_statement_approvals.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- MC admins can update (cancel/expire)
CREATE POLICY "MC admins update approvals" ON public.owner_statement_approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = owner_statement_approvals.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND mcm.role IN ('owner','admin','manager')
    )
  );

-- ============================================
-- 2) signature_requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  document_url text NOT NULL,
  document_type text DEFAULT 'contract',
  related_property_id uuid,
  related_entity_type text,
  related_entity_id uuid,
  status public.signature_request_status NOT NULL DEFAULT 'draft',
  signed_document_url text,
  expires_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigreq_company ON public.signature_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_sigreq_status ON public.signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_sigreq_property ON public.signature_requests(related_property_id);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3) signature_request_signers
-- ============================================
CREATE TABLE IF NOT EXISTS public.signature_request_signers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  signer_user_id uuid,
  signer_email text,
  signer_name text NOT NULL,
  signer_role text DEFAULT 'owner',
  sign_order integer DEFAULT 1,
  status public.signer_status NOT NULL DEFAULT 'pending',
  signature_image_url text,
  signed_at timestamptz,
  declined_at timestamptz,
  decline_reason text,
  signer_ip text,
  signer_user_agent text,
  access_token text UNIQUE DEFAULT encode(gen_random_bytes(32),'hex'),
  notified_at timestamptz,
  reminder_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sigsigners_request ON public.signature_request_signers(request_id);
CREATE INDEX IF NOT EXISTS idx_sigsigners_user ON public.signature_request_signers(signer_user_id);
CREATE INDEX IF NOT EXISTS idx_sigsigners_token ON public.signature_request_signers(access_token);

ALTER TABLE public.signature_request_signers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS for signature_requests
-- ============================================
CREATE POLICY "MC members view company sigreqs" ON public.signature_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = signature_requests.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Signers view assigned sigreqs" ON public.signature_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.signature_request_signers s
      WHERE s.request_id = signature_requests.id
        AND s.signer_user_id = auth.uid()
    )
  );

CREATE POLICY "MC members create sigreqs" ON public.signature_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = signature_requests.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    ) AND created_by = auth.uid()
  );

CREATE POLICY "MC members update sigreqs" ON public.signature_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = signature_requests.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "MC admins delete sigreqs" ON public.signature_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = signature_requests.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND mcm.role IN ('owner','admin')
    )
  );

-- ============================================
-- RLS for signature_request_signers
-- ============================================
CREATE POLICY "Signers view own row" ON public.signature_request_signers
  FOR SELECT USING (signer_user_id = auth.uid());

CREATE POLICY "MC members view request signers" ON public.signature_request_signers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.signature_requests sr
      JOIN public.management_company_members mcm ON mcm.company_id = sr.company_id
      WHERE sr.id = signature_request_signers.request_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "MC members manage signers" ON public.signature_request_signers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.signature_requests sr
      JOIN public.management_company_members mcm ON mcm.company_id = sr.company_id
      WHERE sr.id = signature_request_signers.request_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

CREATE POLICY "Signers update own row" ON public.signature_request_signers
  FOR UPDATE USING (signer_user_id = auth.uid() AND status = 'pending')
  WITH CHECK (signer_user_id = auth.uid());

CREATE POLICY "MC members update signers" ON public.signature_request_signers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.signature_requests sr
      JOIN public.management_company_members mcm ON mcm.company_id = sr.company_id
      WHERE sr.id = signature_request_signers.request_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- ============================================
-- updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_osa_touch ON public.owner_statement_approvals;
CREATE TRIGGER trg_osa_touch BEFORE UPDATE ON public.owner_statement_approvals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_sigreq_touch ON public.signature_requests;
CREATE TRIGGER trg_sigreq_touch BEFORE UPDATE ON public.signature_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_sigsigners_touch ON public.signature_request_signers;
CREATE TRIGGER trg_sigsigners_touch BEFORE UPDATE ON public.signature_request_signers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- Auto-update parent request status when signers change
-- ============================================
CREATE OR REPLACE FUNCTION public.update_signature_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  total_signers integer;
  signed_signers integer;
  declined_signers integer;
BEGIN
  SELECT COUNT(*), 
         COUNT(*) FILTER (WHERE status = 'signed'),
         COUNT(*) FILTER (WHERE status = 'declined')
    INTO total_signers, signed_signers, declined_signers
  FROM public.signature_request_signers
  WHERE request_id = NEW.request_id;

  IF declined_signers > 0 THEN
    UPDATE public.signature_requests SET status = 'declined' WHERE id = NEW.request_id;
  ELSIF signed_signers = total_signers AND total_signers > 0 THEN
    UPDATE public.signature_requests 
      SET status = 'completed', completed_at = now() 
      WHERE id = NEW.request_id;
  ELSIF signed_signers > 0 THEN
    UPDATE public.signature_requests SET status = 'partially_signed' WHERE id = NEW.request_id;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sigsigners_update_parent ON public.signature_request_signers;
CREATE TRIGGER trg_sigsigners_update_parent
  AFTER UPDATE OF status ON public.signature_request_signers
  FOR EACH ROW EXECUTE FUNCTION public.update_signature_request_status();

-- ============================================
-- Storage bucket for signatures (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
CREATE POLICY "Users upload own signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own signatures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- MC members read signatures for their company's requests (via storage path convention: signatures/{user_id}/...)
-- For full cross-team read, MC members access via signed URLs generated by edge function (Phase 2.1)
