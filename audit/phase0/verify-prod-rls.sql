-- ============================================================================
-- Sprint 1 · Phase 0 · PROD RLS VERIFICATION  (READ-ONLY — safe to run on prod)
-- Run this in the Lovable Cloud SQL editor against the PRODUCTION project
-- kakkwibljrjsawxgnupk. It writes nothing. Paste the four result sets back.
-- ============================================================================

-- 0) Confirm you are on PROD, not the mirror/dev.
SELECT current_database(),
       current_setting('server_version'),
       (SELECT count(*) FROM information_schema.tables WHERE table_schema='public') AS public_tables;

-- 1) THE key check (audit HIGH-1): any permissive USING(true)/null SELECT or ALL
--    policy still live on a sensitive table means the pre-hardening open policy
--    survived the exception-swallowing DROPs.
WITH sensitive(t) AS (VALUES
 ('profiles'),('orders'),('payment_intents'),('ledger_entries'),('vendor_payouts'),
 ('leads'),('consultation_requests'),('crm_contacts'),('contact_identities'),
 ('contact_identity_links'),('providers'),('buyers'),('owner_prospects'),
 ('vendor_prospects'),('pipeline_stage_history'),('founder_daily_brief'),
 ('reconciliation_alerts'),('thai_chats'),('thai_chat_messages'),('agent_deals'),
 ('capital_contacts'),('capital_pipeline'),('capital_projects'),('capital_campaigns'),
 ('capital_outreach'),('investment_deals'),('investor_inquiries'),('project_documents'))
SELECT p.tablename, p.policyname, p.cmd, p.roles::text,
       COALESCE(p.qual,'(none)') AS using_expr,
       COALESCE(p.with_check,'(none)') AS check_expr
FROM pg_policies p
JOIN sensitive s ON s.t = p.tablename
WHERE p.schemaname='public'
  AND (p.qual = 'true' OR p.qual IS NULL)
  AND p.cmd IN ('SELECT','ALL')
ORDER BY p.tablename, p.policyname;
-- EXPECT: zero rows. Any row = a live permissive policy on sensitive data → FIX.

-- 2) RLS actually enabled on every sensitive/Tier-3 table (a disabled table has
--    no protection regardless of policies).
WITH sensitive(t) AS (VALUES
 ('profiles'),('crm_contacts'),('contact_identities'),('capital_contacts'),
 ('capital_pipeline'),('capital_projects'),('capital_campaigns'),('capital_outreach'),
 ('investment_deals'),('investor_inquiries'),('agent_deals'),('project_documents'),
 ('orders'),('payment_intents'),('ledger_entries'),('vendor_payouts'))
SELECT s.t AS table_name,
       (c.oid IS NOT NULL) AS exists,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=s.t) AS n_policies
FROM sensitive s
LEFT JOIN pg_class c ON c.relname=s.t
  AND c.relnamespace=(SELECT oid FROM pg_namespace WHERE nspname='public')
ORDER BY s.t;
-- EXPECT: exists=true AND rls_enabled=true for all. Any exists=true/rls_enabled=false = FIX.

-- 3) Full policy dump for the Tier-3 surface — so we can see exactly what gates
--    private deal data and documents.
SELECT tablename, policyname, cmd, roles::text,
       COALESCE(qual,'(none)') AS using_expr,
       COALESCE(with_check,'(none)') AS check_expr
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('investment_deals','investor_inquiries',
                    'capital_contacts','capital_pipeline','capital_projects',
                    'capital_campaigns','capital_outreach','project_documents')
ORDER BY tablename, cmd, policyname;

-- 4) Storage bucket publicity + object policies for deal/KYC/document buckets.
--    A public bucket makes documents_urls reachable regardless of table RLS.
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('project-documents','developer-documents','kyc-documents',
             'owner-vault','deposit-vault','crm-documents','signatures');
-- EXPECT: public=false for anything holding deal/KYC/owner documents.

SELECT policyname, cmd, roles::text, COALESCE(qual,'(none)') AS using_expr
FROM pg_policies
WHERE schemaname='storage' AND tablename='objects'
ORDER BY policyname;

-- 5) Column-level SELECT grants on investment_deals for anon/authenticated.
--    The base-table policy `USING (is_published=true)` has no column restriction,
--    so any role with a table-wide SELECT grant can read PRIVATE columns of
--    published rows (documents_urls, submitter_email, *_private, admin_notes,
--    platform_fee_*). Later migrations restricted `anon`; confirm `authenticated`
--    is ALSO restricted (or that no table-wide grant exists).
SELECT grantee, string_agg(column_name, ', ' ORDER BY column_name) AS granted_columns
FROM information_schema.column_privileges
WHERE table_schema='public' AND table_name='investment_deals'
  AND privilege_type='SELECT' AND grantee IN ('anon','authenticated')
GROUP BY grantee;
-- RED FLAG if `authenticated` (or `anon`) lists documents_urls / submitter_email /
-- title_private / description_private / admin_notes / platform_fee_estimate_usd.

-- 6) Who currently reaches /capital via a SELF-ASSIGNED investor persona?
--    Pre-hardening, InvestorGuard let anyone with this persona in. After the
--    guard fix they lose UI access unless granted a real role. Use this to (a)
--    size who to grant a legit role to, and (b) gauge who *could* have poked at
--    the surface. Cross-check against user_roles to see who has NO server role.
SELECT up.user_id,
       (SELECT count(*) FROM public.user_roles ur
         WHERE ur.user_id = up.user_id
           AND ur.role IN ('investor','capital_team','uno_team','admin')) AS has_privileged_role
FROM public.user_personas up
WHERE up.persona = 'investor' AND up.is_active = true
ORDER BY has_privileged_role;
-- has_privileged_role=0 → was relying on the self-toggle; grant a role if legit.

-- ============================================================================
-- If (1) returns rows, or (2) shows rls_enabled=false on any table, or (4) shows
-- a public bucket holding deal/owner/KYC docs, or (5) grants private columns to
-- anon/authenticated: STOP feature work and fix first.
-- ============================================================================
