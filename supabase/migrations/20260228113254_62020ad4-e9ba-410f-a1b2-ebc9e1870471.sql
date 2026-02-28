
-- Create property_payout_rules table
CREATE TABLE public.property_payout_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  management_terms_id UUID REFERENCES public.property_management_terms(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL DEFAULT 'coagent',
  recipient_staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL,
  recipient_name TEXT,
  commission_type TEXT NOT NULL DEFAULT 'percent_net',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  deduct_before_owner BOOLEAN NOT NULL DEFAULT false,
  min_payout NUMERIC,
  payout_frequency TEXT NOT NULL DEFAULT 'monthly',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger
CREATE TRIGGER set_updated_at_property_payout_rules
  BEFORE UPDATE ON public.property_payout_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.property_payout_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payout rules for their properties"
  ON public.property_payout_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_payout_rules.property_id
      AND (
        p.owner_id = auth.uid()
        OR public.is_mc_member_for_property(p.id, auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.property_manager_assignments pma
          WHERE pma.property_id = p.id AND pma.manager_user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_payout_rules.property_id
      AND (
        p.owner_id = auth.uid()
        OR public.is_mc_member_for_property(p.id, auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.property_manager_assignments pma
          WHERE pma.property_id = p.id AND pma.manager_user_id = auth.uid()
        )
      )
    )
  );

-- Indexes
CREATE INDEX idx_payout_rules_property ON public.property_payout_rules(property_id);
CREATE INDEX idx_payout_rules_terms ON public.property_payout_rules(management_terms_id);
