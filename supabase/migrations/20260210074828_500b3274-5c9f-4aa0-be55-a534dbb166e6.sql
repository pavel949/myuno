
-- Management Companies table
CREATE TABLE public.management_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  logo TEXT,
  cover_image TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  whatsapp TEXT,
  address TEXT,
  district TEXT,
  languages TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  founded_year INT,
  properties_count INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link members (managers) to companies
CREATE TABLE public.management_company_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Add management_company_id to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS management_company_id UUID REFERENCES public.management_companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_management_company ON public.properties(management_company_id);
CREATE INDEX IF NOT EXISTS idx_mc_members_user ON public.management_company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_mc_slug ON public.management_companies(slug);

-- RLS
ALTER TABLE public.management_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_company_members ENABLE ROW LEVEL SECURITY;

-- Public read for active companies (guests can browse)
CREATE POLICY "Anyone can view active management companies"
  ON public.management_companies FOR SELECT
  USING (is_active = true);

-- Members can update their company
CREATE POLICY "Company members can update their company"
  ON public.management_companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members
      WHERE company_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Admins can manage all companies
CREATE POLICY "Admins can manage companies"
  ON public.management_companies FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team'))
  );

-- Members: users can see their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.management_company_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Company admins can manage members
CREATE POLICY "Company admins can manage members"
  ON public.management_company_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = management_company_members.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.role IN ('owner', 'admin')
        AND mcm.is_active = true
    )
  );

-- Admins can manage all memberships
CREATE POLICY "Admins can manage all memberships"
  ON public.management_company_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'uno_team'))
  );

-- Public can view memberships (for company profile pages)
CREATE POLICY "Anyone can view company memberships"
  ON public.management_company_members FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_management_companies_updated_at
  BEFORE UPDATE ON public.management_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
