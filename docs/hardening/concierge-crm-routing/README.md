# Concierge → CRM and WhatsApp: review candidate, not activated

Owner request, 2026-11-24: every submitted concierge service inquiry must enter CRM and be copied to **both** +66630827085 (Thai/English) and +66954243332, Pavel (Russian/English). Language labels are support capabilities; they do not filter notification recipients. Notifications use English labels and preserve the original request text.

## Verified current evidence

Read-only Lovable Cloud project `dcc2b024-7627-4ad9-a915-a3df3dd839f0`, database `kakkwibljrjsawxgnupk`, 2026-11-24:

- `help_requests` has only its updated-at trigger; there is no automatic CRM bridge.
- The submit edge handler inserts `help_requests`, explicitly disables CRM auto-routing and starts an unawaited single-recipient legacy WhatsApp call.
- CRM tasks require a `management_companies.id` and `created_by`. The public concierge customer must never choose those fields.
- Existing management companies are Show Property Phuket and Ignatev Estate Co., ltd. The owner subsequently confirmed Ignatev Estate Co., LTD for all concierge requests. Its one active director membership is the existing operational owner; no new membership is created.
- No `concierge_crm_route` setting is present. Provider credentials, scheduler configuration and real delivery have **not** been verified. No real messages or synthetic business records were sent/inserted.
- `concierge_sessions` includes AI onboarding classification, not submitted human requests. It must not automatically generate sales tasks from an unrequested onboarding session.

## Contract and canonical ownership

`help_requests` remains the single human-escalation record, source of Inbox/customer status and source context. `crm_contact_id` and `crm_task_id` link its existing CRM projection. Neither CRM nor the notification queue creates bookings, service orders, prices, payments or inventory holds. Marketplace structured service orders keep their own semantics.

VIP service cards, Support's concierge action and the life-flow concierge CTA now use the existing `ConciergeHelpSheet`, preserving service/source context. Existing HelpCTA/RequestButton and ServicesIndex already use that writer. Direct contact links remain available on the contact page; a user opening a direct chat or placing a phone call is not a submitted web request, and the application cannot automatically import those conversations without a separate inbound integration.

`forward.sql` is deliberately outside automatic migrations. It adds a private transport outbox, not a second request or CRM domain. The existing `notification_deliveries` is user-owned (`user_id NOT NULL`, owner read/update policies), so storing two external administrative recipients there would invent a user association and expose operational transport state to its owner. The existing draft consultation outbox is not live and is limited to off-plan consultations with unique(request,channel), which cannot record two independent WhatsApp recipients. We reuse its tested scheduler admission and transport worker rather than activating that unrelated draft.

Each new help request transaction creates exactly two queue rows, unique by request and recipient. No historical backfill or automatic replay is performed. Before claim, a checked server-side projection locks the request and creates at most one CRM task. Existing manually established same-company contact links are retained. Public form email/phone are not verified identity: this bridge does not create or merge contacts (whose existing triggers can affect shared identity). Contact information and original request text remain in the CRM task for follow-up. Existing linked tasks must match the configured company. The route requires an active company and active company member as owner; missing/invalid configuration retains the request and pending notifications without inventing a tenant.

Each recipient is leased independently. Only an explicit provider acceptance with nonzero message reference is `accepted`; acceptance is not delivery. Missing credentials are `blocked`. Timeout, malformed provider result or lost lease is `uncertain`, never automatic resend. Operator reconciliation is required before any retry. No caller can supply recipients, request IDs or message bodies to the dispatch endpoint. Scheduler authorization precedes service client creation. Logs/responses contain counts, not request content or credentials.

## Activation gate and coordinated sequence

PROJECT.md §20 and AGENTS.md require review after schema/auth changes. This branch is **NO-GO for production activation** until the concrete change is reviewed and transport configuration is verified. The CRM company is confirmed.

1. Use confirmed Ignatev Estate Co., LTD (`a74c57c1-214c-4405-95fe-be46bc14d224`) and its existing active director (`5cbbcd96-7a9b-4311-ae5f-80a114b27b12`) as CRM owner. Store `concierge_crm_route` as a protected `system_settings` JSON object `{company_id, owner_user_id}`. Do not use a provider/org ID or metadata-derived actor.
2. Verify UltraMSG credentials exist and the instance is authorized, without exposing their values. Configure a separate ≥32-character `CONCIERGE_OUTBOX_SCHEDULER_SECRET` securely. Do not send test messages to the real recipient numbers.
3. Pause new help submissions briefly for the coordinated cutover. Apply the reviewed forward SQL; deploy the changed `submit-help-request` (which removes the old direct WhatsApp sender) and `dispatch-concierge-notifications`. Never deploy only the handler or only the trigger while intake is active: either would lose or duplicate alerts. Keep existing email behavior outside this transport change.
4. Enable the scheduler last. It sends a bodyless POST with `x-scheduler-secret`. Gateway JWT verification is disabled only for this endpoint; application scheduler-secret admission remains mandatory.
5. Resume intake. Read-only verification checks trigger/RPC privileges, trusted route membership, scheduler admission and per-recipient state. Observe the next authorized real request without creating business QA records. Report persisted CRM links and provider acceptance separately from confirmed delivery.
6. Retry blocked/uncertain jobs only after documented operator reconciliation; there is deliberately no public retry API or automatic replay command. Confirm/restore legacy email behavior independently.

## Security-preserving rollback

Disable the scheduler first. Revoke service-role EXECUTE on the two concierge dispatch RPCs. Remove only `concierge_request_notifications` to stop new enqueueing. Preserve help requests, linked CRM records and queue audit rows. Do not restore the legacy direct sender or delete/replay accepted/uncertain jobs. Intake and manual Inbox processing continue; alert the operator that automated WhatsApp copies are paused. A reviewed repair must precede resumption.

## Verification

Isolated PostgreSQL verifies missing-route retention, one task/two jobs, no invented contact identity, per-recipient outcomes, forged-lease rejection, expired lease containment and denied client dispatch. Synthetic transport tests verify fixed recipients, provider rejection despite HTTP200, configuration absence and admission before privileged access. UI tests verify selected VIP context, shared form routing and both public contact links in ru/en/th. No production writes are part of testing.

### Local verification receipt, 2026-11-24

45 targeted tests passed (43 combined plus two additional transport admission/partial-failure tests). TypeScript build check and production build passed. Design audit: zero new/structural findings. Main was re-fetched and remains `454a4431c256ae6c7ca1d19ffd3ff0466598eb55`. Edge deployment, production SQL, scheduler secret/provider verification and actual delivery remain unperformed; this is a review candidate, not a release receipt.
