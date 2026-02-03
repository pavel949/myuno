-- Move pg_trgm extension from public to extensions schema
-- This is a best practice to keep public schema clean for application tables

-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to postgres and authenticated roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Drop and recreate pg_trgm in extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Ensure the extension functions are accessible
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;