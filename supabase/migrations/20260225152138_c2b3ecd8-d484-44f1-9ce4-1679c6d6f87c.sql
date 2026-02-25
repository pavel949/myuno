CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM calendar_sync_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER