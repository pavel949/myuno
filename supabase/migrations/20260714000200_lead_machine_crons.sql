-- Lead Machine · Phase A3 — cron wiring for the supply-side machine.
-- Copies the verified pattern from 20260305170145 (net.http_post + service-role
-- bearer, accepted by requireInternalSecret / requireInternalOrStaff).
-- Every job is unschedule-guarded so this migration is idempotent.
--
-- Cadence: WhatsApp lands ~10:00-10:30 Asia/Bangkok (UTC+7), weekdays only.
-- Volume is governed by system_settings.outreach_daily_caps (A0 seeded WA=5),
-- so limit:10 below is effectively capped to the warm-up value.

-- 1) Score new prospects + promote hot ones into the house crm_contacts book.
SELECT cron.unschedule('auto-vendor-nurture-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-vendor-nurture-daily');
SELECT cron.schedule(
  'auto-vendor-nurture-daily',
  '0 1 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-vendor-nurture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  )$$
);

-- 2) Initial outreach to freshly-promoted (not_contacted) vendor contacts.
SELECT cron.unschedule('vendor-outreach-initial')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vendor-outreach-initial');
SELECT cron.schedule(
  'vendor-outreach-initial',
  '0 3 * * 1-5',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/vendor-outreach-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"action":"initial","limit":10}'::jsonb
  )$$
);

-- 3) Follow-ups for contacts whose next_followup_at is due (never for repliers).
SELECT cron.unschedule('vendor-outreach-followup')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'vendor-outreach-followup');
SELECT cron.schedule(
  'vendor-outreach-followup',
  '30 3 * * 1-5',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/vendor-outreach-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"action":"followup","limit":10}'::jsonb
  )$$
);
