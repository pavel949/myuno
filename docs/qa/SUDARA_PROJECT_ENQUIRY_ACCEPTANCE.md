# Sudara: operator handoff for one project enquiry

## Scope

On the existing authorised Inbox request, **Handle this request** opens the
existing Consultations workspace at `/admin/consultations?request=<receipt UUID>`.
It selects only that canonical consultation row under the current actor and RLS;
missing, invalid, and failed lookups do not fall back to the general queue.
The operator can use the existing status and internal-note actions. This is a
project enquiry, not a deal, reservation, payment, or message to the developer.

The checked buyer writer and newbuild-only outbox are reviewed separately in
[#310](https://github.com/pavel949/myuno/pull/310). This operator change does not
activate that writer, apply SQL, change roles, or send notifications.

## Verification

- Operator: run `vitest run src/pages/admin/__tests__/AdminConsultations.filters.test.tsx src/components/admin/InboxRequestDetail.test.tsx src/lib/adminInboxRequest.test.ts src/pages/admin/AdminInbox.test.tsx`.
  Actual React components and route, synthetic data adapter: open the exact UUID
  from Inbox, mark Contacted, save the internal note, prevent list fallback.
- Buyer: in #310, run `vitest run src/pages/property/__tests__/OffplanEnquiry.actual.test.tsx src/lib/consultationIntake.test.ts`.
  The checked intake uses one key across an uncertain response without falling
  back to a different writer.
- Database: apply only #310's fixture, checked intake, and alternative outbox SQL
  to a disposable database. Submit the synthetic Sudara project enquiry, lose
  the response, retry with the original key, and resolve the same UUID. Verify
  exactly one request, one email job, one WhatsApp job, zero sends, no developer
  disclosure. With authorised operator role record Contacted and an internal
  note; reload, then retry buyer intake and confirm it does not change either.
  A generic employee without access must see and update zero rows.

These are separate isolated checks, not an authenticated browser-to-production
acceptance. Before opening this route to launch traffic, confirm the exact
released build, the approved safe writer and its grants, configured myUNO-only
test destinations, processing and read-back with the intended operator role,
and rollback. No real customer enquiry was created by these tests.
