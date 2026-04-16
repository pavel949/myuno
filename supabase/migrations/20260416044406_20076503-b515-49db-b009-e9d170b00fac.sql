
-- 1. property_owners table
CREATE TABLE IF NOT EXISTS public.property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','co_owner','beneficial_owner','nominee','tenant','investor')),
  ownership_pct NUMERIC CHECK (ownership_pct > 0 AND ownership_pct <= 100),
  since DATE,
  until DATE,
  notes TEXT,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, contact_id, role)
);

ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_property_owners_property ON public.property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_contact ON public.property_owners(contact_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_company ON public.property_owners(company_id);

CREATE POLICY "po_select" ON public.property_owners FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = property_owners.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "po_insert" ON public.property_owners FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = property_owners.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "po_update" ON public.property_owners FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = property_owners.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "po_delete" ON public.property_owners FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = property_owners.company_id AND m.user_id = auth.uid()
  ));

-- 2. inventory_listings table
CREATE TABLE IF NOT EXISTS public.inventory_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale','rent_ltr','rent_str','club_deal','wholesale')),
  price NUMERIC,
  currency TEXT DEFAULT 'THB',
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available','reserved','sold','rented','withdrawn')),
  exclusive BOOLEAN DEFAULT false,
  commission_structure JSONB DEFAULT '{}',
  published_on_channels TEXT[] DEFAULT '{}',
  viewing_count INT DEFAULT 0,
  inquiry_count INT DEFAULT 0,
  company_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_inventory_listings_property ON public.inventory_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_inventory_listings_company ON public.inventory_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_listings_type ON public.inventory_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_inventory_listings_status ON public.inventory_listings(availability_status);

CREATE POLICY "il_select" ON public.inventory_listings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = inventory_listings.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "il_insert" ON public.inventory_listings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = inventory_listings.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "il_update" ON public.inventory_listings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = inventory_listings.company_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "il_delete" ON public.inventory_listings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.management_company_members m
    WHERE m.company_id = inventory_listings.company_id AND m.user_id = auth.uid()
  ));
