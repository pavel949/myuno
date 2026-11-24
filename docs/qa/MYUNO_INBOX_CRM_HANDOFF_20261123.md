# myUNO intake and CRM handoff

The admin inbox reads canonical requests by source, with new Help requests first.
It keeps consultation, property and legacy requests in source queues; a Help
row can move from New to In progress or from a working status to Closed. These
indicate handling, not assignment, delivery or customer contact. Direct
WhatsApp, post-booking chat, support tickets and orders remain separate
channels. Keep them reachable, not automatically replicated.

A property sale or established longer-stay enquiry goes to the platform
consultation workflow with the public property context. It is not a booking,
payment, deal, or request to a vendor. Exact newbuild/property links open the
corresponding existing consultation. The contact stays in the restricted
source. Legacy inquiry intake does not deduplicate ambiguous returns server-side;
the new form does not retry such a response.

## Release boundary

Read-only target inspection (23 November): no deployed `convert_lead_to_deal`
RPC and no `converted_deal_id` or `converted_at` columns on consultations.
Do not reactivate the historical company-only converter. The UI only opens
already-linked deals. Creating a deal is a separate, deliberate action and
remains gated, not an automatic result of intake or an accepted enquiry.

Before adding it, review the checked #310 path against the exact deployed schema:
verified source and assigned actor, company membership plus current CRM
permissions and Operating Space, no customer/provider information leakage,
transactional and durable idempotent link, no phantom contact via the existing
`agent_deals_autolink_contact` trigger, and tested scoped reads and rollback.
Test a lost response, concurrent submits, revoked rights, ambiguous destination
and deal retirement. Do not enable enrollment or deploy DB changes from preview
(which shares production).

Help status controls require the admin queue, exact identity, expected previous
status and a successful read-back. Read-only target metadata showed the status
UPDATE grant and staff policy; the sole noninternal UPDATE trigger updates the
timestamp. Internal notes and provider metadata are never selected or changed.
Production read-through, notification delivery, and visual QA with a role
session still require a separately controlled acceptance.
