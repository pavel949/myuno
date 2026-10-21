# Homepage bouquet-query error contract

Base: `600b1f95af93d9da538cc0f5491551472a7512b6`. A real QueryClient
regression reproduced a plain PostgREST error entering query state `error` while
`useBouquets` exposed `error: null`, allowing the homepage to show an empty
catalogue instead of its existing error state. Baseline: 2 failed / 1 passed.

The list fetch now preserves native Error identity and normalizes a returned
plain error into a generic Error. Backend message/details are not exposed. The
projection, filters, ordering, query key, data identity, retry/refetch contract
and single-bouquet detail hook are unchanged. No public UI copy, role, write or
price changes.

Verification: 3/3 focused tests passed using the actual QueryClient and actual
hook, covering plain-error visibility, native Error identity, and refetch
recovery with unchanged key/filters/ordering/data. External fetch is forbidden.
Scoped lint and diff checks passed. No heavy type/build or responsive browser
run was performed in this isolated tranche; parent owns integrated actual-App
verification after review. No push, PR metadata, merge or deployment.
