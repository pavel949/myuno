# Phased execution continuation — 2026-10-17

User-authorized continuation of the connected-system plan. This register is dated implementation evidence, not another product constitution or proof of production readiness.

## Starting point and parallel work

- Main baseline: `770b2cb4659da4a595ebcf11e8fb4179b66cded9`, merge of PR #89. Its tree is identical to the tested `b0e8a2e90f186257013db5651ed10d76778934fd` tree.
- PR #89 evidence: 1,718 tests, 88 focused tests in each of three timezones, 15 backup cases, types/build/lint/browser PASS. Existing 2,505 lint warnings remain backlog.
- Read-only inventory: 115 branch heads and 28 open PRs. Fresh separate work is PR #88 (PROJECT v3.2/documentation); older open PRs are not assumed to be active sessions.
- PR #88 head reviewed: `2bb5111888131ecc7d8174fa3ec9b7dd399dfa15`. Its five documentation paths do not overlap PR #89's changed paths. However, shortening AGENTS removed concrete checked protections. Stacked [PR #90](https://github.com/pavel949/myuno/pull/90) preserves them without writing into the author's branch.
- Old dependency PRs touch package/lock files and can invalidate the repaired lint dependency graph. PR #51 changes 302 files, including PropertyIndex. Reconcile these against current main before considering integration; no stale PR was merged by this continuation.

## Implemented candidate changes

### Release verification coverage

The connected-system workflow now checks pushes to `main`, PRs targeting `main`, and manual dispatch. The historical codex-branch push trigger is removed. Per-event/ref concurrency cancels obsolete checks while preserving distinct main/PR evidence. Existing verify status names, synthetic configuration, network boundaries, outcome gate, evidence upload and manual-only seeded legacy E2E remain.

This is verification coverage, not a claim that Vercel automatically waits for these checks before promotion. Deployment-check configuration and required branch checks remain separate release concerns.

### P0-A / PC-07 bounded response integrity

`confirm-transfer-operator` previously treated a failed reject UPDATE as an already-cancelled success. A zero-row conditional confirmation also claimed already-confirmed even if a competing cancellation won.

- Returned UPDATE error now yields HTTP 500.
- Zero-row conditional UPDATE now yields HTTP 409 and asks the caller to reload.
- Existing already-confirmed replay remains HTTP 200 without invoking downstream side effects.
- Actual-entrypoint synthetic harness uses HMAC, denies ledger/refund/notifications/network, and checks these five boundaries.

This does not close PC-07: signed operational acceptance's commercial/ledger authority, cancellation-before-refund, and reversal ordering remain unresolved. No financial policy, money writer, SQL, authorization grant or live operation is introduced. A deployed function and hosted acceptance are not claimed. Rollback is a code revert; no data/schema rollback is needed.

## Deployment evidence and limits

GitHub commit statuses for main `770b2cb` reported successful Vercel deployments for both `myuno` and `pavel949-myuno`. The direct Vercel connector returned project-not-found for those names and listed zero accessible projects under the known team, although the team itself was visible. The custom-domain-to-project mapping therefore remains unverified through the connector; GitHub success is not a hosted booking/payment acceptance test.

All seven workflow sources were reviewed. None deploy `scheduled-mc-backup`; the package deploy script names two unrelated partner functions. Vite's MCP generation is not backup deployment evidence. External Lovable deployment behavior is not inferred from repository files. Backup source/deployed parity and restore acceptance remain unverified.

## Client deployment detection and build provenance

The existing watcher compared only APP_VERSION, so distinct deployments at the same semantic version did not notify. The actual prompt also rejected same-version events and stored dismissal by version. The candidate now shares validated commit/build-time comparison, injects the build commit, carries an optional deployment key to the real prompt, and dismisses only that deployment. Version-only event compatibility is retained. A newly available commit can notify without changing the public-facing version label; SHA values are not displayed in the prompt.

A hidden-tab fallback now requires the current poll to confirm availability; an old notification, failed HTTP response, malformed metadata or offline state cannot alone trigger navigation. The existing ten-minute threshold remains. Actual Watcher/Prompt and isolated navigation-boundary tests cover these paths without clearing business drafts.

CI validates dist/version.json against the package version and CI source commit and uploads the metadata as evidence. This cannot prove what a custom production domain currently serves.

Live public read at https://myuno.app/version.json redirected to https://www.myuno.app/version.json and returned version 3.55.5, buildTime 2026-10-17T09:52:24.922Z, with no commit field. Thus domain-to-main parity is UNKNOWN despite successful Vercel statuses; this observation does not identify the hosting/cache root cause or prove which frontend bundle executes. No DNS, project, deployment or cache configuration was changed.

## Ordered remaining gates

| Stage | Current disposition / required next result |
| --- | --- |
| Coordination/docs | Review PR #90 into #88, then review the combined documentation against current main. This is documentation readiness only. |
| Current release | Confirm actual production-domain project, deployed SHA and backend function parity with read-only evidence. |
| P0-A financial decisions | Resolve PC-01 pricing/discounts, PC-02 override/on-behalf, PC-03 receipt/FX/tolerance, PC-04 installment/reversal/operational acceptance, PC-05 merchant/commission contracts. Ownership of tariff entry does not resolve calculation or settlement rules. |
| Financial implementation | Exact isolated actor/quote/receipt/replay/inventory tests and reviewed atomic writer changes; record GO-A/NO-GO. No implicit GO from this response-integrity patch. |
| Real space manifest | Verified company/property/member IDs and existing duties; no invented assignments. |
| Shadow setup | Reviewed data setup with enforcement OFF; resolver, ready-ID and cache isolation proof. |
| E3 | Properties → Calendar → Today → Bookings through existing actor-bound scope; lists/details/deep links/export, checked property creation and coordinated server ceilings. Not started by this candidate. |
| Controlled activation | Isolation/revocation/direct-ID/cache gates; unsupported finance/CRM/export denied until their gates; supervised cutover and rollback. |
| Closed-loop acceptance | Separate isolated booking/payment/check-in/out/cleaning/report environment before any agreed real business acceptance. |
| E4 | Existing employee duties, data entry, housekeeping/maintenance/tasks and private HR; remove duplicate writers through explicit adapters. |
| E5 | Reconciled currency/ledger attribution, owner reports, backup source/storage/version/restore contract. |
| E6 and P1 | Founder consolidation, Agent, Homes Rent/Buy, Identity/CRM, Services Marketplace and remaining consumer/owner surfaces on canonical existing sources. |

## Verification

Local actual-entrypoint conflict harness: 5/5 passed on Node24. Final branch SHA, CI results and artifact links belong in the companion PR. Authored tests or prior PR #89 results must not be substituted for this candidate's CI outcome.

No production business writes, payments/refunds, notifications, migration, edge deploy, publish, seed, assignments or enforcement were used. User business decisions remain pending where recorded; elapsed time or plan authorization does not supply missing contract values.
