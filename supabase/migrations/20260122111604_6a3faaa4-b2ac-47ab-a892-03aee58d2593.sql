
-- Add trigger to calculate commission on order insert
CREATE TRIGGER trigger_calculate_order_commission
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_commission();

-- Add trigger for order updates (in case total_amount changes)
CREATE TRIGGER trigger_recalc_commission_on_update
  BEFORE UPDATE OF total_amount ON public.orders
  FOR EACH ROW
  WHEN (OLD.total_amount IS DISTINCT FROM NEW.total_amount)
  EXECUTE FUNCTION public.calculate_order_commission();
