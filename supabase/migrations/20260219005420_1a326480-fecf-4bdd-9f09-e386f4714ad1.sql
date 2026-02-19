
-- Add 'persona' concept to user_roles to handle tourist/resident/property_owner
-- These are user personas, not security roles, but should still live in user_roles

-- First, check if user_persona type exists (it does per types.ts), update app_role enum if needed
-- The app_role enum already includes: tourist, resident, property_owner, vendor, owner, admin etc.
-- So personas can be stored as roles in user_roles table

-- Add missing persona values to app_role if not present
-- (already present based on types.ts: tourist, resident, property_owner)

-- Add all profile_details columns to profiles table for merge
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text[],
  ADD COLUMN IF NOT EXISTS medical_conditions text,
  ADD COLUMN IF NOT EXISTS travel_preferences jsonb;

-- Standardize emergency contact fields in profiles (rename relationship -> relation for consistency)
-- profiles has: emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
-- profile_details has: emergency_contact_name, emergency_contact_phone, emergency_contact_relation
-- Keep profiles columns as canonical, add alias in profile_details is irrelevant after merge

-- Migrate existing profile_details data into profiles
UPDATE public.profiles p
SET
  date_of_birth = pd.date_of_birth::date,
  gender = pd.gender,
  nationality = pd.nationality,
  address_line1 = pd.address_line1,
  address_line2 = pd.address_line2,
  city = pd.city,
  state_province = pd.state_province,
  postal_code = pd.postal_code,
  country = pd.country,
  dietary_restrictions = pd.dietary_restrictions,
  medical_conditions = pd.medical_conditions,
  travel_preferences = pd.travel_preferences,
  -- Merge emergency contact from profile_details only if profiles doesn't already have them
  emergency_contact_name = COALESCE(p.emergency_contact_name, pd.emergency_contact_name),
  emergency_contact_phone = COALESCE(p.emergency_contact_phone, pd.emergency_contact_phone),
  emergency_contact_relationship = COALESCE(p.emergency_contact_relationship, pd.emergency_contact_relation)
FROM public.profile_details pd
WHERE pd.user_id = p.id;

-- Migrate user_type from profiles to user_roles (as personas)
-- Only insert if not already present in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.user_type::text::app_role
FROM public.profiles p
WHERE p.user_type IS NOT NULL
  AND p.user_type::text::app_role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.id
      AND ur.role = p.user_type::text::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies for profiles to allow users to update new columns
-- (existing RLS should already cover this since policies are on the table level)

-- Drop profile_details table (data migrated to profiles)
DROP TABLE IF EXISTS public.profile_details CASCADE;

-- Add comment to user_type column marking it as deprecated
COMMENT ON COLUMN public.profiles.user_type IS 'DEPRECATED: Use user_roles table instead. Kept for backward compatibility only.';
