# Edge Function Archive

Functions moved here on **2026-04-29** as part of cleanup Wave 1.

## Why archived
Each of these had **zero references** found in:
- Frontend (`src/`)
- Other edge functions (`supabase/functions/`)
- SQL migrations (`supabase/migrations/`)
- `supabase/config.toml`

See `docs/audits/edge-functions-usage.md` for the audit method.

## Important: NOT deleted from Supabase
The deployed functions are still live on Supabase. This was intentional:
some functions may be invoked by **external webhook URLs** (Stripe,
WhatsApp, Resend, Telegram) that don't show up in code search.

**Plan:**
1. Observe Sentry / Edge Function logs for 14 days (until 2026-05-13)
2. If zero invocations recorded → call `supabase--delete_edge_functions` to remove server-side
3. If invocations show up → restore from archive: `mv _archive/<name> ../<name>`

## Archived functions (33)

```
admin-pending-digest         create-pet-checkout          notify-chat-message
ai-chat-moderator            create-wellness-checkout     ocr-receipt
ai-guest-autoreply           create-yacht-checkout        owner-monthly-digest
ai-legal-assistant           daily-reconciliation         peylaa-nurture
ai-orchestrator              devmod-release-holds         proxy-image
canonical-persona-detect     devmod-resend-inbound        task-reminders
create-cleaning-checkout     devmod-stripe-webhook        user-analytics-api
create-clearview-checkout    dispatch-outreach            visa-expiry-reminders
create-event-checkout        execute-campaign-rules       yacht-calendar-export
create-legal-checkout        expire-manual-payments
create-market-checkout       guest-referral-engine
                             lifecycle-processor
                             nb-lead-notify
```

## Restore procedure
```bash
mv supabase/functions/_archive/<name> supabase/functions/<name>
```
