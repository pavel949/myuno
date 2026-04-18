-- Удаляем существующий job если был
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drive-watch-cron-daily') THEN
    PERFORM cron.unschedule('drive-watch-cron-daily');
  END IF;
END $$;

-- Шедулим daily в 03:00 UTC
SELECT cron.schedule(
  'drive-watch-cron-daily',
  '0 3 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/drive-watch-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $cron$
);