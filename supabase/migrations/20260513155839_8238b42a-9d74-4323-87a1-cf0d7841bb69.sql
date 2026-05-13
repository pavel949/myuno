
-- Catalog of lead magnets
CREATE TABLE IF NOT EXISTS public.lead_magnets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  magnet_type text NOT NULL CHECK (magnet_type IN (
    'clearview_report','calculator_save','guide_pdf','area_report',
    'watchlist','prelaunch_alert','viewing_request','resale_weekly',
    'offmarket_access','market_report','newsletter','other'
  )),
  title_ru text NOT NULL,
  title_en text NOT NULL,
  description_ru text,
  description_en text,
  asset_url text,
  default_score integer NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_magnets ENABLE ROW LEVEL SECURITY;

-- Public can read active magnets (so frontend can render the CTA copy)
CREATE POLICY "Active magnets are publicly readable"
ON public.lead_magnets FOR SELECT
USING (is_active = true);

-- Admin/staff manage magnets (uses existing has_role helper)
CREATE POLICY "Admins manage magnets"
ON public.lead_magnets FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Submissions
CREATE TABLE IF NOT EXISTS public.lead_magnet_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  magnet_id uuid REFERENCES public.lead_magnets(id) ON DELETE SET NULL,
  magnet_slug text NOT NULL,
  context_type text,           -- 'project' | 'area' | 'resale' | 'global' | 'developer'
  context_slug text,           -- e.g. project slug, area slug
  context_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Contact
  full_name text,
  email text,
  phone text,
  whatsapp text,
  preferred_channel text CHECK (preferred_channel IN ('email','whatsapp','phone','telegram')),
  persona text,
  language text DEFAULT 'ru',
  -- Attribution
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referer text,
  landing_path text,
  user_id uuid,
  -- Workflow
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','enriched','contacted','qualified','converted','spam','archived')),
  crm_contact_id uuid,
  nb_lead_id uuid REFERENCES public.nb_leads(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magnet_submissions_magnet ON public.lead_magnet_submissions(magnet_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_magnet_submissions_context ON public.lead_magnet_submissions(context_type, context_slug);
CREATE INDEX IF NOT EXISTS idx_magnet_submissions_status ON public.lead_magnet_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_magnet_submissions_user ON public.lead_magnet_submissions(user_id);

ALTER TABLE public.lead_magnet_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authed) can submit
CREATE POLICY "Anyone can submit a magnet form"
ON public.lead_magnet_submissions FOR INSERT
WITH CHECK (true);

-- Authenticated users see their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.lead_magnet_submissions FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Admins/staff see and manage all
CREATE POLICY "Admins view all submissions"
ON public.lead_magnet_submissions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update submissions"
ON public.lead_magnet_submissions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER trg_lead_magnets_updated_at
BEFORE UPDATE ON public.lead_magnets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_lead_magnet_submissions_updated_at
BEFORE UPDATE ON public.lead_magnet_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
