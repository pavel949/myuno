# First four area guides — draft implementation

Status: PARTIAL / NO-GO for release. No merge, deploy, publication, production DB mutation, ACL, credentials or DNS changes are authorized by this work.

## Reuse contract

The editorial registry `src/content/areas/areaRegistry.ts` extends existing `PHUKET_DISTRICTS` identities (`laguna`, `bang-tao`, `nai-yang`, `kamala`) and existing `/area/:slug` routes. Existing `PHUKET_AREAS` supplies profile names where available; Nai Yang already exists in the district taxonomy, but had no old investment profile. No fabricated price/yield/rating/coordinates were created to fill that gap. The `/area` index retains the other existing guides. No `/locations` route, DB table, alternate geographic ID or polygon was added. `properties.location_id` retains its existing address/coordinate FK meaning.

Registry fields: key, slug, historical aliases, kind, explicit relationship with evidence URL, RU/EN copy, explicitly null/unreviewed Thai copy, sources with checkedAt, photo source file/author/license/capture date/URL/alt. Thai selection explicitly discloses English fallback; it is not presented as a reviewed Thai translation. Editorial fit/tradeoff guidance is a recommendation, not a sourced measurement or investment promise.

Laguna is a resort community within the wider Bang Tao coastal area, evidenced by the resort operator. These are distinct existing listing keys. Relationship metadata never expands an inventory predicate or sums child counts. No administrative boundaries, walking radii or centroid-as-polygon claims.

## Inventory and navigation

- Rentals: existing `usePropertiesCount` and `useProperties` over `public_property_catalog`, canonical district + existing district aliases, rental eligibility. The public projection supplies active/approved/non-deleted boundaries; preview additionally retains the hook's explicit approval filter.
- Projects: exact server count, existing `applyProjectCatalogFilters`, active + exact English district label, matching `useOffplanProjects`. Read-only production evidence confirms the active public SELECT policy and separate `public_listing_enabled` policy; the distinct flag is not silently substituted for the existing search contract. This tranche does not change publication or RLS.
- Resale: exact server count, active status + exact zone label, matching `useResaleProperties`. Existing resale index now reads/writes `zone` in the URL and supports browser history.
- Categories are separate entity counts, never project units mixed with properties. Previews are deduplicated by entity ID; server counts are exact PK row counts, never preview length or summed overlapping districts.
- Failed reads remain retryable errors. Empty inventory never creates cards or active category search actions. Missing project/resale count is an error, not zero. No static count fallback.
- Rental links force rental mode and retain applicable query filters/dates while replacing location. Legacy rental intent (`rent-long` / `rent-month`) is preserved; sale-specific intent and old location/page keys are cleared. Unrelated rental filters are not forwarded to project/resale searches.

**Coordinated follow-up:** the parent assigned the minimal district-reader change in `OffplanIndex.tsx` to this branch. It now reads/writes only `district` in the existing URL, preserves other parameters, follows history and clears the district on reset. No card/form/import/intake or publication behavior changed. Five actual-page Router cases compare all four area-link districts with the count resolver and verify Back/reset. The area project search link is now enabled.

## Primary factual sources (checked 2026-10-25)

- https://www.angsana.com/thailand/laguna-phuket — resort between lagoons and Bang Tao beach, within Laguna.
- https://www.lagunaphuket.com/ — Laguna integrated destination, golf; no changing hotel count copied.
- https://www.lagunaphuket.com/experience/canal-village-laguna-phuket/ — minimart, pharmacy, laundry, shops/cafés, other listed facilities. Opening hours/access must be checked directly.
- https://www.tourismthailand.org/Attraction/hat-kamala — Kamala beach and restful visit. No beach length/travel time copied.
- https://www.tourismthailand.org/Attraction/sirinart-national-park — Nai Yang/Sirinat context.
- https://www.tourismthailand.org/Destinations/Provinces/Phuket/350 — Phuket beach context, red-flag swimming advice.

## Media provenance (checked 2026-10-25)

All are real historical photographs, not generated imagery. Capture dates are visible and do not imply current property/building conditions. Each rendered photo has adjacent source/author/license links and a crop disclosure. Derivative crops retain the stated CC BY-SA license. Responsive 640/1280 srcsets, fixed aspect boxes, alt, lazy loading (eager area hero) and failure states are implemented.

| Area | Commons source | Author | Captured | License |
| --- | --- | --- | --- | --- |
| Laguna | https://commons.wikimedia.org/wiki/File:Angsana_Laguna_Phuket.jpg | Banyantree2014 | 2013-07-09 | CC BY-SA 4.0 |
| Bang Tao | https://commons.wikimedia.org/wiki/File:Sunset_at_Bang_Tao_beach_-_02.jpg | Anton Zelenov | 2017-10-21 | CC BY-SA 4.0 |
| Nai Yang | https://commons.wikimedia.org/wiki/File:Nai_Yang_Beach_(29).jpg | Wolfgang Holzem / isaan.live | 2010-11-23 | CC BY-SA 4.0 |
| Kamala | https://commons.wikimedia.org/wiki/File:Kamala_beach.jpg | govertvissers | 2014-07-30 | CC BY-SA 3.0 |

Rejected alternative: `File:Kamala_Beach_-_panoramio.jpg` has conflicting Patong coordinates/tags despite its title; not used.

**Media blocker:** external image downloads and actual Chromium image requests failed in this environment (network proxy 403). Source captions/licenses and thumbnail URL resolution were read through web tools, but image bytes/recognisability/crops/loading have NOT passed local acceptance. Screenshots deliberately show the genuine failure state, not substituted travel pictures. Complete local downloads/visual review and real loading tests before release; do not claim the photogallery is ready.

## Evidence and limits

`node scripts/qa/area-browser-smoke.mjs` uses the real app/router/components with synthetic intercepted read-only backend requests. No production seed or teardown. It tests keyboard Enter from gallery, area→rental URL→Back, area→off-plan exact-district query→Back, area→resale filtered results→Back, at 320/390/430/1440. Screenshots and request predicates: `/tmp/myuno-area-evidence/` (`home-WIDTH.png`, `area-WIDTH.png`, `results.json`). All four cases report no document overflow and no page errors. Inspected 390 and 1440 area screenshots; they show unavailable photo states. This does not prove live supply, photo loading or booking availability.

Targeted 41 tests in six files cover taxonomy reuse, aliases/relationship separation, preserved rental criteria, per-category server count predicates, missing-count errors, duplicate preview IDs, gallery supply/empty/error/loading/photo-failure states and existing landing contracts. Typecheck passes. Full lint: zero errors, 2475 warnings; changed-file lint has warnings but no errors. Production build passes the design prebuild guard after removing two new local geometry classes. Generated version/MCP build outputs are excluded from the change.

Read-only production evidence is now recorded in `INVENTORY_READONLY_2026-10-25.json`: Laguna 1 rental / 11 active approved projects / 0 resale; Bang Tao 14 / 22 / 1; Nai Yang 3 / 4 / 0; Kamala 0 / 23 / 0. All counts use DISTINCT IDs, existing exact project/zone labels and rental eligibility. `public_property_catalog` live view definition confirms active + approved + non-deleted predicates. All projects in these four exact districts are approved. Public `is_active=true` and `public_listing_enabled=true` project SELECT policies coexist; the second flag has fewer rows and is not equivalent to the existing active/public catalog contract. SQL introspection is not anonymous-browser/RLS acceptance or date-specific rental availability.

Remaining acceptance: anonymous browser/publication behavior; real image bytes/loading/visual crop verification; reviewed Thai content; terminal exact-head CI. No production DB acceptance is inferred from fixtures. A source/model draft is not a released populated platform.


Exact previously observed media transport errors (no new retry or tool switch after denial):

- `https://upload.wikimedia.org/wikipedia/commons/a/a9/Angsana_Laguna_Phuket.jpg`: `curl: (56) CONNECT tunnel failed, response 403`; HTTP header `HTTP/1.1 403 Forbidden`, `server: envoy`, `content-length: 16`.
- `https://upload.wikimedia.org/wikipedia/commons/d/dc/Kamala_beach.jpg`: `curl: (22) The requested URL returned error: 403`.
- `https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Kamala_beach.jpg/1280px-Kamala_beach.jpg`: `curl: (22) The requested URL returned error: 403`.
- Initial Commons API attempt: `URLError: <urlopen error Tunnel connection failed: 403 Forbidden>`. No response-body text was captured for these media errors, so none is invented here.

Follow-up browser smoke aborts previously denied thumbnail hosts locally and exercises the honest failure state without retrying external transport. Existing `public/` assets were checked; the Bang Tao named files are transfer/SUV artwork, not georeferenced area photographs. Other photos lacked confirmed area provenance/rights and were not relabelled. Independent image research found commercial stock requiring a purchased license and a separately credited Nai Yang photo at https://www.paidaidmc.com/credits (Andy Mitchell, CC BY-SA 2.0); no new asset was accepted without byte/identity/license review, and no media blocker is claimed solved.
