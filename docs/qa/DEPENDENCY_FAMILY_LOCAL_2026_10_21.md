# Local dependency-family compatibility candidate

This branch is local only. No main merge, external integration branch push, deployment, production DB/access mutation or PR metadata action is authorized here.

## Reviewed sources

Main base fb4b944a4c736f680ddb8e4b178f833030e021b1; homepage600b1f95af93d9da538cc0f5491551472a7512b6, dates718b4d4c7fbe40d75e054c9fb33d09632556b6bc, React132fae881b24f34d098c5c49662dd1880815ed10, Hooksd35f96a573d06dd883ca49398c0def0a4d6cdc17, Refresh7f077402b88881adfba0604882ec929da0b63b32 and Tailwindf76f6500c8b97700bc4593584abee93b5afaf2ba. The integration preserves the semantic merge repair importing `within` in the homepage test.

Excluded: Lucide PR8 and its denied push repair, Auth WIP, UI51, company loading/checklist denied upload, critical booking writer125, transport backlog and FX writer. No excluded source is copied into this branch.

Ordinary strict-peer npm ci passed. Exact installed census: React/DOM19.2.4, Dialog1.1.17, DayPicker9.14.0, date-fns4.1.0, Helmet3.0.0, Vaul1.1.2, Tailwind/PostCSS4.2.2, tailwind-merge3.5.0, Hooks7.0.1, Refresh0.5.2, Lucide0.462.0. No peer bypass or weakened rule was used.

## Completed verification and retained failures

At runtime source fc552c1b80a6f31bb6152f0474cff895480971df (later180262496c6e546b7783ab36afb2b9a090bae142 adds only initial-theme fixture/docs): actual reference-build TypeScript passed in258.27s; seven focused migration files passed47/47. Full suite then exited1:3926passed/4failed in292files,1446.79s. Three failed files were ServiceRoutes (cold discover/services still loading at1s), RUdeveloper avatar menu (5s) and ReactRuntime SEOHead+Vaul (5s). All isolated PostgreSQL suites passed. This full result remains RED; no full repeat or timeout/assertion change is represented as a fix.

The unchanged three-file isolation passed25/26: only the cold services import reproduced. ReactRuntime3/3 and avatar7/7 passed there, but this does not erase their full-run failures. Resource snapshots and complete logs remain under /tmp/myuno-deps-family-*. Historical throttling/host delays were observed; they do not prove the failure cause. PSI files were absent and no OOM kill occurred.

A diagnostic wrapper around the actual registry lazy loader measured GoalEntryPage resolving successfully in1673.46ms, versus332.70ms for ServicesIndex; no rejection occurred. The wrapper and unsuccessful async-act-only experiment were removed. Installed Vitest documentation describes dynamicImportSettled as waiting for imports started by synchronous calls, including nested imports. The retained test mounts the real cold route synchronously, then awaits that API inside async act. No preload, mock page, arbitrary delay, modified deadline or assertion removal is introduced. All16service cases pass in7.93s with no suspended/act warnings. A prior three-file completion-wait check passed26/26; the final act wrapper additionally flushes completion and was checked on all16affected service cases.

Production build with synthetic localhost Supabase configuration passed in3m5s, including PWA generation. It retains the existing catalogue warning, large-chunk advisory and one unused malformed CSS utility auto-scanned from the comment at scripts/canon-scan.mjs:11; no validator or CSS pipeline was weakened to remove it. Generated version/MCP files were inspected and restored.

Full lint and actual main/App browser verification are still pending at this checkpoint. Combined candidate is not declared ready or fully green.
