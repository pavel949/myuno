# Thai Business Layer (Local Services)

Self-serve vertical for Thai small businesses (B2B) + a Russian-first catalogue
for customers (B2C), with auto-translated RU↔TH/EN chat and per-business landing
pages. Gated behind `feature_flag:thai_business_layer` (**ON** since GA 2026-06-24;
the `system_settings` row still works as a kill-switch — set it to
`{"enabled": false}` to force-disable without a redeploy).

## Entities (DB — `supabase/migrations/20260623120000_thai_business_layer.sql`)

| Table | Purpose |
|---|---|
| `thai_businesses` | business profile (owner = `profiles.id`, optional `providers` link), `slug`, moderation flag `is_active` |
| `thai_business_services` | catalogue items (price in THB) |
| `thai_bookings` | bookings — status-only payment for MVP |
| `thai_chats` / `thai_chat_messages` | per-(business, customer) thread; messages store original + translated text |
| `thai_business_reviews` | schema only (UI is phase 2) |

RLS: public read of active businesses/services; owners scoped by `owner_id = auth.uid()`
(existing **`vendor`** app_role); customers by `customer_id`; admins via
`is_admin_or_uno_team()`. Owners are authorized via route guards (`VendorGuard`).

## Routes (`src/lib/config/routes.ts`)

- B2C: `/thai-services` (catalogue), `/thai-services/:id` (detail), `/thai-services/my-bookings`
- B2B: `/vendor/thai-business` (dashboard, inside `VendorLayout`)
- Admin: `/admin/thai-business` (moderation)
- Landing: `/ts/:slug` (standalone SPA microsite, `react-helmet-async` SEO)

## Edge functions

- `thai-chat-send` — auth + rate-limit, translates to the recipient's language,
  persists the message (original + translated), bumps the thread, fires `thai-notify`.
- `thai-notify` — WhatsApp (UltraMSG) + email (Resend) alerts for new booking,
  booking status change, and new message. Reuses `_shared/{whatsapp,notify-utils,admin-config}`.

## Translation (reuses existing `ai-translate`)

- **Business/service fields** (TH→RU): translated client-side in
  `useSaveThaiBusiness` / `useSaveThaiService` via `supabase.functions.invoke('ai-translate', { fields, targetLang: 'ru' })`.
- **Chat messages**: translated server-side in `thai-chat-send` (Lovable AI gateway,
  same contract). Rule: RU→TH, otherwise →RU (`src/lib/thaiServices/chat.ts`, mirrored in the edge fn).

## Frontend

- Hooks: `src/hooks/thaiServices/useThaiServices.ts` (queries + mutations). The
  `thai_*` tables are not yet in the generated `types.ts`; queries cast at the
  single boundary in `src/hooks/thaiServices/db.ts`.
- Pure utils: `src/lib/thaiServices/{slug,booking,mapMarkerAdapter,ics,chat}.ts`.
- Reused primitives: `MiniAppLayout`, `UnifiedCatalogMap`, `ProjectLocationPicker`,
  `ImageUpload`, `useCurrency`, `ProjectMicrosite` pattern.

## Enable + deploy

1. Apply the migration to the (single, prod) Supabase DB, then regenerate
   `src/integrations/supabase/types.ts` via the Supabase MCP `generate_typescript_types`
   and drop the `as any` boundary in `db.ts` if desired.
2. Deploy the two edge functions (`thai-chat-send`, `thai-notify`).
3. Flip `system_settings` key `feature_flag:thai_business_layer` → `{"enabled": true}`
   (admin Feature Flag manager, or directly).

## Test

`npx vitest run src/lib/thaiServices/__tests__/thaiServices.test.ts` — covers slug
generation/uniqueness, booking transitions, map adapter, chat target-language rule,
and ICS generation.
