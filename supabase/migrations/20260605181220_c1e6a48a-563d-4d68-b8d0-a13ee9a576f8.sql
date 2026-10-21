-- Drop 8 phantom-empty tables across 3 dead clusters (Trust accounts, Approval workflows, Staff/HRIS extras).
-- All confirmed: 0 rows, 0 writes, only orphan hooks/admin pages reference them.
-- Preserved (active): staff_members (3 rows, 3.8k reads), trust_badges (6 rows, 1.6k reads) — NOT touched.

DROP TABLE IF EXISTS public.trust_account_movements CASCADE;
DROP TABLE IF EXISTS public.trust_accounts CASCADE;

DROP TABLE IF EXISTS public.approval_requests CASCADE;
DROP TABLE IF EXISTS public.approval_steps CASCADE;
DROP TABLE IF EXISTS public.approval_workflows CASCADE;

DROP TABLE IF EXISTS public.staff_profiles CASCADE;
DROP TABLE IF EXISTS public.staff_documents CASCADE;
DROP TABLE IF EXISTS public.staff_property_assignments CASCADE;