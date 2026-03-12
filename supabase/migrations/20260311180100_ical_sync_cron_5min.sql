-- Schedule ical-scheduled-sync to run every 5 minutes
-- Requires app.settings.supabase_url and app.settings.service_role_key (same as nurture cron)

SELECT cron.schedule(
  'ical-scheduled-sync-every-5min',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/ical-scheduled-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"sync_type": "scheduled"}'::jsonb
  )$$
);
