ALTER TABLE public.agent_deals
ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_agent_deals_is_vip
ON public.agent_deals (company_id, is_vip);

