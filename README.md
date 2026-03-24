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

The app will be available at `http://localhost:8080` (see `vite.config.ts`).

## Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_PUBLIC_APP_URL` | Optional. Canonical site URL (no trailing slash), e.g. `https://myuno.app` — **recommended on Vercel Production** for password-reset emails. See [`docs/AUTH-PASSWORD-RESET.md`](docs/AUTH-PASSWORD-RESET.md) and [`docs/OWNER-SETUP-VERCEL-SUPABASE.md`](docs/OWNER-SETUP-VERCEL-SUPABASE.md). |

Edge functions also require secrets configured in the backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MAPBOX_PUBLIC_TOKEN`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY`.

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
| [`docs/AUTH-PASSWORD-RESET.md`](docs/AUTH-PASSWORD-RESET.md) | Password reset flow & Supabase troubleshooting |
| [`docs/OWNER-SETUP-VERCEL-SUPABASE.md`](docs/OWNER-SETUP-VERCEL-SUPABASE.md) | **Owner checklist:** Vercel env + Supabase URLs (cannot be automated from repo) |

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
