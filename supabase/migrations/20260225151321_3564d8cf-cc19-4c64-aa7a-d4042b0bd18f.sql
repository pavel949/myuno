
-- Fix log_financial_activity: column is transaction_type, not type
CREATE OR REPLACE FUNCTION public.log_financial_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_log (property_id, actor_id, action, entity_type, entity_id, details)
    VALUES (
      NEW.property_id,
      COALESCE(auth.uid(), NEW.owner_id),
      CASE WHEN NEW.transaction_type = 'income' THEN 'income_recorded' ELSE 'expense_recorded' END,
      'financial',
      NEW.id,
      jsonb_build_object(
        'type', NEW.transaction_type,
        'category', COALESCE(NEW.category, ''),
        'amount', NEW.amount,
        'currency', COALESCE(NEW.currency, 'THB'),
        'description', COALESCE(NEW.description, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
