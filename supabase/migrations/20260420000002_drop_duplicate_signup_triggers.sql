-- Remove duplicate signup triggers created by subsequent migrations.
-- handle_new_user() (migration 20260108232401) already handles profile creation
-- + user role assignment atomically. The two functions below are redundant:
--   - handle_new_user_profile: ON CONFLICT DO NOTHING, never fires after handle_new_user
--   - handle_new_user_role:    ON CONFLICT DO NOTHING, same duplicate for user_roles

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_roles ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user_role();
