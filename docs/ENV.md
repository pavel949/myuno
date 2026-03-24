# Environment variables (frontend)

Copy `.env.example` to `.env` for local development.

## Required for production build

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key (Dashboard → API) |

Validation runs in `src/lib/env.ts`: **production** builds throw if these are missing or invalid.

## Optional (features)

| Variable | Description |
|----------|-------------|
| `VITE_PUBLIC_APP_URL` | Canonical site origin without trailing slash (e.g. `https://myuno.app`). Used for **password reset** `redirectTo` so it matches Supabase Redirect URLs. Recommended on Vercel production. |
| `VITE_SUPABASE_PROJECT_ID` | Project ref (some tooling) |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps, Places, Geocoding |
| `VITE_BYPASS_COMING_SOON` | Set to `true` to skip Coming Soon gate locally |

## CI

GitHub Actions (`.github/workflows/ci.yml`) injects placeholder values so `npm run build` does not require repository secrets for public client keys.

## Backend / Edge (never in Vite)

Stripe, Resend, service role, AI keys, etc. live in **Supabase** and **Vercel** dashboards — see `.env.example` comments.
