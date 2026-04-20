-- Add owner_type to profiles to explicitly distinguish owner kinds:
--   'self_managed' — owner who manages their own property directly
--   'mc_portal'    — owner added by a Management Company (read-only portal access)
--
-- Default is 'self_managed' so all existing owners retain current behavior.
-- MC activation (OwnerPortalSetupCard) will flip this to 'mc_portal'.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS owner_type text
    CHECK (owner_type IN ('self_managed', 'mc_portal'))
    DEFAULT 'self_managed';

-- Backfill: any profile that already has rows in owner_portal_settings → mc_portal
UPDATE public.profiles p
SET owner_type = 'mc_portal'
WHERE EXISTS (
  SELECT 1 FROM public.owner_portal_settings ops
  WHERE ops.owner_user_id = p.id
);

COMMENT ON COLUMN public.profiles.owner_type IS
  'Discriminates between self-managing owners (/owner dashboard) and MC-managed owners (/my-property portal). Set automatically by OwnerPortalSetupCard when an MC activates a portal.';
