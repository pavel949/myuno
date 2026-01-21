-- Add uno_team to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'uno_team';