-- Rollback for 0008/0009 (F05 cashback). Restoring the previous body is NOT recommended:
-- it referenced orders.customer_id and removed ledger columns and failed on every completion.
-- Safe rollback = disable cashback while keeping completion working:
CREATE OR REPLACE FUNCTION public.trigger_order_cashback()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN RETURN NEW; END $$;
-- The unique index ledger_entries_cashback_once can stay (it only prevents duplicate cashback).
-- Reversing an already credited cashback must be a balanced 'adjustment' entry, never a DELETE.
