# Approved dependency compatibility tranche

Current release candidate: 08a7da3f62147acece35662889d93603155c14dd, PR #208.

The remaining audit findings require compatibility changes beyond patch upgrades:

| Dependency | Current constraint / affected path | Proposed target |
|---|---|---|
| react-router-dom | 6.30.4; open redirect and SSR hydration advisories | 7.18.5 |
| glob | global override 10.4.5 and nested Workbox | 14.0.6 |
| minimatch | global override 9.0.5 | 11.0.8 |
| esbuild | nested Drizzle/MCP versions | 0.28.2 |
| postcss-selector-parser | Typography's version below 6.1.5 | Compatible 6.1.5 patch line |
| deepmerge | 4.3.1; latest npm release is still affected | Separate reviewed fix; no downgrade or version-only audit suppression |

Registry versions above were queried on 2026-11-15. The owner subsequently explicitly approved the major upgrades and compatibility checks. The changes are implemented on the isolated follow-up branch. The initial automatic approval rejection was resolved by that explicit approval.

Proposed execution after explicit approval: retain the current feature branch and baseline; update only these known chains; adapt Router API/route semantics where needed; verify direct/back/forward navigation, returnTo and role/scope guards; test build/PWA/Excel paths; run typecheck, lint, complete isolated suite and audit; update PR #208 with exact results. No automatic merge, production migration, hosted financial transaction or public deployment follows from dependency installation.

Rollback is the previous reviewed package/lockfile and matching source tree. A failed compatibility test stops the dependency cutover; no dependency advisory is marked fixed based only on its disappearance from npm audit.


Implementation detail: Vite 6 retains its declared compatible esbuild 0.25.12 through a scoped override; other tooling uses 0.28.2. Official npm advisory checks found no matching esbuild advisory for either selected version. An automatic review rejection of the scoped compiler was resolved with this read-only evidence before installation. The old global brace-expansion override was removed to preserve minimatch 11’s named API; JSX accessibility lint retains its compatible minimatch 3 API. npm is the reproducible package manager; stale Bun lock and redundant resolutions were removed.

Workbox/PWA are build dependencies. The remaining deepmerge advisory has no patched upstream release. Actual pinned node-resolve source calls it only with module-local defaults, then shallow-spreads options. This build-only path is reviewed as unreachable from untrusted input; the gate requires exact consumer hashes and rejects any additional advisory. It is not claimed as patched. Production audit: zero; complete audit: four reviewed low entries, no moderate/high/critical.
