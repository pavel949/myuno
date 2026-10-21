-- Fix #1: make crm_contacts email uniqueness multi-tenant (per company_id).
--
-- Problem: the previous index `crm_contacts_email_unique_lower` was global on
-- `lower(email)`, so two different management companies could not store a client
-- with the same email, and `getOrCreateContactByEmail` could return another
-- company's contact row across tenant boundaries.
--
-- Fix: scope uniqueness by (company_id, lower(email)). Relaxing the key can only
-- reduce collisions (rows unique under lower(email) stay unique once company_id is
-- added to the key), so no dedupe/merge pass is required here.
--
-- Note on NULL company_id: company-less contacts (e.g. public lead forms) keep
-- Postgres default NULL-distinct behaviour. The application-side
-- getOrCreateContactByEmail mirrors this by scoping its lookup with the same
-- company_id (or `company_id IS NULL`).

DROP INDEX IF EXISTS public.crm_contacts_email_unique_lower;

CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_company_email_unique_lower
  ON public.crm_contacts (company_id, lower(email))
  WHERE email IS NOT NULL AND email <> '';
