# Purchase options and project evidence: persistence review, not migration

Source baseline: `6112f01033159464d87ba2113c96424cd0011a4b`.
No requests to a deployed database, no production changes, no new RLS grants,
new table, function, writer, scheduler, application wiring or committed credentials.
The companion SQL is a read-only metadata and aggregate inventory, **not applied or
run**. It is not a substitute for actor/privilege testing.

## Reuse findings

| Need | Existing authority | Boundary |
|---|---|---|
| Developer / project | `developers.id → property_projects.developer_id` | Never fuzzy-match brand or infer legal counterparty |
| Actual unit | `project_units.property_id → properties.id`; existing normalized project/unit-code and non-null physical bridges | Sale row ID and physical ID are distinct; no new project/unit registry |
| Drive link, job, receipt | `project_drive_sources`, `drive_import_jobs`, generated `project_price_list_versions`, `project_price_list_items`, `project_fact_assertions` and `stage_drive_import_version` signature | Explicitly reuse; the first two have source DDL, latter types/signature are **not proof** of current SQL bodies/RLS/deployment. Do not turn on `watch_enabled`/cron |
| Protected media, sources, construction evidence | Existing `project_documents` visibility, revision, file locator, category construction/marketing/floor_plans; `project_fact_assertions` can represent reviewable field evidence | Reuse evidence references by project; never turn private locators, source notes or access tokens into gallery URLs |
| Public media | Existing cover, gallery and video fields | A public project is not media permission. Promote only separately reviewed material with stable safe public URL/path, no raw cloud folder/signed URL; preserve explicit gallery order |
| Construction summary | Existing project lifecycle and completion fields | Persist dated private field evidence through existing assertions once verified; do not expose unsupported timing/legal completion |
| Indicative payment terms | Existing project `payment_plan` or `payment_plan_template` (resolve canonical editor/consumer before choosing one) | Reservation `payment_schedules` and existing rental `property_price_offers` are not purchase catalogue authority; no receivable/payment/hold from an indicative schedule |

The earlier crosswalk's language that a general registry or scheduler is not
deployed should not be read as absence of the versioned **Drive** workflow.
No equivalent generalized provider registry or live adapter is proposed here.

## Purchase option v1 contract to verify

First inspect exact deployed/source bodies, constraints, RLS and intended meaning
of `project_price_list_items.raw_record` and `project_fact_assertions.value_jsonb`.
Use these existing surfaces for **private staged and reviewable** L/F offer
observations if their append/approval and actor contracts work. Do not encode
sale options into the single existing unit's scalar amount; do not force them
into rental offers. Do not assume imported assertions are approved or a general
version row publishes its children.

If the existing reviewed surfaces cannot answer an exact option pending/current/
historical query with immutable evidence and concurrency guarantees, use **one
minimal additive private purchase-option revision relation** after separate review.
No such migration is proposed for automatic application. Constraints to implement:

- Derive exact sales unit and physical property ID server-side. Fail closed on
  unmatched, differently scoped, duplicate, unlinked or dynamically changed bridge.
  Never accept physical or project ID from an untrusted offer as target authority.
- Stable key: existing sales unit + `leasehold|freehold` + explicitly reviewed
  source-independent option code. Keep quota/eligibility as terms, not identity.
  Preserve immutable revisions and an explicit selected current revision; versions
  and exact canonical mapping are compared atomically, not read-then-blind-written.
- Record currency and exact positive total for quoted options; unoffered means
  null amount, not free. Record clear/withhold separately from unknown. Require
  reviewed effective date or proper dated confirmation, independent source
  observation date, meaningful revision key and receipt, and promo valid-until.
  A current base price does not revive an expired promo.
- Retain immutable provenance to exact admitted project/source version/item or
  manual project evidence; bind all project keys to the same project at write
  boundary. Deduplicate identical confirmed source revision/content; approval
  requires expected current revision; replay/conflict cases must not overwrite.
- Keep availability as observed unit-level evidence (not automatically applied to
  the sale unit, construction status or rental inventory). Partial feed omission
  never marks sold/withdrawn. Unknown/ambiguous status remains under review.
- Evidence history is private by default. No broad grants or public view in this
  tranche. Separate future scoped actor/project authorization, review decision
  and narrow public presentation. Failures retain last-known-good and must not
  imply approval. Rollback is new explicitly audited revision, not deleting history.

## Minimum isolated acceptance before any registered migration or deploy

1. Check existing bridge and row policies first; no cross-project access or
   new source registry. Test non-admin, mismatched project/developer/source,
   stale revisions and revoked membership against the real authorized writer.
2. On synthetic PostgreSQL, test two L/F options on one physical property, exact
   source-link/version/item linkage, duplicate/concurrent commands, rollback of
   partial writes, old-file expiry and omitted unit preservation. Confirm no
   money, reservation, physical object or public snapshot is changed by staging.
3. Construction/photo/payment evidence with wrong project, private locator,
   or no rights cannot promote; verified terms display no made-up dates,
   amounts, approval labels or missing-cost assumptions.
4. Review launch identity, backup/restore and actor matrix before deployment.
   Obtain independent authorization on scoped live data, privileges and actual
   operator journey. Repository typings or synthetic fixture alone cannot certify it.
