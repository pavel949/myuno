# Lead notification delivery: bounded correction and launch gates

Source baseline: main `6588a08416a0285c375fbd85914be53eb881a5db`. This is a source audit and isolated test evidence, **not proof of production delivery**.

## Existing canonical paths

- Property enquiry writes `property_inquiries`, then `orders` through `useOrders`. The hook invokes `notify-admin-order` with the commercial order context. Neither record creation nor notification acceptance reserves inventory or proves delivery.
- Universal consultation intake uses the existing idempotent intake RPC and `consultation_requests`. It invokes `notify-admin-order`; home-services also invokes `notify-lead-whatsapp`.
- `notify-admin-order` uses configured admin contacts, Resend and UltraMsg. Its input is browser-supplied, not a verified persisted object projection. Do not broaden it or treat client metadata as trusted authority.
- `notify-lead-whatsapp` is home-services-only, reads the private consultation using service role without object authorization in its source, and separately sends to a hardcoded legacy email address. Do not enable, extend or deploy this route as a universal lead service.
- Supplier application creation has its own `notify-admin-partner-application` route; it is not covered by this correction.

## This correction

- Wait for the existing WhatsApp dispatch, with a bounded ten-second timeout, rather than leaving an unawaited promise at edge shutdown.
- Require explicit provider acceptance and provider ID; HTTP 200 alone does not establish success. Resend's resolved error object must not be logged as a successful send.
- Return per-channel `accepted`, `failed`, or `not_configured`. Aggregate success requires both channels accepted. Partial failure returns 502; this does not undo the saved enquiry/order and must never imply the customer should recreate it.
- Remove full WhatsApp message/recipient and provider-response logging. Keep low-information status logs only.
- Use the production `myuno.app` domain for the existing Operations link. No recipient/sender/settings/credentials, schema, permissions, inventory, payment or catalogue changes.

Acceptance by a provider is NOT delivered/read status. UltraMsg may queue requests while its device is disconnected: https://docs.ultramsg.com/api/post/messages/chat . Delivery requires provider evidence, not this response.

## Remaining release blockers

1. Verify actual production routing and deployed function versions through read-only evidence. Repository configuration is not proof of deployment.
2. Verify protected admin recipient settings against the owner's requested destinations. The source fallback WhatsApp differs from the requested number. Do not silently replace settings or distribute enquiries to additional recipients.
3. Verify approved provider account, WhatsApp device/template/window requirements as applicable, verified mail sender/domain, and configured credentials. Read secret presence/status only, never expose values. No new subscription or credentials provisioned here.
4. Replace caller-supplied content with authorized persisted-object resolution and bounded/idempotent dispatch before expanding alert traffic. The legacy home-services endpoint requires a separate security-reviewed correction; do not expose consultation PII to a new public route.
5. Existing frontend `.catch` handlers do not catch resolved Supabase Functions `{error}`. Add handling that distinguishes *request saved* from *notification failed*, preserving the request ID and never requesting a duplicate submit after partial notification acceptance.
6. Check the exact persisted enquiry/order in the existing authorized admin inbox and verify source-specific listing/service context. Generic Operations links are not proof of exact-record handoff.
7. Establish durable dispatch/retry evidence using existing canonical notification mechanisms. Browser fire-and-forget dispatch can be lost on navigation; this patch does not add an outbox or duplicate workflow.
8. With explicit controlled acceptance scope, verify a synthetic request appears in the correct admin view and reaches only approved destinations. No live data writes or outbound test messages were performed for this change.

## Verification and rollback

18 isolated unit/source-contract tests cover Resend error shapes, missing IDs, non-200 and failed UltraMsg responses, explicit acceptance, awaited dispatch, no PII log restoration, and correct production link domain. No real credentials or network calls in tests. Full edge integration and recipient delivery remain unverified.

Review and deploy separately from homepage PRs #215–218. Do not automatically deploy edge functions because frontend tests are green. A source revert restores the previous handler but reintroduces false-positive reporting and PII logs; preserve redaction and truthful outcome handling in any corrective forward rollback. There are no DB or settings changes to reverse.
