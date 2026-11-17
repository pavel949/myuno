# Supplier activation: bounded next contract and acceptance gate

Status: source audit and proposed next scope, not production acceptance. No live writes,
Edge deployments, schema changes, grants, notification sends or onboarding submissions.

## Current launch scope

Owner clarification: customers deal only with myUNO at this stage; enquiries go
to the administrator and Pavel’s approved email/WhatsApp, not directly to suppliers.
Supplier self-activation is therefore **not a blocker to a request-only launch**
provided internal catalogue management and enquiry delivery pass acceptance. Keep
vendor activation paused. The proposed contract below is future separately gated
work, not a prerequisite to publishing the current request-only experience.

## Verified source

- Admin property/project/developer editors exist at `/admin/properties`,
  `/admin/projects`, `/admin/developers`; existence does not certify the live actor's rights.
- Public supplier intake persists `partner_applications`; vendor onboarding invokes
  `partner-onboarding-create`. Initial services remain inactive pending approval.
- `approve-partner-application` intentionally refuses both approve/reject with
  `partner_decision_contract_unavailable`. Its containment tests pass. This is a
  supplier self-activation blocker, not a missing button. It does not itself block
  the clarified admin-operated request-only scope.
- Supplier submission alerts are best effort. Persisted application does not prove
  admin notification acceptance or delivery.

## Proposed separately reviewed contract, not authorization to deploy

1. First verify deployed schema, RLS, writer privileges and application-linked
   provider/vendor/org relationships read-only. Identify historical partial activation
   without silently repairing or granting access.
2. Design one actor-bound atomic decision writer. Bind caller identity server-side;
   authorize action and exact application; require expected state/revision and a
   stable command identifier. Lock/compare the persisted application before changing
   anything. Never trust client-supplied provider/org IDs or activation targets.
3. Approve only explicitly application-linked records according to the approved
   publication/role policy. Reject must not activate any records. Do not equate
   provider ID with org ID or activate unrelated services owned by the same user.
4. Return a persisted command receipt. Same command/same payload replays that receipt;
   same key/different payload conflicts. Concurrent opposite decisions allow exactly
   one committed transition. Failed activation rolls back the entire decision.
5. Keep notification dispatch outside the activation transaction with a durable,
   deduplicated dispatch record linked to the receipt. Provider acceptance and
   actual delivery are separate evidence. Mail failure cannot reverse an already
   committed decision or cause duplicate activation on retry.
6. Wire UI/Edge only after isolated contract tests and independent security review.
   Preserve the current fail-closed handler until the verified contract is deployed
   under an explicitly approved release/rollback plan.

## Required isolated tests

Unauthenticated/non-admin/cross-application requests; stale revisions; missing or
ambiguous org mapping; preexisting provider with incomplete activation; same-command
retry; lost response; concurrent approve/reject; injected failure at each mutation;
no cross-provider service activation; duplicate dispatch; provider rejection;
delivery webhook replay; no success UI without committed receipt. Use fixtures only.

## Operational acceptance still required

With an authorized operator account and controlled test records: create/edit a property,
project and developer; attach photos and exact commercial terms; publish only the
intended record; verify public projection; submit a controlled supplier application,
review/approve through the new contract, verify scoped supplier access and offer
visibility. Verify actual notification delivery separately. Source tests alone are not
proof that the live platform is ready for unattended supplier onboarding.
