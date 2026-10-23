# PR1 / PR36 instrumentation reconciliation

The old proposals injected analytics unconditionally at bootstrap and mounted SpeedInsights outside the router, with an unrelated second pnpm lockfile. This npm/Vite application now has one optional, deferred public instrumentation component inside the router. PR36 carries the combined replacement; PR1's original standalone injection is superseded, not silently reintroduced. Neither original PR is closed or deleted by this work.

Default is OFF. Only an explicitly configured production build (`VITE_VERCEL_TELEMETRY_ENABLED=true`), myuno.app/www.myuno.app over HTTPS, analytics consent and an allowlisted public discovery route can load the SDKs. Initial URLs containing query/hash do not load scripts. Before every event the current route and consent are checked again; event query/hash are removed. Private/unknown paths, external event origins and all preview/other hostnames are dropped. The optional Speed Insights route field is replaced with the sanitized public pathname too. This does not change the existing first-party analytics domain or database.

No production environment, account product, billing, DNS, collector, proxy or settings were enabled. Lovable production does not imply Vercel collection endpoints exist. Activation requires separate verified hosting/endpoint readiness; absence stays disabled, not a claimed live integration. Do not enable the flag as a workaround for unavailable ingestion.

Official API references: https://vercel.com/docs/analytics/package (beforeSend returning null, explicit endpoint configuration); https://vercel.com/docs/speed-insights/package. This is a source-level restricted integration, not certification of deployed collection or a general privacy audit.

Local validation: ordinary npm ci; 25/25 tests across four files, including route/preview-host and actual consent-cache changes; changed-source lint has no errors. Independent source review GO preceded the final route/hostname hardening. Exact-head CI remains the authority for the full suite/build. No live collection acceptance is claimed.
