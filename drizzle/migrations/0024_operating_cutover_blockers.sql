-- E2.6 cutover-blocker ceilings. Conditional on operating_spaces_enforced; no activation, seed or data change.
-- Space-limited actor: member (or uno_team) of an enforced company who is not a company overseer.
CREATE FUNCTION public.actor_is_space_limited(p_company_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE enforced boolean; actor uuid:=auth.uid();
BEGIN
 IF p_company_id IS NULL THEN RETURN false; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF enforced IS NOT TRUE THEN RETURN false; END IF;
 IF public.actor_is_operating_company_overseer(p_company_id) THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=actor)
  OR EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=actor AND r.role='uno_team');
END $$;
-- Row ceiling for rows with optional property and optional company. Null property in an enforced
-- company is ambiguous: fail closed for space-limited actors (classification 3).
CREATE FUNCTION public.actor_company_property_ceiling(p_company_id uuid, p_property_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_property_id IS NOT NULL THEN
   IF NOT public.actor_private_property_ceiling(p_property_id) THEN RETURN false; END IF;
   -- A row naming a company different from its property's company is never consistent.
   RETURN p_company_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.properties p WHERE p.id=p_property_id
     AND p.management_company_id IS NOT NULL AND p.management_company_id<>p_company_id);
 END IF;
 RETURN NOT public.actor_is_space_limited(p_company_id);
END $$;
CREATE FUNCTION public.actor_booking_ceiling(p_booking_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE((SELECT public.actor_private_property_ceiling(b.property_id) FROM public.property_bookings b WHERE b.id=p_booking_id), false)
$$;
-- Ledger has no deterministic property linkage: company-level, denied to space-limited actors.
CREATE FUNCTION public.actor_ledger_account_ceiling(p_account_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE((SELECT NOT public.actor_is_space_limited(a.management_company_id) FROM public.ledger_accounts a WHERE a.id=p_account_id), true)
$$;
-- Assignment/delegation governance: enforced company grants only by overseers; independent owners unaffected.
CREATE FUNCTION public.actor_can_govern_property_access(p_property_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid; enforced boolean; actor uuid:=auth.uid();
BEGIN
 SELECT p.management_company_id,c.operating_spaces_enforced INTO company,enforced
 FROM public.properties p LEFT JOIN public.management_companies c ON c.id=p.management_company_id WHERE p.id=p_property_id;
 IF NOT FOUND THEN RETURN false; END IF;
 IF enforced IS NOT TRUE THEN RETURN true; END IF;
 IF public.actor_is_operating_company_overseer(company) THEN RETURN true; END IF;
 RETURN NOT public.actor_is_space_limited(company)
   AND EXISTS(SELECT 1 FROM public.properties p WHERE p.id=p_property_id AND p.owner_id=actor);
END $$;

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['property_financials','property_payout_rules','property_accounting_policies','property_rate_seasons',
  'property_price_offers','property_documents','property_owners','property_activity_log','property_inquiries',
  'owner_portal_settings','owner_statement_approvals','inventory_listings','property_delegates','property_manager_assignments'] LOOP
  EXECUTE format('CREATE POLICY operating_space_property_ceiling ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
    USING (public.actor_private_property_ceiling(property_id)) WITH CHECK (public.actor_private_property_ceiling(property_id))', t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['owner_invoices','owner_payouts','crm_tasks'] LOOP
  EXECUTE format('CREATE POLICY operating_space_property_ceiling ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
    USING (public.actor_company_property_ceiling(company_id, property_id)) WITH CHECK (public.actor_company_property_ceiling(company_id, property_id))', t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['property_booking_status_history','booking_notifications_log'] LOOP
  EXECUTE format('CREATE POLICY operating_space_booking_ceiling ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
    USING (public.actor_booking_ceiling(booking_id)) WITH CHECK (public.actor_booking_ceiling(booking_id))', t);
 END LOOP;
END $$;
CREATE POLICY operating_space_company_ceiling ON public.ledger_accounts AS RESTRICTIVE FOR ALL TO authenticated
 USING (NOT public.actor_is_space_limited(management_company_id)) WITH CHECK (NOT public.actor_is_space_limited(management_company_id));
CREATE POLICY operating_space_company_ceiling ON public.ledger_entries AS RESTRICTIVE FOR ALL TO authenticated
 USING (public.actor_ledger_account_ceiling(debit_account_id) AND public.actor_ledger_account_ceiling(credit_account_id))
 WITH CHECK (public.actor_ledger_account_ceiling(debit_account_id) AND public.actor_ledger_account_ceiling(credit_account_id));
-- Company-global templates: unchanged read, writes by overseers only when enforced.
CREATE POLICY operating_space_template_write_ceiling ON public.property_checklist_templates AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (NOT public.actor_is_space_limited(company_id));
CREATE POLICY operating_space_template_update_ceiling ON public.property_checklist_templates AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (NOT public.actor_is_space_limited(company_id)) WITH CHECK (NOT public.actor_is_space_limited(company_id));
CREATE POLICY operating_space_template_delete_ceiling ON public.property_checklist_templates AS RESTRICTIVE FOR DELETE TO authenticated
 USING (NOT public.actor_is_space_limited(company_id));
-- Governance ceilings (writes only).
CREATE POLICY operating_space_assignment_insert ON public.property_manager_assignments AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (public.actor_can_govern_property_access(property_id));
CREATE POLICY operating_space_assignment_update ON public.property_manager_assignments AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (public.actor_can_govern_property_access(property_id)) WITH CHECK (public.actor_can_govern_property_access(property_id));
CREATE POLICY operating_space_assignment_delete ON public.property_manager_assignments AS RESTRICTIVE FOR DELETE TO authenticated
 USING (public.actor_can_govern_property_access(property_id));
CREATE POLICY operating_space_delegate_insert ON public.property_delegates AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (public.actor_can_govern_property_access(property_id));
CREATE POLICY operating_space_delegate_delete ON public.property_delegates AS RESTRICTIVE FOR DELETE TO authenticated
 USING (public.actor_can_govern_property_access(property_id));
CREATE POLICY operating_space_permission_write ON public.team_member_permissions AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (NOT public.actor_is_space_limited(company_id));
CREATE POLICY operating_space_permission_update ON public.team_member_permissions AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (NOT public.actor_is_space_limited(company_id)) WITH CHECK (NOT public.actor_is_space_limited(company_id));
CREATE POLICY operating_space_permission_delete ON public.team_member_permissions AS RESTRICTIVE FOR DELETE TO authenticated
 USING (NOT public.actor_is_space_limited(company_id));
-- Direct managed-property INSERT into an enforced company must use the checked RPC.
CREATE POLICY operating_space_property_insert_ceiling ON public.properties AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (management_company_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.management_companies c
   WHERE c.id=management_company_id AND c.operating_spaces_enforced IS TRUE));
-- Company-wide backups: enforced companies restrict reads/writes to overseers. Other buckets unaffected.
CREATE FUNCTION public.actor_can_read_company_backup(p_folder text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid;
BEGIN
 BEGIN company := p_folder::uuid; EXCEPTION WHEN others THEN RETURN false; END;
 RETURN NOT EXISTS(SELECT 1 FROM public.management_companies c WHERE c.id=company AND c.operating_spaces_enforced IS TRUE)
   OR public.actor_is_operating_company_overseer(company);
END $$;
CREATE POLICY operating_space_backup_ceiling ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
 USING (bucket_id <> 'mc-backups' OR public.actor_can_read_company_backup((storage.foldername(name))[1]))
 WITH CHECK (bucket_id <> 'mc-backups' OR public.actor_can_read_company_backup((storage.foldername(name))[1]));

-- Audited assignment history (covers RPC and direct overseer writes).
CREATE TABLE public.operating_space_assignment_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL, management_company_id uuid NOT NULL,
 from_space_id uuid, to_space_id uuid, actor_id uuid, reason text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.operating_space_assignment_audit TO authenticated;
GRANT ALL ON public.operating_space_assignment_audit TO service_role;
ALTER TABLE public.operating_space_assignment_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY overseers_read_assignment_audit ON public.operating_space_assignment_audit FOR SELECT TO authenticated
 USING (public.actor_is_operating_company_overseer(management_company_id));
CREATE FUNCTION public.audit_operating_space_assignment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.operating_space_assignment_audit(property_id,management_company_id,from_space_id,to_space_id,actor_id,reason)
 VALUES (COALESCE(NEW.property_id,OLD.property_id),COALESCE(NEW.management_company_id,OLD.management_company_id),
  CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.operating_space_id END,
  CASE WHEN TG_OP='DELETE' THEN NULL ELSE NEW.operating_space_id END,
  auth.uid(), nullif(current_setting('myuno.assignment_reason',true),''));
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER audit_operating_space_assignment AFTER INSERT OR UPDATE OR DELETE ON public.operating_space_properties
 FOR EACH ROW EXECUTE FUNCTION public.audit_operating_space_assignment();

-- Checked onboarding: actor-bound, permission-checked, atomic property + space assignment.
CREATE FUNCTION public.create_managed_property_checked(p_company_id uuid, p_operating_space_id uuid,
 p_title_en text, p_title_ru text, p_property_type text, p_listing_type text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); enforced boolean; new_id uuid;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 SELECT operating_spaces_enforced INTO enforced FROM public.management_companies WHERE id=p_company_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'company not found' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.management_company_members m WHERE m.company_id=p_company_id AND m.user_id=actor
   AND m.is_active IS TRUE AND m.role IN ('director','admin','manager'))
   AND NOT public.actor_is_operating_company_overseer(p_company_id) THEN
   RAISE EXCEPTION 'company authority required' USING ERRCODE='42501'; END IF;
 IF NOT public.mc_can_access(actor,p_company_id,'properties','edit') THEN RAISE EXCEPTION 'properties edit permission required' USING ERRCODE='42501'; END IF;
 IF enforced IS TRUE THEN
   -- Contract: a space is always required in enforced companies, overseers included (no unassigned onboarding).
   IF p_operating_space_id IS NULL THEN RAISE EXCEPTION 'operating space required' USING ERRCODE='22023'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.operating_spaces s WHERE s.id=p_operating_space_id AND s.management_company_id=p_company_id AND s.is_active)
     OR NOT public.actor_can_access_operating_space(p_operating_space_id) THEN
     RAISE EXCEPTION 'operating space not authorized' USING ERRCODE='42501'; END IF;
 ELSIF p_operating_space_id IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM public.operating_spaces s WHERE s.id=p_operating_space_id AND s.management_company_id=p_company_id)
     OR NOT public.actor_is_operating_company_overseer(p_company_id) THEN
     RAISE EXCEPTION 'operating space not authorized' USING ERRCODE='42501'; END IF;
 END IF;
 INSERT INTO public.properties(title_en,title_ru,property_type,listing_type,management_company_id,is_active)
 VALUES (p_title_en,p_title_ru,p_property_type,p_listing_type,p_company_id,false) RETURNING id INTO new_id;
 IF p_operating_space_id IS NOT NULL THEN
   PERFORM set_config('myuno.assignment_reason','onboarding',true);
   INSERT INTO public.operating_space_properties(operating_space_id,property_id,management_company_id)
   VALUES (p_operating_space_id,new_id,p_company_id);
 END IF;
 RETURN new_id;
END $$;
CREATE FUNCTION public.reassign_property_operating_space(p_property_id uuid, p_to_space_id uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE company uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF coalesce(btrim(p_reason),'')='' THEN RAISE EXCEPTION 'reason required' USING ERRCODE='22023'; END IF;
 SELECT management_company_id INTO company FROM public.properties WHERE id=p_property_id;
 IF company IS NULL OR NOT public.actor_is_operating_company_overseer(company) THEN
   RAISE EXCEPTION 'company overseer required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.operating_spaces s WHERE s.id=p_to_space_id AND s.management_company_id=company AND s.is_active) THEN
   RAISE EXCEPTION 'target space not in company' USING ERRCODE='42501'; END IF;
 PERFORM set_config('myuno.assignment_reason',p_reason,true);
 INSERT INTO public.operating_space_properties(operating_space_id,property_id,management_company_id)
 VALUES (p_to_space_id,p_property_id,company)
 ON CONFLICT (property_id) DO UPDATE SET operating_space_id=EXCLUDED.operating_space_id;
END $$;

-- Public marketing projection (additive; base-table access unchanged until consumers migrate).
CREATE VIEW public.public_property_catalog WITH (security_barrier=true) AS
SELECT id,location_id,project_id,complex_id,title_en,title_ru,title,description_en,description_ru,property_type,listing_type,
 listing_modes,price,price_period,price_per_night,currency,sale_price,sale_currency,is_for_sale,bedrooms,bathrooms,rooms,beds,
 area_sqm,plot_size_sqm,max_guests,amenities,highlights,images,cover_image,video_url,lat,lng,district,building_name,
 view_type,furnishing_level,floor,total_floors,pool_type,pool_size,garden_type,has_elevator,parking_spaces,parking_type,
 pets_allowed,children_friendly,smoking_policy,parties_allowed,check_in_time,check_out_time,min_stay_nights,
 instant_booking,house_rules,house_rules_ru,cancellation_policy,host_languages,nearby_places,is_featured,is_verified,
 rating,review_count,available_from,created_at,updated_at
FROM public.properties
WHERE is_active IS TRUE AND approval_status='approved' AND deleted_at IS NULL;
GRANT SELECT ON public.public_property_catalog TO anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.actor_is_space_limited(uuid),public.actor_company_property_ceiling(uuid,uuid),
 public.actor_booking_ceiling(uuid),public.actor_ledger_account_ceiling(uuid),public.actor_can_govern_property_access(uuid),
 public.actor_can_read_company_backup(text),public.create_managed_property_checked(uuid,uuid,text,text,text,text),
 public.reassign_property_operating_space(uuid,uuid,text),public.audit_operating_space_assignment() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.audit_operating_space_assignment() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.actor_is_space_limited(uuid),public.actor_company_property_ceiling(uuid,uuid),
 public.actor_booking_ceiling(uuid),public.actor_ledger_account_ceiling(uuid),public.actor_can_govern_property_access(uuid),
 public.actor_can_read_company_backup(text),public.create_managed_property_checked(uuid,uuid,text,text,text,text),
 public.reassign_property_operating_space(uuid,uuid,text) TO authenticated,service_role;
