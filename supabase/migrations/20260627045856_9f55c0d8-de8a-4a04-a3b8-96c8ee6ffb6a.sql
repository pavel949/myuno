-- Wave A.5 (Taxonomy Spine v2): close drift between TS `AppRole` and DB `public.app_role`.
-- The TypeScript SoT (src/types/auth.ts) already lists `property_manager`, but the DB
-- enum was missing it (`property_manager_assignments` table used as a workaround).
-- Adds the value idempotently. No RLS / grant changes; nothing currently requires it,
-- so this is a forward-compatible enum extension only.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'property_manager';