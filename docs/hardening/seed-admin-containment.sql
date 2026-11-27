-- Approved containment of the exact exposed test administrator only.
-- Never edit/replay the historical seed or alter managed auth tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles r
    JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role = 'admin'
      AND r.user_id <> 'a0000000-0000-0000-0000-000000000005'::uuid
      AND p.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Containment requires another active administrator';
  END IF;
END $$;

DELETE FROM public.user_roles
WHERE user_id = 'a0000000-0000-0000-0000-000000000005'::uuid
  AND role = 'admin';

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_exposed_seed_admin_denied
  CHECK (user_id <> 'a0000000-0000-0000-0000-000000000005'::uuid OR role <> 'admin');

COMMENT ON CONSTRAINT user_roles_exposed_seed_admin_denied ON public.user_roles
  IS 'The retired exposed test administrator cannot regain production administrator authority.';