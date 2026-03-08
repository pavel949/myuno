

# Plan: Admin API Keys & Secrets Management Panel

## What We're Building
A new admin page at `/admin/api-keys` that shows all backend secrets and frontend environment variables in one dashboard. Admins can see which keys are configured, their status, and have fields to update or add missing ones via an edge function.

## Current State
**Backend secrets (7 configured):**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe payments
- `RESEND_API_KEY` — Email notifications
- `MAPBOX_PUBLIC_TOKEN` — Maps
- `LOVABLE_API_KEY` — AI features (system-managed)
- `FIRECRAWL_API_KEY` — Web scraping (connector-managed)
- `TELEGRAM_BOT_TOKEN` — Telegram bot

**Frontend env vars (in .env):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — auto-configured
- `VITE_GOOGLE_MAPS_API_KEY` — **MISSING**, causing /map page errors
- `VITE_BYPASS_COMING_SOON` — optional gate bypass

## Implementation Plan

### 1. Create Edge Function `admin-secrets-status`
- **Path**: `supabase/functions/admin-secrets-status/index.ts`
- Admin-only (uses `requireAuth` + `has_role` check)
- Checks each known secret via `Deno.env.get()` — returns `{ key, configured: boolean, managedBy }` for each
- Never exposes actual values — only presence/absence
- Also fix the `npm:@supabase/supabase-js@2.49.4` → `@2` version issue in this file

### 2. Create Admin Page Component
- **Path**: `src/pages/admin/AdminApiKeys.tsx`
- Two sections:
  - **Backend Secrets** — fetched from edge function, shows status badges (configured/missing)
  - **Frontend Variables** — reads from `import.meta.env`, shows which are set
- For missing keys: input field + save button that calls a second edge function
- Each secret has description, link to where to get the key, and managed-by label
- RU/EN language support

### 3. Create Edge Function `admin-update-secret`
- **Path**: `supabase/functions/admin-update-secret/index.ts`
- Admin-only, accepts `{ key, value }` 
- Uses Supabase Management API or `Deno.env` to validate
- Actually stores via the Lovable secrets mechanism (note: edge functions can't programmatically set secrets — so this will show instructions and use the toast to guide the admin)
- **Alternative approach**: Since secrets can't be set from code, the panel will show status + provide a "copy key name" button and direct the admin to use the Lovable UI to set them. For frontend env vars like `VITE_GOOGLE_MAPS_API_KEY`, we'll store in a `system_config` table and read from there.

### 4. Database: `system_config` table
- Migration to create `system_config` table for frontend-accessible config values
- Columns: `key TEXT PRIMARY KEY`, `value TEXT`, `updated_at TIMESTAMPTZ`, `updated_by UUID`
- RLS: SELECT for authenticated, INSERT/UPDATE for admins only
- Used for things like `GOOGLE_MAPS_API_KEY` that the frontend needs

### 5. Wire Up Routes & Navigation
- Add route `/admin/api-keys` in `AnimatedRoutes.tsx`
- Add quick link in `AdminSystemSettings.tsx` quick links grid
- Add to `ControlSystemTab.tsx` system sections

### 6. Fix Build Errors
- Update `npm:@supabase/supabase-js@2.49.4` → `npm:@supabase/supabase-js@2` across all 16 files in `supabase/functions/`

## Known Secrets Registry (hardcoded in the panel)

| Key | Description | Where to get | Status |
|-----|------------|--------------|--------|
| `STRIPE_SECRET_KEY` | Stripe payments | dashboard.stripe.com/apikeys | Configured |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | dashboard.stripe.com/webhooks | Configured |
| `RESEND_API_KEY` | Email via Resend | resend.com/api-keys | Configured |
| `MAPBOX_PUBLIC_TOKEN` | Mapbox maps | account.mapbox.com/access-tokens | Configured |
| `LOVABLE_API_KEY` | AI features | System-managed | Configured |
| `FIRECRAWL_API_KEY` | Web scraping | firecrawl.dev | Connector-managed |
| `TELEGRAM_BOT_TOKEN` | Telegram bot | @BotFather | Configured |
| `GOOGLE_MAPS_API_KEY` | Google Maps | console.cloud.google.com | **MISSING** |

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/admin-secrets-status/index.ts` | Create |
| `src/pages/admin/AdminApiKeys.tsx` | Create |
| `src/components/layout/AnimatedRoutes.tsx` | Add route |
| `src/pages/admin/AdminSystemSettings.tsx` | Add quick link |
| `src/components/admin/control/ControlSystemTab.tsx` | Add section link |
| `supabase/functions/_shared/supabase.ts` | Fix version `@2` |
| 15 other edge function files | Fix version `@2` |
| Migration for `system_config` table | Create |

