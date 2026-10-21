-- Rollback for 0025. These guards only remove proven escalation paths; dropping them restores those bypasses.
-- Use only if a legitimate workflow is blocked, and re-add a narrower guard in the same change.
DROP TRIGGER IF EXISTS guard_property_delegate_update ON public.property_delegates;
DROP TRIGGER IF EXISTS guard_property_company_change ON public.properties;
DROP POLICY IF EXISTS company_placement_insert_ceiling ON public.properties;
