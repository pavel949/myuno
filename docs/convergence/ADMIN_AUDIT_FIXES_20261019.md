# Admin audit repair — 19 October 2026

## Scope
Routine UI repair after live read-only inspection of myuno.app build 3.55.5 (2026-10-18T20:49:30.232Z). This package does not change inventory, financial arithmetic, authentication, database schema or operational records.

- Property service/inspection Back and successful completion retain a property selected from the accessible collection.
- Provider detail `?edit=` opens the existing authorized provider after loading and consumes only its dialog parameters.
- Consultation filters include existing legacy vertical aliases and source case variants. Unknown request types render safely.
- Team searches show an explicit no-results state and reset.
- The admin property editor has one contained body scroller, protected actions and correctly layered nested photo dialogs. Cloud help describes public-link import, not private OAuth connectivity.
- Finance copy labels order-derived amounts as provisional and distinguishes the source and period. Missing payment method remains unknown. Amounts, queries, payment and payout controls are unchanged.

## Verification
Focused component/helper tests cover interrupted navigation, delayed loading, cancellation, no-results, aliases and payment evidence. The connected workflow adds the network-denying property-editor browser fixture at RU/EN 375/390/430/1280 pixels. Browser acceptance depends on the recorded CI result, not fixture compilation.

## Explicitly unresolved
The separate critical iCal inventory/authentication candidate, live reconciliation, staff/account association in pending PR96, guest category-to-booking integration, checked booking writer, resort scope isolation and complete accounting are not closed by this patch. No existing project or property mapping was rewritten. A published or green UI is not resort operational GO.

## Rollback
Revert this bounded frontend package if visual/navigation regression occurs. No business records, schema or credentials require rollback. Reverting truthful finance copy would restore misleading labels and should be avoided when a smaller forward UI correction suffices.
