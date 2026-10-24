# Isolated pricing acceptance

Runs the actual `CalendarPriceEditor`, `OwnerCalendar`, shared calendar-price
hook, the two existing pricing SQL functions, and both canonical server quote
modules. Auth, property/category manifests, bookings/tasks and unrelated dialogs
are synthetic boundaries; the real Supabase client is replaced at bundle time.
The fixture HTTP adapter calls PostgreSQL over loopback. Browser and Node network
guards reject external traffic. No Stripe, production URL or secret is used.

## Reproduce (Node 24, Docker, Chromium)

Install this checkout's locked dependencies with `npm ci`. An older checkout's
node_modules is insufficient (the current main also needs Vercel telemetry and
the current react-day-picker API).

After checking the local Docker daemon, start a dedicated local fixture server:

```bash
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH \
  docker --host=unix:///var/run/docker.sock run -d --rm \
  --name myuno-pricing-acceptance-local \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 127.0.0.1:15439:5432 postgres:16
NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs' \
  node scripts/qa/pricing-acceptance/run.mjs
```

The database target is fixed at `127.0.0.1:15439`, user postgres; there is no URL
or environment override that could redirect it to production. Each run creates a
randomly named `pricing_acceptance_test_*` database, seeds synthetic records,
loads the **existing** migration functions, and drops that database in cleanup.
The container has no password/credential and is exposed only on loopback; stop
this task's container after testing with `docker stop myuno-pricing-acceptance-local`.

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if Chromium is elsewhere; the tested default
is `/usr/bin/chromium`. CSS is compiled by a CSS-only Vite server with config/env
loading, entry discovery and warmup disabled. Google Fonts and the app shell are
not loaded; screenshots use the project CSS with local fallback fonts.

## Evidence

`/tmp/browser/pricing-acceptance-20261024/` contains:

- `results.json`: named scenarios, request log, final synthetic DB state, source
  fingerprints and the checkout HEAD observed when the run finished.
- `unit-canonical-calendar.png`, `category-canonical-calendar.png`,
  `conflict-refreshed.png`, `permission-denied.png`.
- 24 category-calendar layout screenshots: RU/EN × 375/390/430/1440 ×
  UTC/Asia-Bangkok/America-New-York.

The harness stops at the first failed boundary, records the failure, screenshots
it and exits nonzero. A failed stale write must leave its winning price/audit
unchanged and expose the fresh visible price before a manual retry. Category
prices must stay separate from units and sibling categories, remain selected on
`/mc/calendar`, and flow into canonical category quote computation including the
rate-plan adjustment. Period endpoints, leap day, closures, invalid values,
identity/role/scope/currency denial and retry are checked against SQL.

## What this does not certify

The fixture's `auth.uid`, private property helper and Operating Space helper are
synthetic contracts. This proves the real pricing functions invoke and obey those
contracts; it does **not** certify the production helper implementations, real
JWT/PostgREST mapping, session behavior or all tenant roles. The price quote
endpoint imports the actual pure server modules; it does not run the deployed
checkout Edge Function, create holds/orders, or make payments. The metadata hooks
are synthetic projections. Real operator-session acceptance and live visual
comparison remain separate gates. No production business records are QA inputs.
