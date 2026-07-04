-- Re-add previously dropped tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.manual_payment_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drive_import_jobs;

-- Grant EXECUTE on role/access helpers to anon so RLS policies that reference them
-- do not fail with "permission denied" for guest sessions.
GRANT EXECUTE ON FUNCTION public.devmod_is_broker_or_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.devmod_my_developer_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_uno_team() TO anon;