# Homepage and audience entry simplification — 24 October 2026

Base: `2fa3d90b42caf710c8c5300b5cf807f84a2774b5`, pavel949/myuno. Separate from PR166/167. No production publication, migration, access or business data changes.

## Implemented contract

- Keep the existing coastal hero, typography, header, reduced-motion and bottom navigation.
- One search entry offers all four existing query intents in a compact sheet: holiday `mode=rent&tenancy=short`, monthly `medium`, yearly `long`, purchase `mode=buy`. A choice goes straight to results; dates, area and other refinements remain optional in the existing results UI. No AI parsing or instant-booking promise.
- Six named, unique public homes with usable stored media are selected from at most18 public rental records, retaining existing featured/newest ordering. Failed media removes that candidate instead of displaying a placeholder. No inferred property type or invented ratings. Titles remain readable; terms occupy a consistent bottom row.
- Prices are displayed only when supported tenancy, currency and billing period are known. The current public list projection does not supply tenancy_modes, so its ambiguous rates are deliberately left on the detail page. No new columns, projection or grants are introduced.
- A short factual process explains listing → inquiry/details → confirmed terms. Sending an inquiry is not a booking.
- Kamala, Surin and Bang Tao link to existing guides as text. Project photography does not establish area photography. No unsupported area differences, stock substitutions or empty-photo blocks.
- Only complexes linked to the displayed public homes are presented, as text links. No per-project inventory-count waterfall, fabricated availability or unsuitable project-cover imagery.
- Experiences require usable stored media, capped at4. Successfully empty experience/service previews disappear; loading and read errors remain explicit with retry. Active real DB category records still determine service destinations. Service categories use a small grid with descriptions rather than a third repeated carousel.
- Homepage, cards and intent sheet use the existing semantic background/card/border/text/accent roles. No global theme replacement.
- Property detail links retain tenancy. An explicitly supported monthly/yearly intent selects the existing manager-request UI even on mixed short/long offers; the URL never makes an unsupported property eligible.
- Owner entry goes directly to the existing `/owner/management-landing` request. Unsupported occupancy/yield/SLA/fee claims were removed from this directly affected page. Self-management/account entry remains secondary.
- Existing HelpSheet and consultation/owner intake require nonblank server receipts before showing saved state. Optional private consultation readback failure is reported as unavailable without retrying an already accepted creation or fabricating a row. Pending locks prevent concurrent duplicate form submissions.

## Evidence and boundaries

Runtime fixtures use actual React screens/components and explicit synthetic catalog/auth/read adapters, with external traffic and production writes blocked. Hook regressions test missing receipts, failures, retries, accepted receipts with readback failures and duplicate pending clicks. These are not production transactions.

Actual-route browser checks distinguish reaching the property request/auth action or inquiry route from committing inventory. Service category discovery is tested; service fulfillment is not part of this change. Help/owner receipts acknowledge source-defined persistence; actual backend activation, notification delivery and staff response are NOT VERIFIED.

Client pending locks do not make an unknown-outcome transport retry idempotent. Existing server intake contracts have no stable request-id replay; this remains a separate backend prerequisite, not a claimed fix.

No unsupported main guard changes are imported. Any pre-existing stableLoadingShell failures must be shown separately from homepage regressions. No tests or thresholds are weakened.

## Required data, not invented UI content

- Licensed, correctly identified area photography and source-reviewed neighborhood descriptions.
- Correct canonical property type/title/media and safe published tenancy/rate metadata before displaying unambiguous homepage rates.
- Verified project photography if project image cards are restored.
- Actual experience supply with working media and service offering readiness beyond taxonomy navigation.
- Operational proof of inquiry readback, staff handling and optional notification delivery in an authorized backend environment.

Local screenshots: `/workspace/artifacts/myuno-homepage-intents-20261024/` (synthetic, not production). Exact tests, final SHA, CI and deliverable links are recorded in the PR once available.

## Local verification checkpoint

- Focused frozen-runtime regression report:101 passed,0 failed,0 skipped. Includes both real Landing composition/motion tests and shared form/receipt tests.
- Frozen runtime TypeScript build check:PASS. Scoped changed TypeScript lint:0 errors,5 warnings. Earlier full lint:0 errors,2486 warnings. Candidate production build:PASS; exact-head CI still required.
- Homepage synthetic matrix:18 passed (RU/EN/TH ×360/390/768/1440/1920 plus loading/empty/error). A final six-case short-screen/root-rem-text-scale/reduced-motion supplement passed. Gallery code validates four immediate intent destinations, arrow/keyboard/focus/swipe and no page overflow.
- Routed synthetic matrix:42 distinct cases passed, including current owner form. Explicit limits: no backend commit, authentication, payment, notification delivery or service fulfillment proof.
- Existing base2fa3d90b stableLoadingShell test independently reproduces2 failures (layout mounted twice, expected once),6 passes in a clean detached worktree. This homepage patch does not include an unrelated guard fix.
- Full local suite was run, not declared green:50 failures during an overloaded run; the serial retry separates environment/guard failures from these changes. Seven PostgreSQL suites cannot initialize because this executor has no `postgres` binary; hosted safe workflows install their isolated dependency.
- Geometry screenshots use fallback fonts. A separate attempt to load the exact existing Google Font assets did not complete. Direct public CSS read returned `Tunnel connection failed:403 Forbidden` for fonts.googleapis.com. No alternate route, TLS bypass or font substitution was used. Canonical-font visual acceptance remains UNVERIFIED; this does not prove the production site has a font outage.
