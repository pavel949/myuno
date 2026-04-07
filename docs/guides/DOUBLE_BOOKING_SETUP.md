# Double-Booking Mitigation Setup

Steps to complete the double-booking risk reduction setup.

## 1. Apply migrations

```bash
# Link project first (if not already)
npx supabase link --project-ref erfwtoavipwjqmylpizt

# Push migrations
npx supabase db push
```

Or apply manually in **Supabase Dashboard → SQL Editor** by running the migration files in order:
- `supabase/migrations/20260311180000_booking_lock_and_conflicts.sql`
- `supabase/migrations/20260311180100_ical_sync_cron_5min.sql`

## 2. Cron config (app.settings)

The `ical-scheduled-sync` and `process-nurture-queue` cron jobs need `app.settings.supabase_url` and `app.settings.service_role_key`.

Run in **Supabase Dashboard → SQL Editor** (replace placeholders with your values):

```sql
-- Set Supabase project URL and service role key for pg_cron
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://erfwtoavipwjqmylpizt.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

Get the service role key from **Project Settings → API** in the Supabase dashboard.

## 3. Rentals United secrets

Add to **Supabase Dashboard → Project Settings → Edge Functions → Secrets**:

| Secret | Description |
|--------|-------------|
| `RENTALS_UNITED_ACCESS_KEY` | Rentals United API Access Key |
| `RENTALS_UNITED_SECRET_KEY` | Rentals United API Secret Key |

Or via CLI:

```bash
npx supabase secrets set RENTALS_UNITED_ACCESS_KEY=your_access_key
npx supabase secrets set RENTALS_UNITED_SECRET_KEY=your_secret_key
```

## 4. Regenerate TypeScript types

After migrations are applied:

```bash
# From linked project
npx supabase gen types typescript --project-id erfwtoavipwjqmylpizt > src/integrations/supabase/types.ts

# Or with local Supabase (requires Docker)
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

This adds the `booking_conflicts` table to the generated types.
