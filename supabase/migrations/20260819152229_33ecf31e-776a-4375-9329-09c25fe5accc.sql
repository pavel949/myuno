CREATE OR REPLACE FUNCTION public.user_has_clearview_access(_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(auth.uid(), 'admin')
    OR public.is_admin_or_uno_team()
    OR EXISTS (
      SELECT 1 FROM public.clearview_purchases p
      WHERE auth.uid() IS NOT NULL
        AND p.user_id = auth.uid()
        AND p.valid_until > now()
        AND (
          coalesce(p.amount_paid_cents, 0) > 0
          OR p.stripe_subscription_id IS NOT NULL
          OR p.stripe_session_id IS NOT NULL
        )
        AND (
          (p.tier = 'single' AND p.project_id = _project_id)
          OR (p.tier = 'investor_pass')
          OR (p.tier = 'bundle3' AND p.project_id = _project_id)
        )
    );
$function$;