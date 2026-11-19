-- Review candidate. Apply separately after inspecting the target policies,
-- checking existing consented transfers and testing the admin Inbox.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;

-- Require a completed operator transfer as well as developer identity.
-- This replaces the permissive developer SELECT policy, preserving admin access.
DROP POLICY IF EXISTS "Developer read own nb_leads" ON public.nb_leads;
CREATE POLICY "Developer read own nb_leads"
ON public.nb_leads FOR SELECT TO authenticated
USING (
  transferred_to_developer IS TRUE
  AND transferred_at IS NOT NULL
  AND developer_id IN (SELECT d.id FROM public.developers d WHERE d.user_id = (SELECT auth.uid()))
);

-- These operational fields may not be populated by a direct public insert.
CREATE POLICY "Newbuild lead transfers are operator controlled"
ON public.nb_leads AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (
  (transferred_to_developer IS NOT TRUE AND transferred_at IS NULL)
  OR (SELECT public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- The old HTTP trigger can point to an external-dispatch handler. Replace its
-- side effect with an internal, exact-ID notification without contact data.
ALTER TABLE public.nb_leads DISABLE TRIGGER trg_nb_lead_notify;

CREATE FUNCTION private.notify_admins_of_internal_newbuild_lead()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT DISTINCT r.user_id,
    'Новая заявка по новостройке',
    'Откройте заявку в myUNO',
    'lead',
    jsonb_build_object(
      'lead_id', NEW.id,
      'action_url', '/admin/inbox?source=nb_leads&request=' || NEW.id::text
    )
  FROM public.user_roles r
  WHERE r.role = 'admin'::public.app_role;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_admins_of_internal_newbuild_lead() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER notify_admins_of_internal_newbuild_lead
AFTER INSERT ON public.nb_leads
FOR EACH ROW EXECUTE FUNCTION private.notify_admins_of_internal_newbuild_lead();

COMMIT;
