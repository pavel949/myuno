-- Restore only the reviewed category move; preserve subsequent edits.
UPDATE public.listings SET category='attraction'
WHERE id='dd15b9e1-5d61-4d87-9924-8de972a91566'
AND category='aquarium' AND updated_at='2026-11-18 07:56:09.836835+00'
RETURNING id,category;
-- Retain aquarium registry row: it may already be used by later offers/admin edits.
