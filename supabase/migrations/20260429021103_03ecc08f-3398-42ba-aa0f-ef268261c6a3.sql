-- Wave 4 / Tier 1: drop 4 empty tables with zero code references
-- Verified 2026-04-29: 0 rows each, 0 refs in src/ and supabase/functions/ (excluding auto-generated types.ts)
-- See docs/audits/db-table-classification.md

DROP TABLE IF EXISTS public.booking_scheduled_messages CASCADE;
DROP TABLE IF EXISTS public.clearview_projects CASCADE;
DROP TABLE IF EXISTS public.document_reminders CASCADE;
DROP TABLE IF EXISTS public.property_passport_events CASCADE;