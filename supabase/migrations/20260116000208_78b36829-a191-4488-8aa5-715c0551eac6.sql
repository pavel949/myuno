-- Fix overly permissive RLS policy for service_order_status_history INSERT
DROP POLICY IF EXISTS "Insert order history" ON public.service_order_status_history;

CREATE POLICY "Insert order history by authorized users" ON public.service_order_status_history
  FOR INSERT WITH CHECK (
    -- Allow if user is the guest or assignee of the order
    EXISTS (
      SELECT 1 FROM public.service_orders so 
      WHERE so.id = order_id 
      AND (so.guest_id = auth.uid() OR so.assigned_to = auth.uid())
    )
    -- Or if user is admin/staff
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff', 'vendor'))
  );