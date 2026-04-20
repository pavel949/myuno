-- Add owner_type column to profiles to discriminate self-managed owners from MC-portal owners
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS owner_type text
CHECK (owner_type IS NULL OR owner_type IN ('self_managed', 'mc_portal'));

COMMENT ON COLUMN public.profiles.owner_type IS 'Discriminates self-managing owners from MC-portal owners. Null = not an owner.';