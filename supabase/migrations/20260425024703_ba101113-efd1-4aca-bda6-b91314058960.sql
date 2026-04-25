
-- 1. Columns on clearview_purchases
ALTER TABLE public.clearview_purchases
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS quota_remaining INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clearview_purchases_tier_check'
  ) THEN
    ALTER TABLE public.clearview_purchases
      ADD CONSTRAINT clearview_purchases_tier_check
      CHECK (tier IN ('single','bundle3','investor_pass'));
  END IF;
END $$;

ALTER TABLE public.clearview_purchases
  ALTER COLUMN project_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clearview_purchases_tier_user
  ON public.clearview_purchases(user_id, tier);

-- 2. Bundle-slot tracking table (must exist before functions reference it)
CREATE TABLE IF NOT EXISTS public.clearview_bundle_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.clearview_purchases(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_clearview_bundle_slots_project
  ON public.clearview_bundle_slots(project_id);

ALTER TABLE public.clearview_bundle_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own bundle slots" ON public.clearview_bundle_slots;
CREATE POLICY "Users view own bundle slots"
  ON public.clearview_bundle_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clearview_purchases p
      WHERE p.id = purchase_id
        AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "Admins manage bundle slots" ON public.clearview_bundle_slots;
CREATE POLICY "Admins manage bundle slots"
  ON public.clearview_bundle_slots FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Updated access-check function (now references bundle_slots table)
CREATE OR REPLACE FUNCTION public.user_has_clearview_access(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.clearview_purchases p
      WHERE p.user_id = auth.uid()
        AND p.valid_until > now()
        AND (
          (p.tier = 'single' AND p.project_id = _project_id)
          OR (p.tier = 'investor_pass')
          OR (
            p.tier = 'bundle3'
            AND EXISTS (
              SELECT 1 FROM public.clearview_bundle_slots s
              WHERE s.purchase_id = p.id
                AND s.project_id = _project_id
            )
          )
        )
    );
$$;

-- 4. Atomic bundle slot consumption
CREATE OR REPLACE FUNCTION public.consume_clearview_bundle_slot(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Already spent a slot on this project?
  IF EXISTS (
    SELECT 1
    FROM public.clearview_bundle_slots s
    JOIN public.clearview_purchases p ON p.id = s.purchase_id
    WHERE p.user_id = auth.uid()
      AND s.project_id = _project_id
      AND p.valid_until > now()
  ) THEN
    RETURN TRUE;
  END IF;

  -- Pick oldest active bundle row with remaining quota
  SELECT id INTO v_purchase_id
  FROM public.clearview_purchases
  WHERE user_id = auth.uid()
    AND tier = 'bundle3'
    AND valid_until > now()
    AND COALESCE(quota_remaining, 0) > 0
  ORDER BY created_at ASC
  FOR UPDATE
  LIMIT 1;

  IF v_purchase_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.clearview_bundle_slots (purchase_id, project_id)
  VALUES (v_purchase_id, _project_id);

  UPDATE public.clearview_purchases
  SET quota_remaining = COALESCE(quota_remaining, 0) - 1
  WHERE id = v_purchase_id;

  RETURN TRUE;
END;
$$;
