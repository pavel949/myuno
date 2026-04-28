-- Clean legacy duplicate categories from Phase 6 seed.
-- These 6 slugs were ingested as 'top-level' but lacked the cat-* prefix
-- and duplicated the canonical Master Taxonomy entries.
-- Also remove orphan services whose parent_id points to deleted/legacy rows.

-- 1. Detach any services accidentally linked to legacy parents
UPDATE public.categories
SET is_active = false
WHERE parent_id IN (
  SELECT id FROM public.categories
  WHERE slug IN ('transfers','transport','yachts','events','shopping','food-delivery')
    AND parent_id IS NULL
);

-- 2. Delete the 6 legacy duplicate top-level categories
DELETE FROM public.categories
WHERE slug IN ('transfers','transport','yachts','events','shopping','food-delivery')
  AND parent_id IS NULL;

-- 3. Soft-delete services that no longer have a valid active parent
UPDATE public.categories c
SET is_active = false
WHERE c.parent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categories p
    WHERE p.id = c.parent_id AND p.is_active = true
  );