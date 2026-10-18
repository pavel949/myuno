-- Store user-entered configuration on its existing canonical terms row.
-- No seed, notification, payment, ledger mutation or authorization change.
ALTER TABLE public.property_management_terms ADD COLUMN accounting_policy jsonb;
ALTER TABLE public.property_management_terms ALTER COLUMN owner_notification_defaults DROP DEFAULT;
-- Missing payout value is unconfigured, not an implicit zero-value rule.
ALTER TABLE public.property_payout_rules ALTER COLUMN commission_value DROP DEFAULT;
COMMENT ON COLUMN public.property_management_terms.accounting_policy IS 'Nullable user-configured accounting options; NULL means not configured. Not payment execution authority.';
CREATE SCHEMA IF NOT EXISTS private;

CREATE FUNCTION private.validate_management_terms_configuration()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE n numeric; k text; v jsonb; entry jsonb;
 allowed_expenses text[] := ARRAY['cleaning','electricity','water','internet','repairs_minor','repairs_major','cam_fees','insurance','marketing'];
BEGIN
 IF TG_OP='UPDATE' AND ROW(NEW.status,NEW.commission_type,NEW.commission_rate,NEW.commission_amount,NEW.commission_base,NEW.revenue_split_owner,NEW.revenue_split_manager,NEW.expense_responsibility,NEW.payment_day,NEW.valid_from,NEW.valid_until,NEW.accounting_policy)
  IS NOT DISTINCT FROM ROW(OLD.status,OLD.commission_type,OLD.commission_rate,OLD.commission_amount,OLD.commission_base,OLD.revenue_split_owner,OLD.revenue_split_manager,OLD.expense_responsibility,OLD.payment_day,OLD.valid_from,OLD.valid_until,OLD.accounting_policy) THEN RETURN NEW; END IF;
 IF NEW.commission_type NOT IN ('percent','fixed') OR NEW.commission_base NOT IN ('gross','net') OR NEW.status NOT IN ('draft','active','pending_approval','archived') THEN RAISE EXCEPTION 'invalid terms configuration type' USING ERRCODE='23514'; END IF;
 FOREACH n IN ARRAY ARRAY[NEW.commission_rate,NEW.commission_amount,NEW.revenue_split_owner,NEW.revenue_split_manager] LOOP
  IF n IS NOT NULL AND (n::text IN ('NaN','Infinity','-Infinity') OR n<0) THEN RAISE EXCEPTION 'finite non-negative amounts required' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOREACH n IN ARRAY ARRAY[NEW.commission_rate,NEW.revenue_split_owner,NEW.revenue_split_manager] LOOP
  IF n>100 THEN RAISE EXCEPTION 'percentage out of range' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF NEW.payment_day IS NOT NULL AND NEW.payment_day NOT BETWEEN 1 AND 31 THEN RAISE EXCEPTION 'invalid payout day' USING ERRCODE='23514'; END IF;
 IF NEW.valid_from IS NOT NULL AND NEW.valid_until IS NOT NULL AND NEW.valid_until<NEW.valid_from THEN RAISE EXCEPTION 'invalid validity period' USING ERRCODE='23514'; END IF;
 IF jsonb_typeof(NEW.expense_responsibility) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'expense configuration must be an object' USING ERRCODE='23514'; END IF;
 FOR k,v IN SELECT key,value FROM jsonb_each(NEW.expense_responsibility) LOOP
  IF NOT k=ANY(allowed_expenses) OR jsonb_typeof(v)<>'string' OR (v #>> '{}') NOT IN ('owner','manager','split') THEN RAISE EXCEPTION 'invalid expense responsibility' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF NEW.status IN ('active','pending_approval') THEN
  IF (NEW.commission_type='fixed' AND NEW.commission_amount IS NULL) OR (NEW.commission_type='percent' AND NEW.commission_rate IS NULL) THEN RAISE EXCEPTION 'commission must be configured before activation or approval' USING ERRCODE='23514'; END IF;
  FOREACH k IN ARRAY allowed_expenses LOOP
   IF NOT NEW.expense_responsibility ? k THEN RAISE EXCEPTION 'expense responsibilities must be configured before activation or approval' USING ERRCODE='23514'; END IF;
  END LOOP;
 END IF;
 IF NEW.accounting_policy IS NOT NULL THEN
  IF jsonb_typeof(NEW.accounting_policy) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'accounting policy must be an object' USING ERRCODE='23514'; END IF;
  FOR k,v IN SELECT key,value FROM jsonb_each(NEW.accounting_policy) LOOP
   IF k='net_profit_deductions' THEN
    IF jsonb_typeof(v)<>'array' THEN RAISE EXCEPTION 'deductions must be an array' USING ERRCODE='23514'; END IF;
    FOR entry IN SELECT value FROM jsonb_array_elements(v) LOOP
     IF jsonb_typeof(entry)<>'string' OR NOT (entry #>> '{}')=ANY(allowed_expenses) THEN RAISE EXCEPTION 'invalid deduction' USING ERRCODE='23514'; END IF;
    END LOOP;
   ELSIF k='report_frequency' THEN
    IF jsonb_typeof(v)<>'string' OR (v #>> '{}') NOT IN ('monthly','quarterly','on_demand') THEN RAISE EXCEPTION 'invalid report frequency' USING ERRCODE='23514'; END IF;
   ELSIF k='report_format' THEN
    IF jsonb_typeof(v)<>'string' OR (v #>> '{}') NOT IN ('summary','detailed') THEN RAISE EXCEPTION 'invalid report format' USING ERRCODE='23514'; END IF;
   ELSIF k='report_language' THEN
    IF jsonb_typeof(v)<>'string' OR (v #>> '{}') !~ '^[a-z]{2}(-[A-Z]{2})?$' THEN RAISE EXCEPTION 'invalid report language' USING ERRCODE='23514'; END IF;
   ELSIF k='include_pending_bookings' THEN
    IF jsonb_typeof(v)<>'boolean' THEN RAISE EXCEPTION 'invalid pending-booking setting' USING ERRCODE='23514'; END IF;
   ELSIF k IN ('minimum_payout','payout_hold_days','owner_approval_required_above','tax_withholding_percent') THEN
    IF jsonb_typeof(v)='null' THEN CONTINUE; END IF;
    IF jsonb_typeof(v)<>'number' THEN RAISE EXCEPTION 'numeric accounting option required' USING ERRCODE='23514'; END IF;
    n:=(v #>> '{}')::numeric;
    IF n<0 OR n::text IN ('NaN','Infinity','-Infinity') OR (k='tax_withholding_percent' AND n>100) OR (k='payout_hold_days' AND (mod(n,1)<>0 OR n>9007199254740991)) THEN RAISE EXCEPTION 'invalid numeric accounting option' USING ERRCODE='23514'; END IF;
   ELSE RAISE EXCEPTION 'unknown accounting option' USING ERRCODE='23514';
   END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.validate_management_terms_configuration() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER validate_management_terms_configuration
 BEFORE INSERT OR UPDATE OF status,commission_type,commission_rate,commission_amount,commission_base,revenue_split_owner,revenue_split_manager,expense_responsibility,payment_day,valid_from,valid_until,accounting_policy
 ON public.property_management_terms FOR EACH ROW EXECUTE FUNCTION private.validate_management_terms_configuration();

CREATE FUNCTION private.validate_configured_payout_value()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.commission_type NOT IN ('percent_net','percent_gross','fixed','per_booking') THEN RAISE EXCEPTION 'invalid payout commission type' USING ERRCODE='23514'; END IF;
 IF NEW.commission_value IS NULL OR NEW.commission_value::text IN ('NaN','Infinity','-Infinity') OR NEW.commission_value<0 OR (NEW.commission_type IN ('percent_net','percent_gross') AND NEW.commission_value>100) THEN
  RAISE EXCEPTION 'invalid configured payout value' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.validate_configured_payout_value() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER validate_configured_payout_value BEFORE INSERT OR UPDATE OF commission_value,commission_type
 ON public.property_payout_rules FOR EACH ROW EXECUTE FUNCTION private.validate_configured_payout_value();

