
ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_experience_type_check;
ALTER TABLE public.experiences ADD CONSTRAINT experiences_experience_type_check 
  CHECK (experience_type IN ('tour','activity','workshop','attraction','event','class'));
