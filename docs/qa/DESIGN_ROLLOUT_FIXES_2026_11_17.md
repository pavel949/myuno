# Confirmed design-rollout fixes — 17 November 2026

Base: `0e599eaf467eed60d49f7f86e417f93bf364c345` (myuno React/Vite). This addresses confirmed findings from the fresh platform audit; it is not a claim that every screen/state has been visually accepted.

## Changes

- Remove reviewed decorative gradients from management/local-service/vendor landings, finance/portfolio/vendor payout cards, A/B hero preview and the admin AI panel. Retain semantic status colors, chart series, imagery/readability overlays and existing controls.
- Use the canonical foreground on the solid payment-method icon so the surface respects theme inversion.
- Replace unsupported vendor marketing promises (escrow, guaranteed payments, Friday payouts, fixed review/onboarding time, zero-commission trial and unverified tier entitlements) with the existing application/review/terms path. No payment, payout, commission, role or publication logic changes.
- Repair narrow owner-portfolio metric columns on mobile, and make the existing property destination a native keyboard-operable link.
- Supply Noto Sans Thai through the single canonical font stylesheet and locale stacks, including first-paint bootstrap dependencies. Primary Latin fonts remain Source Serif 4/Geist/IBM Plex Mono. RU/EN retain their existing Latin fallback order before the Thai fallback, preserving typography when external fonts are unavailable.
- Refresh the 715-declaration source route register and primitive inventory. Adoption checks now reject stale route inventory instead of approving a component inventory derived from it. These inventories explicitly remain SOURCE_ONLY_NOTTESTED; route declarations are not unique screens.

## Verification

The new `scripts/qa/design-rollout-surfaces.mjs/.py` compiles six actual changed leaf pages with explicit synthetic identity/read data and shell/payment-editor boundaries. It denies production backend modules and external browser requests; mutation handlers fail. The 96-case matrix covers RU/EN, 375/390/430/1440px and light/dark: no decorative CSS gradients, page errors, horizontal overflow or mutations; vendor registration destination and owner property keyboard destination remain intact; property metrics must fit one line. The workflow retains source hashes, outcomes and screenshots.

Focused bootstrap/font/design-inventory regressions passed (16 tests in 5 files), including rejection of an outdated route count. Source audit: 3,937 retained findings, 0 new/structural, 344 resolved baseline entries. The baseline is unchanged; these retained fingerprints are not a count of confirmed visible defects.

A separate local real-font check using the actual canonical compiled CSS and stylesheet confirms Noto Sans Thai is a custom downloaded font for both heading and body Thai glyphs. Isolated CI fixtures intentionally block external fonts and do not establish real-font fidelity. Production font verification must be recorded after publication.

TypeScript, lint, build, hosted exact-head CI and publication evidence are tracked in the PR/release receipt. An initial metric probe counted separate currency/amount text fragments as multiple lines and therefore failed all 16 portfolio cases even on desktop. It now checks distinct rendered line positions, retaining the real single-line readability assertion. Only the corrected run is accepted. Runtime generated version/MCP outputs are excluded from this frontend change.

## Limits and rollback

Private real-role admission, every remaining leaf state, physical safe-area/accessibility acceptance and pixel comparison to an external wireframe collection remain unverified. Shared tokens or a representative fixture do not prove those claims. Existing source debt requires classification; do not mechanically rewrite status colors, specialist geometry, image overlays or approved brand exceptions.

No SQL, Edge, financial writer, inventory, auth/RLS or real business mutation changes. Frontend rollback is a revert of this PR and republish; no data reversal. This does not merge financial PR #208 or activate payment features.
