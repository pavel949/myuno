-- Fix #3 (Phase 3): give the platform a "house" management company so admins can
-- operate as an MC (full sales CRM: crm_contacts / agent_deals / pipelines) in
-- addition to running the platform — and so the lead→deal bridge has a default
-- company to route inbound platform leads into.
--
-- agent_deals / crm_contacts RLS is membership-based (is_company_member) with no
-- admin bypass, so the correct, least-surprising way to let admins use the MC CRM
-- is to make them real members of the house company — NOT to weaken tenant RLS.
-- Other MCs remain fully isolated.
--
-- Idempotent: safe to re-run. Picks up admins/uno_team from user_roles, so no
-- user id is hardcoded and new admins are enrolled when this is re-applied.

WITH house AS (
  INSERT INTO public.management_companies (slug, name_en, name_ru, is_active, is_verified)
  VALUES ('myuno-house', 'myUNO', 'myUNO', true, true)
  ON CONFLICT (slug) DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id
)
INSERT INTO public.management_company_members (company_id, user_id, role, is_active)
SELECT h.id, ur.user_id, 'owner', true
FROM house h
CROSS JOIN public.user_roles ur
WHERE ur.role IN ('admin', 'uno_team')
ON CONFLICT (company_id, user_id) DO NOTHING;
