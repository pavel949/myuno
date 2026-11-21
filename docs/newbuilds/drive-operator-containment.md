# Drive review: operator containment and pending-only pilot

The existing project documents route retains its normal document vault. Its
Google Drive panel is a read-only history, not an importer. It cannot invoke
the legacy folder job, apply/discard extracted data, remove a source, or enable
its watch. It queries only the signed-in actor's accessible project receipt
metadata and whether the visible sources include a watch setting. It does not
read source URLs, extraction payloads, or error logs; receipt states refer to
file processing only, never price freshness, availability or publication.

**Rollout limit:** this client change does not stop a configured background
job or an already-running import, change an Edge Function/API/RLS, or flush
other clients. “Watch configured” is not confirmation that a scheduler is
active. Direct invocation of the legacy writer remains out of scope. No
production changes or account permissions are implied by this code.

## Smallest safe pilot

1. Use one approved, dated developer observation with an exact existing
   project/source/job and sales unit linked to its canonical physical unit.
   Preserve original artifact/revision/effective date separately from the
   reviewed normalized bytes. Unknown remains unknown. A generic folder or
   project layout is not proof of availability.
2. Continue using the existing offline [preview](source-preview-contract.md)
   and isolated [pending-only staging acceptance](drive-stage-postgres-acceptance.md).
   The [adapter](drive-stage-adapter.md) validates role/project/source/job,
   bytes/hash, exact linkage, and reads back the pending receipt. It is
   disconnected; neither history UI nor offline preview starts it.
3. Before a hosted pending-only pilot, use a separately authorized
   actor-scoped backend and exact admitted source, and prove private stage
   receipt readback, concurrent/version mismatch and denied actor behavior.
   Do not use the old Apply flow, enable a scheduler or upload to public storage.
   No stock, ownership terms, live quote, property ID, or catalogue row is
   created or published by a dry run.
