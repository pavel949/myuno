# Employee finance capability containment — SOURCE NO-GO

This is a separate, unapplied activation candidate. PR187's synthetic rental/task proof does not establish safe staff onboarding under existing finance policies. No production change or new staff access has been performed.

Read-only policy and ACL inspection found that active MC membership can read company ledger accounts/entries without the finance module, and the existing property financial policy admits all operations through membership plus a readable property. The existing Space ceiling is conditional on Space enforcement; enabling Spaces is not a substitute for a finance permission.

The candidate intersects existing permissive policies with restrictive finance checks. It adds a trusted, default-false company rollout flag independent of Space enforcement. Applying the schema activates no company. A separate exact approval is required to enable a chosen company's flag and to add any employee membership or property assignment.

For governed employee access, ledger reads require company finance view capability. Property financial SELECT requires finance view; INSERT/UPDATE/DELETE require finance edit plus property authority. UPDATE checks both the stored row and proposed row, preventing a permitted row from being moved into an unauthorized property. A separate restrictive booking mutation check blocks governed employees from forging an unreceipted booking owner field to invoke trusted income triggers. Genuine physical-owner/provider/admin paths remain subject to the existing permissive policies. Managers use checked reservation commands; finance edit does not authorize raw booking writes. These booking restrictions check both old and new property on UPDATE. Ledger writes retain their existing policies and writers. No amount, booking, payment, ledger entry or financial business record is changed by this candidate.

Independent ownership is proved from persisted physical ownership, provider-to-user mapping, or owned wallet/organization ledger party. A financial-row owner field, including one persisted before activation, is not proof of independent employee ownership. Governed employees with only that legacy field must use an authorized finance capability; verified physical owners/providers retain their independent paths. Generic employment remains insufficient authority. Existing permissive policies still decide whether any retained independent path grants access; these restrictive checks create no new grant.

The actor's membership in an activated company also subjects their employee paths in other companies to capability checks. This cross-company impact must appear in the action-time approval. Actors outside both the governed-resource and governed-employee boundary retain their existing behavior. Default false is compatibility behavior, not a claim that legacy finance access is safe.

## Gates before activation

1. Verify fresh production schema, helper bodies, policies, table ACLs and callable definer paths against the isolated fixture. Do not read financial business rows to obtain this evidence.
2. Run baseline reproduction, role/capability/property/scope negative tests, row-reparenting tests and independent-rights regressions on a disposable PostgreSQL instance. Obtain independent source/security review and exact SQL hashes.
3. Approve schema/RLS/EXECUTE changes separately from enabling one named company and separately from any identity/membership/property linkage or live test writes. No hidden change to `operating_spaces_enforced` is permitted.
4. Perform approved preflight, exact-hash application and immediate role-scoped postflight. The production outcome is unknown until this happens.

The file in `docs/hardening/rollback/mc_finance_scope_stop.candidate.sql` is a restrictive stop: it suspends governed employee finance paths, including ordinary director/manager module access, and retains verified independent paths and protected platform-admin access. It does not restore membership-only access, undo data, remove schema, or reverse the rollout flag. Recovery after a stop requires a separately reviewed forward operation.

Current status: combined isolated PostgreSQL run passes 66 tests (41 finance capability, 11 booking initiator, 14 task commands/composition). This is bounded supporting-schema evidence, not a production-schema replay. No production activation or live staff acceptance.

## Trusted trigger boundary

RLS does not constrain a table owner executing a SECURITY DEFINER bridge. Fresh catalog inspection also confirmed legacy booking policies trusting caller-supplied `owner_id`. The booking mutation policies contain direct employee table access; they must be composed with the separately tested receipt-aware booking initiator guard before granting pilot staff access. A nonreceipt order bridge must not become an alternate income/ledger writer for a governed employee.

The selected pilot remains zero-cost and unpaid. Existing task autoexpense code uses `cost_source='auto_task'`, while the inspected live financial constraint admits only `internal`, `external`, `mixed`. No constraint relaxation or cost-bearing workflow activation is proposed. A relaxed synthetic-target rollback test, if present, demonstrates transaction rollback only and must be distinguished from the live-constraint rejection test.

The initiator guard's explicitly governed-resource boundary also covers authenticated nonemployee guests: a guest-supplied booking `owner_id` is not a verified customer right. Genuine customer SELECT and checked receipt-bound cancellation remain unchanged. This is an explicit additional impact of enabling the company's flag; it must be included in approval. On a foreign unactivated resource, only the governed employee context is newly constrained. Server operations without an authenticated actor retain their existing trusted-writer contract; this is not a universal definer audit or blanket authorization for those operations.

On an explicitly flagged company resource, financial-row checks also reject unaffiliated guest/self-owner forgery. Historical financial-row-owner-only access is not retained without canonical physical ownership, provider mapping or operational finance authority, because that field was caller-mintable. This additional read/write impact must be approved explicitly; owned-wallet/org-party ledger reads and verified property-owner/provider paths remain protected.

Root verification log: `/tmp/myuno-finance-composed-final.log` (three suites serial, PostgreSQL17.6). Candidate hashes are in `candidate-hashes.json`; source changes require rehash and fresh review.
