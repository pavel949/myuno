# Edge Functions Usage Audit — 2026-04-29

Inventory of all **157 edge functions** in `supabase/functions/`.

**Method:**
1. Frontend refs: `rg "functions\.invoke\(['\"]<name>['\"]" src`
2. Migration refs: `rg "<name>" supabase/migrations` (cron, triggers)
3. Config refs: `[functions.<name>]` in `supabase/config.toml` (scheduled / configured)

## Summary

| Status | Count | Action |
|---|---|---|
| **Called from frontend** | **80** | KEEP |
| **Configured in config.toml** (scheduled/JWT) | 70 | usually KEEP — review case-by-case |
| **Referenced ONLY in migrations** (cron/trigger) | 12 | KEEP — cron-driven |
| **TRUE ORPHANS** (no frontend, no migration, no config) | **33** | DROP candidates |
| **TOTAL** | **157** | target ≤ 90 |

## Tier 1 — TRUE ORPHANS (33 functions, drop candidates)

These have no callers anywhere. Move to `supabase/functions/_archive/` first, observe 2 weeks, then delete.

```text
admin-pending-digest
ai-chat-moderator                  ⚠ Memory: Guest AI Chat moderation — verify
ai-guest-autoreply
ai-legal-assistant
ai-orchestrator                    ⚠ Memory: AI Flywheel Vision — verify
canonical-persona-detect
create-cleaning-checkout           ⚠ Likely called by webhook URL; manual test
create-clearview-checkout
create-event-checkout
create-legal-checkout
create-market-checkout
create-pet-checkout
create-wellness-checkout
create-yacht-checkout
daily-reconciliation               ⚠ Memory: reconciliation_alerts — keep, verify trigger
devmod-release-holds
devmod-resend-inbound
devmod-stripe-webhook              ⚠ Likely called as Stripe webhook URL — KEEP
dispatch-outreach
execute-campaign-rules
expire-manual-payments
guest-referral-engine              ⚠ Memory: Guest Revenue Loop — verify
lifecycle-processor                ⚠ Memory: Lifecycle Messaging — KEEP, called via webhook
nb-lead-notify
notify-chat-message                ⚠ Memory: Guest AI Chat — verify
ocr-receipt
owner-monthly-digest
peylaa-nurture
proxy-image
task-reminders
user-analytics-api
visa-expiry-reminders              ⚠ Memory: Visa Tracker — verify cron config
yacht-calendar-export
```

### Action plan
For each function above:
1. Search Lovable Cloud cron schedules (not visible from repo) — confirm not scheduled there
2. Search Stripe Dashboard webhooks — many `create-*-checkout` and `*-webhook` functions are called by Stripe URL, not from code
3. If confirmed no caller → move to `supabase/functions/_archive/<name>/`
4. After 14 days of no errors in Sentry → delete

## Tier 2 — Migration-only (12 functions)

Called by cron jobs or triggers via `pg_cron` / `pg_net` in migrations. **KEEP**.

```text
ai-personalize-home               (cron: home recommendations)
canonical-lifecycle-recompute     (cron: lifecycle recompute)
cleanup-abandoned-orders          (cron: order cleanup)
drive-watch-cron                  (cron: drive sync)
execute-crm-workflow              (trigger: CRM workflows)
ical-scheduled-sync               (cron: iCal pull)
leads-factory                     (cron: lead generation)
listing-quality-analyzer          (cron: listing quality)
send-guest-welcome-whatsapp       (trigger: guest signup)
send-nurture-messages             (cron: nurture)
vendor-acquisition                (cron: vendor outreach)
```

## Tier 3 — Webhook URLs (manual verification needed)

These are likely called by external services (Stripe, WhatsApp, Resend, Telegram) via direct URL — won't show in `rg`. **DO NOT DROP without verification.**

Probable webhook functions:
- `stripe-webhook` — Stripe payment confirmations
- `whatsapp-incoming-webhook` — WhatsApp inbound
- `auth-email-hook` — Supabase auth email customisation
- `send-email` — Resend webhooks
- `nb-lead-notify` — newbuilds form submissions

→ Check Stripe Dashboard, WhatsApp config, Resend dashboard for active URLs before drop.

## Wave 1 execution

PR cadence:
1. **PR #1** — move 10 truly safe orphans (no memory mention, no checkout, no webhook) to `_archive/`
2. **PR #2** — verify webhook-suspects via Stripe/WhatsApp/Resend dashboards, drop confirmed dead
3. **PR #3** — `devmod-*` functions — confirm not used in dev/preview, drop
4. **PR #4** — AI orphans — verify against AI Center cron config in DB

Target after Wave 1: 157 → ≤ 120 functions.
Target after Wave 4 RPC audit: ≤ 90.

## Ground rules

- Move first, delete after 14 days
- Each archived function keeps its `index.ts` + `deno.json` for instant rollback
- Update `supabase/config.toml` to remove the `[functions.<name>]` block when archiving
- If the function imports from `_shared/`, verify no other archived function still depends on it
