-- Single source of truth for new user registration (audit fix).
-- handle_new_user() already creates profile + user_roles in migration 20260108232401.
-- Dropping the duplicate trigger that only created profile (ON CONFLICT DO NOTHING)
-- so we don't rely on trigger order and avoid any edge case of missing user_roles.
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
