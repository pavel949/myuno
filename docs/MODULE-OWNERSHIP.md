# Module ownership (myUNO)

Rough boundaries for reviews and PR routing. Not org chart — **who to ask first** when touching an area.

| Area | Path / scope | Primary concern |
|------|----------------|-----------------|
| MC workspace | `src/pages/mc/**`, `src/components/mc/**`, MC routes | CRM, properties, team permissions |
| Owner portal | `src/pages/owner/**`, `src/components/owner/**` | Owner dashboard, contacts, reports |
| Vendor | `src/pages/vendor/**`, `src/components/vendor/**` | Vendor subscriptions, listings |
| Marketplace / property hub | `src/pages/property/**`, discovery | Listings, search |
| Supabase Edge | `supabase/functions/**` | Auth, CORS, secrets, rate limits |
| Shared UI | `src/components/ui/**` | Radix/shadcn primitives — avoid one-off forks |

When adding features: check `CLAUDE.md` personas and `APP_ROUTES` in `src/lib/config/routes.ts`.
