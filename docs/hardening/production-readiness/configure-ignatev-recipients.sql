-- APPROVED TARGET, NOT EXECUTED. Owner confirmed Ignatev Estate Co., LTD for
-- all 24 currently active properties, including Show Property Phuket, 2026-11-15.
-- Operator-only data configuration, not a public RPC or an automatic migration.
-- Run after the reviewed migrations + recovery gate, inside one transaction:
-- SET LOCAL myuno.approved_recipient_property_ids = '<verified 24 UUID array>';
-- SET LOCAL myuno.approved_recipient_provider_id = '<verified existing provider UUID>';
-- This DO statement is atomic. Do not promote provider publication or grant roles.
DO $configure$
DECLARE
 ids uuid[]:=nullif(current_setting('myuno.approved_recipient_property_ids',true),'')::uuid[];
 provider uuid:=nullif(current_setting('myuno.approved_recipient_provider_id',true),'')::uuid;
 legal_name text:='Ignatev Estate Co., LTD';
 recipient uuid; matches integer; ready integer; visible_before uuid[]; visible_after uuid[];
BEGIN
 IF current_user IN ('anon','authenticated') THEN RAISE EXCEPTION 'operator_connection_required' USING ERRCODE='42501'; END IF;
 IF ids IS NULL OR cardinality(ids)<>24 OR provider IS NULL
  OR (SELECT count(DISTINCT x) FROM unnest(ids) x)<>24 THEN RAISE EXCEPTION 'approved_24_property_manifest_required'; END IF;
 IF has_table_privilege('authenticated','public.provider_org_links','INSERT')
  OR has_table_privilege('authenticated','public.provider_org_links','UPDATE')
  OR has_table_privilege('authenticated','public.provider_org_links','DELETE')
  OR has_table_privilege('authenticated','public.provider_org_links','TRUNCATE') THEN
  RAISE EXCEPTION 'recipient_binding_containment_required'; END IF;
 IF to_regprocedure('public.private_property_payment_recipient(uuid)') IS NULL THEN
  RAISE EXCEPTION 'checked_recipient_resolver_required'; END IF;
 PERFORM id FROM public.providers WHERE id=provider AND lower(btrim(name))='ignatev estate'
  AND coalesce(is_demo,false)=false FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'confirmed_existing_provider_required'; END IF;
 PERFORM id FROM public.properties WHERE id=ANY(ids) ORDER BY id FOR UPDATE;
 SELECT count(*) INTO ready FROM public.properties WHERE id=ANY(ids) AND is_active
  AND (provider_id IS NULL OR provider_id=provider);
 IF ready<>24 THEN RAISE EXCEPTION 'approved_property_context_changed'; END IF;
 IF EXISTS(SELECT 1 FROM public.properties WHERE provider_id=provider AND NOT(id=ANY(ids))) THEN
  RAISE EXCEPTION 'provider_binding_has_unapproved_properties'; END IF;
 SELECT array_agg(id ORDER BY id) INTO visible_before FROM public.public_property_catalog WHERE id=ANY(ids);
 PERFORM pg_advisory_xact_lock(hashtextextended('myuno:recipient:ignatevestatecoltd',0));
 SELECT count(*),min(id::text)::uuid INTO matches,recipient FROM public.orgs
 WHERE regexp_replace(lower(name),'[^a-z0-9]','','g')=regexp_replace(lower(legal_name),'[^a-z0-9]','','g');
 IF matches>1 THEN RAISE EXCEPTION 'recipient_organization_ambiguous'; END IF;
 IF matches=0 THEN
  INSERT INTO public.orgs(name,org_type,is_active,is_verified,metadata)
  VALUES(legal_name,'vendor',true,false,jsonb_build_object('configuration_source','owner_confirmed_2026_11_15','scope','approved_24_property_manifest')) RETURNING id INTO recipient;
 ELSE
  PERFORM id FROM public.orgs WHERE id=recipient AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'recipient_organization_inactive'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public.provider_org_links WHERE provider_id=provider AND org_id IS DISTINCT FROM recipient)
  OR (SELECT count(*) FROM public.provider_org_links WHERE provider_id=provider)>1 THEN
  RAISE EXCEPTION 'existing_recipient_binding_requires_review'; END IF;
 INSERT INTO public.provider_org_links(provider_id,org_id)
 SELECT provider,recipient WHERE NOT EXISTS(SELECT 1 FROM public.provider_org_links WHERE provider_id=provider);
 UPDATE public.properties SET provider_id=provider WHERE id=ANY(ids) AND provider_id IS DISTINCT FROM provider;
 SELECT count(*) INTO ready FROM public.properties p WHERE p.id=ANY(ids)
  AND public.private_property_payment_recipient(p.id)=recipient;
 IF ready<>24 THEN RAISE EXCEPTION 'recipient_configuration_postcondition_failed'; END IF;
 SELECT array_agg(id ORDER BY id) INTO visible_after FROM public.public_property_catalog WHERE id=ANY(ids);
 IF visible_after IS DISTINCT FROM visible_before THEN RAISE EXCEPTION 'public_catalogue_visibility_changed'; END IF;
END
$configure$;
