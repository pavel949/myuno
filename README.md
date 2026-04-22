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

### Canonical Documentation (single source of truth)

Перед любым продуктовым, UX-, контентным или архитектурным решением — **читай документы из [`docs/canonical/`](docs/canonical/)**. При расхождении кода/UI с этими документами правится код, а не документ.

| # | Document | Description |
|---|----------|-------------|
| 01 | [`docs/canonical/01-segmentation-framework.md`](docs/canonical/01-segmentation-framework.md) | 3-осевая сегментация, 25 персон, 10 кластеров, CRM-поля |
| 02 | [`docs/canonical/02-service-catalogue-v2.md`](docs/canonical/02-service-catalogue-v2.md) | 16 категорий × 230 услуг с тегами lifecycle/role/cluster |
| 03 | [`docs/canonical/03-tone-of-voice.md`](docs/canonical/03-tone-of-voice.md) | Канонический голос бренда |
| 04 | [`docs/canonical/04-implementation-protocol.md`](docs/canonical/04-implementation-protocol.md) | Operational playbook M1→M7 |
| 05 | [`docs/canonical/05-visual-design-system.md`](docs/canonical/05-visual-design-system.md) | Визуальная дизайн-система v1.0 |

См. также [`docs/canonical/CHANGELOG.md`](docs/canonical/CHANGELOG.md).

### Other references

| Document | Description |
|----------|-------------|
| [`CLAUDE.md`](CLAUDE.md) | AI assistant instructions — start here for any AI-assisted work |
| [`DESIGN.md`](DESIGN.md) | Design system DS 2.1 — colors, fonts, spacing, motion (source of truth) |
| [`project.md`](project.md) | Comprehensive system spec — verticals, CRM, flows, known gaps |
| [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) | Environments, databases, credentials reference |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Coding standards and naming conventions |
| [`docs/UX_CONTRACT.md`](docs/UX_CONTRACT.md) | UX patterns v2.0 — DS 2.1 aligned (dark-first, cluster accents, fonts) |
| [`docs/EDGE_FUNCTIONS.md`](docs/EDGE_FUNCTIONS.md) | Edge Functions overview |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Database schema, tables, RLS policies |
| [`supabase/functions/_docs/API_REFERENCE.md`](supabase/functions/_docs/API_REFERENCE.md) | Full API reference for all Edge Functions |
| [`handoff/ARCHITECTURE_V2.md`](handoff/ARCHITECTURE_V2.md) | Architecture v2 blueprint — roles, clusters, surfaces, hard rules |
| [`handoff/FEASIBILITY.md`](handoff/FEASIBILITY.md) | Architecture v2 migration path and per-role implementation status |

### Archive

Stale and superseded documents are in [`archive/`](archive/). Each file has an `ARCHIVED:` header with the reason and superseding document. Do not reference archived files in new code — follow the superseding document instead.

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
