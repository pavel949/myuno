# Admin activity cleanup — 2026-10-25

Base: `775bd61cef82011eb1f530bcce8dfe666f661a03` in `pavel949/myuno`
(React/Vite, myuno.app). Branch: `codex/safe-dead-utilities-20261025`.
This is one bounded batch, not a claim that the application is fully cleaned.
Merge/deployment require separate authorization.

## Inventory and boundaries

Read `PROJECT.md` v3.2.1, `AGENTS.md`, local skill catalogue,
package scripts, TypeScript/Vite/Vitest/ESLint/Knip configuration and CI contracts.
Existing frontend design skills do not apply to this deletion-only runtime change.
The Supabase skill is relevant only to the read-only inventory/deprecation boundary;
no backend feature, live query, migration or deployment is performed here.

Verified source entrypoints and consumers:

- `index.html` → `src/main.tsx` → `src/App.tsx` → `AnimatedRoutes`.
  `pageRegistry.ts` supplies lazy pages; `routes/adminRoutes.tsx` maps `/admin`
  and `/admin/analytics` to the current dashboard/analytics pages.
- `package.json` is private with no `main`/`exports` library API. Internal barrel
  exports are still examined; published packages are not assumed consumers.
- Vite includes PWA/Workbox and Lovable MCP generation. The configured Knip
  `src/sw.ts` entry does not exist; generated service workers remain real build
  outputs. `.lovable/mcp/manifest.json` and the MCP plugin explain why the
  apparently unreferenced MCP implementation must be retained.
- `api/peylaa-og.ts`, edge `supabase/functions/**/index.ts`, package scripts,
  CI workflows, QA generated imports and tests are independent entry surfaces.
  The admin QA fixture imports `AdminKPIGrid` from a generated source string.
  It is retained even though Knip reports the file unused.
- Repository migrations contain RPC, trigger, policy, view and cron/HTTP job
  definitions. They describe source history, not verified deployed schema.
  `useAuditLogs.ts`, `admin-manage-user`, `admin-invite-user`, `stripe-webhook`
  and other handlers still consume/write `admin_audit_logs`.
- Browser `/install`, PWA buttons/provider, all public routes, edge endpoints,
  cron/jobs, email links and external integrations are retained. External
  consumption of public endpoints/assets cannot be disproved from this checkout.

Git refs confirmed the specified main and active route-layout/newbuilds branches.
Connected GitHub search confirmed open #174 and #175–177; no changes are taken
from them. Calendar/header/layout QA, workflows, property/newbuilds/domain/import
files and migrations are outside this batch. CLI GitHub API returned Forbidden;
the connected GitHub app successfully supplies PR inventory instead.

## Deletion evidence and independent source review

Independent reviewer `cleanup_source_review` returned **GO before deletion** for
the two files and one re-export, conditional on validation. Reviewer inspected
history, AST imports including literal dynamic imports, computed import sites,
generated QA source imports, package entrypoints and top-level effects.

`5727ee044` explicitly removed `AdminActivityBlock` and the dashboard barrel from
the real dashboard, adopting direct imports of the current task-first components.
At this base, only `dashboard/index.ts` references `AdminActivityBlock`, and only
that orphan component references `useAdminAuditLogs`. Neither file performs
requests/subscriptions on module evaluation: those effects are inside hooks that
have no reachable caller. No source glob loader or computed application import
loads them. Neither is a route, public endpoint, job, plugin entry or test target.

The dashboard barrel remains to avoid unnecessary import compatibility churn.
Its QA virtual alias exports three retained blocks and does not load the orphan.
The obsolete screen recipe is corrected to the existing dashboard composition.
No audit logging capability or production data is removed.

## Candidate and deprecation ledger

| Candidate | Evidence / classification | Risk | Action and rollback |
|---|---|---|---|
| `AdminActivityBlock.tsx` | True dead widget; retired by `5727ee044`; only orphan barrel edge | Low, bounded internal source surface | Delete; restore file and re-export from parent commit, or revert batch |
| `useAdminAuditLogs.ts` | True dead hook; only caller is orphan widget; no top-level subscription | Low; table itself remains active | Delete hook only; restore from parent commit |
| Dashboard barrel | Internal compatibility surface; QA virtual alias exists | Avoidable import churn | Keep all other exports |
| Screen recipe | Lists retired activity widget and old dashboard structure | Misleads future development | Update to current composition; Git revert |
| `AdminKPIGrid` | Test/QA-only consumer proven by `moderation-queue-ui.mjs` generated import | Tests are real consumers | Keep; no automatic dead-code classification |
| `useAdminAnalytics` | QA stub and historical analytics intent; stronger lifecycle evidence needed | Planned/retired status unresolved | Keep pending separate review |
| `readOperationalScope` | Knip unused but constitution cites reference/shadow controller contracts | Planned/inactive is not dead | Keep |
| `src/lib/mcp/**` | Plugin-discovered entry; MCP manifest and Vite plugin | External API compatibility | Keep |
| PWA banner/sheet | No runtime imports, but layout-test mocks and historical installation surfaces | Adjacent to protected #174 layout work | Defer; no layout/test edits |
| Six Workbox dependencies | Knip suspects unused; generated Workbox build consumes modules | Generated-code false positives possible | Keep; separate dependency/lockfile build analysis |
| `drizzle-orm` | Knip suspects unused; DB tooling/schema workflow requires separate review | Tooling dependency ownership | Keep |
| Knip duplicate exports (61) | Alias/re-export report, not proof of duplicate implementations | Semantic differences / public imports | Review individually later; no bulk consolidation |
| Public assets / flags | URL-based external consumers and remotely configured flags unresolved | Breaking external links or planned activation | Keep; require consumer/owner evidence |
| April cleanup roadmap | Historic recommendations/count targets include dropping empty tables | Conflicts with current owner restrictions and constitution | Do not execute it; this batch follows current request and PROJECT.md |
| `admin_audit_logs` and other DB objects | Active source writers/readers; live dependencies/retention/ownership unknown | High; audit retention and external integrations | No DB mutation; read-only plan below |

Knip baseline is candidate discovery only: 20 unused-file findings, 1,266 exports,
468 types, 61 duplicate exports, six production and one development dependency
finding. It also reports unresolved/unlisted references; it is not a deletion gate.

## Database deprecation plan (not executed)

Require an authorized connection to the actual target and a dated read-only
catalogue snapshot: FKs, dependent views/materialized views, functions/RPCs,
triggers, RLS/policies, grants, cron/HTTP jobs, edge handlers and integrations.
Identify the data owner and retention/audit obligations before proposing any
deprecation. Check external email/deep-link/API consumers independently of repo
imports. Record UNKNOWN where evidence is absent; zero rows never proves disuse.
Then propose compatibility/observability and an owner-approved retirement plan.
No DROP/TRUNCATE/record/column deletion, applied-migration edit, credentials,
grants, production settings or data changes are authorized by this batch.

## Validation and metrics

Baseline tracked `src/`: 3,074 files, 649,697 physical lines (all tracked source
assets/docs included). Production dependencies: 79; development dependencies: 27.
Runtime deletion: two files and 250 lines including the re-export; no dependency
or route change. Documentation is measured separately from runtime deletion.

Baseline production build: 2,385 output files; 87,426,383 bytes including maps and
public assets; 1,062 JavaScript files, 17,710,752 JS bytes, 5,407,943 independently
gzipped JS bytes; 413,188 CSS bytes. Both builds use synthetic loopback Supabase
values with `local-network-only.cjs` outbound denial. A dead-code cleanup need
not reduce runtime JS: these modules were already absent from reachable bundles.

After deletion: 3,072 tracked `src/` files and 649,452 physical lines (the README
adds five net lines). Dependencies remain 79 + 27. Output file count, total bytes,
JS file count, uncompressed JS and CSS bytes are identical to baseline. Independent
gzip total is 5,409,661 bytes (+1,718); build timestamps/generated metadata vary,
so no runtime-size improvement is claimed. Sourcemap source sets are identical
after normalizing the temporary generated Workbox `sw.js` path; the two deleted
modules were absent in both builds. Both builds transform 7,124 modules.

Admin fixture bundle before/after: identical 2,021 input entries. Route registries,
page registry, entrypoints, APIs and backend files are byte-identical to base.
Validation results and exact final commit are recorded in the draft PR; do not
substitute checks from another branch/head. The `admin-dashboard-ui.mjs` browser
runner is remote-GitHub-CI-only and its guard is preserved. Legacy e2e seeds the shared
backend and must not be dispatched for this cleanup.
