# Currency-rate updater containment — source candidate, activation NO-GO

Base main `fb4b944a4c736f680ddb8e4b178f833030e021b1`. This is a finite
source-only containment, not deployed authority or a certified financial feed.
**Deno runtime: NOT TESTED. Provider fetch remains without a local deadline; no unambiguous shared timeout contract was found. Scheduler compatibility, staleness and concurrent monotonicity are unresolved; deployed-writer activation is NO-GO.**

The updater blob before this tranche is `bd2886c71ba0cc63add8277fb58b048c4a9fdbc0`.

## Evidence and contract

The existing handler describes pg_cron but repository search found no producer
or scheduled invocation. It creates a service client, fetches external responses
and upserts reference rates without an ingress guard. No claim is made that its
live deployment or caller configuration matches this source. Canonical scheduler
authority is `_shared/internal-secret.ts`: an exact configured internal secret
or service-role bearer, separate from user/admin capabilities.

The candidate accepts OPTIONS without side effects and POST with that existing
guard before provider access/client creation. No manual-admin path is invented.
Other methods/anonymous/ordinary JWT/invalid secrets cannot fetch or write.
Request body/query values cannot select a provider, base, targets or actor.

Both fixed existing URLs remain. Primary accepts only successful HTTP,
`result: success`, `base_code: THB`, self rate THB=1 and complete USD/EUR/RUB
numeric data. Fallback accepts only successful HTTP and the explicit historical
`success: true`, `base: THB`, rates shape; missing/unknown schemas fail closed.
This is not evidence that the current fallback API actually provides that shape.
No API key, paid provider capability, endpoint change or new credential is added.

Every target must be an own numeric finite positive value representable by the
existing numeric(12,6) column; reject coercion, rounded zero, overflow and partial
batches. Only a fully validated batch reaches the existing single upsert with
base/target conflict key. Source/api actor fields remain server-controlled.
Existing ingestion-time `updated_at` semantics are unchanged. No provider as-of,
staleness threshold, concurrent monotonic writer or financial conversion rule is
chosen by this patch. Errors do not manufacture defaults or successful writes.

## Isolated verification

`scripts/qa/currency-rate-updater-boundary.mjs` bundles the actual entrypoint and
actual internal-secret guard. Only Supabase SDK/provider transports are replaced.
No live HTTP or database is used. Tests were authored first: baseline anonymous
request returned 200 where 401 was expected under synthetic SDK/provider stubs.
The candidate exercises authority/method denials with zero SDK/fetch/DML,
valid fixed complete batches, primary/fallback failures, malformed JSON, infinite
JSON exponent, nonnumeric/zero/negative/missing/underflow/overflow data and failed
DML. The fixture is registered in connected CI's focused stage.

## Activation gate and rollback

Source review GO is separate from deployment. Deployment remains NO-GO until the
actual scheduler method/header contract is verified read-only and operator
compatibility is accepted. Also unresolved: provider/fallback availability and
attribution/terms acceptance, rate freshness policy and whether ingestion time
is sufficient, and atomic stale-overwrite protection if concurrent writers exist.
The primary provider documents daily open-access updates and attribution:
https://www.exchangerate-api.com/docs/free . No unsupported fresh/live quote is
promised. No schema, role, cron, secret or production reference/financial row is
changed here.

Rollback preserves containment: disable the governed updater invocation rather
than redeploying the unauthenticated writer. Actual schedule changes are outside
this task and are not performed. Existing stored data is untouched on rejected
requests/provider failures; stale-data presentation remains explicit reference
information rather than a guaranteed executable exchange quote.
