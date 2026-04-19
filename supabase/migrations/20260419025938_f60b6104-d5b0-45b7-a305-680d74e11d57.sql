-- Phase 1: Drop fully dead tables (zero code references, zero rows)
DROP TABLE IF EXISTS public.juristic_documents CASCADE;
DROP TABLE IF EXISTS public.crm_score_log CASCADE;