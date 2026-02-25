
-- =============================================
-- 1. owner_service_vendors — personal vendor directory
-- =============================================
CREATE TABLE public.owner_service_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  name_ru text,
  category text DEFAULT 'other',
  contact_person text,
  phone text,
  email text,
  whatsapp text,
  line_id text,
  address text,
  photo_url text,
  notes text,
  source text DEFAULT 'own',
  is_favorite boolean DEFAULT false,
  is_active boolean DEFAULT true,
  avg_rating numeric DEFAULT 0,
  total_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.owner_service_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own vendors"
  ON public.owner_service_vendors FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- 2. vendor_documents — files attached to vendors
-- =============================================
CREATE TABLE public.vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.owner_service_vendors(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  doc_type text DEFAULT 'other',
  title text,
  file_url text,
  file_name text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage vendor docs"
  ON public.vendor_documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- 3. vendor_property_assignments — link vendors to properties
-- =============================================
CREATE TABLE public.vendor_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.owner_service_vendors(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  service_type text,
  rate numeric,
  rate_type text DEFAULT 'per_visit',
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vendor_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage vendor assignments"
  ON public.vendor_property_assignments FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- 4. staff_members — add photo_url
-- =============================================
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS photo_url text;

-- =============================================
-- 5. staff_documents — files attached to staff
-- =============================================
CREATE TABLE public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  doc_type text DEFAULT 'other',
  title text,
  file_url text,
  file_name text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage staff docs"
  ON public.staff_documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_owner_vendors_owner ON public.owner_service_vendors(owner_id);
CREATE INDEX idx_owner_vendors_category ON public.owner_service_vendors(category);
CREATE INDEX idx_vendor_docs_vendor ON public.vendor_documents(vendor_id);
CREATE INDEX idx_vendor_assignments_vendor ON public.vendor_property_assignments(vendor_id);
CREATE INDEX idx_vendor_assignments_property ON public.vendor_property_assignments(property_id);
CREATE INDEX idx_staff_docs_staff ON public.staff_documents(staff_id);
