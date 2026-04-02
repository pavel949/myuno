
-- Phase 6: Extend automation rules with structured trigger/action fields
ALTER TABLE public.mcc_automation_rules
  ADD COLUMN IF NOT EXISTS trigger_entity_type text,
  ADD COLUMN IF NOT EXISTS condition_field text,
  ADD COLUMN IF NOT EXISTS condition_operator text DEFAULT 'eq',
  ADD COLUMN IF NOT EXISTS condition_value text,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS action_config jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cooldown_hours integer DEFAULT 0;

-- Phase 3: Guest referral codes
CREATE TABLE IF NOT EXISTS public.guest_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_user_id uuid NOT NULL,
  booking_id uuid,
  referral_code text NOT NULL UNIQUE,
  discount_percent integer DEFAULT 10,
  max_uses integer DEFAULT 5,
  used_count integer DEFAULT 0,
  referred_user_ids uuid[] DEFAULT '{}',
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral codes"
  ON public.guest_referral_codes FOR SELECT TO authenticated
  USING (guest_user_id = auth.uid());

CREATE POLICY "Service role can manage referrals"
  ON public.guest_referral_codes FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_referral_codes_guest ON public.guest_referral_codes(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.guest_referral_codes(referral_code);
