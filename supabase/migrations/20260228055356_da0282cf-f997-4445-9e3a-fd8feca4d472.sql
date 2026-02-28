
-- Add subscription columns to management_companies
ALTER TABLE public.management_companies
  ADD COLUMN IF NOT EXISTS paid_slots integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create mc_property_slots table
CREATE TABLE public.mc_property_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.management_companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  activated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mc_property_slots_property_unique UNIQUE (property_id)
);

CREATE INDEX idx_mc_property_slots_company ON public.mc_property_slots(company_id);
CREATE INDEX idx_mc_property_slots_active ON public.mc_property_slots(company_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.mc_property_slots ENABLE ROW LEVEL SECURITY;

-- RLS: MC members can view their company's slots
CREATE POLICY "MC members can view slots"
  ON public.mc_property_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = mc_property_slots.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
    )
  );

-- RLS: Only directors/managers can manage slots
CREATE POLICY "MC directors can manage slots"
  ON public.mc_property_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.management_company_members mcm
      WHERE mcm.company_id = mc_property_slots.company_id
        AND mcm.user_id = auth.uid()
        AND mcm.is_active = true
        AND mcm.role IN ('director', 'manager')
    )
  );
