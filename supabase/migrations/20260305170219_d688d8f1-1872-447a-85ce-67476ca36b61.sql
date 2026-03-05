
-- Owner report preferences stored per property for cron-based auto-delivery
CREATE TABLE IF NOT EXISTS public.owner_report_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  auto_send_enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly')),
  day_of_month integer NOT NULL DEFAULT 5,
  recipient_emails text,
  send_whatsapp boolean DEFAULT false,
  recipient_phone text,
  report_type text DEFAULT 'owner_statement',
  currency text DEFAULT 'THB',
  sections jsonb DEFAULT '{"income":true,"expenses":true,"netIncome":true,"occupancy":true,"bookings":true,"commission":true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, property_id)
);

ALTER TABLE public.owner_report_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their report preferences"
ON public.owner_report_preferences
FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
