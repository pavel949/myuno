-- E2.5 continuation: legacy-mode bypasses proven against the live catalog. No enforcement, seed or data change.
-- 1) Invite acceptance may only accept; it cannot rewrite scope, role, permissions or inviter.
CREATE FUNCTION public.guard_property_delegate_update() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL OR current_user IN ('postgres','service_role','supabase_admin') THEN RETURN NEW; END IF;
 IF OLD.invited_by=actor OR public.has_role(actor,'admin')
   OR EXISTS(SELECT 1 FROM public.properties p WHERE p.id=OLD.property_id AND p.owner_id=actor) THEN RETURN NEW; END IF;
 IF NEW.property_id IS DISTINCT FROM OLD.property_id OR NEW.role IS DISTINCT FROM OLD.role
   OR NEW.permissions IS DISTINCT FROM OLD.permissions OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
   OR NEW.invited_email IS DISTINCT FROM OLD.invited_email OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
   OR (NEW.user_id IS DISTINCT FROM OLD.user_id AND NEW.user_id IS DISTINCT FROM actor)
   OR NEW.status NOT IN ('pending','active','accepted','declined') THEN
   RAISE EXCEPTION 'delegate may only accept or decline an invitation' USING ERRCODE='42501';
 END IF;
 IF OLD.expires_at IS NOT NULL AND OLD.expires_at < now() AND NEW.status IN ('active','accepted') THEN
   RAISE EXCEPTION 'invitation expired' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_property_delegate_update BEFORE UPDATE ON public.property_delegates
 FOR EACH ROW EXECUTE FUNCTION public.guard_property_delegate_update();
-- 2) Placing a property into a management company requires authority in that company.
CREATE FUNCTION public.actor_can_place_property_in_company(p_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p_company_id IS NULL OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.management_company_members m
  WHERE m.company_id=p_company_id AND m.user_id=auth.uid() AND m.is_active IS TRUE AND m.role IN ('director','admin','manager'))
$$;
CREATE POLICY company_placement_insert_ceiling ON public.properties AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (public.actor_can_place_property_in_company(management_company_id));
CREATE FUNCTION public.guard_property_company_change() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR current_user IN ('postgres','service_role','supabase_admin') THEN RETURN NEW; END IF;
 IF NEW.management_company_id IS DISTINCT FROM OLD.management_company_id THEN
   IF NOT ((NEW.management_company_id IS NULL OR public.actor_is_operating_company_overseer(NEW.management_company_id))
     AND (OLD.management_company_id IS NULL OR public.actor_is_operating_company_overseer(OLD.management_company_id))) THEN
     RAISE EXCEPTION 'company reassignment requires director/admin authority in both companies' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_property_company_change BEFORE UPDATE OF management_company_id ON public.properties
 FOR EACH ROW EXECUTE FUNCTION public.guard_property_company_change();
REVOKE ALL ON FUNCTION public.guard_property_delegate_update(),public.guard_property_company_change() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.actor_can_place_property_in_company(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.actor_can_place_property_in_company(uuid) TO authenticated,service_role;
