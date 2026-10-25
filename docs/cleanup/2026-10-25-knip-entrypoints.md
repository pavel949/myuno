# Knip entrypoint accuracy — 2026-10-25

Base: `775bd61cef82011eb1f530bcce8dfe666f661a03`, the actual main at branch
creation. Branch: `codex/knip-entrypoint-accuracy-20261025`. PR #179 is separate
and unmerged; its runtime deletions are not included here. No runtime file,
workflow, dependency/lockfile, route, backend or security setting changes.

## Exact scope and independent review

Independent reviewer `cleanup_source_review` returned GO before implementation.
The change corrects discovery roots, not issue suppression. No ignore, wildcard
entry or global `includeEntryExports` setting is added or changed.

| Changed entry | Actual consumer and evidence | Action |
|---|---|---|
| `src/sw.ts` | File absent. `vite.config.ts` uses VitePWA default generateSW; generated `dist/sw.js` is an output, not an authored TypeScript entry | Remove stale entry |
| `src/lib/mcp/index.ts` | `vite.config.ts` calls `mcpPlugin()` without an override. Locked SDK `@lovable.dev/mcp-js` 0.20.0 defines this default in `dist/stacks/supabase/vite.js` and bundles it from `configResolved`/`buildStart` | Add exact root; ordinary imports reach the three tool modules |
| `src/components/admin/dashboard/AdminKPIGrid.tsx` | `scripts/qa/moderation-queue-ui.mjs` generates a real import in its esbuild stdin, renders the component and asserts it is present in the metafile | Add exact fixture root; do not mark the mocked analytics hook used |

MCP root currently exports only the plugin-consumed default. KPI root exports
only the fixture-consumed component. Knip normally excludes entry-file exports
from unused-export reporting: future additional exports in either root need
review. This is a narrow, explicit entrypoint contract, not permission to put
unrelated helpers there or treat all exports in neighbouring files as used.

## Existing configuration retained

| Entry or ignore | Existing purpose / limitation; unchanged in this batch |
|---|---|
| `src/main.tsx`, `src/App.tsx` | Browser bootstrap and application root |
| Vite/Tailwind/PostCSS/Vitest/Playwright/Capacitor config entries | Tool-loaded configuration files, not necessarily imported by browser source |
| `supabase/functions/**/index.ts`, `api/**/*.{ts,js}` | Independently invoked edge/API entry surfaces; unused frontend references do not prove disuse |
| `scripts/**/*.{mjs,ts,js}` | Existing operational/build/QA script roots; generated source strings still need explicit consumer review |
| `e2e/**/*.spec.ts`, `src/test/**/*.{ts,tsx}` | Existing test entry surfaces; test-only use is real use |
| Project exclusion and ignore for `src/integrations/supabase/types.ts` | Existing generated type exclusion; this scan is not a generated-schema cleanup certificate |
| Ignore for `src/integrations/supabase/client.ts` | Existing client-result exclusion, not new evidence of disuse; application/QA network boundaries remain separate |
| `archive/**` | Existing historical-source exclusion; archived text is not a live consumer by itself |
| `**/__tests__/**` | Existing broad test-result exclusion is retained, not endorsed as a deletion heuristic; source/test consumers must still be checked independently |
| `tailwindcss-animate`, `@tailwindcss/typography` dependency ignores | Existing styling/plugin exceptions; animate is imported by Tailwind config. No broader dependency reclassification here |
| `autoprefixer`, `postcss`, `@rollup/plugin-terser` dependency ignores | Existing tooling exceptions; PostCSS config names plugins and Vite/PWA build uses minification. Exact necessity of each inherited ignore is not certified by this batch |
| `tw-animate-css` dependency ignore | Inherited exception for a package absent from the current manifest; remains an explicit follow-up question, not newly validated usage |
| `lovable-exec` binary ignore | Inherited platform-runner exception; not changed or used to suppress additional binaries |

## Before / after controls

Both scans use the same runtime source tree and locked Knip **6.16.1**. Only
configuration differs. Local Node: **24.19.0**. Source review is not replaced by
the fact that a scanner stopped reporting an issue.

| Known case | Before | After | Classification |
|---|---|---|---|
| MCP root + `tools/list-services.ts`, `tools/search-properties.ts`, `tools/whoami.ts` | Four unused files | Reachable | Plugin-discovered false positives, proven by actual plugin generation |
| `AdminKPIGrid.tsx` | Unused file | Reachable | Generated-fixture false positive, proven by real fixture build |
| `AdminActivityBlock.tsx`, `useAdminAuditLogs.ts` | Flagged | Still flagged | Reviewed orphan controls on this base; retirement belongs to separate PR #179 |
| `useAdminAnalytics.ts` | Flagged | Still flagged | Virtual QA stub is not a consumer of the production hook; lifecycle status still needs review |
| `readOperationalScope.ts` | Flagged | Still flagged | Planned/reference contract is not automatically dead code |

Unused files: **20 → 15**. Normalized full-report delta is exactly those five
file findings removed, **zero new findings**, all other path/type/symbol findings
unchanged: 1,266 exports, 468 types, 61 duplicate exports, 6 production dependency
findings, 1 development dependency finding, 38 unresolved and 125 unlisted imports,
43 binary findings. These are findings, not a clean-bill-of-health claim.

Counterfactuals confirm each root's scope: removing only the MCP root from the
new config restores its four file findings (**19** total); removing only the KPI
root restores its one file finding (**16** total). No unrelated finding disappears.

The real moderation fixture compiles **1,996** non-virtual inputs; KPI is present,
production analytics/stats hooks and Supabase client are absent. This is a bundle
consumer check, not a claim of browser execution. Actual SDK `configResolved`
generation in a temporary directory bundles source markers for the root and all
three tools; no handlers execute, no repository-generated backend file is written,
and outbound network is denied. CI results at the final head are recorded in the
draft PR; no manual duplicate workflow dispatch or CDN workaround is needed.

## Reproduce the scanner delta

Run at the PR head after `npm ci`, using the locked local binary. Findings keep
Knip's normal nonzero exit; inspect JSON rather than treating it as a clean gate.

```sh
git show 775bd61cef82011eb1f530bcce8dfe666f661a03:knip.json > /tmp/myuno-knip-base.json
node_modules/.bin/knip --config /tmp/myuno-knip-base.json --reporter json > /tmp/myuno-knip-before.json
node_modules/.bin/knip --reporter json > /tmp/myuno-knip-after.json
NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs' node scripts/qa/moderation-queue-ui.mjs --bundle-only
```

Normalize findings as `(issue type, file, symbol name)` tuples, ignoring source
positions. Assert the removed set is exactly the five files above and the added
set is empty. To reproduce counterfactuals, copy current `knip.json` to `/tmp`,
remove just one added entry from its `entry` array, and pass it via `--config`.
The full JSON reports remain report-only; no `--fix`/file removal option is used.

The plugin proof can be repeated without touching repository output:

```sh
NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs' node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/supabase/vite';
const root = process.cwd();
const temp = await mkdtemp('/tmp/myuno-mcp-proof-');
const sources = ['src/lib/mcp/index.ts', 'src/lib/mcp/tools/list-services.ts',
  'src/lib/mcp/tools/search-properties.ts', 'src/lib/mcp/tools/whoami.ts'];
try {
  for (const file of ['package.json', ...sources]) {
    await mkdir(path.dirname(path.join(temp, file)), { recursive: true });
    await copyFile(path.join(root, file), path.join(temp, file));
  }
  const plugin = mcpPlugin();
  await plugin.configResolved({ root: temp, envDir: temp,
    envPrefix: '__KNIP_ENTRY_PROOF_', base: '/' });
  assert.equal(plugin.api.mcpEntry, path.join(temp, sources[0]));
  const output = await readFile(path.join(temp, 'supabase/functions/mcp/index.ts'), 'utf8');
  for (const file of sources) assert.ok(output.includes(file), file);
  console.log('PASS: actual MCP plugin bundled all four source markers; handlers not run');
} finally { await rm(temp, { recursive: true, force: true }); }
NODE
```

## Rollback and performance boundary

Revert this config/documentation commit to restore the prior scanner behaviour;
runtime behaviour is unchanged. No speedup, bundle reduction, route parity change
or production-schema conclusion is claimed. Performance/legacy-route work needs
its own reproducible same-condition baseline and replacement/compatibility review.
