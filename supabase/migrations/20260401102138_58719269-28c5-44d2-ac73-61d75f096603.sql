
-- Phase 1: Extend property_projects with newbuilds-specific columns
ALTER TABLE property_projects 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS tagline_ru TEXT,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS unit_types TEXT[],
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[],
  ADD COLUMN IF NOT EXISTS location_area TEXT;

-- Extend developers with user linking and subscription
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';

-- New table: Special terms / payment plans for projects
CREATE TABLE nb_special_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE NOT NULL,
  payment_plan TEXT,
  payment_details TEXT,
  discount_percent DECIMAL,
  discount_description TEXT,
  promo_label TEXT,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Construction updates feed
CREATE TABLE nb_project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  photo_urls TEXT[],
  progress_at_time INTEGER,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Monthly PDF reports
CREATE TABLE nb_project_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Newbuild leads (developer-facing CRM)
CREATE TABLE nb_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES property_projects(id),
  developer_id UUID REFERENCES developers(id),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  budget_min BIGINT,
  budget_max BIGINT,
  unit_preference TEXT,
  message TEXT,
  source TEXT DEFAULT 'landing',
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  transferred_to_developer BOOLEAN DEFAULT false,
  transferred_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New table: Promotions / paid placements
CREATE TABLE nb_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES developers(id),
  project_id UUID REFERENCES property_projects(id),
  type TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  amount_paid BIGINT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE nb_special_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_project_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nb_promotions ENABLE ROW LEVEL SECURITY;

-- Public read on special terms, updates, reports (linked to active/approved projects)
CREATE POLICY "Public read nb_special_terms" ON nb_special_terms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read nb_project_updates" ON nb_project_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read nb_project_reports" ON nb_project_reports FOR SELECT TO anon, authenticated USING (true);

-- Leads: authenticated users can insert
CREATE POLICY "Authenticated insert nb_leads" ON nb_leads FOR INSERT TO authenticated WITH CHECK (true);
-- Leads: admin can read all
CREATE POLICY "Admin read all nb_leads" ON nb_leads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
-- Leads: developers can read own leads
CREATE POLICY "Developer read own nb_leads" ON nb_leads FOR SELECT TO authenticated USING (
  developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid())
);

-- Promotions: public read active
CREATE POLICY "Public read active nb_promotions" ON nb_promotions FOR SELECT TO anon, authenticated USING (status = 'active');

-- Admin full access on all nb tables
CREATE POLICY "Admin manage nb_special_terms" ON nb_special_terms FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_project_updates" ON nb_project_updates FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_project_reports" ON nb_project_reports FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_leads" ON nb_leads FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage nb_promotions" ON nb_promotions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow anonymous users to insert leads (for non-logged-in visitors)
CREATE POLICY "Anon insert nb_leads" ON nb_leads FOR INSERT TO anon WITH CHECK (true);
