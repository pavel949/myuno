
-- =============================================
-- 1. ENHANCE EXISTING REVIEWS TABLE
-- =============================================
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'auto_approved';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Backfill entity_type/entity_id from existing item_type/item_id
UPDATE public.reviews SET entity_type = item_type WHERE entity_type IS NULL AND item_type IS NOT NULL;
UPDATE public.reviews SET entity_id = item_id::uuid WHERE entity_id IS NULL AND item_id IS NOT NULL AND item_id ~ '^[0-9a-f-]{36}$';

CREATE INDEX IF NOT EXISTS idx_reviews_entity ON public.reviews(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.reviews(order_id);

-- Auto-moderate trigger
CREATE OR REPLACE FUNCTION public.auto_moderate_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 3 THEN
    NEW.moderation_status := 'pending';
    NEW.is_approved := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_moderate_review ON public.reviews;
CREATE TRIGGER trg_auto_moderate_review
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_moderate_review();

-- =============================================
-- 2. REFERRAL SYSTEM
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_balance NUMERIC NOT NULL DEFAULT 0;

CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_amount NUMERIC NOT NULL DEFAULT 200,
  reward_currency TEXT NOT NULL DEFAULT 'THB',
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  qualifying_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.user_referrals(referred_id);
CREATE UNIQUE INDEX idx_referrals_unique ON public.user_referrals(referrer_id, referred_id);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.user_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
  ON public.user_referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_id);

-- Generate referral code trigger
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(md5(random()::text) from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT OR UPDATE OF referral_code ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();

-- Generate codes for existing profiles
UPDATE public.profiles SET referral_code = upper(substring(md5(id::text || random()::text) from 1 for 6)) WHERE referral_code IS NULL;

-- =============================================
-- 3. ENHANCE USER_DOCUMENTS TABLE
-- =============================================
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS reminder_days INT[] DEFAULT '{30,14,7}';
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS country TEXT;
