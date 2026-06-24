# `src/data/` — Data-access contract

> **Status:** introduced in Increment 1 (architecture hardening). This is the
> canonical home for typed, cached data-access. Today it re-exports the best
> existing domain hooks; over Increment 2 the raw call-sites migrate here.

## Why this exists

The app had **three** competing ways to talk to Supabase: ~243 components/pages
importing the raw client, hundreds of TanStack `useQuery` sites, and hundreds of
`useEffect` fetch loops. Three paradigms = no single place to enforce error
handling, loading states, caching, or RLS reasoning, and the repo rule "every
query in try/catch" became unenforceable.

`src/data/` is the **one contract**. Presentation layers (`src/components/**`,
`src/pages/**`) must not import `@/integrations/supabase/client` directly — a
warn-level ESLint rule (`no-restricted-imports`) and
`scripts/validate-architecture.mjs` track and ratchet this down.

## The contract

Every data hook follows the shape already proven in
[`src/hooks/useAgentDeals.ts`](../hooks/useAgentDeals.ts) and
[`src/hooks/useProperties.ts`](../hooks/useProperties.ts):

1. **TanStack Query only** — `useQuery` / `useInfiniteQuery` / `useMutation`.
   Never `useState` + `useEffect` for fetching.
2. **Centralised query keys** — from `queryKeys` in
   [`src/lib/queryConfig.ts`](../lib/queryConfig.ts). One source of truth for
   cache invalidation. Add a factory there before writing a new hook.
3. **A cache profile** — `CACHE_PROFILES.{STATIC,SEMI_STATIC,DYNAMIC,REALTIME,ADMIN,WEATHER}`
   from `queryConfig.ts`, chosen by data volatility. No ad-hoc `staleTime`.
4. **Error handling at the edge** — `if (error) throw error;` inside `queryFn`;
   surface to the user with a toast in `onError` for mutations.
5. **Invalidate on mutation** — `queryClient.invalidateQueries({ queryKey: queryKeys.<domain>.all })`
   in `onSuccess`; optionally `setQueryData` to avoid a refetch.
6. **The client is imported only here** — `@/integrations/supabase/client` may be
   imported from `src/data/**`, `src/hooks/**`, `src/lib/**`, `src/integrations/**`.

### Reference template

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES, queryKeys } from '@/lib/queryConfig';
import { toast } from 'sonner';

export function useThings(filters = {}) {
  return useQuery({
    queryKey: queryKeys.things.list(filters),
    ...CACHE_PROFILES.SEMI_STATIC,
    queryFn: async () => {
      const { data, error } = await supabase.from('things').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      const { data, error } = await supabase.from('things').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.things.all }),
    onError: (err) => toast.error(err.message),
  });
}
```

## Layout

```
src/data/
├── README.md                       ← this contract
└── repositories/
    └── <domain>/
        └── queries.ts              ← useXxx query/mutation hooks for one domain
```

`repositories/properties/queries.ts` is the first reference. New domains get a
folder; existing domain hooks in `src/hooks/` migrate here folder-by-folder in
Increment 2, at which point the ESLint rule for that folder flips `warn → error`.
