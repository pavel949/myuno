
-- Document types enum
CREATE TYPE public.crm_document_type AS ENUM (
  'passport', 'id_card', 'visa', 
  'rental_contract', 'sale_contract', 'agency_contract', 'power_of_attorney',
  'invoice', 'receipt', 'act', 'payment_confirmation',
  'correspondence', 'photo', 'screenshot', 'other'
);

-- CRM Documents table — links files to contacts and/or properties
CREATE TABLE public.crm_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.agent_deals(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.crm_document_type NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_crm_documents_company ON public.crm_documents(company_id);
CREATE INDEX idx_crm_documents_contact ON public.crm_documents(contact_id);
CREATE INDEX idx_crm_documents_property ON public.crm_documents(property_id);
CREATE INDEX idx_crm_documents_deal ON public.crm_documents(deal_id);
CREATE INDEX idx_crm_documents_type ON public.crm_documents(document_type);

-- RLS
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;

-- Members of the company can view documents
CREATE POLICY "Company members can view documents"
  ON public.crm_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- Members can insert documents for their company
CREATE POLICY "Company members can insert documents"
  ON public.crm_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- Members can update their own documents or admins/directors can update any
CREATE POLICY "Company members can update documents"
  ON public.crm_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND (crm_documents.uploaded_by = auth.uid() OR mcm.role IN ('director', 'admin', 'owner'))
    )
  );

-- Only directors/admins or uploaders can delete
CREATE POLICY "Uploaders or admins can delete documents"
  ON public.crm_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = crm_documents.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND (crm_documents.uploaded_by = auth.uid() OR mcm.role IN ('director', 'admin', 'owner'))
    )
  );

-- Storage bucket for CRM documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('crm-documents', 'crm-documents', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: company members can upload
CREATE POLICY "Company members can upload crm docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'crm-documents' AND (storage.foldername(name))[1] IS NOT NULL);

-- Storage RLS: company members can view
CREATE POLICY "Company members can view crm docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'crm-documents');

-- Storage RLS: company members can delete their own
CREATE POLICY "Uploaders can delete crm docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'crm-documents' AND (select auth.uid()::text) = owner_id::text);
