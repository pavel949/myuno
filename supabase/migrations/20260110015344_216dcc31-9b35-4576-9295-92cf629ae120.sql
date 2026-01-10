-- First add 'vendor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Now we can safely reference it in functions/triggers