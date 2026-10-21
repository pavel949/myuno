# Older UI PR triage and bounded salvage

Compared current main `796c0ee2a501e7c3feeac18ec25c96503daf0c69` and release
`f8a644ea87fda042fc8ca3e0d4a654177c505157` with the actual PR diffs. The same
outstanding issues below exist on both inspected targets. The candidate is based
on the release, with no edits to the release worktree.

## Decisions

### PR #32: extract accessibility repairs; do not merge the color sweep

Source: <https://github.com/pavel949/myuno/pull/32>, head `8aa3f35cb`, 97 files.

Implemented a bounded subset of missing accessibility fixes:
- `WishlistButton`: expose saved state in both variants.
- `NbLightbox`: localised control/link names and current thumbnail; closing the
  button now calls the existing close handler once instead of bubbling twice.
- `DealPriorityStars`: localised names and the exact selected priority, preserving
  the existing click-again-to-clear and disabled read-only behaviour.
- `ResetPassword`: name the visibility toggle using the existing translation
  keys; associate both visible field labels with their inputs.

The three equivalent `Auth.tsx` password-toggle labels already exist with
translation keys, so the old English/Russian replacements were not imported.

Do not take the mechanical palette changes as-is: the PR changes the `lost`
status in `AdminOwnerProspects.tsx` to `bg-destructive text-destructive`, making
foreground and background identical. Additional icon-label gaps (for example
property-carousel dots and owner setup-step state) and the `rounded-sm` lint
exception remain separate work, not evidence that the whole PR was superseded.

### PR #51: retain as a translation donor; split the remaining migration

Source: <https://github.com/pavel949/myuno/pull/51>, head `dcec76f92`, 302 files.

No i18n foundation or bulk component replacement is included here.

- Current `getStoredLang()` already handles Thai.
- Current `pickLang(language, values)` already implements Thai -> English ->
  Russian fallback. The PR introduces the incompatible reverse argument order
  `pickLang(map, language)` and would break newer consumers such as `TopBar`.
  It also replaces the exported `LangValues` type with `LangMap` while the
  current i18n barrel still exports `LangValues`.
- Current language switching already leaves the tree mounted and preloads
  English/Thai dictionaries on idle. The PR's initial dictionary-ready render
  gate is missing; review it independently with cold-load and rapid-switch
  tests, preserving idle preload and form state.
- Substantial translations are genuinely missing, not superseded: 223 changed
  existing files still exactly match their PR-base blobs. Examples include
  `BookingStatusTimeline`, `BookingConditionsChips`, listing-wizard steps,
  profile/security sections, transport booking steps, and MC/owner-portal pages.
  Port these in reviewed surface-sized tranches using the current helper API.
- Two touched components no longer exist (`MuunoScoreWidget` and
  `PropertyPreviewCard`). Do not restore them. The 12 `welcome.hero.pickTrip.*`
  Thai keys have no remaining component callers in the inspected source.

### PR #61: extract only the existing intake category

Source: <https://github.com/pavel949/myuno/pull/61>, head `cf415960d`, 13 files.

Implemented only `Other / Other business` in the existing category picker and
its label in the existing admin application list.

Source-level compatibility evidence:
- `supabase/functions/partner-onboarding-create/index.ts` accepts a nonempty
  category up to 100 characters and passes it to `create_partner_onboarding`.
- Migration `20260820001641_91b32dd0-940d-4a9b-a0b3-5c8a8d27eb4c.sql` persists
  the text category in the existing provider and pending application. New
  provider/marketplace vendor records remain inactive and unverified.
- Existing `VendorOnboarding` step 2 passes the category to `useVendorServices`
  with `is_active: false`; `vendor_services.category` is a text column.
- The admin list displays unknown categories as their raw identifier. Adding an
  `other` label is sufficient; no recategorisation UI is claimed.

Reject the PR's exchange-domain additions from this UI salvage. Its proposed
`20260625120000_currency_exchange_layer.sql` creates a parallel exchanger table,
allows owner `FOR ALL` writes without protecting verification/featured/tier
columns, grants generic `uno_team` global authority, seeds unverified factual
claims as verified listings/ratings, and adds a cron and manual rates. These
need a separate canonical-domain and security design. The current exchange
page's hardcoded rates/listings remain a separate known issue, not solved by
moving them into seeded database rows.

### PR #70: extract microsite tokens; retain the newer public landing

Source: <https://github.com/pavel949/myuno/pull/70>, head `5a1715ef2`, 65 files.

Implemented the isolated `ProjectMicrosite` semantic-surface/type cleanup from
commit `03212f451`, preserving existing copy, data, links and lead-form context.
The standalone page now explicitly imports the existing `newbuilds-theme.css`;
adding `nb-theme` alone would otherwise depend on visiting another lazy route
first to load its stylesheet.

Do not import the old `Landing.tsx` hero replacement or restore removed
`ClusterGrid`/`PrimaryGrid`. Current landing and business-intent work is newer.
The remaining persona/cluster hero consolidation is not fully superseded, but
is a separate aesthetic tranche, not necessary for this bounded repair.
Punctuation-only sweeps do not justify replacing current content.

## Verification and limits

- 16 focused synthetic component tests passed in 3 files.
- Changed-file ESLint: 0 errors, 8 pre-existing warnings for lightbox click
  surfaces and the legacy label rule. Actual reset-field accessible names are
  checked through DOM queries.
- `git diff --check` passed.
- Tests stub network/auth/data writes; no production business records changed.
- No full typecheck/build, browser screenshot run, deployment, push or merge.
  Browser visual review and aggregate CI remain integration gates. Source-level
  onboarding compatibility is not a claim that the live migration was applied.

## Isolated browser evidence fixture (authored, awaiting CI execution)

`scripts/qa/ui-backlog-salvage.mjs` follows the existing Vite-CSS/esbuild fixture
convention and invokes `scripts/qa/ui-backlog-salvage.py`. With Vite on port 8080,
run `node scripts/qa/ui-backlog-salvage.mjs`; `--bundle-only` checks the isolated
bundle without any browser, and `--build-only` prepares assets without launching.

The fixture covers RU/EN at 375/390/430/1280 px. It renders the real microsite
(including `NbLeadForm`), reset-password page, wishlist variants, priority
selector, lightbox and category picker. The admin category-label-only addition
is not included in this fixture. Existing Russian-only microsite copy is
preserved even under an English session; translation scope is not expanded.

Only explicit GETs for the fixture HTML/JS/CSS are served. All other browser
requests are denied. Database/auth/attribution boundaries are synthetic, business
writes throw, and the microsite view event is captured only in memory. Local SVG
images are explicitly synthetic. Tests do not submit either real form.

Direct microsite entry verifies the actual imported theme stylesheet is bundled
and applied: legacy aliases resolve to canonical tokens, form/input surfaces are
opaque, and the primary CTA has at least 4.5:1 contrast. The global Tailwind CSS
and esbuild's component CSS are separate files so the theme output cannot be
accidentally overwritten. Assertions also cover horizontal containment and the
changed controls' state transitions. Four screenshots per language/width and
`results.json` go to `/tmp/browser/ui-backlog-isolated` for CI visual review.

Authoring checks: fixture bundle, JavaScript syntax, Python compilation and diff
check passed. Chromium was not launched locally; no browser result is claimed.
