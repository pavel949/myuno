# Newbuilds first release — implementation brief

Repository: pavel949/myuno; baseline 775bd61ce. Domain change, not a new site.

## Sequence and acceptance
1. Repair project CTA contract and persist structured project/unit/intent in the existing consultation intake. A receipt requires an acknowledged persisted ID. No hold, payment or response-time promise.
2. Remove operator modules and real hold/checkout from public project tabs. One explicit public field projection and one status normalizer for buyer inventory. Unknown stays unknown; blocked is not sold, zero availability is not sold.
3. Stage source files offline with source identity/revision/hash, explicit price units and provenance. Quarantine ambiguity; never auto-publish or overwrite good data on parse failure.
4. Synthetic regression tests; draft PR only. Production acceptance requires verified backend project, privileges, material rights and supplied files.

## Canonical model / evolutionary target
Reuse developers, property_projects, project_units, floor_plans, property documents and consultation_requests. Developer brand differs from legal counterparty (explicit org/legal mapping required). Project → optional phase → optional building → physical unit; villa building is optional and has plot/home/pool attributes. Floor-plan/type is not a physical unit. Preserve UUID; myUNO short sequence and developer external code require stable unique constraints, never derive public short IDs from truncated UUIDs.

Offer revisions are immutable evidence linked to the physical unit: amount/currency/unit, source and effective/verified/valid-until dates, ownership/quota, payment schedule, mandatory/recurring costs. Construction, sales availability and transaction lifecycle remain distinct. Existing status and unit_status conflicts are unknown until reconciled. No destructive migration or catalogue deletion in this tranche.

## Routes and team handling
Existing Buy routes remain canonical: /property/offplan → /property/offplan/:id; resale remains the existing property purchase route. Shared header/layout is owned by concurrent #174 and excluded. Buyer project → unit → terms → documents/viewing/reserve request → consultation_requests receipt. Team uses existing AdminConsultations; metadata is structured, not embedded in a project-ID string. nb_leads remains historical; no dual write.

## Drive source registry contract (not connected)
Registry scope: developer_id + project_id + source_id; source types price_availability/media/floorplans/brochure/construction_update. Folder access does not grant publication rights. Stable provider file ID, revision and SHA256 identify inputs; source effective date differs from modified/imported timestamps. Versioned parser mappings normalize codes and explicit units. Stage diff/upsert only on exact project+unit mapping; duplicates, missing units, drastic changes and unknown rows need review. Absence never means sold. Failed refresh retains last-known-good, records failure/staleness and does not zero inventory. Manual refresh and eventual scheduler use the same adapter. Undo must restore batch before-images with concurrent-version checks; price/status history stays auditable. No OAuth or scheduler activated.

## Activation / rollback
NO-GO for live hold/payment, production schema/data, source scheduler and verified production readiness. Public read-only UI is not server authorization: existing project_units policies and service-role writers still require a separate restrictive deployment and authenticated actor/object tests. Rollback is code revert; staged local inputs are retained, no production records changed. Real files/links and material publication permissions are pending. Inventory and backup precede any demo classification; empty records are not proof of demo status.

## Source containment prepared, not deployed
The hold and booking-checkout entrypoints now have an unconditional request-only 409 gate before privileged clients. No new secret/env activation switch exists. Quarantined legacy code is retained for review, not considered fixed or safe to re-enable. `project-unit-containment.sql` is a review candidate only, not an applied migration; direct browser DML must be revoked after inspecting actual grants and operator needs. This deliberately blocks transaction activation; it does not certify production enforcement.

## Implemented scope and remaining gaps
Buyer units, plans and availability use one explicit-field project_units reader; status conflicts never restore availability and conflicting prices render price-on-request. Project-level price_from is withheld pending verified offers. Public terms name unknown mandatory/recurring costs rather than inventing them. Team metadata displays project, physical unit and intent in the existing consultations workflow. Only this project buyer path is converged; other legacy nb_leads entrypoints remain and require separate migration.
Persistent source registry/import batches, versioned offers, short myUNO number allocation, phase/building/type relations, live source parser and scheduler are target work, not deployed or implemented database contracts. Offline staging and undo are plans only; there is no database apply mode. Backend access and actual schema inspection are prerequisites to finish those contracts. Existing mocks/demo records and source materials were neither removed nor reclassified.

## Owner source confirmation — 2026-10-25 03:10 UTC
Owner confirms supplied working folders/prices as current business sources within their scope, even where file dates are old. Keep source effective/modified/imported dates and promo expiry, plus owner_confirmed_current_at and confirmation provenance. Old dates alone do not reject base prices; expired promotions are not reactivated. Partial feeds may update confidently matched listed units only, never infer missing units sold. Promotional-only totals with inseparable base prices require field review. Google Drive and Telegram sources share stable revision/message identity, explicit project/field priority and dedup contracts; actual connector/scheduler readiness is unverified.
