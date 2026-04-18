# myUNO — SuperApp for Phuket

myUNO is a comprehensive SuperApp platform providing 18+ service verticals for residents and tourists in Phuket, Thailand. It covers real estate, transport, restaurants, beauty, healthcare, education, events, yachts, and many more — all in one unified application.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Radix UI + Tailwind CSS (semantic tokens)
- **State:** React Context (9 providers) + TanStack React Query
- **Backend:** Lovable Cloud (Supabase) — 60+ Edge Functions, PostgreSQL with RLS
- **Payments:** Stripe (checkout sessions, webhooks, vendor subscriptions)
- **Maps:** Mapbox GL
- **Notifications:** Resend (email), WhatsApp integrations
- **AI:** Lovable AI (descriptions, search, translations, moderation)
- **PWA:** vite-plugin-pwa with offline support

## Quick Start

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Fill in your values (see .env.example for details)

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables, Databases & Keys

> 📖 **Single source of truth:** [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — read this first if you're unsure where data goes or which key to use.

**Databases (TL;DR):**
- **PRIMARY (production):** Supabase `kakkwibljrjsawxgnupk` — all reads & writes go here (frontend + edge functions).
- **MIRROR (optional):** Supabase `erfwtoavipwjqmylpizt` — standalone backup, only via manual `scripts/` migration.
- **PEYLAA:** migrated into PRIMARY DB (`slug=peylaa-phuket-marriott`). The legacy separate Supabase project is no longer used.

⚠️ Local dev, preview and production all hit the **same PRIMARY DB**. There is no separate staging — mark test data with `[TEST]` / `source='smoke_test'` / `*@myuno.test`.

See [`.env.example`](.env.example) for the full variable list. Frontend keys (publishable, OK in code):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Primary DB URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Primary DB anon key |
| `VITE_SUPABASE_PROJECT_ID` | `kakkwibljrjsawxgnupk` |
| ~~`VITE_PEYLAA_SUPABASE_URL` / `_KEY`~~ | Removed — PEYLAA is now in PRIMARY DB |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS + Places + Geocoding |

**Backend secrets** (managed in Lovable Cloud, never in `.env`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY`, `RENTALS_UNITED_*`, `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, etc. Full list in [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md#42-backend-secrets-lovable-cloud--edge-functions).

## Project Structure

```
src/
  components/    — UI components organized by domain (60+ folders)
  pages/         — Route pages (40+ verticals)
  hooks/         — Business logic hooks (230+)
  contexts/      — Global providers (Auth, Cart, Language, Currency, Theme, etc.)
  lib/           — Utilities, configs, taxonomies, adapters
  types/         — TypeScript type definitions
  integrations/  — Auto-generated files (DO NOT EDIT)

supabase/
  functions/     — Edge Functions (60+)
  migrations/    — SQL migrations (DO NOT EDIT)

docs/            — Developer documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Project structure, patterns, and key abstractions |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Coding standards and naming conventions |
| [`docs/EDGE_FUNCTIONS.md`](docs/EDGE_FUNCTIONS.md) | Reference for all 60+ backend functions |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Database schema, tables, and RLS policies |
| [`docs/MCC_ARCHITECTURE.md`](docs/MCC_ARCHITECTURE.md) | Management company business logic |
| [`docs/UX_CONTRACT.md`](docs/UX_CONTRACT.md) | UX patterns and contracts |

## Key Concepts

- **Verticals** — Each service category (property, yachts, restaurants, etc.) is a self-contained vertical with its own pages, hooks, filters, and components. See `src/lib/verticals.ts` for the canonical registry.
- **MiniAppLayout** — Every vertical uses this standardized layout wrapper.
- **Canonical Listing Wizard** — Schema-driven forms for creating/editing listings across all verticals.
- **Taxonomy System** — Static (`src/lib/taxonomies/`) + dynamic (`lookup_values` table) classification system.
- **Bilingual** — All content supports English and Russian via `useLanguage()` context.

## User Modes

1. **Life** (`/`) — LifeOS dashboard with situational shortcuts
2. **Services** (`/discover`) — Service discovery hub organized by life contexts
3. **Marketplace** (`/market`) — Product marketplace
4. **Me** (`/account`) — Profile, bookings, wallet, settings

## Portals

- **Admin** (`/admin`) — Platform management (content, orders, analytics, AI)
- **Vendor** (`/vendor`) — Service provider dashboard
- **Owner** (`/owner`) — Property owner management
- **Team** (`/team`) — Internal team tools
- **Manager** (`/manager`) — Property manager tools

## Deployment

The app is deployed via Lovable. Frontend changes require clicking "Update" in the publish dialog. Backend changes (Edge Functions, migrations) deploy automatically.
