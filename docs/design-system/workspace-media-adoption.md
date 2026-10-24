# Workspace and media follow-on adoption

This is a separate, in-progress batch based on draft #170 at `1111c7505e5df64b8308c38ae466f2b560dcc37e`. It is not published and does not certify full route, authorization or backend acceptance.

## Scope

- `OwnerDashboard` populated management workspace (`/mc`, beneath ActiveCompanyProvider/MCGuard/MCLayout): use the existing named workspace width instead of a local 1536px limit. The intentional `max-w-2xl` first-time onboarding cap (672px in the current Tailwind configuration) remains a documented exception, not a new global default.
- Vendor dashboard (`/vendor`, beneath VendorRouteLayout) normal/loading frames: reuse PageShell and the same width/gutter source. VendorLayout → AppLayout → NavShell owns mobile bottom-navigation clearance; verify the final content above a matching synthetic fixed navigation, without counting the synthetic shell as actual role acceptance.
- Vendor settings (`/vendor/settings`): KEEP. Existing PageContainer/Card/Input roles are already canonical; no cosmetic churn. Disabled coming-soon actions remain disabled.
- Media: use a dedicated, fixed inverse canvas/foreground pair in the existing token source. This role must not alias the action foreground, which changes with dark mode. Keep specialized crop/viewer bounds and business callbacks.

## Coverage limits

Actual page/component fixtures will be listed with fresh evidence after execution. Nested widget adapters, synthetic reads/auth and fallback fonts remain explicit limitations. Vendor order hooks do not expose a page error state, so that state is not certified by a loading/normal screenshot. No real role changes, uploads, AI enhancement, business writes or production tests are permitted.

Remaining route declarations retain NOT TESTED unless independently exercised and recorded. A shared CSS inheritance claim is not a screenshot or an end-to-end acceptance result.


## Completed workspace evidence

The actual three page frames passed 56 EN/RU light/dark contexts at 390/768/1024/1440, including Vendor loading and management first-time onboarding. The latter remains 672px under the existing Tailwind `max-w-2xl` configuration. One Vendor unit and a behavior AST comparison passed; the comparison normalizes only the reviewed wrapper/classes and permitted cancelled-status palette. Business handlers, calculations, query/mutation payloads and permission predicates are unchanged.

Actual mobile screenshots revealed wrapped currency/status in a recent order. The existing action group now wraps as a unit and keeps amount/status unbroken. Full alpha compositing of badge→muted row→card→page found dark cancelled text at 4.451:1 with a 20% danger fill; using the existing 10% fill yields 6.792:1 light and 5.367:1 dark across all 16 Vendor populated contexts, asserted against the unchanged 4.5 threshold. External transport and writes remain blocked. Pixels were inspected; fonts are fallback geometry only.

A Python raw-string repair after local capture changes no evaluated string constants (AST comparison), and removes the warning without altering fixture JavaScript. Exact-head CI must rerun the retained helper. Source guard ratchets 4299→4296 with zero new/structural findings. Media integration is now included below.


## Media and canonical Button typography

The actual viewer/editor and real lazy cropper passed eight contexts: EN at 390 px/RU at 1440 px × light/dark × default/reduced motion. Synthetic images, blocked external transport, and forbidden AI/storage/save calls keep this a local UI acceptance, not a production upload or business workflow test.

Bright photos previously erased white arrow icons; the shared inverse canvas scrim now gives 5.742:1 against a worst-case white photo. The viewer reuses the existing Dialog for focus containment/scroll lock and has connected/non-inert opener restoration, one close callback, named/current thumbnails and controls with a 44 px minimum from the existing touch-target token. An actual first-frame check caught inherited centered dialog zoom/slide; scoped no-animation variants retain static full-screen geometry. Local rotate, resize-crop, apply and undo passed without backend writes. Specialized editor bounds and vendor cropper styling are retained.

Pixel review exposed a second typography inheritance bug: an Undo Button inside DialogTitle inherited display/serif family despite body text size. A fresh browser regression failed with Source Serif 4 versus expected Geist body family. Shared Button now selects existing locale-aware font-sans/--font-body; callers can still explicitly override it. Six merge regressions preserve family, medium weight and caller choice. The real shared fixture checks body family inside a display-font parent and changes --font-body alone to monospace and sans-serif; original font settings are restored before accepted screenshots. Existing checks for a 15 px Button inside a 31 px parent and a 21 px size token remain intact.

Combined local checks: 68 focused tests, typecheck and production build PASS; lint zero errors/five existing warnings; fresh 56 workspace, 8 media, 32 shared and 4 one-source rebrand contexts PASS (overlapping fixture observations, not unique end-to-end journeys). Representative fresh pixels were inspected after the body-family fix. Initial unsupported Testing Library exact options were removed; role-name matching remains exact by default. Source guard retains 4281 findings, zero new/structural, down 18 from the parent batch. Most source routes remain NOT TESTED; fallback fonts do not certify production typography. Exact-head CI is required before any merge/release review.
