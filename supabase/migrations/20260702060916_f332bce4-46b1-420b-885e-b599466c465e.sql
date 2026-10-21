
-- 1) DUE DILIGENCE REPORTS
REVOKE SELECT ON public.due_diligence_reports FROM anon;
REVOKE SELECT ON public.due_diligence_reports FROM PUBLIC;

DROP POLICY IF EXISTS "Developers read own DD reports" ON public.due_diligence_reports;
CREATE POLICY "Developers read own DD reports"
  ON public.due_diligence_reports FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pp.id FROM public.property_projects pp
      JOIN public.developers d ON d.id = pp.developer_id
      WHERE d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Paid users can read published DD reports" ON public.due_diligence_reports;
CREATE POLICY "Paid users can read published DD reports"
  ON public.due_diligence_reports FOR SELECT TO authenticated
  USING (
    is_published = true
    AND auth.uid() IS NOT NULL
    AND public.user_has_clearview_access(project_id)
  );

DROP POLICY IF EXISTS "Staff can read all DD reports" ON public.due_diligence_reports;
CREATE POLICY "Staff can read all DD reports"
  ON public.due_diligence_reports FOR SELECT TO authenticated
  USING (public.is_admin_or_uno_team());

-- 2) INVESTMENT DEALS
REVOKE ALL ON public.investment_deals FROM anon;
REVOKE ALL ON public.investment_deals FROM PUBLIC;
GRANT INSERT, SELECT ON public.investment_deals TO authenticated;
GRANT SELECT ON public.v_investment_deals_public TO anon, authenticated;
GRANT SELECT ON public.investment_deals_public   TO anon, authenticated;

-- 3) PROPERTY CHAT MESSAGES
DROP POLICY IF EXISTS "Managers can view all messages" ON public.property_chat_messages;
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.property_chat_messages;

CREATE POLICY "Chat: participant scoped read"
  ON public.property_chat_messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_chat_messages.property_id AND p.owner_id = auth.uid()
    )
    OR (
      booking_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.property_bookings b
        WHERE b.id = property_chat_messages.booking_id AND b.guest_id = auth.uid()
      )
    )
    OR public.is_admin_or_uno_team()
  );

-- 4) REALTIME PUBLICATION: drop sensitive tables
DO $$
DECLARE
  t text;
  sensitive text[] := ARRAY[
    'property_chat_messages','team_messages','portal_messages','ticket_messages',
    'owner_notifications','manual_payment_requests','drive_import_jobs'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 5) SIGNATURE_REQUEST_SIGNERS: access_token hardening
REVOKE SELECT (access_token) ON public.signature_request_signers FROM anon;
REVOKE SELECT (access_token) ON public.signature_request_signers FROM authenticated;
REVOKE SELECT (access_token) ON public.signature_request_signers FROM PUBLIC;

DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ') INTO cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='signature_request_signers'
    AND column_name <> 'access_token';
  EXECUTE format('GRANT SELECT (%s) ON public.signature_request_signers TO authenticated', cols);
END $$;

CREATE OR REPLACE FUNCTION public.get_my_signer_access_token(_signer_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.access_token FROM public.signature_request_signers s
  WHERE s.id = _signer_id AND s.signer_user_id = auth.uid()
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_my_signer_access_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_signer_access_token(uuid) TO authenticated;

-- 6) TEAM_MEMBERS
REVOKE SELECT ON public.team_members FROM anon;
REVOKE SELECT ON public.team_members FROM PUBLIC;

DROP POLICY IF EXISTS "Team members can view all team members" ON public.team_members;
CREATE POLICY "Team members can view all team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'uno_team'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
    OR user_id = auth.uid()
  );
