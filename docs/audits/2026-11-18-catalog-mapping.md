# Catalogue mapping audit, 18 November 2026

## Confirmed root cause and data correction
Live `categories.exchange` still had `cat-transport` as its parent and the `arrive` group. The static fallback had already moved it to `cat-finance`. DB-backed navigation therefore disagreed with static landing sections.

Read-only inventory: 90 category rows (27 roots, 63 leaves), 38 life situations, 1,319 catalogue-life links, 406 lookup values, 41 taxonomy definitions. No missing/nested parents or active children of inactive parents were returned. All life links reference active existing situations and weights in 0–100. This does **not** validate their linked offers or editorial relevance.

One guarded live update moved existing exchange row `a8cf49c5-db99-4a43-bae8-c42d96b6d668` to existing finance parent `99be2770-881f-4a04-98cb-44a7eac26674`, group `c31d1588-0f84-4681-ab2e-b952ee081cbe`. Route `/exchange`, identity, status and other data preserved; RETURNING and separate readback confirmed. A full category snapshot was saved before the update. No schema/RLS changes.

## Implemented tranche
- Landing destination grouping now consumes the same DB-backed catalogue as navigation, while preserving curated guide links and explicit scenario routes. Exact destination paths handle known live slug differences (`restaurant/restaurants`, `education/education-expat`) without renaming records.
- Master Catalogue editor can move a leaf between root categories and a root between sections. Existing two-level shape is validated; IDs and service workflows do not change. The root's group determines the effective section of its children.
- Failed/no-row saves are not reported as success. Admin reload errors are explicit.
- Structural diagnostics expose orphan/nested/inactive parents, duplicate slugs and missing sections, including otherwise hidden rows.
- LifeOS Quality no longer invents provider verification from recommendation weight or advertises no-op moderation. It reports only actual structural checks with explicit limitations.
- Arrival copy no longer promises an exchanger map that `/exchange` does not have.

## Service situations and connectivity
- Created `cat-connectivity` and moved existing SIM row there; no route/identity changes. Currency and SIM mutations were backed up and separately read back.
- Reviewed 58 active live service destinations against existing tags and inserted 211 initial service/situation links, retaining the established deterministic service UUIDs. No duplicate secondary navigation identities were imported. Existing 1,319 offer links were untouched.
- Removed misleading seed associations: transfer/emergency, VIP concierge/emergency, veterinary/human health, wedding/family relocation, banking/visa renewal.
- Public service situation filters now read active persisted links with public role scope. Successfully empty mappings stay empty; deleting a link does not resurrect static tags. Unfiltered services remain in the catalogue. Static fallback applies only during unavailable catalogue loading/error paths.
- Existing LifeOS mapping editor now offers named service choices and refreshes public catalogue caches. Mapping and quality lists paginate beyond the 1,000-row API cap.

## Existing editing surfaces retained
- `/admin/catalog?tab=categories`: section/category/service menu tree (`category_groups`, `categories`).
- `/admin/taxonomy`: vertical field dictionaries (`taxonomy_definitions`, `lookup_values`).
- `/admin/life-situations`: situations, entity links, ranking/roles, routes and resolver preview (`life_situations`, `catalog_life_map`, `lifeos_routes`).
- Property developer → project → physical property is a domain relation, not a menu category. Existing protected property editors remain authoritative.
- Experience topic hierarchy is the separate PR251 tranche; three-catalog entry hub is PR253. No duplicate editors or tables added here.

## Remaining gaps, not silently claimed complete
1. Experience registry remains flat; PR251 topic grouping is code-defined, not an editable parent relationship. No schema was invented here.
2. Existing live and fallback category slugs differ; explicit service identity aliases handle restaurants, education-expat and beauty-spa without duplicating destinations. Broader editorial reconciliation remains separate.
4. `useTaxonomyWithFallback` still revives static options when a DB dictionary is emptied. Runtime adoption of lookup values varies by vertical. This tranche does not certify all public field dictionaries are live editable.
5. Structural checks do not establish correct location, availability, working booking, published offering or relevance to children/families. No production transactions submitted for QA.

## Verification
Focused unit/component tests cover live grouping, status restrictions and placement validation. Browser fixture uses only synthetic in-memory data for move/save/reopen/cancel/Escape at 375/390/430/1440. Local Chromium launch was blocked by socket permissions; CI browser evidence is required before release. No automatic publish.

## Aquaria and public topic audit
Aquaria's listing used `category=attraction`, but the registry contained neither attraction nor aquarium. Escape Room was a correctly named independent `escape-room` row; the parks page showed that empty active topic alongside the unclassified Aquaria card, not a changed Aquaria title. Backed up the listing and full category registry, added the aquarium topic, and guarded-updated only Aquaria's category. Separate readback confirmed `aquarium / Океанариумы`, with discovery-only, published and concierge flags unchanged. Official identity checked at https://www.aquaria-phuket.com/ . No programme, price or bookable inventory was invented.

Audited all 12 currently admitted published experience listings. The other confirmed classification mismatch was `shows` versus code topic `show`; an explicit presentation alias now puts it in culture/shows without changing stored slugs. Unapproved records are not used to populate public topics. Topic buttons/selects now derive populated categories from admitted unfiltered inventory; selecting one topic preserves its siblings. Empty prospective groups remain hidden publicly, while the admin registry remains complete. RU/EN names remain admin-owned; reviewed Thai labels are used for known topics, explicit English fallback for custom topics. Fixed-place admission still requires explicit venue identity and location type, never category inference.
