# Security evidence: support ticket history (#337)

Combined application tree tested: `5c0d38adc0cd34a72305b88a8d45462aa773fcdd` (the expected merge of draft `795decb0874f06c5b8653494493f0fa5a4de0e58` into alignment with main `621f8ef91021d90640217d466324f18b9fa2d505`, before adding this Markdown record).

## Changed sensitive surface and validation

The support history link opens the existing ticket list. The production hook change exposes read status for the UI; it does not change ownership filters, role policies, the database, or ticket writes. The focused regression exercises the real [`useTickets` hook](../src/hooks/useTickets.ts) and QueryClient, with only the auth context and read adapter mocked. Retries are disabled to make denial timing deterministic.

- Signed-out clients do not initiate a history read. Sign-out drops the previous account's rows from the active hook even when its cache entry still exists.
- History requests bind to the current account. A delayed response from the prior account stays under its own key and does not appear for the next account.
- A denied scoped read exposes an error and no prior account rows; it does not masquerade as a confirmed empty history.

## Reproduced pass/fail gate

```sh
NODE_OPTIONS='--require ./scripts/qa/local-network-only.cjs' npm test -- src/hooks/useTickets.security.test.tsx --maxWorkers=1
```

```text
✓ src/hooks/useTickets.security.test.tsx (3 tests)
Test Files  1 passed (1)
     Tests  3 passed (3)
```

This is focused client-boundary regression evidence, not SARIF, an independent scanner clearance, or proof of deployed server RLS. No production access, real customer data, or writes were used. Existing GitHub checks and workflow permissions remain unchanged.
