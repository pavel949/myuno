-- Conditional rollback of the one live category move. No schema/RLS/route changes.
-- Run only if reverting this reviewed mapping is required; do not overwrite a later admin move.
UPDATE public.categories SET parent_id='ae8b2b8e-7714-48a2-848c-02c3ff41dd55', group_id='584ab3ec-534b-49ae-b1e6-f712d2143a19'
WHERE id='a8cf49c5-db99-4a43-bae8-c42d96b6d668' AND slug='exchange' AND app_path='/exchange'
AND parent_id='99be2770-881f-4a04-98cb-44a7eac26674' AND group_id='c31d1588-0f84-4681-ab2e-b952ee081cbe';

-- Connectivity: restore SIM only if it still has the placement made by this tranche.
UPDATE categories SET parent_id='ae8b2b8e-7714-48a2-848c-02c3ff41dd55'
WHERE id='99246b9e-2809-4c93-8020-765ed751f0b0'
  AND parent_id='e03a097c-386e-4b91-af9f-b42faa2accbc';
-- Retain empty Connectivity rather than deleting a category which an admin may have edited.
-- Service seed rollback must use the saved inserted-ID allowlist, never all service links.
-- See service-links rollback companion. Re-read counts/placements after rollback.
