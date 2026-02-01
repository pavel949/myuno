-- =============================================
-- ФАЗА 1: ДВУНАПРАВЛЕННЫЕ ПРИГЛАШЕНИЯ
-- =============================================

-- Таблица для запросов на управление (Owner <-> УК)
CREATE TABLE public.property_management_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('owner', 'manager', 'agency')),
  target_email TEXT NOT NULL,
  target_user_id UUID,
  request_type TEXT NOT NULL CHECK (request_type IN ('add_property', 'request_management', 'transfer_ownership', 'invite_delegate')),
  proposed_terms JSONB DEFAULT '{}',
  proposed_role TEXT DEFAULT 'manager',
  proposed_permissions JSONB DEFAULT '{"view": true, "edit": false, "financial": false, "bookings": false}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для запросов
CREATE INDEX idx_mgmt_requests_requester ON public.property_management_requests(requester_id);
CREATE INDEX idx_mgmt_requests_target_email ON public.property_management_requests(target_email);
CREATE INDEX idx_mgmt_requests_status ON public.property_management_requests(status);
CREATE INDEX idx_mgmt_requests_property ON public.property_management_requests(property_id);

-- RLS для property_management_requests
ALTER TABLE public.property_management_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
ON public.property_management_requests FOR SELECT
USING (
  requester_id = auth.uid() 
  OR target_user_id = auth.uid()
  OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Users can create requests"
ON public.property_management_requests FOR INSERT
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their received requests"
ON public.property_management_requests FOR UPDATE
USING (
  target_user_id = auth.uid()
  OR target_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR requester_id = auth.uid()
);

-- =============================================
-- ФАЗА 2: СИСТЕМА ОТЧЁТОВ
-- =============================================

-- Таблица отчётов
CREATE TABLE public.property_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.owner_properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  generated_by UUID,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  summary_text TEXT,
  summary_text_ru TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('generating', 'draft', 'ready', 'sent', 'viewed', 'error')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  sent_to TEXT[],
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для отчётов
CREATE INDEX idx_reports_property ON public.property_reports(property_id);
CREATE INDEX idx_reports_owner ON public.property_reports(owner_id);
CREATE INDEX idx_reports_period ON public.property_reports(period_start, period_end);
CREATE INDEX idx_reports_status ON public.property_reports(status);

-- RLS для property_reports
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their reports"
ON public.property_reports FOR SELECT
USING (
  owner_id = auth.uid()
  OR generated_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_delegates pd
    WHERE pd.property_id = property_reports.property_id
    AND pd.user_id = auth.uid()
    AND pd.status = 'active'
    AND (pd.permissions->>'financial')::boolean = true
  )
);

CREATE POLICY "Users can create reports for their properties"
ON public.property_reports FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.owner_properties op
    WHERE op.id = property_id AND op.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.property_delegates pd
    WHERE pd.property_id = property_reports.property_id
    AND pd.user_id = auth.uid()
    AND pd.status = 'active'
    AND (pd.permissions->>'financial')::boolean = true
  )
);

CREATE POLICY "Users can update their reports"
ON public.property_reports FOR UPDATE
USING (
  owner_id = auth.uid()
  OR generated_by = auth.uid()
);

CREATE POLICY "Owners can delete their reports"
ON public.property_reports FOR DELETE
USING (owner_id = auth.uid());

-- =============================================
-- ФАЗА 3: РАСШИРЕНИЕ ФИНАНСОВ (OCR)
-- =============================================

-- Добавить колонки для OCR в property_financials
ALTER TABLE public.property_financials 
ADD COLUMN IF NOT EXISTS receipt_metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Добавить notification_preferences в property_delegates
ALTER TABLE public.property_delegates
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "reports": true}';

-- =============================================
-- ТРИГГЕРЫ ДЛЯ UPDATED_AT
-- =============================================

CREATE TRIGGER update_management_requests_updated_at
  BEFORE UPDATE ON public.property_management_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.property_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STORAGE BUCKET ДЛЯ ОТЧЁТОВ
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-reports', 'property-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Политики хранилища для отчётов
CREATE POLICY "Users can upload their reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);