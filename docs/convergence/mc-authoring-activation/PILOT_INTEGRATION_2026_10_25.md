# Rental request operational pilot — integration candidate

Status: implemented source under verification; **not activated or live accepted**.
The backup WIP and PR183 are retained. The integration branch starts at published
main `46c05eb0479cee46ff7e4232e19894f2aaad2cca`, merging the saved WIP history.
No DS186/provider/off-plan/rates donor branch is merged.

## Canonical path and bounded corrections

The guest command stores an unpaid pending order, canonical property item,
participant, private command receipt and inventory hold atomically. Checked manager
commands confirm/cancel with a revision; checked receipts and scoped queues read
the same order. Inventory remains `property_bookings`, with half-open civil dates.
The current bridge links through `external_id`; a nullable `order_id` is not proof
that the canonical hold is absent.

Task creation now retains the existing durable command identity across component
unmount/response loss; it persists only actor/digest/UUID, never task content. Task
completion metadata remains server owned. The browser task fixture uses the actual
gateway and editor at 375/390/430/1280, with synthetic authorization and transport.

The portfolio calendar now projects the same scoped checked booking adapter as
the manager list. Its former independent raw-order query could omit guest orders
under RLS. Failed booking/task reads hide the calendar with an unknown/retry state.
The local PostgreSQL browser fixture checks pending/confirmed reserved state and
cancelled released state through this actual calendar hook. Its title/property
authorization shell remains synthetic; it does not prove live catalogue discovery.

Known schedule/expense refusals have RU/EN manager explanations and a safe next
step. Failed rows remain selected; no success is shown. This is a bounded refusal,
not a completed extension or rebooking workflow.

Two bounded guards from PR160 refuse the unpaid cohort before Stripe construction
or manual-payment writes, including unknown RPC outcomes. Other cohorts require
an explicit true eligibility response. DB eligibility must therefore precede edge
deployment; deploying these handlers alone could block existing checkout paths.
No payment activation, real payment or external notification is part of this work.

`reservation-task-bridge.candidate.sql` is a separate additive critical candidate
after reservation and task commands. It uses the executing checked change receipt
bound to actor/transaction/property/order. On cancellation it locks linked open
tasks in ID order, cancels zero-cost unfinished work and preserves completed work.
An unfinished task with a cost/expense aborts the transaction rather than releasing
dates with unresolved operational expense. Existing unrelated/legacy tasks and
unselected properties are outside this bridge. No business-data backfill occurs.

## Fresh read-only production evidence

25 October, after the integration request: only the preexisting six-argument
`create_managed_property_checked` is present among inspected checked authoring,
reservation and task contracts. The four reservation predecessor fingerprints and
two actor helper fingerprints match the saved contracts. New reservation/task
contracts and task opt-in metadata remain absent. Complex owner and booking owner
are still NOT NULL. The live booking auto-task function body equals the historical
source used in the combined isolated case.

The selected resort inventory still has 40 inactive/unapproved properties without
owner or management-company links. The selected existing company is active, has
one active member, no active staff and no active Operating Space. These aggregate
facts do not grant assignment or ownership; the private ID manifest stays outside
Git. No properties, company, staff or owners were created.

Production order creation has an automatic admin-notification trigger. Confirmed
booking preparation creates three operational tasks. Check-in has a WhatsApp
trigger; check-in is outside this unpaid pilot. Existing repeat-guest automation
may write CRM records. A live smoke must review these effects explicitly rather
than claiming notification-free execution merely because the client sends none.

## Exact activation gates

1. Review current metadata against `preflight.sql` and `reservation-preflight.sql`,
   all actual triggers, constraints, RLS/ACLs and exposed schemas. Regenerate the
   authoring forward/stop packets offline; approve exact hashes per action.
2. Separately approve catalogue client-DML revocation, authoring/task contracts,
   reservation contracts and this task cancellation bridge. None is implicitly
   approved by choosing the company or asking for the feature. No historical
   migration batch is replayed.
3. Privately identify **one existing physical unit**, its real authorized owner,
   its existing resort/category/project and the selected company. Approve exact
   company/Space assignment and access impact. Preserve all physical UUIDs. Do
   not reuse the earlier full-inventory mapping as permission to update 40 rows.
4. Identify a genuine staff actor and approve only the required membership,
   property assignment, Space membership and task module actions. Existing roles
   and independent owner/customer rights stay intact. No automatic invitations,
   role escalation, global enforcement toggle or invented owner is allowed.
5. Verify real rental rules, occupancy, permitted media and current rates. Guest
   amounts are **estimates for manager verification**, not a certified quote or
   payment. Publish only approved real content for the selected supported mode.
6. Apply approved DB contracts first, metadata-only postflight second, coordinated
   edge/UI code afterward. Then run separately authorized live actor acceptance
   with agreed dates, receipt IDs, allowed notification effects and a zero-cost
   task. Guest B/other staff must be denied; cancellation must release the exact
   hold and retire unfinished tasks while preserving completed work.

## Stop and rollback

### Owner and selected participants are separate inputs

Legal ownership of the asset, the management company's operating mandate and a
staff assignment are different facts. Production FK metadata confirms both
`properties.owner_id` and `property_bookings.owner_id` reference `auth.users(id)`.
The former is nullable, the latter is not. A company UUID is therefore neither
a valid owner-account relation nor evidence of legal ownership. The chosen
company must never be substituted into this field; neither may a director or
staff account without a separately verified owner-account relationship.

The minimal pilot retains an explicit owner-input gate: identify the existing
authorized owner account and approve the precise selected-property relationship.
Until then the request/hold writer fails atomically and the real unit stays
unpublished. A future ownerless request-hold design would need a separate
inventory/authorization contract; this candidate does not silently relax the FK,
create an owner identity or manufacture ownership to bypass the gate.

The user selected two existing people for the pilot. Name-based profile and Auth
lookups did not resolve their accounts unambiguously; their registered login
emails are required for an exact private manifest. This is an identity-input gate,
not permission to invite, duplicate accounts or grant company/Space/module rights.

The source-bundle checksum guard also detected the earlier WIP's changed property
candidate. Its manifest is repinned to exact backup `7e03ed765…` bytes, retaining
the previous source reference. The assembler labels it a pinned checkpoint, not
reviewed authorization. Checksum enforcement and separate approval remain intact.

Confirmed-date changes with existing work require schedule reconciliation. Because
the existing auto-task trigger runs before the downstream guard, correcting dates
and confirming in one command can also be refused. Correct pending dates first,
then confirm separately. The pilot does not silently reschedule operational work.

Use the existing restrictive reservation lifecycle stop and task-command stop
packets. Preserve canonical rows, receipts, history, holds, catalogue restrictions
and the downstream cancellation invariant. Do not restore unsafe legacy bridges
or erase receipts. A stop is not cancellation of a real hold: any live acceptance
cleanup uses an explicitly approved canonical command. An expense reconciliation
failure remains visible and holds inventory until legitimately resolved.

Build, test counts and exact-head CI are recorded in the PR/checkpoint only after
terminal results; previous WIP results do not certify the final candidate. Synthetic
auth/helpers, local PostgreSQL and browser fixtures do not constitute live role
acceptance. Ownership, staff configuration, approved publication, production
activation and live acceptance remain separate unresolved gates.
