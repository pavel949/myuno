
ALTER TABLE public.agent_deals 
ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;
