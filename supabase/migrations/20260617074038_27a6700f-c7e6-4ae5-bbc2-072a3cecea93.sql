
-- =============================================================
-- Security hardening: lock down PII / financial column exposure
-- and restrict overly-permissive public read policies.
-- =============================================================

-- 1) properties: revoke sensitive columns from anon (public catalog
--    visitors). Authenticated users keep access; their RLS policies
--    further restrict to their own rows (owner/provider/MC/admin).
DO $$
DECLARE
  c text;
  sensitive_cols text[] := ARRAY[
    'lock_code','ical_token',
    'actual_owner_email','actual_owner_phone','actual_owner_name',
    'owner_email','owner_phone','owner_name',
    'chanote_number','purchase_price','mortgage_amount','mortgage_bank',
    'electricity_meter_id','water_meter_id',
    'bank_account','bank_name','swift_code','tax_id'
  ];
BEGIN
  FOREACH c IN ARRAY sensitive_cols LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='properties' AND column_name=c
    ) THEN
      EXECUTE format('REVOKE SELECT (%I) ON public.properties FROM anon', c);
    END IF;
  END LOOP;
END$$;

-- 2) management_companies: revoke financial / legal identifiers from anon.
DO $$
DECLARE
  c text;
  sensitive_cols text[] := ARRAY[
    'bank_account','bank_name','swift_code','iban',
    'stripe_customer_id','stripe_subscription_id','stripe_account_id',
    'tax_id','registration_number','legal_address',
    'director_email','director_phone','director_name',
    'contact_email_private','contact_phone_private'
  ];
BEGIN
  FOREACH c IN ARRAY sensitive_cols LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='management_companies' AND column_name=c
    ) THEN
      EXECUTE format('REVOKE SELECT (%I) ON public.management_companies FROM anon', c);
    END IF;
  END LOOP;
END$$;

-- 3) transfer_operators: replace the public "is_active = true" SELECT
--    policy with one that requires authentication. Anonymous visitors
--    no longer see internal dispatch staff phones / shift schedules.
DROP POLICY IF EXISTS "Anyone can read active operators basic info" ON public.transfer_operators;
CREATE POLICY "Authenticated can read active operators"
  ON public.transfer_operators
  FOR SELECT
  TO authenticated
  USING (is_active = true);
REVOKE SELECT ON public.transfer_operators FROM anon;

-- 4) realtime_stats: lock down live business revenue / order / user
--    metrics to admin / uno_team only. Realtime subscribers without
--    those roles will no longer receive updates.
DROP POLICY IF EXISTS "realtime_select" ON public.realtime_stats;
CREATE POLICY "Admins can view realtime stats"
  ON public.realtime_stats
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
  );
REVOKE SELECT ON public.realtime_stats FROM anon;
