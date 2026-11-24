# One reviewed price observation: disconnected canonical stage adapter

This module is not an Edge route, provider client, migration or scheduler.
It has no production call sites. Local tests provide synthetic injected ports;
there are no network calls, service credentials or catalogue writes in tests.

The adapter requires scoped admin admission and a trusted read of the existing
developer, project, Drive source and import job. The port must supply the
reviewed parser version, the approved SHA-256 of the normalized JSON snapshot,
and the complete exact sales and physical match set for safe ambiguity checks.
It does not create a registry, new units, source jobs, actor roles or approvals.
The actual backend must derive authorization from its authenticated request,
not from any browser flags. The observed stage RPC is service-only.

V1 consumes deterministic UTF-8 normalized **single-row** JSON with only
`unit_code`, `unit_type`, positive decimal-string `amount`, explicit supported
`currency`, `price_unit: "total"`, and explicit observed `status`. It hashes
those exact reviewed normalized bytes, not arbitrary original PDF or Drive
bytes; future ingestion must retain separate provenance to the original
artifact. Unknown status remains unknown. Codes match one existing normalized
sales key and exact canonical spelling, and the sale UUID must connect to
one existing physical UUID in the same project. Source JSON credentials,
private links, raw parser objects and supplied identity fields cannot cross
the narrow RPC envelope. This slice is not multi-option L/F admission.

The RPC receives neutral project/source objects and `needs_review: true`.
If an existing job version does not match hash, parser and bound identity,
the adapter refuses it, including on post-call readback (the deployed RPC
replays by job only). An identical existing version is read without an RPC
retry. Any exception is sanitized; it is not automatically retried. The
receipt is acknowledged only after exact version and one item readback,
then a fresh canonical link check. The stage RPC itself does not create or
verify the physical linkage, and the adapter does not claim atomic canonical
linkage or non-revocation across separate remote reads. A changed link can
leave a private review item but never earns a success receipt or catalogue
change. An item price/unit code is an observation, not a published price.

Remaining before making this callable: load the exact deployed RPC, policies and
approved evidence adapter into an isolated backend; validate actual return
shapes, authorization, scoped reads and job conflicts end to end. Do not hook
generic Drive Apply, activate the watcher, or write production data through
this design. A project with no approved canonical sales/physical units, source,
job or cleared evidence must not use the adapter. No publication or real
Sudara unit/schedule claims are made by this patch.

Test:
`node --test scripts/lib/offplan-drive-stage-adapter.test.mjs`
