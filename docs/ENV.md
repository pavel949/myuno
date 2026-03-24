# Environment variables (frontend)

Copy `.env.example` to `.env` for local development.

**Production (Vercel + Supabase dashboards):** step-by-step checklist — [`VERCEL-SUPABASE-PRODUCTION-SETUP.md`](./VERCEL-SUPABASE-PRODUCTION-SETUP.md).

**Pre-launch audit (data flow, Coming Soon, smoke tests):** [`PRODUCTION-READINESS-CHECKLIST.md`](./PRODUCTION-READINESS-CHECKLIST.md).

**Login works in Lovable but not on Vercel:** almost always different Supabase project in env — [`AUTH-LOGIN-LOVABLE-VERCEL.md`](./AUTH-LOGIN-LOVABLE-VERCEL.md).

## Required for production build

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key (Dashboard → API) |

Validation runs in `src/lib/env.ts`: **production** builds show a configuration screen if these are missing or invalid (and log the error). Values are **trimmed** to avoid accidental spaces from copy-paste.

## Optional (features)

| Variable | Description |
|----------|-------------|
| `VITE_PUBLIC_APP_URL` | Canonical site origin without trailing slash (e.g. `https://myuno.app`). Used for **password reset** `redirectTo` so it matches Supabase Redirect URLs. Recommended on Vercel production. |
| `VITE_CHAT_API_URL` | Optional. Full URL for **ChatWidget** `POST` (default `/api/chat`). Use when the static host has no `/api` route. See `docs/CHAT-WIDGET.md`. |
| `VITE_ADMIN_LOGIN_API_URL` | Optional. Full URL for **`/admin/login`** password `POST` (default `/api/admin/login`). Same-origin `/api/*` only exists if you add a Vercel/serverless route or proxy. |
| `VITE_SUPABASE_PROJECT_ID` | Project ref (some tooling) |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps, Places, Geocoding |
| `VITE_COMING_SOON_GATE` | Set to `true` to show **Coming Soon** for anonymous users (closed beta). **Default: off** — guests see the full app. |
| `VITE_BYPASS_COMING_SOON` | When `VITE_COMING_SOON_GATE=true`, set to `true` to open the full app without login (QA / demos). |

## CI

GitHub Actions (`.github/workflows/ci.yml`) injects placeholder values so `npm run build` does not require repository secrets for public client keys.

## Backend / Edge (never in Vite)

Stripe, Resend, service role, AI keys, etc. live in **Supabase** and **Vercel** dashboards — see `.env.example` comments.
