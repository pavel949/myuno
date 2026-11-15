BEGIN;
REVOKE ALL ON FUNCTION public.confirm_manual_receipt_checked(uuid,numeric,numeric,numeric,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Preserve existing receipts, protected metadata, unique references and proof.
COMMIT;
