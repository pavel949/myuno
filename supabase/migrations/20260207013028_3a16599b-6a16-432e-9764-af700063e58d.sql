
-- Trigger function: create admin notification on new order
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for each admin
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT 
    ur.user_id,
    'New order #' || LEFT(NEW.id::text, 8),
    COALESCE(NEW.order_type, 'order') || ' — ' || COALESCE(NEW.total_amount::text, '0') || ' ' || COALESCE(NEW.currency, 'THB'),
    'order',
    jsonb_build_object('order_id', NEW.id, 'order_type', NEW.order_type, 'status', NEW.status)
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on orders table
DROP TRIGGER IF EXISTS trg_notify_admins_new_order ON public.orders;
CREATE TRIGGER trg_notify_admins_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_new_order();
