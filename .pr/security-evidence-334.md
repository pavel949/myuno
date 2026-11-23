# Security regression evidence: myUNO Admin Inbox and consultation handoff (#334)

Tested application tree: `eede7154bbc6aedbb0f0024ab8fe59ba11110be4` (tree `ee4ca8bcfdd6c9f703de09938940dbd955871aab`). This artifact does not change runtime, authorization, or workflows.

## Sensitive surface

`src/hooks/useAdminConsultations.ts` now supports an exact single-request read. Its cache key includes the admitted actor and request reference; malformed or actor-less selections do not query, and an exact miss is not replaced with the full queue. Existing status and note writes stay scoped to the selected persisted record. The surrounding admin route and existing database policy remain responsible for authorization; a UUID is not an access grant.

## Reproduction

From this PR checkout with locked dependencies installed:

```sh
npx vitest run --maxWorkers=2 \
  src/components/admin/InboxRequestDetail.test.tsx \
  src/components/crm/ConvertLeadToDealButton.test.tsx \
  src/components/property/PropertyMarketEnquiry.test.tsx \
  src/components/property/detail/__tests__/PropertyDetailMobileBar.test.tsx \
  src/lib/adminInboxRequest.test.ts \
  src/lib/nav/__tests__/adminTaskNavigation.test.ts \
  src/lib/nav/__tests__/navigationModel.test.ts \
  src/pages/admin/AdminInbox.test.tsx \
  src/pages/admin/__tests__/AdminConsultations.filters.test.tsx \
  src/pages/property/__tests__/PropertyDetailIntent.test.tsx \
  src/pages/property/__tests__/OffplanEnquiry.actual.test.tsx \
  src/components/landings/LandingLeadForm.test.tsx
```

Result on the cited tree: **202/202 tests passed across 12 files**; exit status 0.

- `AdminConsultations.filters.test.tsx` exercises the actual Inbox handoff and consultation hook together: the canonical request stays selected, an unrelated row is not displayed, and status and note writes match only the original reference. Invalid references make no request; an unavailable exact row does not fall back or write.
- `InboxRequestDetail.test.tsx` denies non-admin and invalid sources, removes prior actor data when admission changes, and confirms that Help status changes target the exact request and require readback.
- `ConvertLeadToDealButton.test.tsx` confirms that missing or malformed links cannot initiate conversion or navigation; only an already linked canonical deal can be opened.
- `PropertyMarketEnquiry.test.tsx` preserves exact property intent without creating a booking and does not replay a request whose outcome the legacy server cannot establish.

## Limits

These are focused defensive regressions with synthetic actors, records and mocked Supabase transport. They are not a general security scanner, production authentication/RLS proof, or provider-delivery verification. No production records, external sends, new CRM writes, real payments or reservations were exercised. Existing [exact-head focused CI](https://github.com/pavel949/myuno/actions/runs/45291256872) and repeat CI on the evidence commit remain independent gates.
