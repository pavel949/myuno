# Design-system convergence

This is an incremental migration of the existing myUNO system, not a second theme or a platform-wide visual sign-off. The starting main is `8b5a92a0df43feae188d89d1f7de91d5791f5816`. Production publication of that earlier homepage release was independently observed; this design-system branch is not published.

## One editable source

`src/styles/tokens.css` owns brand hue/palette, semantic surfaces, locale font anchors, font stylesheet metadata, type roles, named widths, gutters, card spacing and navigation clearance. Existing `ThemeProvider` remains responsible for light/dark/system and persistence.

- Brand: `--brand-hue`, `--brand-orange`, `--brand-cream`. Derived navy/dark hues follow the brand anchor. Success/warning/danger, category colors and explicit subbrands retain their meaning.
- Fonts: `--font-family-body`, `--font-family-display`, `--font-family-mono`; locale fallbacks share these anchors. For a new external font, configure its approved stylesheet in `--font-stylesheet-url` in this same file. Family changes do not manufacture font files.
- Type: `--type-*` roles feed Tailwind and responsive page heading/body styles. Existing numerical defaults are preserved.
- Frames: article/content/wide/workspace/catalogue/container/journey/home are distinct named purposes, not one width forced onto all workflows. `--layout-gutter` and `--layout-inset-scale` control insets; specialized calendar/map/table geometry is preserved.
- Surfaces: `--card-padding`, semantic card/background/border/text roles and existing radius/shadow primitives. The retired neumorphic alias explicitly resolves to no shadow.
- Navigation: PageShell and NavShell clearance roles share `--bottom-nav-h`, which already includes the safe area. Separate scroll owners retain their own clearance; physical device safe areas require device verification.

Vite generates first-paint bootstrap values from the actual CSS dependency closure and generates the three font links from its one URL. CSP, recovery scripts and the shared provider tree are preserved.

## Acceptance evidence and limits

The isolated design harness compiles actual Landing, PMS Today and AdminDashboard plus actual ThemeProvider, Button, Input and StatusPill. Its rebrand variant changes only the canonical token source in memory: hue, font anchors, inset scale, named width and card padding. Page source files are not changed; default source tokens remain the agreed theme.

The portal harness uses actual Vendor/Guest/Team/Capital/Developer layouts and actual owner dashboard with synthetic identity/read data and explicitly synthetic Outlet content. Shell evidence is not leaf-page, role authorization or backend acceptance. Shared-form tests use real primitives, dialogs and layered controls.

Screenshots and computed styles are associated with source hashes. External font requests are blocked in isolated fixtures, so current-brand font fidelity is unverified; generic system fonts provide the deterministic rebrand demonstration. Production mobile and physical safe-area acceptance are not claimed.

`route-surface-register.json` records 712 source route declarations, including aliases, conditional entries and layouts. It is not 712 rendered screens. Shared NOTTESTED defaults remain until an observation is explicitly recorded. Actual page/data/guard boundaries must be distinguished when adding evidence.

## Blocking guardrails

`npm run design:check` runs in prebuild and the unit quality gate. It parses real CSS, TSX strings and exact runtime variable producers, rejects undefined required tokens/cycles/parse errors and catches new raw colors/fonts/type sizes/local frame overrides. Exact installed Radix/Tailwind producer contracts and a single context-bound negative fixture are tested; no source directory is ignored.

`audit-baseline.json` is a fingerprinted migration-debt inventory, not approval of every retained design. Its source locations and signatures remain visible. New findings fail; `--ratchet-baseline` can only remove resolved entries and cannot waive structural problems. Do not recapture it to make new styling pass. Existing specialized/subbrand/test findings require explicit classification rather than blind replacement.

The dedicated read-only CI workflow retains synthetic screenshots, computed metrics and provenance. It does not seed a live backend, create bookings/payments or publish the app.

## Remaining scope

The shared foundation and representative adoption do not complete the requested whole-platform convergence. Continue through real public/property/service flows, account/stay, authoring/upload, owner/vendor/staff/PMS, admin/settings and Capital/Team/Developer leaf screens. Keep the route registry and evidence matrix explicit about shared adoption, observed pixels, regression checks and unresolved exceptions. No final platform-wide claim may be inferred from test totals or these representative screens.

## Foundation batch evidence (2026-10-24)

- Full TypeScript check, repository lint and production build: PASS. Generated version/MCP outputs were saved as build evidence and excluded from source changes.
- Isolated actual public/PMS/admin frames: 114 PASS, including one-source rebrand and loading/error variants. These are overlapping responsive scenarios, not 114 distinct workflows.
- Actual portal layouts: 180 PASS across six layouts, RU/EN/TH, 375/390/430/768/1440 and light/dark. A separate 12-case rapid-repeat check also passed: two clicks without intermediate readiness waits, matching DOM/provider/storage, unchanged route/draft mounts. The full portal matrix retains this regression alongside settled-switch checks.
- Shared forms/dialogs/sheets: 32 PASS; one-source card-spacing variant: 4 PASS. The synthetic bottom navigation now follows actual mobile visibility and the existing navigation-height token; desktop no longer invents a fixed overlay.
- Bootstrap/layout/presentation focused suite: 34 PASS; source guard wrapper: 2 PASS; guard-engine suite: 34 PASS; compiled typography acceptance: 8 PASS. These counts are separate scopes and are not summed as unique platform tests.
- Independent source review: GO for this bounded batch. Existing nested shell/page clearance ownership remains migration debt, not fully consolidated.

Pixels inspected include owner mobile, Team tablet dark, Capital desktop, mobile long dialog and rebrand primitives. Test controls and synthetic content are visibly labelled. Font loading, production roles/business persistence, physical safe areas and complete leaf-route visual acceptance remain UNVERIFIED. This foundation is not a claim of whole-platform completion. The 4,473 fingerprinted retained findings are an inventory to reduce, not approved exceptions or 4,473 proven user-visible defects.
