-- Synthetic stand-ins for E2.6 sibling tables; isolated tests only, never production.
ALTER TABLE public.properties ALTER COLUMN id SET DEFAULT gen_random_uuid();
GRANT SELECT ON public.management_company_members TO authenticated;
ALTER TABLE public.properties ADD COLUMN title_en text, ADD COLUMN title_ru text, ADD COLUMN property_type text,
 ADD COLUMN listing_type text, ADD COLUMN is_active boolean DEFAULT true, ADD COLUMN approval_status text DEFAULT 'approved',
 ADD COLUMN deleted_at timestamptz, ADD COLUMN lock_code text, ADD COLUMN actual_owner_phone text, ADD COLUMN notes text;
GRANT INSERT ON public.properties TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.team_member_permissions,public.property_manager_assignments TO authenticated;
ALTER TABLE public.property_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY legacy_pma ON public.property_manager_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY legacy_tmp ON public.team_member_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY legacy_insert ON public.properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY public_view ON public.properties FOR SELECT TO authenticated USING (is_active AND approval_status='approved');
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['property_financials','property_payout_rules','property_accounting_policies','property_rate_seasons',
  'property_price_offers','property_documents','property_owners','property_activity_log','property_inquiries',
  'owner_portal_settings','owner_statement_approvals','inventory_listings','property_delegates'] LOOP
  EXECUTE format('CREATE TABLE public.%I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), property_id uuid NOT NULL, owner_id uuid)', t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['owner_invoices','owner_payouts','crm_tasks'] LOOP
  EXECUTE format('CREATE TABLE public.%I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid, property_id uuid)', t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['property_booking_status_history','booking_notifications_log'] LOOP
  EXECUTE format('CREATE TABLE public.%I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid)', t);
 END LOOP;
END $$;
ALTER TABLE public.property_delegates ADD COLUMN invited_by uuid;
CREATE TABLE public.property_checklist_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid);
CREATE TABLE public.ledger_accounts (id uuid PRIMARY KEY, management_company_id uuid);
CREATE TABLE public.ledger_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), debit_account_id uuid, credit_account_id uuid);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['property_financials','property_payout_rules','property_accounting_policies','property_rate_seasons',
  'property_price_offers','property_documents','property_owners','property_activity_log','property_inquiries',
  'owner_portal_settings','owner_statement_approvals','inventory_listings','property_delegates','owner_invoices','owner_payouts',
  'crm_tasks','property_booking_status_history','booking_notifications_log','property_checklist_templates','ledger_accounts','ledger_entries'] LOOP
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated; ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;
   CREATE POLICY legacy_broad ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t, t);
 END LOOP;
END $$;
CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name,'/') $$;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO authenticated;
GRANT SELECT ON storage.objects TO authenticated;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Mirrors the live broad member read policy.
CREATE POLICY member_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='mc-backups' AND (storage.foldername(name))[1] IN
 (SELECT company_id::text FROM public.management_company_members WHERE user_id=auth.uid() AND is_active));
CREATE POLICY other_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id<>'mc-backups');
-- E2.5 continuation stand-ins.
ALTER TABLE public.property_delegates ADD COLUMN user_id uuid, ADD COLUMN role text, ADD COLUMN permissions jsonb,
 ADD COLUMN invited_email text, ADD COLUMN status text DEFAULT 'pending', ADD COLUMN expires_at timestamptz, ADD COLUMN accepted_at timestamptz;
CREATE FUNCTION public.has_role(actor uuid, r text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS
 $$ SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=actor AND role=r) $$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,text) TO authenticated;
