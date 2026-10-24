# Public managed-complex detail binding

19 October 2026. Source baseline: main `20d3cb3954202710ec4db62ca54e9db88ccba4cb`.

## Evidence and contract

Employee complex authoring persists `property_complexes`; employee unit authoring
sets `properties.complex_id`. The existing `/property/complex/:id` page resolves
`property_projects` and `project_id`, so changing its interpretation would break
existing links. Add `/property/residential-complex/:id` without altering that route.
Reuse the canonical public-unit query and rental/sale eligibility predicates,
selecting its foreign-key column explicitly. Do not copy inventory or map IDs
between the domains.

`usePublicComplexDetail` selects descriptive fields only from
`public_complex_catalog`. There is no fallback to private complex rows, including
for authenticated administrators, or to similarly named projects. The checked
publication candidate defines public rows as active and approved (or legacy
NULL approval). Unit cards are sourced only from `public_property_catalog`.
Missing projection/permission/network failures show a retryable error; unpublished
or missing rows show not-found. Unit reads are disabled until public complex
resolution. Unit pages show a complex link only after public resolution.

The detail page preserves Rent/Buy, guest dates/count and explicit operator
filter, supports pagination, safe stored photos/video, and RU/EN/TH UI. Amenities, services, security and
infrastructure render the exact authoring taxonomy from `complexConstants.ts`;
unknown saved values remain text. Current public schema has no facility schedules,
so opening hours are labelled not provided rather than invented. Stored
names/descriptions use their actual RU/EN values; no Thai content is invented.
`PropertyDetail` calls `usePropertyWithRentalTerms`, which supplies
`PROPERTY_PUBLIC_DETAIL_COLUMNS` (including `complex_id`) to
`selectPropertyCatalogFirst` and retains it in the returned normalized property.
The public view in migration 0026 explicitly selects `complex_id`. A focused hook
test asserts the actual selected column list and returned value, not only its type.
The page has no booking, publication, privilege or production-write action.

## Verification and activation gate

Focused Vitest hook/page tests verify separate FKs/URLs, safe fields, no private
fallback on missing/forbidden views, not-found vs error, mode/context/pagination,
localization and public-only links. Existing project-page tests remain unchanged.
Focused result: 69 tests across six files passed; targeted lint and diff whitespace
checks passed. These are synthetic tests, not production or visual/browser acceptance.

Production publication migration was not executed or retried. This frontend is
not evidence of a deployed public projection or completed employee→approval→guest
workflow. Activation requires separately authorized server-contract verification
and browser acceptance when the permitted environment is available. No browser,
full build or full typecheck was run for this patch.

Rollback: revert this frontend commit to remove the managed route and unit links;
leave existing project URLs and any server publication/private boundaries intact.
