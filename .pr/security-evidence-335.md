# Security evidence: booking guest chat (#335)

Combined application tree tested: `a753ee02255bcd5305a3e50ef76daca6bff52567`, at `145e65a0a6d4458b8afa1e027762ea31d00c78f7` before adding this Markdown record. That draft incorporates main `621f8ef91021d90640217d466324f18b9fa2d505`.

## Changed sensitive surface and validation

The Today booking detail links to the existing guest chat by inventory booking ID. The route checks the record against the current actor before mounting the existing composer. The [chat hook](../src/hooks/usePropertyChat.ts) scopes the transcript cache to actor, property and booking. No server role, database policy, or message writer changed.

The [focused test](../src/hooks/__tests__/usePropertyChat.security.test.tsx) runs the real owner route, chat window, transcript hook and React Query under simulated account changes. Auth, unrelated UI peripherals, and the read and subscription transport are mocked. The fixture has no write methods and the test runner denies non-local network access.

- Synthetic actor A sees one scoped transcript and types an unsent draft. The fixture records the expected ownership and message queries.
- Switching to actor B at the same route, while the ownership request is pending and then denied, removes the old transcript and composer immediately and closes the prior subscription. The app makes no second transcript read or new subscription, and B has no transcript cache entry.
- The adjacent owner-route suite covers the verified booking, absent and mismatched records, read denial, direct and missing-ID entry, and the return to Today with the original query and fragment. The Today and booking-sheet suites cover exact inventory-ID handoff and keep booking status distinct from payment evidence.

## Reproduced pass/fail gate

```sh
NODE_OPTIONS="--require $PWD/scripts/qa/local-network-only.cjs" ./node_modules/.bin/vitest run --maxWorkers=2 \
  src/hooks/__tests__/usePropertyChat.security.test.tsx \
  src/pages/owner/__tests__/OwnerChatRoom.booking.test.tsx \
  src/pages/mc/operations/__tests__/PmsTodayPage.test.tsx \
  src/components/owner/__tests__/BookingDetailSheet.test.tsx \
  src/test/design-system/routeInventoryFreshness.test.ts
```

```text
usePropertyChat.security.test.tsx       1 passed
OwnerChatRoom.booking.test.tsx        11 passed
PmsTodayPage.test.tsx                  38 passed
BookingDetailSheet.test.tsx           11 passed
routeInventoryFreshness.test.ts        2 passed
Test Files  5 passed (5)
     Tests  63 passed (63)
```

This is focused client-boundary regression evidence, not SARIF, an independent scanner clearance, or validation of deployed server RLS, authenticated browser behavior, or real message delivery. No production requests, customer data, message writes, or workflow/security permission changes were used.
