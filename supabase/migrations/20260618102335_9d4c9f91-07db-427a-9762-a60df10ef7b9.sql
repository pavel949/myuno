
CREATE TABLE public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  topic text NOT NULL CHECK (topic IN ('visa','invest','business','relocation','property','legal','finance','general')),
  subject text,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 5000),
  urgency text NOT NULL DEFAULT 'normal' CHECK (urgency IN ('low','normal','high','urgent')),
  contact_email text,
  contact_phone text,
  preferred_channel text NOT NULL DEFAULT 'in_app' CHECK (preferred_channel IN ('in_app','whatsapp','email','phone')),
  language text NOT NULL DEFAULT 'ru' CHECK (language IN ('ru','en','th')),
  source_page text,
  source_route text,
  referral_code text,
  vendor_id uuid,
  listing_id uuid,
  source_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaged','in_progress','waiting_user','closed','spam')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  crm_contact_id uuid,
  crm_task_id uuid,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_help_requests_user ON public.help_requests(user_id);
CREATE INDEX idx_help_requests_topic_status ON public.help_requests(topic, status);
CREATE INDEX idx_help_requests_created ON public.help_requests(created_at DESC);
CREATE INDEX idx_help_requests_assigned ON public.help_requests(assigned_to) WHERE assigned_to IS NOT NULL;

GRANT SELECT, INSERT ON public.help_requests TO authenticated;
GRANT INSERT ON public.help_requests TO anon;
GRANT ALL ON public.help_requests TO service_role;

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create help requests"
  ON public.help_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own help requests"
  ON public.help_requests FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Staff can view all help requests"
  ON public.help_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'support')
    OR public.has_role(auth.uid(), 'uno_team')
  );

CREATE POLICY "Staff can update help requests"
  ON public.help_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'support')
    OR public.has_role(auth.uid(), 'uno_team')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'support')
    OR public.has_role(auth.uid(), 'uno_team')
  );

CREATE TRIGGER trg_help_requests_updated_at
  BEFORE UPDATE ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.v_public_movers AS
SELECT
  id,
  business_name,
  business_name_ru,
  district,
  city,
  website,
  COALESCE(source_data->'specialties', '[]'::jsonb) AS specialties,
  COALESCE(source_data->'languages', '[]'::jsonb) AS languages,
  COALESCE(source_data->'service_areas', '[]'::jsonb) AS service_areas,
  COALESCE((source_data->>'verified')::boolean, false) AS verified,
  status,
  ai_priority,
  created_at
FROM public.vendor_prospects
WHERE category = 'relocation-services'
  AND status IN ('prospect','contacted','active');

GRANT SELECT ON public.v_public_movers TO anon, authenticated;
