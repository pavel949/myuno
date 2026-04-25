-- referral_codes extensions
ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS booking_id uuid,
  ADD COLUMN IF NOT EXISTS guest_user_id uuid,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS discount_percent int4,
  ADD COLUMN IF NOT EXISTS max_uses int4 DEFAULT 1,
  ADD COLUMN IF NOT EXISTS uses_count int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'guest';

CREATE INDEX IF NOT EXISTS idx_referral_codes_booking ON public.referral_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_referral_code ON public.referral_codes(referral_code);

-- ai_task_suggestions extensions
ALTER TABLE public.ai_task_suggestions
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS impact_score int4,
  ADD COLUMN IF NOT EXISTS target_entity_type text,
  ADD COLUMN IF NOT EXISTS target_entity_id uuid,
  ADD COLUMN IF NOT EXISTS source_agent text;

-- Make `kind` nullable since older code uses different shape
ALTER TABLE public.ai_task_suggestions ALTER COLUMN kind DROP NOT NULL;

-- owner_prospects extensions
ALTER TABLE public.owner_prospects
  ADD COLUMN IF NOT EXISTS nurture_stage text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS nurture_count int4 NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_score numeric,
  ADD COLUMN IF NOT EXISTS template_used text,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_op_nurture_stage ON public.owner_prospects(nurture_stage);

-- social_posts extensions
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- ai_decisions_log extensions
ALTER TABLE public.ai_decisions_log
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS user_id uuid;