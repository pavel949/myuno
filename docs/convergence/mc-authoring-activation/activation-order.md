# Bounded rental/request activation order

Status: source review plan, **not authorization to apply**. This note contains no private production IDs or mapping records. Existing real properties must retain their canonical UUIDs. A resort parent, its room categories, physical units and sales/project records are different records; an absent `complex_id` is not evidence that the resort or units must be recreated.

## Independent gates

| Gate | Required evidence/action | Firebreak |
| --- | --- | --- |
| A. Public catalogue DML | Exact separately reviewed catalogue candidate; fresh client ACL preflight and immediate ACL plus SELECT postflight after explicit approval | Revokes client DML, not universal immutability; does not remove PostgreSQL 17 MAINTAIN or trusted/service-role authority |
| B. MC authoring | Exact generated forward SQL with current embedded source hashes; current actor-helper, schema, constraint and trigger compatibility; source review and isolated tests | No permission/member/property mapping seeds; old applied migrations are not replayed |
| C. Task commands | Separate task candidate and restrictive rollback reviewed; all adopted UI mutations use checked commands; selected existing properties explicitly governed | Merely adding a company/Space does not prove assignee-owned completion. Legacy preparation writers must not be silently blocked or bypassed |
| D. Reservation lifecycle | Bounded reuse of PR160 exact canonical contract and reviewed current-main adaptations, not wholesale old frontend merge | Authoring packet does not install the reservation functions or command receipts |
| E. Real configuration | User-approved mapping of existing property/project/resort/category records to the verified operating company and Space; actual owner relation; approved real content and rental terms | Membership of a creator in a company is not property assignment. A content author/manager must not be substituted as owner |
| F. Full acceptance | Guest submission, manager decision, canonical hold/release, guest receipt/list/status and scoped task completion | SQL catalogue SELECT, isolated fixtures and a successful build are not production operational acceptance |

No UI publication should precede the backend contracts it invokes. During mixed-version rollout, missing RPCs fail closed with an actionable error; there must be no fallback to raw inquiry/order/task writes. The final code release and all required database packets need one explicit version/contract manifest. If code is merged before database activation, that merge alone must not be described as making the operational flow usable.

## Existing reservation contract dependencies

The reviewed reference is PR160 head `e97ad7427e46a59a232a29f0163569603ca7d874`, `drizzle/migrations/0036_property_reservation_lifecycle.sql`. It is a separate critical tranche, not part of the authoring generator. The canonical commercial/inventory authorities remain `orders` and `property_bookings`; command receipts supply replay identity and evidence rather than parallel inventory.

Before any approved application, repeat all guards against current live metadata, not just the first successful helper check:

- Exact `create_order_atomic(...)` and order-to-booking bridge definitions/anchors, with unsafe primitive client EXECUTE absent. The first bridge rewrite changes its expected fingerprint for the subsequent preflight inside the same transaction.
- Exact `actor_can_operate_property`, `actor_has_platform_admin`, post-rewrite order bridge and item bridge fingerprints.
- Existing validated `property_bookings_no_overlap` exclusion constraint, canonical inventory-status predicate and half-open dates.
- Every present optional predecessor checked by the lifecycle source: financial-from-booking, order-to-booking producer, protected-order guard and availability-release trigger. A missing optional predecessor and a present but drifted predecessor are different states.
- Source dependencies on private command schema/receipt tables, existing order/items/participants/history/payment/ledger/manual-payment/property-financial tables, import uniqueness and block serialization. Do not copy only the public function wrappers and omit their guards.
- Trusted execution owner compatibility for every invoker trigger. BYPASSRLS alone does not prove a role passes a literal trusted-owner branch.

The pending unpaid reservation mode creates one exact canonical property item and guest participant, commits inventory atomically, and returns a checked receipt. It is not an unreserved contact enquiry and it is not online payment. A rejection/cancellation must release that same linked inventory; dates alone never authorize adoption of an existing booking. The first supported path must label a customer amount as an estimate where the contract stores `customer_estimate`; do not promote it to verified paid or server-tariff truth.

Current-main consumer adaptation is mandatory: guest receipt/list cannot look up `orders.id` in legacy `bookings.id`; the manager queue cannot infer the property only from `orders.metadata.property_id`; manager bulk transitions cannot directly update command-governed orders. The canonical identity is the checked property `order_items.resource_id` and receipt. Calendar/booking consumers need to read the resulting canonical linked booking, not a second request process.

## Real property mapping/configuration

Keep the private mapping manifest outside the public repository. For one user-selected physical unit first, record verified before/after expectations for:

1. Existing resort/project/category/unit identities and the parent/category semantics. Do not use mutable hotel/category `parent_property_id` as a newly invented immutable building FK.
2. Actual company and Space, existing authenticated actor memberships/module permissions, and explicit unit assignment. No role escalation or automatic staff invitations.
3. Genuine owner relation required by the current nonnullable booking owner contract. If it is unavailable, rental reservation remains blocked; a separately reviewed ownerless operational booking contract would be another gate.
4. Real descriptions, image rights, maximum occupancy, rental mode, dates, price/currency and stay rules. Unknown values stay unknown. Enable only the selected supported short-stay/request mode; do not infer all hotel/long-stay/sale variants ready.
5. Existing booking/block inventory remains unchanged by configuration or publication. Any selected-property task-command opt-in is separately approved configuration, not a migration seed.

Publish only real approved supplied content through its approved workflow. Reuse the existing physical property row; do not generate replacement units to work around missing company/owner configuration. The existing public media bucket and uploader-folder policy do not prove staff postpublication asset custody or revocation.

## Acceptance and stop/rollback

First finish the isolated combined scenario against production-compatible supporting schema: required task dates, actual relevant trigger bodies, two staff assigned to the same property, two guests and two companies. Cover overlapping dates, response loss/replay, stale manager revision, same request key with altered input, manager confirm/cancel, exact hold/release, guest list/detail/status refresh and employee completion identity. Include failures between each writer boundary so partial inquiry/order/inventory success cannot be reported.

After exact per-action database approval: apply the reviewed critical packets in dependency order, run metadata-only postflight and verify the expected public contracts and ACLs before publishing their UI. Do not register/apply the entire historical migration journal. New candidate hashes require fresh review; a previous catalogue-only approval does not approve authoring, task, reservation or mapping changes.

Production smoke is a separate explicit plan/approval because a reservation changes availability and may invoke existing side effects. Use only the user-selected real unit, legitimate authenticated guest/operator/staff identities, agreed dates and a zero-cost task. Do not use fictional public listings, actual payments, invitations or real notification dispatch as incidental QA. If live side effects cannot be safely bounded, remain at read-only postflight and report the exact acceptance blocker.

Rollback here is a **restrictive stop**, not inverse migration or replay recovery. Freeze the affected create/change/task entrypoints; preserve existing canonical records, replay receipts, audit, inventory constraints, client DML restrictions and read-only receipts. Stopping reservation commands does not erase a live hold or cancel a real booking: reconciling/releasing any real smoke reservation is an explicit reviewed canonical command. Never restore the unsafe predecessor bridge, raw public writes or broad employee writes to make rollback appear complete.
