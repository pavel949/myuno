-- REVIEW CANDIDATE: owner-confirmed company; no production execution in tests.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.management_companies c JOIN public.management_company_members m ON m.company_id=c.id
 WHERE c.id='a74c57c1-214c-4405-95fe-be46bc14d224' AND c.is_active IS TRUE
 AND m.user_id='5cbbcd96-7a9b-4311-ae5f-80a114b27b12' AND m.is_active IS TRUE) THEN
 RAISE EXCEPTION 'confirmed_concierge_route_no_longer_active'; END IF;
 IF EXISTS(SELECT 1 FROM public.system_settings WHERE key='concierge_crm_route'
 AND value<>jsonb_build_object('company_id','a74c57c1-214c-4405-95fe-be46bc14d224','owner_user_id','5cbbcd96-7a9b-4311-ae5f-80a114b27b12')) THEN
 RAISE EXCEPTION 'existing_concierge_route_conflicts_review_required'; END IF;
END $$;
INSERT INTO public.system_settings(key,value) VALUES('concierge_crm_route',
 jsonb_build_object('company_id','a74c57c1-214c-4405-95fe-be46bc14d224','owner_user_id','5cbbcd96-7a9b-4311-ae5f-80a114b27b12'))
ON CONFLICT(key) DO NOTHING;
COMMIT;
