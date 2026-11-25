# Booking confirmation is not payment — review-only containment (#347)

**Class C / NO-GO for activation.** Baseline d151a23cf0526d6ae9183f2a7cc2f34ec8e6f25d. This package is deliberately outside registered migrations. It changes neither production nor preview.

## Read-only evidence (25 Nov 2026)

- Live public.create_financial_from_booking() body MD5 ae00d05a916624fc9707b9679118b4a5 exactly matches the applied source 20260225151243_38a83508-b901-4d34-97e5-4b5866663e36.sql (compared via SELECT md5). Trigger trg_create_financial_from_booking is enabled AFTER INSERT OR UPDATE on property_bookings.
- Confirmation/reconfirmation inserts rent and cleaning income with status paid without any verified payment. The enabled AFTER INSERT trigger trg_sync_financial_to_ledger on property_financials calls fn_sync_financial_to_ledger (body MD5 73e1d44bc0d5ac98472021938f859bf1). It does not check verification_status or payment evidence. Merely changing the booking-created record to pending would therefore be insufficient.
- The current owner finance UI already labels records unreconciled (docs/hardening/mc-finance-overview.md). UI containment cannot prevent new bad accounting records.

## Contract
Stop only the unsupported financial posting made by this legacy booking confirmation trigger. Keep the existing operational booking_confirmed audit event, actor, amounts and dates. Those amounts describe a booking, not a payment. The canonical booking/calendar/status history and separate payment writers remain untouched; no new table, financial state, transaction, account or ledger truth is introduced. Existing financial rows and mirrored ledger entries stay unchanged, including historical errors. No unverified replacement accrual is inserted because the current mirror would post it.

## Verification and release gates
The native PostgreSQL regression fixture installs the exact predecessor migration and an intentionally synthetic immediate-ledger mirror; it demonstrates the legacy failure, and checks confirmed insert, transition, cancellation/reconfirmation, iCal-style imports, unrelated updates, preserved historical rows, standalone record path and a security-preserving rollback. It does not certify manual payment authority, the real ledger mirror, or historical cash reconciliation. Run `npx vitest run src/lib/__tests__/bookingFinancePosting.postgres.test.ts` in the existing isolated CI. The current runtime cannot clone/install the repository and no local PostgreSQL execution is claimed.

Before any production activation: exact-head CI, independent financial review, inventory/operation regression including Layantara and Condominiums, verify actual canonical cash writer and statements still show verified receipts, current live predecessor/readback, rollback rehearsal, and an explicit GO decision. The fallback rollback never restores automatic paid records; it temporarily suppresses the legacy activity event only if the two independent audit/status triggers are still enabled. It is not a historical repair.

## Separate accounting work
Ratify the company-scoped verified-payment-to-ledger contract and evaluate the live generic ledger mirror independently. Reconcile historical legacy entries with payment evidence (including refunds, cancelled/re-imported iCal bookings, duplicates, mixed currencies and Bangkok periods). Avoid irreversible changes without an accounting reconciliation plan. The UI PRs #283/#284/#286 must be reconciled against current main; #288 was a partial UI release. Do not claim realized revenue or P&L from the synthetic fixture.
