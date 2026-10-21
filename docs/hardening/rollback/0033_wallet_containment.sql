-- Security-preserving rollback: keep wallet primitives server-only.
REVOKE EXECUTE ON FUNCTION public.pay_from_wallet_atomic(uuid,numeric,text,text,text,text),
 public.topup_wallet_atomic(uuid,numeric,text,text) FROM PUBLIC,anon,authenticated;
-- Do not restore the arbitrary-ID/amount frontend refund or negative-debit path.
-- If service compatibility fails, stop wallet settlement until reconciled;
-- retain positive finite guards. No business DML is part of rollback.