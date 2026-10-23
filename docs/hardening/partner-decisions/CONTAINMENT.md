# Partner decision containment

Source candidate only; no Edge deployment, permission change or live mutation performed.

The previous approve handler independently activated providers, services, marketplace vendors and orgs, granted membership/roles, then changed the application. Several SDK errors were ignored. Opposing decisions had no checked atomic state transition; notification failure was swallowed while UI claimed email sent.

The registered `create_vendor_from_partner_application` function is not a usable decision contract: it requires status already approved, lacks an actor-bound decision/CAS boundary, and returns early for an existing provider without proving complete activation. This patch does not call it or infer target schema.

Approval AND rejection now return authenticated-admin-only HTTP503 `partner_decision_contract_unavailable`, before any service client, business write, grant or mail dispatch. Identical retries, conflicting requests and lost responses have zero decision effects; `retryable:false` means refresh/retry cannot activate the unavailable contract. The UI disables both actions and explains the pause. Existing read/filter paths remain available. Start Review remains a single pending→reviewing compare-and-set and requires the exact returned row; zero rows/error cannot show success. It neither activates supply nor sends mail. A lost acknowledgement requires a refreshed read rather than guessing success.

Notification fields are explicit: `attempted:false`, `provider_accepted:false`, `delivered:false`. Future provider acceptance must only mean the mail provider accepted a dispatch, never delivered; delivery requires separate provider evidence. No email is sent by this candidate and no resend endpoint is introduced.

Activation remains NO-GO. Re-enabling decisions needs a separately reviewed, actor/object-authorized atomic server contract covering expected state/revision, exact application-linked activation, idempotent command receipts, concurrent opposite decisions, rollback, and separately governed notification dispatch. Source tests cannot certify deployed schema/RLS or historical partial activation. Do not resume the deleted multi-write saga, seed grants, or apply migrations as part of this containment.
