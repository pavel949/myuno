-- Executable SQL rollback of 0021 only. Run through the managed migration tool.
-- Safe while E1 is unconsumed: no runtime reads these objects. Drops any space rows.
DROP TABLE IF EXISTS public.operating_space_members;
DROP TABLE IF EXISTS public.operating_space_properties;
DROP TABLE IF EXISTS public.operating_spaces;
DROP FUNCTION IF EXISTS public.actor_can_access_operating_space(uuid);
DROP FUNCTION IF EXISTS public.actor_is_operating_company_overseer(uuid);
DROP FUNCTION IF EXISTS public.operating_spaces_lock_company();
DROP FUNCTION IF EXISTS public.operating_spaces_touch_updated_at();
ALTER TABLE public.management_company_members DROP CONSTRAINT IF EXISTS management_company_members_id_company_key;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_id_management_company_key;
