# Newbuild enquiry notification reliability (review only)

Base: main b4bbfde5dca7a301940d3baf8c04695221ae0701. Separate from PR #260. No production deployment, schema migration or production enquiry.

## Contract
The canonical consultation intake receipt proves persistence only. Provider acceptance is not delivery. A notification failure or timeout must not turn a saved enquiry into a failed intake or invite duplicate submission. Existing nonce/session recovery remains unchanged; notifications are attempted only when shouldDispatch is true. No automatic delivery retries are introduced.

Project-level actions clear prior unit selection; close and project navigation clear it too. The lead form is keyed to the selected project/unit so internal form state cannot silently follow a different intent.

The browser observes the admin notification for at most 10 seconds; rejected and resolved-error responses are both unconfirmed. The server attempts the existing configured platform channels independently, awaits bounded outcomes (8 seconds per channel), requires explicit provider acceptance and returns per-channel outcomes. Missing email configuration cannot skip configured WhatsApp. Only protected configured MyUNO recipients are used; no supplied manager recipients. Full message/contact/provider response logs are removed.

## Evidence
30 isolated Node assertions passed, including actual edge-handler execution with synthetic Resend/WhatsApp/configuration stubs: missing email configuration, email rejection, WhatsApp rejection, no channels, both accepted. TypeScript stripping parsed changed non-TSX sources. 15 Vitest cases added, not run in this executor. This executor has no full checkout/dependencies and git clone lacks credentials; full Vitest, lint, typecheck, build, browser modal regression and CI remain required.

## Remaining blockers / non-goals
- Browser departure between save and dispatch still can lose alerts. This is NOT durable delivery or a production acceptance certificate.
- No outbox, background retry, provider callback, persisted channel audit or delivery receipt is added. A properly authorized canonical server-side dispatch design is a separate tranche.
- The legacy notify-admin-order endpoint still accepts client-authored message data. This patch does not claim object authorization or anti-abuse hardening. Production activation needs review of the existing entry-point contract, secrets, sender verification and permissions.
- Existing deep link destination was corrected from uno.ae to myuno.app; exact canonical consultation inbox deep links require separate verification.
- No production secret availability or actual email/WhatsApp receipt was checked; no live messages sent.
- PR #260 may also edit OffplanDetail; reconcile the small context reset with its navigation/anchor changes before merging.

## Rollback
Revert this frontend/edge code commit independently and redeploy the previously approved version through the governed release process. There are no migrations, data changes, new credentials, recipient changes or RLS changes. Do not deploy the edge handler automatically with this review branch.

## Independent security review follow-up
Verified in source: legacy admin-config defaults fall back to old contacts on settings failure, including a WhatsApp number different from the owner's current supplied number. This endpoint now uses a strict reader of the existing protected settings: query failure aborts dispatch, missing/malformed settings disable that channel, and no default recipient is used. Other callers retain their existing behavior and require separate review. No settings were changed.

Only POST and OPTIONS are accepted. User-controlled request identifiers are not logged. Additional isolated tests cover settings failure (zero outbound attempts), missing/malformed contacts and unsupported methods. Updated total: 36 isolated Node assertions passed; 18 Vitest cases authored. Full CI on the preceding head was still running at review; no complete CI or real delivery claim.

**Edge activation NO-GO:** no actor/object admission or durable canonical dispatch exists in this legacy endpoint. CORS is not authorization. Restricting to authenticated users would break legitimate guest intake and would still not establish object authority; adding a service-role lookup based solely on a supplied ID would be an unsafe substitute. These shortcuts were not implemented. A separately reviewed server-owned persisted-intake event/claim contract with replay/rate protection is required before calling notifications commercially reliable. No secrets or third-party messages were used for QA.
