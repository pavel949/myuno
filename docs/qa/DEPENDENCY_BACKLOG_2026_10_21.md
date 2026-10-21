# Dependency backlog reconciliation — 21 October 2026

Inspected main: `fb4b944a4c736f680ddb8e4b178f833030e021b1`. The homepage proposal remains isolated in PR 156 (`f782951188ab35322a4f9ca06f8789185721b2ca`); this audit does not replace its layout or data contract. No main merge, force push, branch deletion, production activation, schema, access or credential change was performed.

## Small dependency updates

- PR 10, old head `7cf8eca6aad5c0847689d2d5d7f8c8baa9c8e2b6`, updated additively to `7f077402b88881adfba0604882ec929da0b63b32`. Preserves original ancestry and current main's dependency/security overrides. Diff from main is only the requested eslint-plugin-react-refresh 0.5.2 manifest/lock entries. Ordinary `npm ci --ignore-scripts --no-audit --no-fund` succeeded; full lint succeeded with 0 errors / 2491 warnings. No lint rule was disabled or weakened. Fresh CI: https://github.com/pavel949/myuno/actions/runs/39629491305 and https://github.com/pavel949/myuno/actions/runs/39629491167 . Terminal outcome must be read before readiness is claimed.
- PR 8, old head `934331116aacb1a02d86d857b3aec33c63df2434`, updated additively to `0eca8af3f6c5866e17e09ded3b06d7eff5af0b5d`. Diff from main is only lucide-react 0.577.0 manifest/lock entries. Ordinary peer resolution/install succeeded. Existing homepage catalog/community tests passed: 2 files, 12 tests. Runtime-export census found no missing icon values; its only apparent misses were 12 pre-existing `LucideIcon` type imports, which are erased types in the package declaration. Full TypeScript/build remain exact-head CI responsibilities. CI: https://github.com/pavel949/myuno/actions/runs/39630361309 and https://github.com/pavel949/myuno/actions/runs/39630361233 .

The historical failed dependency job logs have expired (GitHub HTTP 410). Their failure cannot honestly be attributed to a specific current dependency or reproduced from those missing logs. These updates obtain new evidence against current source instead. No `--legacy-peer-deps` or `--force` install option was used.

## Related migrations, not lockfile shortcuts

- PR 6 (`bb9e8a11c39ed68402df5e747347527a68a46648`): date-fns 4 conflicts with DayPicker 8's declared date-fns 2/3 peer contract. Related work upgrades DayPicker to v9 and migrates the shared calendar and its controlled date-search consumer, including native button/grid semantics. Required checks include real range/single selection, disabled days, checkout-only markings, keyboard/navigation, civil dates/timezones and styled mobile/desktop browser scenarios.
- PR 5 (`c84081ba457b7f213b943392e4e13c3dd1b04286`): React 19 requires matching React DOM/types and compatible react-helmet-async (current 2.0.5 declares only React 16–18). A React-only manifest change is insufficient. React 19's required ref initial values and scoped JSX types need source/type verification.
- PR 11 (`1473047699cf3f2892b8aa81309aa87ba5d62fcb`): Tailwind 4 needs the v4 PostCSS integration/CSS entry migration and explicit compatibility checks for tokens, utilities, preflight and all public/admin layouts. Current source uses the v3 `tailwindcss` PostCSS plugin and `@tailwind` directives. It must not be made green by suppressing CSS errors.
- PR 9 (`97092e3e6b41e7e0774e657d4e5be5ad22c7c2e1`): the new Hooks plugin's recommended rules must be evaluated against actual source; do not disable additional correctness rules merely to make the upgrade pass.

Primary migration references: [DayPicker v9](https://daypicker.dev/v9/upgrading), [React 19](https://react.dev/blog/2024/04/25/react-19-upgrade-guide), [Tailwind 4](https://tailwindcss.com/docs/upgrade-guide). Peer contracts were read from the npm registry for the exact package versions.

## PR 40 is not a lock-only change

Head `ae3388f7babd30a24ac231a8e28817c11ab6fa82` changes 21 files (+3401/-2756), including data repositories, wallet/order success surfaces, staff assignment UI and architecture tooling. Its title does not describe the full change. It remains untouched rather than importing stale behavior merely to clear a merge conflict.

| Proposed part | Current source comparison and disposition |
| --- | --- |
| Lock sync | Current main already passes ordinary clean `npm ci`; retain the current lock and hardening overrides. Old 5029-line lock churn is superseded. |
| New `src/data/repositories/properties/queries.ts` | Re-exports current property hooks but adds a future migration/import surface. Existing `src/hooks/useProperties.ts` remains canonical; no runtime capability is missing solely because the alias is absent. Do not introduce a second mandatory data layer for tidiness. |
| New `useOrderBySession` / `useOrderById` | These exact abstractions are absent on main. Current service/wellness success pages already read and poll their existing orders, and transfer success reads by ID. The proposed cache omits actor binding; the session key also omits projection. `isResolving` hides errors behind indefinite loading/polling. This is not equivalent to current bounded behavior. Do not port it without a corrected actor-bound/error/cancellation contract and tests. Current pages' own error/cancellation behavior is a separately identified residual, not certified by retaining them. |
| New `useWalletBalance` | Current BookingPaymentSelect already reads only the current user's balance without creating a wallet and retains `null` while unavailable. Existing `useWallet` is a different, side-effecting get-or-create/mutation API and is not a substitute. Proposed PGRST116-to-zero handling conflates zero and multiple rows; no need to import that abstraction to preserve existing read capability. |
| Staff page removal | Deletes 117 lines of property-assignment display/editing. Do not drop specialized workflow during an unrelated dependency reconciliation without verified replacement/equivalence. |
| Architecture ratchet | Main already has architecture-scan, connected verification, semantic and cleanup regression workflows. A different hardcoded cluster/data-layer rule is a new architectural proposal, not a necessary package-lock fix; reconcile against current constitution before adoption. |
| Graphify SessionStart hook | Installs an unrelated CLI package and changes agent setup automatically. Not needed for app/dependency correctness; not restored. |

No PR was closed or deleted. A superseded proposal remaining open is not an authorization to replay its removed workflows, helpers or installation hooks.

## Terminal verification checkpoint

Read from exact-head GitHub checks and completed job logs on 21 October:

| PR | Verified source head | Terminal outcome / evidence |
| --- | --- | --- |
| 10 | `7f077402b88881adfba0604882ec929da0b63b32` | Standard [39629491167](https://github.com/pavel949/myuno/actions/runs/39629491167) and connected [39629491305](https://github.com/pavel949/myuno/actions/runs/39629491305) succeeded. [Browser evidence](https://github.com/pavel949/myuno/actions/runs/39629491305/artifacts/12360482718). |
| 6 | `718b4d4c7fbe40d75e054c9fb33d09632556b6bc` | Date-fns 4.1.0 + DayPicker 9.14.0 migration complete. Standard [39635095570](https://github.com/pavel949/myuno/actions/runs/39635095570) and connected [39635095702](https://github.com/pavel949/myuno/actions/runs/39635095702) succeeded; 3914 tests / 288 files, 21/21 browser groups. [Browser evidence](https://github.com/pavel949/myuno/actions/runs/39635095702/artifacts/12363382715). |
| 9 | `d35f96a573d06dd883ca49398c0def0a4d6cdc17` | Hooks 7.0.1 using the package's documented custom configuration, preserving exactly the two existing rule IDs and severities. No React Compiler adoption or claim of compliance with its new recommended rules. Standard [39634902184](https://github.com/pavel949/myuno/actions/runs/39634902184) and connected [39634902371](https://github.com/pavel949/myuno/actions/runs/39634902371) succeeded; 3914 tests / 288 files, 21/21 browser groups. [Browser evidence](https://github.com/pavel949/myuno/actions/runs/39634902371/artifacts/12365150834). |
| 8 | Remote `0eca8af3f6c5866e17e09ded3b06d7eff5af0b5d`; local repair `09bcd9838f41629580bafee06c25a72ec85d9425` | Standard CI succeeded, connected CI exposed the real Lucide `.mjs` resolution incompatibility in two fixture builders. Their repair builds locally and UI-backlog 8/8 browser cases passed. One ordinary push returned `remote rejected ... (failed)`, exit 1; readback confirms remote unchanged. The remote reason is unknown, and push was not retried or routed through another write mechanism. Admin-shell browser execution remains CI-only; its guard was respected. |

The previous planning sections describe original incompatibilities; these exact-head terminal records supersede their pending wording. The Tailwind migration remains under local/CI verification, React 19 is owned by the operations workstream, and no integration or release acceptance is implied by independently green dependency branches.
