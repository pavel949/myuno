-- Add lead management fields to consultation_requests
ALTER TABLE public.consultation_requests 
  ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS sla_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS contact_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_order_id uuid REFERENCES public.orders(id);

-- Create function to calculate SLA deadline based on request type
CREATE OR REPLACE FUNCTION public.calculate_sla_deadline(request_type text, created_at timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE request_type
    WHEN 'vacation_rental' THEN created_at + interval '2 hours'
    WHEN 'property_tour' THEN created_at + interval '4 hours'
    WHEN 'property_consultation' THEN created_at + interval '24 hours'
    WHEN 'investment_advice' THEN created_at + interval '48 hours'
    WHEN 'full_management' THEN created_at + interval '24 hours'
    ELSE created_at + interval '24 hours'
  END;
END;
$$;

-- Trigger to auto-set SLA deadline on insert
CREATE OR REPLACE FUNCTION public.set_lead_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.sla_deadline := public.calculate_sla_deadline(NEW.request_type, NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_sla_deadline_trigger ON public.consultation_requests;
CREATE TRIGGER set_sla_deadline_trigger
  BEFORE INSERT ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_sla_deadline();

-- Update existing records with SLA deadlines
UPDATE public.consultation_requests 
SET sla_deadline = public.calculate_sla_deadline(request_type, created_at)
WHERE sla_deadline IS NULL;

-- RLS policies for UNO Team
DROP POLICY IF EXISTS "uno_team_view_leads" ON public.consultation_requests;
CREATE POLICY "uno_team_view_leads" ON public.consultation_requests
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'uno_team') OR 
    public.has_role(auth.uid(), 'admin') OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "uno_team_update_leads" ON public.consultation_requests;
CREATE POLICY "uno_team_update_leads" ON public.consultation_requests
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'uno_team') OR 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'uno_team') OR 
    public.has_role(auth.uid(), 'admin')
  );