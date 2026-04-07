# myUNO — SuperApp for Phuket

> Home is where myUNO is. Your life abroad, simplified.

myUNO is a comprehensive SuperApp platform providing 18+ service verticals for residents, tourists, and investors in Phuket, Thailand. Real estate, transport, restaurants, beauty, healthcare, education, events, yachts, and more — all in one unified application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript 5.8 + Vite 5 |
| **UI** | shadcn/ui + Radix UI + Tailwind CSS (semantic HSL tokens) |
| **State** | React Context (12 providers) + TanStack React Query |
| **Backend** | Supabase — 134 Edge Functions, PostgreSQL with RLS |
| **Payments** | Stripe (checkout sessions, webhooks, vendor subscriptions) |
| **Maps** | Google Maps (`@react-google-maps/api`) |
| **Notifications** | Resend (email), WhatsApp integrations |
| **PWA** | vite-plugin-pwa with offline support |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/pavel949/myuno.git
cd myuno

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Fill in your values (see .env.example for details)

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key |

Edge functions also require secrets configured in the Supabase dashboard: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FIRECRAWL_API_KEY`.

## Project Structure

```
src/
  components/    — UI components organized by domain (75+ folders)
  pages/         — Route pages (78 files across 18+ verticals)
  hooks/         — Business logic hooks (370+)
  contexts/      — Global providers (Auth, Cart, Language, Currency, Theme, etc.)
  lib/           — Utilities, configs, taxonomies, adapters
  types/         — TypeScript type definitions
  integrations/  — Auto-generated Supabase types (DO NOT EDIT)

supabase/
  functions/     — Edge Functions (134)
  migrations/    — SQL migrations (DO NOT EDIT)

docs/
  architecture/  — Project structure, patterns, and key abstractions
  conventions/   — Coding standards and naming conventions
  reference/     — Database schema, Edge Functions reference
  guides/        — Setup and deployment guides
  audits/        — Audit reports and fix plans
```

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | Project structure, patterns, and key abstractions |
| [`docs/conventions/CONVENTIONS.md`](docs/conventions/CONVENTIONS.md) | Coding standards and naming conventions |
| [`docs/reference/EDGE_FUNCTIONS.md`](docs/reference/EDGE_FUNCTIONS.md) | Reference for all 134 backend functions |
| [`docs/reference/DATABASE.md`](docs/reference/DATABASE.md) | Database schema, tables, and RLS policies |
| [`docs/architecture/MCC_ARCHITECTURE.md`](docs/architecture/MCC_ARCHITECTURE.md) | Management company business logic |
| [`docs/conventions/UX_CONTRACT.md`](docs/conventions/UX_CONTRACT.md) | UX patterns and contracts |

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

The app is deployed via [Vercel](https://vercel.com). Push to `main` triggers automatic deployment. See `vercel.json` for configuration.

Backend Edge Functions deploy via Supabase CLI:

```bash
npm run supabase:deploy
```
