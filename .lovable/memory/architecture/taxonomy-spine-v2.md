---
name: Taxonomy Spine v2 (Wave A)
description: Forward-looking SSOT unifying 6 parallel registries into a single SpineAppNode shape. Derived from APP_REGISTRY; backfill of jtbd/personas/monetization happens in Wave C/E. Drift tracked in docs/audits/taxonomy-spine-drift.json.
type: feature
---

# Taxonomy Spine v2

**Files:** `src/lib/taxonomies/spine.ts`, `src/lib/taxonomies/spine/adapters.ts`, test `__tests__/spine.contract.test.ts`.
**Doc:** `docs/canonical/architecture/TAXONOMY_SPINE.md`.

## Hard rules

1. Spine derives from `APP_REGISTRY` — never edit registries from Spine in Wave A.
2. Every `APP_REGISTRY` id must have a Spine node (contract test enforces).
3. Untagged jtbd/personas/monetization is WARNING-ONLY in Wave A; becomes blocking in Wave C.
4. `Readiness` enum is fixed at 6 values: `ready / lead_only / preview / hidden / parked / deprecated`.

## DB enum alignment

`property_manager` added to `public.app_role` enum on 2026-06-27 (Wave A.5 migration). TS and DB now both list 18 roles.

## Wave roadmap

A (done) → B (leads_unified view) → C (DB enums sync, contract test blocking) → D (Geo hierarchy) → E (Monetization tagging + Spine becomes primary SSOT).
