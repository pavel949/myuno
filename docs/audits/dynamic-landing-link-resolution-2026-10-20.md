# Landing link resolution decisions — 2026-10-20

Source base `4632f3b68`. Covers original 72 unmatched occurrences (50 unique hrefs) and 36 dynamic-pattern occurrences. Decisions below concern authored intent, not proof of current production availability. No database queries, browser launches, business writes, new routes or permission changes performed. Config/render changes are owned by coordinating task.

## Rendering policy

Keep verified links. Correct only specific proven equivalents. Otherwise retain visible source entry as nonclickable with localized unavailable label; do not imply the advertised service is available. Unverified database entities remain unknown, not proven absent. Copy must be narrowed before using a partial alternative. No generic hub redirect.

## Dynamic parameter contracts

- PropertyDetail calls usePropertyWithRentalTerms(id), then selectPropertyCatalogFirst: public_property_catalog.eq(id), independently authorized properties fallback. No semantic feature-slug switch.
- PublicGuidebook calls usePublicGuidebook(token): property_guidebook.eq(share_token).eq(is_public,true).
- PetServiceDetail/usePetService and ExperienceDetail/useExperience query listings by id and respective vertical. Category strings do not become verified listing IDs.
- KnowledgePillarPage decodes slug, prepends slash; useKnowledgePillar queries exact knowledge_pillars.slug. Historical src/content/semantic/pillarPages.ts reference is missing in current checkout.
- ClusterLandingPage resolves configured slug alias then exact static config plus live predicate.

| Dynamic href | Occurrences | Decision | Evidence |
|---|---:|---|---|
| `/cluster/compliance` | 2 | KEEP | Exact CLUSTER_LANDINGS slug passes isLiveClusterLanding. |
| `/cluster/health` | 2 | UNAVAILABLE | No health configuration or resolveClusterSlug alias; ClusterLandingPage returns NotFound. |
| `/cluster/lifestyle` | 8 | KEEP | Exact CLUSTER_LANDINGS slug passes isLiveClusterLanding. |
| `/experiences/private` | 1 | UNAVAILABLE | ExperienceDetail queries listings.id plus vertical=experience; no private entity or complete advertised chef/photo/helicopter bundle verified. |
| `/guide/areas` | 2 | REPAIR /area | PublicGuidebook passes token to property_guidebook.share_token; AreaIndexPage uses static AREA_LANDINGS. |
| `/knowledge/pillars/fet-process` | 2 | UNVERIFIED ENTITY; present unavailable until evidence | KnowledgePillarPage queries exact leading-slash database slug; no current entity/static-seed proof obtained. |
| `/knowledge/pillars/foreign-quota` | 1 | UNVERIFIED ENTITY; present unavailable until evidence | KnowledgePillarPage queries exact leading-slash database slug; no current entity/static-seed proof obtained. |
| `/knowledge/pillars/leasehold-vs-freehold` | 1 | UNVERIFIED ENTITY; present unavailable until evidence | KnowledgePillarPage queries exact leading-slash database slug; no current entity/static-seed proof obtained. |
| `/pets/care` | 1 | UNAVAILABLE | Grooming category exists, but not equivalent to combined shops, food delivery and care promise. |
| `/pets/import` | 2 | UNAVAILABLE | PetServiceDetail expects listings.id. /pets/transport does not prove import paperwork, permits or clearance fulfilment. |
| `/pets/vets` | 1 | UNAVAILABLE as authored; narrow alternative /pets?category=veterinary | PetServiceDetail expects listings.id. PetsIndex supports veterinary category; no proof of advertised six clinics, multilingual 24/7 access or discounts. |
| `/property/areas` | 1 | REPAIR /area | PropertyDetail treats areas as property id; AreaIndexPage is mounted exact area-guide index. |
| `/property/due-diligence` | 3 | UNAVAILABLE as authored; narrow alternative /newbuilds/due-diligence | Existing NewbuildsDueDiligence uses CHECKLIST_ITEMS for self-service checklist; not professional diligence fulfilment. Relabel as checklist before repair. |
| `/property/insights` | 1 | UNAVAILABLE | Property-id lookup; private MC analytics is not equivalent to public district PM-data heatmap. |
| `/property/mortgage` | 1 | UNAVAILABLE | Property-id lookup; no mounted public mortgage flow verified. |
| `/property/reservation` | 1 | UNAVAILABLE | Property-id lookup; no verified reservation agreement template/refund-clause-review destination. |
| `/property/sell` | 2 | UNAVAILABLE | Property-id lookup. /sell is SellItemPage classifieds, not advertised asset valuation/CMA within 48 hours. |
| `/property/tax-calculator` | 2 | UNAVAILABLE | Property-id lookup. /tax is residency/income TaxNavPage questionnaire, not transaction transfer-tax calculator. |
| `/property/urgent` | 2 | UNAVAILABLE | Property-id lookup; no verified public distressed-property feature or asserted discounts. |

Unique dynamic hrefs: 19; occurrences: 36.

## Every unmatched href (50)

Specific existing catalogue candidates were examined against authored labels/oneLiners; broad matches do not establish the advertised workflow. Each row below is an owner decision, not merely a missing-route count.

| Unmatched href | Decision | Intent / evidence |
|---|---|---|
| `/community/seniors` | UNAVAILABLE; nonclickable | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/concierge?topic=checkin` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=emergency` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=insurance` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=medical` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=overstay` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=police` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/fitness/muay-thai` | UNAVAILABLE; nonclickable | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/legal/consultation` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/driving-license` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/lost-documents` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/retirement-visa` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/spa` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/tm30` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/visa-extension` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/visa-run` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/work-permit` | UNAVAILABLE; nonclickable | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/owner/audit` | UNAVAILABLE; nonclickable | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/maintenance` | UNAVAILABLE; nonclickable | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/pms` | UNAVAILABLE; nonclickable | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/rental` | UNAVAILABLE; nonclickable | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/reports` | UNAVAILABLE; nonclickable | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/services/concierge` | UNAVAILABLE; nonclickable | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/services/coworking` | UNAVAILABLE; nonclickable | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/services/finance/bank-account` | UNAVAILABLE; nonclickable | No matching finance subpage. /banking and /exchange exist; account/cash workflow equivalence not established. |
| `/services/finance/cash` | UNAVAILABLE; nonclickable | No matching finance subpage. /banking and /exchange exist; account/cash workflow equivalence not established. |
| `/services/finance/insurance` | UNAVAILABLE; nonclickable | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/health/checkup` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/clinics` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/dental` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/hospitals` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/nutrition` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/paediatrics` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/recovery` | UNAVAILABLE; nonclickable | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/home/cleaning` | UNAVAILABLE; nonclickable | CleaningIndex catalogue exists at /cleaning; authored Home help includes cooking/repairs/fixed price. Narrow to cleaning catalogue before alternative; current combined promise unavailable. |
| `/services/insurance` | UNAVAILABLE; nonclickable | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/insurance/liaison` | UNAVAILABLE; nonclickable | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/insurance/senior` | UNAVAILABLE; nonclickable | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/property/inspection` | UNAVAILABLE; nonclickable | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/services/transport` | UNAVAILABLE; nonclickable | TransportIndex is rental catalogue; authored car rent OR BUY + VIN-check + monthly-price promise exceeds it. Narrow to vehicle-rental catalogue before a /transport alternative; current combined promise unavailable. |
| `/services/utilities/internet` | UNAVAILABLE; nonclickable | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/vendor/apply` | NARROW COPY then REPAIR /vendor/onboarding | AnimatedRoutes:716 wraps existing VendorOnboarding in AuthGuard. Wizard registers provider/org through existing checked submit flow and creates service; valid onboarding destination. Does not prove 15-minute KYC, instant bookings or every payment method promised by persona copy. Primary onboarding CTA can use the exact flow; remove unsupported promises in service copy. |
| `/vendor/billing` | UNAVAILABLE; nonclickable | No mounted billing route; no public flat-rate/payout/payment-method terms destination was verified. No equivalence established. |
| `/water-activities` | UNAVAILABLE; nonclickable | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/wedding/guests` | UNAVAILABLE; nonclickable | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/legal` | UNAVAILABLE; nonclickable | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/photo` | UNAVAILABLE; nonclickable | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/planner` | UNAVAILABLE; nonclickable | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/venues` | UNAVAILABLE; nonclickable | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wellness` | UNAVAILABLE; nonclickable | No /wellness landing mounted; wellness success route does not establish catalogue readiness. |

## Scope limits / remaining product work

- Three exact area-link repairs are source-proven;10 cluster occurrences stay as configured. All other dynamic intents need unavailable presentation or narrowed copy/entity evidence.
- Vendor onboarding is an existing auth-gated workflow, not a new authority grant. Existing auth return mechanism remains responsible for return path; no roles are granted by a link.
- No existing entity was invented for knowledge/property/pet/experience slugs. The three knowledge slugs require actual public published-row evidence before enabling; no current read was made.
- This resolves navigation disposition, not missing business capabilities or unsupported legal/price/availability claims elsewhere in FAQ/body copy. Those claims require separate content evidence.
- Original per-occurrence files/line evidence: ../sitemap-exposure-inventory.json (consumer-local task file) and existing remaining-content-workspaces audit.
