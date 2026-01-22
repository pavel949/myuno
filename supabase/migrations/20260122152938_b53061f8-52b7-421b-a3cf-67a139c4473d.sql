-- Drop wellness tables (remove wellness mini-app data)
DROP TABLE IF EXISTS public.user_wellness_logs CASCADE;
DROP TABLE IF EXISTS public.user_wellness_streaks CASCADE;
DROP TABLE IF EXISTS public.wellness_content CASCADE;