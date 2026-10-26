# Master Catalog → myUNO crosswalk (source review, not an import)

Master candidate: `[MASTER_CATALOG_SOURCE]` (configured only in the private operator source registry).
Tab names and candidate codes supplied by research handoff; sheet columns/rows have not been directly verified in this implementation workspace. Repo source is verified at baseline 775bd61ce; deployed schema is not verified. No new schema was applied.

| Master candidate | Existing myUNO source | Mapping / gap |
|---|---|---|
| Project codes IE-024/IE-050/IE-053 | property_projects UUID + slug, offplan_catalog legacy_id | Persist explicit reviewed external-key crosswalk; do not match by fuzzy name or substitute Master code for UUID |
| N03 Buildings | project_units floor/floor_number; floor_plans project link | A floor-plan level is not a building. Optional phase/building FKs need additive design after actual schema inspection; villa may have neither |
| N04 Physical Units | properties.id via project_units.property_id; project_units.id + project_id + unit_code identify sales inventory | Preserve codes as strings, including 020701. Project+code mapping must be unique before automatic upsert; properties.id remains the physical UUID; preserve the existing sales bridge |
| N05 Offers | project_units price/currency and price_thb; no proven versioned newbuild offer table | Existing property_price_offers is rental/property-linked (booking_id/nights), not a safe reuse for developer offer revisions. Additive revision design needed, never duplicate physical units for LH/FH offers |
| N06 Sources | property_projects.offplan_catalog JSON provenance + local source registry | File/folder/official-web identity, effective date, revisions and publication rights staged locally. Persistent registry/batch history and scheduler not deployed |
| N09 Unit Types | development_units (legacy type aggregates), floor_plans, project_units.unit_type | Types/plans are templates, never availability authority. Preserve legacy rows until reviewed mapping and backup exist |
| N12 Payment Plans | property_projects.payment_plan/payment_plan_template, nb_special_terms | Template terms differ from payment_schedules, which belongs to a reservation. Do not create schedules or payable obligations for enquiries |
| Buyer enquiry | consultation_requests + vertical_metadata | Structured project/unit/offer/intent/request_only context; existing admin status/notes workflow. nb_leads historical readers remain; no dual write |

Source evidence: `20260416045421_aab9dd3f-1394-47c7-ab6a-fb053d39fc3e.sql` creates sales project_units and initial broad policies later removed by cumulative source; `20260416200200_devmod_03_floor_plans.sql` adds parallel unit_status/price_thb/size_sqm/floor_number; `20260416200600_devmod_07_reservations.sql` binds payment_schedules to reservations. These files are source evidence only.

Read-only access correction: the associated myUNO database is readable through Lovable despite absence from a separate Supabase project list. Actual bridge/scoped-policy inventory was reviewed read-only; further actor/RPC tests and separately approved activation remain required. Never substitute an unrelated or denied project.

[Detailed canonical identity reuse and existing bridge guards](identity-reuse.md) supersede any interpretation of project_units as a separate physical registry. property_projects owns the canonical project; property_complexes remains legacy under existing SQL comments.
