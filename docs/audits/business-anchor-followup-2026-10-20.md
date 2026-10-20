# Owner/business anchor and frame follow-up

Base: current main342e2ecb (merged PR145). This tranche is limited to owner and
business anchors, business framing/actions, and actual-component CI coverage.

## Changes

- Both owner hero links still use native `href="#paths"`. Their target now uses
  measured `--consumer-header-height + 1rem` instead of fixed96px.
- The business consultation button keeps its actual smooth `scrollIntoView`
  handler. Its target gets the same shared measured-header margin.
- Business sections use the existing marketing frame/gutters. The centered
  `max-w-3xl` hero and `max-w-2xl` consultation form remain explicitly narrow.
  CTAs use the existing flexible-height, full-text marketing button style and
  their row can wrap. Copy, routes, validation/submission logic are unchanged.

## Verification

The existing geometry matrix expands from75 to105cases: RU/EN/TH ×
320/360/640/767/1280px ×seven surfaces. It bundles actual ForOwners and
ForBusinessPage, real NavShell/ConsumerHeader, CSS and controls. The referral hook
is synthetic and the builder excludes its production data module. Supabase
access still throws; forms are not submitted by geometry tests.

Owner checks click both native hero anchors and verify their hash, shared
measured margin, settled target/heading geometry, and original path-card links.
Business checks click the real consultation CTA, verify its target settles below
the measured header, retain the form's672px maximum, and click the existing
partner CTA into MemoryRouter. Targets account for native end-of-document scroll
clamping. No harness scroll is used to manufacture anchor success. Failures keep
actual target/heading/observed-scroll geometry and results persist per case.

Local component/source assertions and bundle-only/syntax checks are distinct
from remote rendered geometry. Canonical Google Fonts remain unavailable under
network denial, so the established system-fallback limitation still applies.

## Explicitly deferred

- Consumer header gutters differ from ecosystem tokens at768–820px (18vs24px)
  and1024–1100px (24vs32px). No header-width changes are included here.
- BecomePartnerPage has PageContainer nested inside AppLayout's default page
  container in normal and success states (around197–198 and227–228). Removing
  nesting requires an explicit form-width choice and separate coverage. It is
  not changed or claimed complete in this tranche.
- No unrelated workspaces or wizards are changed.

No local browser, production data/permissions changes, merge or deployment.
Coordinator owns rendered acceptance and release after required current-head CI.
