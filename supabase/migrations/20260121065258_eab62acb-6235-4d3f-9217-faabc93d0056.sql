-- =====================================================
-- Property Documents - документы объекта
-- =====================================================
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES owner_properties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  
  document_type TEXT NOT NULL CHECK (document_type IN (
    'ownership_title',
    'power_of_attorney',
    'lease_agreement',
    'insurance_policy',
    'building_permit',
    'condo_rules',
    'access_key_card',
    'door_code',
    'gate_remote',
    'safe_code',
    'wifi_password',
    'utility_contract',
    'cam_agreement',
    'other'
  )),
  
  title TEXT NOT NULL,
  title_ru TEXT,
  description TEXT,
  description_ru TEXT,
  file_url TEXT,
  file_name TEXT,
  
  access_code TEXT,
  access_instructions TEXT,
  access_instructions_ru TEXT,
  
  issue_date DATE,
  expiry_date DATE,
  is_sensitive BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS для property_documents
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their property documents" ON property_documents;
CREATE POLICY "Owners can manage their property documents"
  ON property_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owner_properties op
      WHERE op.id = property_documents.property_id
      AND (
        op.owner_id = auth.uid()
        OR op.managed_by_org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM property_delegates pd
          WHERE pd.property_id = op.id
          AND pd.user_id = auth.uid()
          AND pd.status = 'active'
        )
      )
    )
  );

-- =====================================================
-- Juristic Contacts - дополнительные контакты УК
-- =====================================================
CREATE TABLE IF NOT EXISTS juristic_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE,
  property_id UUID REFERENCES owner_properties(id) ON DELETE CASCADE,
  
  contact_type TEXT NOT NULL CHECK (contact_type IN (
    'general', 'maintenance', 'security', 'accounting', 'emergency', 'management'
  )),
  name TEXT NOT NULL,
  name_ru TEXT,
  position TEXT,
  position_ru TEXT,
  phone TEXT,
  email TEXT,
  line_id TEXT,
  whatsapp TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT juristic_contacts_project_or_property CHECK (
    (project_id IS NOT NULL AND property_id IS NULL) OR
    (project_id IS NULL AND property_id IS NOT NULL)
  )
);

-- RLS для juristic_contacts (через uno_team_permissions)
ALTER TABLE juristic_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view juristic contacts for their properties" ON juristic_contacts;
CREATE POLICY "Anyone can view juristic contacts for their properties"
  ON juristic_contacts FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM owner_properties WHERE owner_id = auth.uid()
    )
    OR property_id IN (
      SELECT id FROM owner_properties WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage juristic contacts" ON juristic_contacts;
CREATE POLICY "Admins can manage juristic contacts"
  ON juristic_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Juristic Requests - запросы к УК комплекса
-- =====================================================
CREATE TABLE IF NOT EXISTS juristic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE,
  
  property_id UUID NOT NULL REFERENCES owner_properties(id),
  project_id UUID REFERENCES property_projects(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  
  request_category TEXT NOT NULL CHECK (request_category IN (
    'maintenance', 'complaint', 'payment', 'administrative'
  )),
  
  request_type TEXT NOT NULL CHECK (request_type IN (
    'maintenance_common_area',
    'maintenance_unit',
    'renovation_request',
    'complaint_cleaning',
    'complaint_security',
    'complaint_noise',
    'complaint_facilities',
    'complaint_other',
    'payment_cam',
    'payment_utility',
    'payment_sinking_fund',
    'payment_other',
    'access_card_request',
    'parking_sticker',
    'move_in_out',
    'guest_registration',
    'document_request',
    'other'
  )),
  
  subject TEXT NOT NULL,
  subject_ru TEXT,
  description TEXT NOT NULL,
  description_ru TEXT,
  attachments TEXT[],
  
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_payment',
    'submitted',
    'acknowledged',
    'in_progress',
    'completed',
    'rejected',
    'cancelled'
  )),
  
  requires_payment BOOLEAN DEFAULT false,
  payment_amount NUMERIC,
  service_fee_percent NUMERIC DEFAULT 5,
  service_fee NUMERIC,
  total_amount NUMERIC,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id UUID,
  payment_receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  
  payment_period_start DATE,
  payment_period_end DATE,
  
  submitted_at TIMESTAMPTZ,
  juristic_response TEXT,
  juristic_response_at TIMESTAMPTZ,
  
  assigned_to UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  completion_photos TEXT[],
  
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence и функция для номера запроса
CREATE SEQUENCE IF NOT EXISTS juristic_request_seq START 1;

CREATE OR REPLACE FUNCTION generate_juristic_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'JR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(NEXTVAL('juristic_request_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_juristic_request_number ON juristic_requests;
CREATE TRIGGER trg_generate_juristic_request_number
  BEFORE INSERT ON juristic_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_juristic_request_number();

-- RLS для juristic_requests
ALTER TABLE juristic_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own juristic requests" ON juristic_requests;
CREATE POLICY "Users can view their own juristic requests"
  ON juristic_requests FOR SELECT
  USING (
    owner_id = auth.uid()
    OR submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM owner_properties op
      WHERE op.id = juristic_requests.property_id
      AND (
        op.managed_by_org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM property_delegates pd
          WHERE pd.property_id = op.id
          AND pd.user_id = auth.uid()
          AND pd.status = 'active'
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create juristic requests for their properties" ON juristic_requests;
CREATE POLICY "Users can create juristic requests for their properties"
  ON juristic_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM owner_properties op
      WHERE op.id = property_id
      AND (
        op.owner_id = auth.uid()
        OR op.managed_by_org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM property_delegates pd
          WHERE pd.property_id = op.id
          AND pd.user_id = auth.uid()
          AND pd.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own draft requests" ON juristic_requests;
CREATE POLICY "Users can update their own draft requests"
  ON juristic_requests FOR UPDATE
  USING (
    (submitted_by = auth.uid() AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM uno_team_permissions WHERE user_id = auth.uid()
    )
  );

-- Триггеры updated_at
DROP TRIGGER IF EXISTS update_property_documents_updated_at ON property_documents;
CREATE TRIGGER update_property_documents_updated_at
  BEFORE UPDATE ON property_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_juristic_contacts_updated_at ON juristic_contacts;
CREATE TRIGGER update_juristic_contacts_updated_at
  BEFORE UPDATE ON juristic_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_juristic_requests_updated_at ON juristic_requests;
CREATE TRIGGER update_juristic_requests_updated_at
  BEFORE UPDATE ON juristic_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_type ON property_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_juristic_contacts_project_id ON juristic_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_juristic_contacts_property_id ON juristic_contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_juristic_requests_property_id ON juristic_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_juristic_requests_status ON juristic_requests(status);
CREATE INDEX IF NOT EXISTS idx_juristic_requests_owner_id ON juristic_requests(owner_id);