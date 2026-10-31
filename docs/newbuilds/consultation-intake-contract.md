# Consultation intake — live read-only evidence and proposed repair

## Verified observation, 2026-10-25
The actual browser hook invokes `public.submit_consultation_request(payload jsonb)`. Lovable database status and read-only pg_proc introspection succeeded for the associated myUNO project. No request or personal row was read/created.

Read-only column-name inspection found no existing nonce/idempotency/fingerprint/request-key fields; index inspection showed no idempotency unique index. The current function is SECURITY DEFINER with search_path=public. It validates nonempty name/phone/request_type, removes a short denylist, sets server id/user_id/timestamps, defaults status only if empty, and inserts a jsonb_populate_record of the whole consultation_requests row. Each invocation generates a new UUID. The definition has no nonce/recovery contract or project/unit/property linkage checks. This is verified definition evidence; no forged payload or exploit was executed. It does not certify RPC authorization or deployed end-to-end intake safety.

## Minimal proposed additive repair — not deployed
Reuse consultation_requests and the existing intake RPC. Replace whole-record population with an explicit INSERT column allowlist; derive user_id/status='pending'/priority='normal'/timestamps server-side. Reject or ignore workflow/admin/outcome/scoring/assignment values, regardless of caller role. Preserve current callers' benign pending/normal inputs for compatibility; operator status changes remain the separately authorized existing update workflow.

Allow only documented contact/preferences/request fields. Offplan metadata gets an explicit shape: schema_version, project_id, unit_id (sales row), property_id (physical UUID), offer_id, intent and request_only. Validate UUIDs, permitted intents and current readable/public project; when unit is supplied it must belong to that project, and supplied property must equal its existing property_id and have consistent project linkage. Null property/offer is permitted only as an explicitly unmapped request, never a transaction commitment. Client claims cannot create links or grant access. Material/source identifiers and internal commercial data are not intake metadata.

Add nullable idempotency fields to the canonical request table only after schema review: intake_actor_key (derived from auth.uid or guest scope), intake_key (client-generated high-entropy nonce) and canonical sanitized payload fingerprint. A unique actor+nonce constraint and one transaction return the existing receipt for identical replay, reject changed-payload reuse, and never overwrite processed admin state. Existing requests remain valid with null keys. Guest recovery returns only the ID for the exact nonce/fingerprint, never contact rows. A network retry must reuse its pending nonce; a deliberate new enquiry gets a new nonce. Do not replace a nonce automatically after an uncertain response.

Notification dispatch also needs a single verified event per persisted intake ID; replay must not send duplicate third-party messages. Preserve the existing notification authority and test it with inert adapters. A compatible receipt may remain UUID-only, with server-side deduplicated dispatch; any richer receipt requires coordinated caller changes.

## Required isolated database acceptance before activation
- Guest: valid project-only and mapped unit request accepted once; identical concurrent/recovery retries return one ID/row; different payload with same nonce rejected; no PII reads.
- Signed-in customer: user_id cannot be spoofed; anonymous/signed-in scopes cannot recover each other's receipts.
- Operator: normal intake still enters pending; protected existing workflow can update authorized requests; unauthorized status/notes/outcome writes denied. Intake never becomes an admin bypass.
- Negative metadata: wrong project/unit/property, private project, fabricated offer, forged physical link and invalid UUID rejected without mutation.
- Lost response: simulate commit then transport failure; retry recovers the same ID, processed status/history remains unchanged, notification is emitted once through an inert dispatcher.
- Rollback/security: additive schema and explicit allowlist preserve legacy request rows and private-read boundaries.

These SQL integration/negative actor tests and a migration implementation are not complete. No production migration or actual request test is authorized by this document. The current UI receipt behavior is narrower than full intake correctness; launch remains blocked on the repaired, isolated-tested contract and separate activation review.
