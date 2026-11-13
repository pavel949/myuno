# Lead retry finding — 2026-11-13

Finding: `3e7d707d-f584-5018-9ccb-f2e001c31f7b`.
Baseline HEAD: `2e48b0a70e4c5048e9481d435137f23bac5dcf99`.
Verified source HEAD before this report: `22270ff94e9733715b0f7c2aaf1d5a860df4f636`.

## Confirmed cause and bounded fix

`consultationIntake.ts` retained the pending fingerprint for legacy `P0001` required-field rejections. Editing details then failed before the RPC, including after remount. The registered SQL raises `name_required`, `phone_required`, `request_type_required` without an explicit SQLSTATE.

The shared helper now clears pending state for those exact `P0001` messages, alongside the existing `22023`/`22P02` handling. Zod rejects blank/whitespace name, phone and request type before storing a nonce or sending a request. All three callers use shared localized validation/unknown-status messages. Unknown exceptions, access errors, conflicts and transport outcomes still do not silently reset the key.

Changed source: `src/lib/consultationIntake.ts`, `src/hooks/useUniversalLead.ts`, `src/hooks/useConsultationRequests.ts`, `src/components/property/PropertyTourLeadForm.tsx`.
Retained regression tests: `src/lib/consultationIntake.test.ts`, `src/hooks/useConsultationRequests.receipt.test.tsx`.
Execution docs: `AGENTS.md`, `roadmap.md`, this report.

## Fresh evidence

- `bun run test src/lib/consultationIntake.test.ts src/hooks/useConsultationRequests.receipt.test.tsx`: **35/35 PASS** (16 helper, 19 hook tests).
- `python3 /tmp/browser/lead-retry/check_form.py`: actual form with intercepted auth/language/client modules; all external network denied. Whitespace input makes no RPC; stubbed P0001 rejection clears storage; corrected name plus added note submits with a new key and shows Thank you. Two RPC calls, one stubbed notification, no real delivery. Screenshots `/tmp/browser/lead-retry/rejected.png`, `corrected.png` reviewed. Desktop 1280×1800; not live E2E. Expected caught validation errors appear in the existing form console logging.
- Harness latest build: **build OK**, 2026-11-13T02:07:09Z.
- `git diff --check`: clean.
- SELECT-only function metadata: `has_legacy_name_validation=true`, `has_request_key=false`, `has_payload_fingerprint=false`, `has_actor_key=false`. No contact rows or secret values read.

## Explicit remaining boundary

The live RPC lacks verified server idempotency. The existing same-key replay algorithm is not changed in this narrow fix; its synthetic recovery tests exercise the client contract, not live duplicate safety. Replaying after a lost response can still duplicate a legacy insert. UI now says the status is unknown and directs the visitor to the team, rather than promising a safe retry. Backend candidate is unapplied and was not activated. Closing transport recovery requires a separately reviewed backend contract; no migrations, deployments, publication, Auth/invitation settings, working data or outbound notifications were changed.

Result: definitive input-rejection lock **fixed**; ambiguous network recovery **not certified**.