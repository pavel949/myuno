# Canonical UI contracts — bounded migration checkpoint

Target: pavel949/myuno. This branch is not deployed and does not change backend, authorization, business records or financial rules.

## Implemented

- Existing SectionHeader is the shared presentation for PageSection, UnifiedSectionHeader, SectionTitle and homepage gallery headers. Named density variants preserve public/workspace hierarchy.
- Existing PageHeader actions distinguish native router links from imperative buttons, including portaled mobile overflow actions. Existing route/query destinations and callbacks remain intact.
- Section spacing scale, heading/content gaps, action glyph and touch targets use the existing token source. No additional theme/provider.
- Admin Today and PMS Today adopt PageHeader without changing their reads, authorization, refresh gating or named navigation.
- Existing vendor fields have instance-safe label associations. Delegated reports and insurance destinations are native links; property selection exposes pressed state.

## Evidence

Isolated synthetic component acceptance: 36 cases, RU/EN/TH ×390/1440 ×light/dark ×normal/spacing/icon source variants. The harness compiles a changed token source in memory, checks real computed geometry and exercises native links, history, mobile menu, focus and callbacks. Portal geometry is measured after the actual opening animation completes; no forced click or enlarged timeout.

Targeted tests: shared section contract 6, PageHeader 5, controls accessibility 5, Admin Today 9, PMS Today 32. Source-inventory parser 2. Final typecheck, targeted ESLint, design guard (zero new/structural findings) and production build passed. Actual-page source-token acceptance passed 114/114 cases across public Landing, PMS Today and Admin Today, including RU/EN/TH, light/dark, mobile/tablet/desktop, loading/error and one-source rebrand/spacing propagation. Source rebrand preserves semantic status colors and measured contrast. An interim PMS title hierarchy regression was found in screenshots and corrected with the existing H1 token before this final acceptance. Shared-component geometry/history/mobile-menu acceptance was repeated successfully after that correction (36/36). Controls browser acceptance passed at 390/1280 with the same Python driver pinned by CI. Exact-head remote CI is tracked separately; it is not implied by these local results. Screenshots use fallback fonts and synthetic reads, not authenticated production acceptance.

## Coverage and honest limits

`route-surface-register.json` inventories 712 route declarations and 596 template entries; declarations are not unique screens. `primitive-adoption-register.json` records 1,145 direct rendered primitive consumer files, 22 families. Each consumer remains NOTTESTED until its actual surface is exercised. The AST inventory handles named aliases but does not certify transitive, namespace or programmatic usage. These counts do not establish whole-platform completion.

Outstanding: remaining actual catalogs/details/forms/tables/overlays and role routes, unavailable authorized production sessions, full typography with downloaded fonts, remaining source-audit baseline exceptions. Preserve domain-specific calendars/maps/statuses and unavailable-action semantics. No live messages, bookings, payments, credentials, grants, migrations, merge or publication were performed.

Previous unpublished work is preserved separately: codex/ds-catalog-settings-20261024 at b811b8d933c1e50bc6f8c9d17a1015e273cc6bf5 and codex/owner-intake-20261025 at 0fb39b76297e450042cb63385b81e994edbfa1f5. They are not silently incorporated here.
