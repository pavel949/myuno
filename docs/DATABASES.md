# Databases — Canonical Source of Truth

> **Last updated:** 2026-04-17
> **Status:** Working on Lovable Cloud. Migration to self-managed Supabase is **ON HOLD**.
>
> This is the single source of truth about which databases the app uses. If anything here contradicts another doc (CLAUDE.md, project.md, MIGRATION_PLAN.md, etc.), **this file wins**. Update this file first, then reconcile others.

---

## 1. Three-project topology

The app touches **three** Supabase projects. Only two are active at runtime; the third is a migration target that is not active yet.

| # | Project | Project ref | Role | Status |
|---|---|---|---|---|
| 1 | **Main (Lovable Cloud)** | `kakkwibljrjsawxgnupk` | Active production DB. **All runtime reads/writes from the frontend land here.** Hosts all Edge Functions. | ✅ **Active** |
| 2 | **Self-managed target** | `erfwtoavipwjqmylpizt` | Planned migration destination (Own Supabase Instance). Not connected to the app at runtime today. | 🔄 **Planned — migration ON HOLD** |
| 3 | **PEYLAA** | value of `VITE_PEYLAA_SUPABASE_URL` | Separate Supabase project for the peylaa.com landing. Primary write target for PEYLAA leads; the app also mirrors each lead into the Main DB. | ✅ **Active** |

### Quick answers to common questions

- **Which DB does the frontend write to?** → Main (`kakkwibljrjsawxgnupk`).
- **What is `erfwtoavipwjqmylpizt`?** → A *future* self-managed Supabase project. Referenced in `supabase/config.toml`, `MIGRATION_PLAN.md`, `docs/DOUBLE_BOOKING_SETUP.md`, `scripts/MIGRATION_HOWTO.md`, and (historically) in `public/sitemap.xml`. **Not the live DB.**
- **Does PEYLAA receive writes?** → Yes. PEYLAA is the *primary* write target for leads from the peylaa.com landing flow. See `src/hooks/usePeylaa.ts` (`useSubmitPeylaaLead`, lines ~160–231).
- **Does Lovable (the AI platform) write to the DB?** → No. Lovable Cloud *hosts* the Main DB (so it provisions it), but Lovable's IDE/AI Gateway/Email Service do not write rows. All writes originate from the app's own code. See section 5.

---

## 2. Data flow by domain

| Domain | Main (`kakkwibljrjsawxgnupk`) | PEYLAA | Self-managed (`erfwtoavipwjqmylpizt`) |
|---|---|---|---|
| **CRM contacts** (`crm_contacts`, `profiles`) | ✅ all writes | — | — |
| **Leads — general** (`nb_leads`, `consultation_requests`, `lead_attributions`) | ✅ all writes | — | — |
| **Leads — PEYLAA landing** | ⚠️ mirror write (`nb_leads` + `consultation_requests`) via `useSubmitPeylaaLead` | ✅ primary write (`leads` table) | — |
| **Bookings** (`bookings`, `property_bookings`, `booking_payments`, `booking_status_history`) | ✅ all writes | — | — |
| **Orders** (`orders`, `order_items`, `order_status_history`, `payment_intents`) | ✅ all writes | — | — |
| **Finances** (`ledger_entries`, `ledger_accounts`, `vendor_payouts`, `reconciliation_alerts`, `stays_subscription`) | ✅ all writes (Stripe webhook + RPC `record_ledger_entries`) | — | — |
| **Auth** (`auth.users`, `profiles`) | ✅ Supabase Auth writes here when users sign up / log in (incl. OAuth via Lovable Cloud Auth) | — | — |

### PEYLAA lead flow in detail

`src/hooks/usePeylaa.ts:158–236`:

1. Primary write → `peylaaDb.from('leads').insert(lead)` → **PEYLAA project**.
2. Fire-and-forget mirror → `supabase.from('nb_leads').insert(...)` → **Main**.
3. Fire-and-forget mirror → `supabase.from('consultation_requests').insert(...)` → **Main**.
4. Fire-and-forget notify → `fetch('https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/peylaa-lead-notify', ...)` → Edge Function on **Main** that sends WhatsApp.

> Note: The anon-key PEYLAA client (`persistSession: false`) is **not read-only**. `persistSession` controls whether the auth session is stored in localStorage — it has nothing to do with read/write permissions. PEYLAA RLS policies allow anonymous inserts into `leads`.

---

## 3. Runtime configuration

Which project a client connects to is determined **exclusively by env vars at runtime** — not by `supabase/config.toml`.

### Env vars (see `.env.example`)

| Env var | Resolves to | Used by |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://kakkwibljrjsawxgnupk.supabase.co` (Lovable Cloud) | `src/integrations/supabase/client.ts` → Main client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key for Main | Main client |
| `VITE_SUPABASE_PROJECT_ID` | `kakkwibljrjsawxgnupk` | Docs / tooling |
| `VITE_PEYLAA_SUPABASE_URL` | PEYLAA project URL | `src/lib/peylaa/supabaseClient.ts` → PEYLAA client |
| `VITE_PEYLAA_SUPABASE_KEY` | anon key for PEYLAA | PEYLAA client |

### Backend secrets (Edge Functions only — **not** in `.env`)

Configured in Supabase Edge Functions dashboard: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY`, `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `PEYLAA_SUPABASE_URL`, `PEYLAA_SUPABASE_SERVICE_KEY`, etc.

### `supabase/config.toml` ≠ runtime DB

`supabase/config.toml:1` has `project_id = "erfwtoavipwjqmylpizt"`. **This is a CLI configuration** used by `supabase link`, `supabase functions deploy`, `supabase gen types` — it does not affect which DB the running app connects to. Runtime DB comes from `VITE_SUPABASE_URL`.

> ⚠️ Because `config.toml` points at the migration target while the live DB is elsewhere, running `supabase link` / `supabase functions deploy` against this repo without overrides may hit the wrong project. Before running Supabase CLI commands, verify `--project-ref` explicitly.

---

## 4. Supabase clients in code

There are **exactly two** `createClient(...)` instances in `src/`. Don't create more.

| Client | File | Target | Notes |
|---|---|---|---|
| `supabase` | `src/integrations/supabase/client.ts` | Main (`kakkwibljrjsawxgnupk`) | The default. Import via `import { supabase } from '@/integrations/supabase/client'`. Uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`. |
| `peylaaDb` | `src/lib/peylaa/supabaseClient.ts` | PEYLAA | Import via `import { peylaaDb } from '@/lib/peylaa/supabaseClient'`. Only used in `src/hooks/usePeylaa.ts`. |

Edge Functions use a shared helper at `supabase/functions/_shared/supabase.ts` which reads URL + service-role key from the Edge Function runtime environment (so it targets whichever project hosts the function). Two Edge Functions (`peylaa-lead-notify`, `peylaa-nurture`) also instantiate a PEYLAA client using `PEYLAA_SUPABASE_URL` + `PEYLAA_SUPABASE_SERVICE_KEY` for writes to the PEYLAA project.

---

## 5. Lovable platform — what it touches

Lovable shows up in five places. **None of them write application data to our DB** (the Main DB is Lovable-Cloud-hosted, but Lovable itself isn't inserting rows into our tables).

| Surface | What it does | Writes to our tables? |
|---|---|---|
| Lovable.dev IDE | Generates code, commits to git | ❌ No — only touches the repo |
| `lovable-tagger` (Vite plugin) | Build-time component tagging for preview | ❌ No — build-time only |
| `@lovable.dev/cloud-auth-js` (`src/integrations/lovable/index.ts`) | OAuth proxy for Google/Apple → returns tokens → our code calls `supabase.auth.setSession(tokens)` | ⚠️ Indirectly: Supabase Auth writes to `auth.users`/`profiles`. Lovable itself does not. |
| Lovable AI Gateway (`ai.gateway.lovable.dev`) | LLM provider used by ~20 Edge Functions | ❌ No — returns text; our functions choose whether to persist |
| Lovable Email Service (`@lovable.dev/email-js`) in `supabase/functions/auth-email-hook/index.ts` | Transactional auth emails (like Resend) | ❌ No — renders and sends emails only; no Supabase client is imported in that file |

---

## 6. For AI assistants (Claude Code, Lovable, Cursor)

### DO

- Treat **`kakkwibljrjsawxgnupk`** as the live production DB. All SQL, RLS policies, migrations, and admin actions should target this project.
- Use the single Main client: `import { supabase } from '@/integrations/supabase/client'`.
- For PEYLAA work only, use `peylaaDb` from `src/lib/peylaa/supabaseClient.ts`.
- Read/refresh this file before proposing architecture changes that touch data.

### DON'T

- Don't assume `supabase/config.toml` identifies the runtime DB — it doesn't.
- Don't assume `erfwtoavipwjqmylpizt` is active. It's the future self-managed target and is currently on hold.
- Don't create additional `createClient(...)` instances.
- Don't open a migration PR or schema-move PR without an explicit go-ahead. Migration is **ON HOLD**.

---

## 7. Migration status

- **Plan document:** `MIGRATION_PLAN.md` (Lovable Cloud → Own Supabase).
- **Status:** ON HOLD as of 2026-04-17.
- **Scope when resumed:** export from `kakkwibljrjsawxgnupk`, import into `erfwtoavipwjqmylpizt`, switch `VITE_SUPABASE_URL`, rewire Edge Functions, update `supabase/config.toml` usage. None of this is active now.

Files related to the migration (present but dormant):

- `MIGRATION_PLAN.md` — top-level plan
- `scripts/MIGRATION_HOWTO.md` — operator instructions
- `scripts/export-data.mjs` — `SOURCE_URL = 'https://kakkwibljrjsawxgnupk.supabase.co'`
- `scripts/import-data.mjs` — `TARGET_URL = 'https://erfwtoavipwjqmylpizt.supabase.co'`
- `docs/DOUBLE_BOOKING_SETUP.md` — self-managed setup steps
- `supabase/config.toml` — already points at the target ref

All of these should be treated as reference-only until migration is resumed.

---

## 8. Known mismatches (not code bugs, not in scope to fix right now)

These exist in the repo but are expected given the "ON HOLD" state. Listing them so no one mistakes them for bugs:

- `supabase/config.toml:1` → `project_id = "erfwtoavipwjqmylpizt"` (CLI points at target, not live).
- `public/sitemap.xml` → Edge Function URLs use `https://erfwtoavipwjqmylpizt.supabase.co/functions/v1/...` (sitemap may be stale; functions are live on the Main project).
- Various historical docs mention `erfwtoavipwjqmylpizt` as if it were live — those have been updated to point to this file as the source of truth.

If/when we need to actually fix sitemap or `config.toml` routing, track it as a separate ticket.

---

## 9. Related documentation

- `CLAUDE.md` — section 4 DATABASE (links here)
- `project.md` — section 5 DATABASE (links here)
- `MIGRATION_PLAN.md` — migration plan (ON HOLD)
- `README.md` — env var quick reference
- `.env.example` — env var list
- `supabase/functions/_docs/API_REFERENCE.md` — Edge Function base URLs
