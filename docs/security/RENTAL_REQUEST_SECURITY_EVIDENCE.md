# Rental request security evidence and review gate

This is focused regression evidence, not a production security approval, SAST certification or waiver. The request/booking code baseline is `e1de85affdf5a69945d05aff3be99f3356f495bc`; the CI evidence report binds the actual current PR head and source-file hashes.

Both blocking authored-source verification paths run the actual isolated PostgreSQL suite, then validate its JSON report with `scripts/qa/rental-request-security-evidence.mjs`. Missing/skipped/failed/duplicated cases, absent required controls, global test failure or an invalid subject SHA fail the gate. Parser regressions also run. No test/timeout/coverage requirement is removed, no production database is used, and workflow permissions are unchanged.

The generated `rental-request-security-evidence` artifact records the exact subject SHA, workflow run ID, full-report checksum, relevant source checksums, 25 actual SQL assertions and named control coverage. It contains no test payloads, production records or credentials. The connected-system artifact also retains the report alongside the full unit evidence.

Required review covers actor/key/payload binding, lost acknowledgement, transaction rollback, scoped operator reads, NULL-safe authorization, nonblocking requests, conflict rollback on confirmation, cancellation boundaries and emergency-stop preservation of receipts. These assertions exercise real SQL under synthetic database roles; they do not establish deployed RLS/privileges or live booking/payment behavior.

ECC Tools reported `Security Evidence: action_required` for the initial head and an inability to publish Checks without app-owner permission approval. This evidence is provided for guarded review. No app permissions, rules, CodeRabbit settings or waiver state are changed. The reviewer must verify artifact head/checksums and required control counts against the same successful CI run before accepting the evidence. Missing bot publication or a green unrelated check cannot substitute for that review.

SQL remains an unapplied candidate outside migration journals. Backend activation, commercial price validation, payment/P&L, credentials, production restoration and deployment remain separate gates.
