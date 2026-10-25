-- REVIEW CANDIDATE ONLY — not a migration; never applied by this task.
-- First verify actual project, existing grants, policy catalogue and operator paths.
-- Source policies permit arbitrary authenticated project_units DML. UI hiding is not authorization.
-- Request-only release must deny direct browser writes until checked operator RPCs exist.
BEGIN;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.project_units FROM anon, authenticated;
COMMIT;
-- Security-preserving rollback: retain this denial, restore the previous read-only buyer code.
-- Do not restore broad browser grants as a rollback. Re-enable writes only through reviewed,
-- actor/object-authorized operator RPCs. Also deploy edge containment from the same reviewed tranche.
