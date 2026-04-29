ALTER TABLE public.mcc_automation_rules
  ADD COLUMN IF NOT EXISTS user_state_filter TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS landing_filter TEXT[] DEFAULT '{}';