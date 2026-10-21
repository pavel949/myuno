-- Prevent duplicate active partner applications per user.
--
-- The vendor onboarding (VendorOnboarding / BecomePartnerPage) guards duplicates
-- with an application-level "7-day active application" check, but check-then-insert
-- is not atomic: two tabs or a double-tap can both pass the read and then both
-- INSERT, creating duplicate partner_applications (and the provider/org rows they
-- trigger). This adds the DB-level guarantee that there is at most one
-- pending/reviewing application per user.

-- 1. Resolve any pre-existing duplicates so the unique index can be created:
--    keep the most recent pending/reviewing application per user, demote the rest.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.partner_applications
  WHERE status IN ('pending', 'reviewing')
)
UPDATE public.partner_applications p
SET status = 'rejected'
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- 2. Enforce at most one active application per user going forward.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_partner_app_active_per_user
  ON public.partner_applications (user_id)
  WHERE status IN ('pending', 'reviewing');
