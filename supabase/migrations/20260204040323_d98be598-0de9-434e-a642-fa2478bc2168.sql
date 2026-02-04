-- =============================================
-- Investment Hub Database Schema
-- =============================================

-- Add investor role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'investor' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'investor';
  END IF;
END $$;

-- =============================================
-- 1. Investment Projects - Core table
-- =============================================
CREATE TABLE public.investment_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  slug TEXT UNIQUE,
  description_en TEXT,
  description_ru TEXT,
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  
  -- Classification
  project_type TEXT NOT NULL DEFAULT 'real_estate_offplan', -- real_estate_offplan, hospitality, restaurant, etc.
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, funded, closed
  
  -- Financial info
  currency TEXT NOT NULL DEFAULT 'USD',
  funding_goal NUMERIC,
  amount_raised NUMERIC DEFAULT 0,
  min_investment NUMERIC,
  max_investment NUMERIC,
  
  -- ROI & Terms
  roi_projected NUMERIC, -- Annual ROI percentage
  investment_term_months INTEGER,
  exit_strategy TEXT,
  
  -- muUNO Scoring
  muuno_score INTEGER CHECK (muuno_score >= 0 AND muuno_score <= 100),
  risk_level TEXT DEFAULT 'medium', -- low, medium, elevated, high
  score_breakdown JSONB DEFAULT '{}', -- {location: 80, developer: 90, financial: 85, market: 75}
  risk_factors TEXT[] DEFAULT '{}',
  
  -- Relations
  property_project_id UUID REFERENCES public.property_projects(id) ON DELETE SET NULL,
  founder_id UUID,
  developer_id UUID,
  
  -- Location (for non-property projects)
  district TEXT,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  
  -- Metadata
  investors_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_hot BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  funded_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_investment_projects_type ON public.investment_projects(project_type);
CREATE INDEX idx_investment_projects_status ON public.investment_projects(status);
CREATE INDEX idx_investment_projects_score ON public.investment_projects(muuno_score DESC);
CREATE INDEX idx_investment_projects_featured ON public.investment_projects(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE public.investment_projects ENABLE ROW LEVEL SECURITY;

-- Public read access for active projects
CREATE POLICY "Anyone can view active investment projects" 
ON public.investment_projects 
FOR SELECT 
USING (status = 'active' OR status = 'funded');

-- Admins can manage all projects
CREATE POLICY "Admins can manage investment projects"
ON public.investment_projects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 2. Investment Interests - Lead tracking
-- =============================================
CREATE TABLE public.investment_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Interest details
  interest_type TEXT NOT NULL DEFAULT 'learn_more', -- 'invest', 'learn_more', 'call_request'
  preferred_amount NUMERIC,
  preferred_currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, converted, declined
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Contact info (optional override)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Notes
  notes TEXT,
  admin_notes TEXT,
  
  -- Tracking
  source TEXT, -- web, referral, agent
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_investment_interests_project ON public.investment_interests(project_id);
CREATE INDEX idx_investment_interests_user ON public.investment_interests(user_id);
CREATE INDEX idx_investment_interests_status ON public.investment_interests(status);

-- Enable RLS
ALTER TABLE public.investment_interests ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own interests
CREATE POLICY "Users can create interest"
ON public.investment_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interests"
ON public.investment_interests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all interests
CREATE POLICY "Admins can manage interests"
ON public.investment_interests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 3. Investment Team Members
-- =============================================
CREATE TABLE public.investment_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,
  
  -- Member info
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- CEO, CFO, CTO, Developer Director, etc.
  bio_en TEXT,
  bio_ru TEXT,
  photo TEXT,
  
  -- Links
  linkedin_url TEXT,
  website_url TEXT,
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_team_project ON public.investment_team_members(project_id);

-- Enable RLS
ALTER TABLE public.investment_team_members ENABLE ROW LEVEL SECURITY;

-- Public read for team members of active projects
CREATE POLICY "Anyone can view team of active projects"
ON public.investment_team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investment_projects 
    WHERE id = project_id 
    AND (status = 'active' OR status = 'funded')
  )
);

-- Admins can manage team members
CREATE POLICY "Admins can manage team members"
ON public.investment_team_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 4. Investment Documents
-- =============================================
CREATE TABLE public.investment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.investment_projects(id) ON DELETE CASCADE,
  
  -- Document info
  name_en TEXT NOT NULL,
  name_ru TEXT,
  document_type TEXT NOT NULL DEFAULT 'other', -- pitch_deck, financials, legal, marketing, other
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  requires_nda BOOLEAN DEFAULT false,
  requires_interest BOOLEAN DEFAULT false, -- Only visible after expressing interest
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  
  -- Tracking
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_docs_project ON public.investment_documents(project_id);

-- Enable RLS
ALTER TABLE public.investment_documents ENABLE ROW LEVEL SECURITY;

-- Public documents visible to all
CREATE POLICY "Anyone can view public documents"
ON public.investment_documents
FOR SELECT
USING (
  is_public = true 
  AND EXISTS (
    SELECT 1 FROM public.investment_projects 
    WHERE id = project_id 
    AND (status = 'active' OR status = 'funded')
  )
);

-- Authenticated users can view after expressing interest
CREATE POLICY "Users with interest can view restricted documents"
ON public.investment_documents
FOR SELECT
USING (
  requires_interest = true
  AND requires_nda = false
  AND EXISTS (
    SELECT 1 FROM public.investment_interests 
    WHERE project_id = investment_documents.project_id 
    AND user_id = auth.uid()
  )
);

-- Admins can manage documents
CREATE POLICY "Admins can manage documents"
ON public.investment_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff', 'uno_team')
  )
);

-- =============================================
-- 5. Add investment fields to property_projects
-- =============================================
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS investment_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS funding_goal NUMERIC;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS min_investment NUMERIC;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS roi_projected NUMERIC;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS muuno_score INTEGER;
ALTER TABLE public.property_projects ADD COLUMN IF NOT EXISTS risk_level TEXT;

-- =============================================
-- 6. Add investment categories to lookup_values
-- =============================================
INSERT INTO public.lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES 
  ('investment_category', 'real_estate_offplan', 'Off-Plan Property', 'Новостройки', '🏗️', 1, true),
  ('investment_category', 'real_estate_rental', 'Rental Business', 'Арендный бизнес', '🏠', 2, true),
  ('investment_category', 'hospitality', 'Hospitality', 'Гостиничный бизнес', '🏨', 3, true),
  ('investment_category', 'restaurant', 'Restaurant & F&B', 'Рестораны и HoReCa', '🍽️', 4, true),
  ('investment_category', 'retail', 'Retail', 'Ритейл', '🛍️', 5, true),
  ('investment_category', 'yacht_charter', 'Yacht Charter', 'Яхтенный чартер', '⛵', 6, true),
  ('investment_category', 'marine_tourism', 'Marine Tourism', 'Морской туризм', '🌊', 7, true),
  ('investment_category', 'wellness', 'Wellness & Spa', 'Велнес и СПА', '💆', 8, true),
  ('investment_category', 'tech_startup', 'Tech Startup', 'Технологии', '💻', 9, true),
  ('investment_category', 'franchise', 'Franchise', 'Франшиза', '🏪', 10, true),
  ('investment_category', 'agriculture', 'Agriculture', 'Агро', '🌴', 11, true)
ON CONFLICT (lookup_type, value_key) DO NOTHING;

-- =============================================
-- 7. Trigger for updated_at
-- =============================================
CREATE TRIGGER update_investment_projects_updated_at
  BEFORE UPDATE ON public.investment_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_interests_updated_at
  BEFORE UPDATE ON public.investment_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_documents_updated_at
  BEFORE UPDATE ON public.investment_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();