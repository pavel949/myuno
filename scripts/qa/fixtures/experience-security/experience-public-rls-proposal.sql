-- REVIEW ONLY: restrict experience discovery without changing editor policies.
BEGIN;
ALTER POLICY listings_public_read ON public.listings
USING (
  is_active = true
  AND (approval_status = 'approved' OR approval_status IS NULL)
  AND (
    vertical <> 'experience'
    OR (
      approval_status = 'approved'
      AND attributes->>'status' = 'published'
      AND lower(btrim(COALESCE(attributes->>'operating_status', ''))) NOT IN
        ('temporarily_closed', 'permanently_closed', 'closed')
    )
  )
);
COMMIT;
-- Rollback (only after explicit review):
-- ALTER POLICY listings_public_read ON public.listings USING
-- ((is_active = true) AND ((approval_status = 'approved') OR (approval_status IS NULL)));
