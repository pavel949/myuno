# myUNO DS 2.1 convergence — audit and migration gates (2026-11-15)

## Authoritative source

- Runtime source: `src/styles/tokens.css`; do not introduce a second token registry.
- Canon: `DESIGN.md`, `docs/DESIGN_TOKENS.md`, `docs/canonical/05-visual-design-system.md`.
- Shared primitives: `src/components/ui/{button,card,input,select,badge,tabs,alert}.tsx`.
- Shared shell/spacing: PageShell, NavShell and `--bottom-nav-h`; never layer competing safe-area offsets.
- Existing enforcement: `npm run design:check` and `scripts/design-system-audit.mjs`. Preserve the fingerprint baseline; do not recapture it to hide debt.

## Findings grounded in repository

- The 2026-10-24 convergence report explicitly states that foundation/portal harnesses do not certify every leaf route.
- The inventory contains 4,472 retained fingerprints at its referenced snapshot, not 4,472 confirmed live visual defects.
- Legacy local presentation remains in public services, transport booking, admin CRM, and miscellaneous pages.
- Canon requires sharp corners for primary controls; avoid blanket `rounded-lg/xl` migration.
- The existing shared Button/Input/Card/Select/Badge already use semantic tokens and sharp corners. Replace local reimplementations rather than changing these primitives blindly.
- Previous booking UX changes in this PR introduced rounded surfaces. This tranche restores canonical sharp corners in Fast Track, service category cards and transfer checkout.

## Migration batches

1. **Foundation**: verify tokens, typography, radii, focus, tap targets, status semantics, disabled/loading, overlays, safe area. No new palette or duplicate tokens.
2. **Shared commerce**: centralize service card, price/quote label, step progress, booking CTA and request-received states. Preserve distinct pricing and payment contracts.
3. **Public flows**: home, discovery, property, Fast Track, transfers, yachts, flowers, home service requests. Test RU/EN/TH and 375/390/430/768/1440 widths.
4. **Portals**: owner, vendor, PMS, admin, Capital, Team and Developer shells, then real leaf routes; do not infer leaf coverage from shell tests.
5. **Release**: run `npm run design:check`, TypeScript, lint, build, targeted visual harnesses, keyboard/screen-reader checks and device safe-area acceptance; record before/after screenshots and remaining fingerprints.

## Acceptance rule

A shared primitive migration is accepted only if its real consumers remain accessible, its token values resolve, no new design audit fingerprints are introduced, and booking/business behavior is unchanged. Production visual parity and whole-app adoption remain **NOT VERIFIED** until actual routes are rendered and inspected.
