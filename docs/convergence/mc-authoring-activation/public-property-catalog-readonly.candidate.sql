-- SOURCE CANDIDATE. Requires explicit production privilege-change approval.
-- The live allowlisted view is automatically updatable and has legacy write
-- grants. Public catalogue access must never be an alternative property writer.
BEGIN;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
 ON public.public_property_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.public_property_catalog TO anon,authenticated;
COMMIT;
