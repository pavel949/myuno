# Growth backlog: source reconciliation and outbound containment

Verified base: `fb4b944a4c736f680ddb8e4b178f833030e021b1`.
This is source/isolated-test evidence, not a statement of deployed functions,
applied migrations, sender activation, production catalogue or monetary acceptance.

## PR84 — retain current authority; extract restrictive sender guard

The proposed auth gate is superseded by current `requireInternalOrStaff` with
admin-only roles and current fail-closed house-company lookup. Do not restore
its older generic `uno_team` allowance or optional company filtering. Current
follow-up selection uses historical outreach logs; a subsequently opted-out,
responded or unsubscribed contact could still be returned. The sender did not
check the existing `suppressed_emails` table.

A bounded containment adds a canonical contact re-read, constrained by ID,
house company and vendor type, before generation/delivery/mutation. Only known
sendable statuses are accepted. The chosen destination must still match the
current contact. Email suppression must explicitly return no row with no error;
missing rows, errors, unknown statuses and thrown reads deny sending. No new
contact, suppression, CRM, order or financial model is introduced.

Remaining PR84 work is NOT certified: atomic per-channel daily budgets and
concurrent sends; validated finite cap settings; approved WhatsApp templates;
STOP webhook semantics; atomic/idempotent prospect promotion and deduplication;
protected escalation capability. The proposed migrations/cron installation are
not imported or executed. Promotion's unchecked updates and raw PostgREST `or`
construction require separate design/testing, not blind merge. No outgoing
email/WhatsApp was sent during verification.

Race limitation: a contact can change after the final read and before an external
send. This patch reduces the stale-log hazard but is not an atomic consent/send
protocol. Keep activation NO-GO until the complete sender contract is reviewed.

Rollback: disable outreach scheduling/manual invocation operationally rather than
removing the restrictive gate. This task changes no scheduler configuration. No
production migration or function deployment is required by the source patch.

## PR74 — commission referral economics require a new critical contract

The proposed default-on provider program changes central commission economics,
creates reward/settings records and triggers on verification. Generic `uno_team`
gets global settings authority. Do not transplant these into the current
provider-org, ledger and verified-event model merely to clear historical CI.
The read-only reward UI also requires a truthful backend contract and cannot
promise commission discounts before that acceptance. No activation or economic
change is made here. Residual work: approved earning event/counterparty,
authorization, idempotency/concurrency, bounded discount arithmetic, reconciliation,
security-preserving rollback and isolated PostgreSQL tests.

## PR61 — intake salvage exists; exchange domain proposal is not accepted

Current main already contains the `Other / Other business` intake salvage,
recorded in `UI_BACKLOG_SALVAGE_2026-10-19.md`. Do not restore the parallel
exchanger table, owner-writable verified/featured fields, generic team global
policy, seeded ratings/listings, manual rates or cron. Existing
`CurrencyContext` / `get_all_currency_rates` is the canonical rate source.
Current public exchange page still has hardcoded rates, merchants, ratings and
an invented current update time; that is a separate routine read-only UI fix.
`update-currency-rates` remains an independently observed public privileged
writer and needs an auth/response-validation critical tranche before activation
can be certified. No live updater invocation is performed.

## Gate

GO for review of this restrictive source-only sender patch after its focused tests.
NO-GO for PR84 full activation, PR74 economics or PR61 domain/schema activation.
No live roles, credentials, schema, cron, requests or financial records changed.
