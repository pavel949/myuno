-- Add lead-to-deal conversion fields to consultation_requests
ALTER TABLE public.consultation_requests
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_deal_id UUID REFERENCES public.agent_deals(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.consultation_requests.converted_at IS 'When lead was converted to a deal';
COMMENT ON COLUMN public.consultation_requests.converted_deal_id IS 'agent_deals.id if lead was converted to a deal';
