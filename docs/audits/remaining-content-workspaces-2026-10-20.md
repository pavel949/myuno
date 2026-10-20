# Remaining authored-link and workspace audit — 2026-10-20

Source snapshot: PR137 head 5af8cff; generated AST inventory includes live and draft configurations. Static route matching proves declaration only, never entity existence or service readiness. No runtime/database writes performed.

## Workspace findings

- `/staff` has no route: AnimatedRoutes explicitly records dashboard removal. Removed dead Home/avatar shortcuts, without substituting `/team` authority.
- Avatar owner entry now uses existing `useOwnerType`: `mc_portal` → `/my-property`; self-managed → `/mc`. Owner loading defers entry. Destination guards remain unchanged.
- `/mc`: existing ActiveCompanyProvider / MCGuard / MCLayout. `/my-property`: MCPortalGuard. `/vendor`: VendorGuard. `/team`: TeamGuard. `/admin`: AdminGuard.
- `/capital`: InvestorGuard permits resolved admin/capital_team/investor (not generic employment; its comment mentions uno_team but implementation excludes it). Added separate Capital deal entry only for already available investor role; portfolio entry remains.
- `/developer-portal`: DeveloperPortalLayout owns existing membership/onboarding flow; avatar explicitly names property development, not API development. MC API keys and webhooks remain `/mc/developer/api-keys` and `/mc/developer/webhooks` under MC guards; no extra shortcut exposed.
- Organization/context switching remains in existing layouts/useUserContext. Navigation preferences grant no roles. No guards, modules or permissions changed.

## Every unmatched authored href

72 occurrences / 50 unique hrefs in original snapshot. The table records each href individually; unresolved entries are findings, not accepted functionality.

| Authored href | Source | Disposition |
|---|---|---|
| `/community/seniors` | personas/P20_RETIREES.ts | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/concierge?topic=checkin` | clusterLandings.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=emergency` | clusterLandings.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=insurance` | clusterLandings.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=medical` | personas/P14_MEDICAL.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=overstay` | clusterLandings.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/concierge?topic=police` | clusterLandings.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/fitness/muay-thai` | clusterLandings.ts | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/legal/consultation` | personas/P09_RELOCATOR_SOLO.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/driving-license` | clusterLandings.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/lost-documents` | clusterLandings.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/retirement-visa` | personas/P20_RETIREES.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/spa` | clusterLandings.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/tm30` | clusterLandings.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/visa-extension` | clusterLandings.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/visa-run` | clusterLandings.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/legal/work-permit` | personas/P13_EMPLOYEE_EXPAT.ts | No matching legal subpage. /visa or /legal hubs are broader; specific service/claim not verified. |
| `/owner/audit` | clusterLandings.ts | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/maintenance` | clusterLandings.ts, personas/P23_PROPERTY_OWNER.ts | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/pms` | clusterLandings.ts | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/rental` | clusterLandings.ts | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/owner/reports` | clusterLandings.ts | Unmatched legacy owner operation. /mc requires membership/context; do not redirect public intent into private operations. |
| `/services/concierge` | personas/P17_HALAL.ts | No mounted concierge target. Existing /support is escalation, not a proven topic-equivalent replacement; retain audit finding. |
| `/services/coworking` | personas/P4_DIGITAL_NOMADS.ts | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/services/finance/bank-account` | clusterLandings.ts | No matching finance subpage. /banking and /exchange exist; account/cash workflow equivalence not established. |
| `/services/finance/cash` | clusterLandings.ts | No matching finance subpage. /banking and /exchange exist; account/cash workflow equivalence not established. |
| `/services/finance/insurance` | clusterLandings.ts | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/health/checkup` | personas/P14_MEDICAL.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/clinics` | personas/P18_LGBTQ.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/dental` | personas/P14_MEDICAL.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/hospitals` | clusterLandings.ts, personas/P14_MEDICAL.ts, personas/P20_RETIREES.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/nutrition` | personas/P16_ATHLETES.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/paediatrics` | personas/P7_FAMILIES.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/health/recovery` | personas/P14_MEDICAL.ts | No matching health subpage. /medical catalogue exists; specialty/provider availability not established. |
| `/services/home/cleaning` | personas/P20_RETIREES.ts | Existing /cleaning catalogue is candidate; exact page intent and approved provider coverage require review. |
| `/services/insurance` | clusterLandings.ts | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/insurance/liaison` | personas/P14_MEDICAL.ts, personas/P19_ACCESSIBILITY.ts | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/insurance/senior` | personas/P20_RETIREES.ts | No matching insurance subpage. /insurance exists; specified product/advice workflow not verified. |
| `/services/property/inspection` | clusterLandings.ts | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/services/transport` | clusterLandings.ts | Existing /transport entry is candidate; authored context must distinguish information, vehicle rental and booking. |
| `/services/utilities/internet` | clusterLandings.ts | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/vendor/apply` | personas/P21_PROVIDERS.ts, personas/P22_FREELANCERS.ts, personas/P23_SMB.ts | Unmatched vendor subpage. /vendor is guarded workspace; application/billing equivalence not established. |
| `/vendor/billing` | personas/P21_PROVIDERS.ts, personas/P22_FREELANCERS.ts, personas/P23_SMB.ts | Unmatched vendor subpage. /vendor is guarded workspace; application/billing equivalence not established. |
| `/water-activities` | personas/P19_ACCESSIBILITY.ts | No matching mounted subpage or verified entity. Keep unresolved; do not invent catalogue destination. |
| `/wedding/guests` | personas/P15_WEDDINGS.ts | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/legal` | personas/P15_WEDDINGS.ts | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/photo` | personas/P15_WEDDINGS.ts | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/planner` | personas/P15_WEDDINGS.ts | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wedding/venues` | personas/P15_WEDDINGS.ts | Only /wedding hub mounted; requested specialist flow has no matching mounted subpage. |
| `/wellness` | clusterLandings.ts, personas/P16_ATHLETES.ts, personas/P3_EU_GUESTS.ts | No /wellness landing mounted; wellness success route does not establish catalogue readiness. |

## Dynamic matches require entity evidence

Route patterns accept these paths, but source-only inspection does not establish persisted IDs, public visibility, catalogue approval or active offerings. No placeholder entity is promoted to a working destination. 36 occurrences in the original snapshot.

| Href | Matched route | Source |
|---|---|---|
| `/guide/areas` | `/guide/:token` | src/content/landings/clusterLandings.ts:96 |
| `/guide/areas` | `/guide/:token` | src/content/landings/clusterLandings.ts:156 |
| `/property/areas` | `/property/:id` | src/content/landings/clusterLandings.ts:206 |
| `/property/due-diligence` | `/property/:id` | src/content/landings/clusterLandings.ts:473 |
| `/property/reservation` | `/property/:id` | src/content/landings/clusterLandings.ts:718 |
| `/property/due-diligence` | `/property/:id` | src/content/landings/clusterLandings.ts:719 |
| `/property/tax-calculator` | `/property/:id` | src/content/landings/clusterLandings.ts:722 |
| `/property/due-diligence` | `/property/:id` | src/content/landings/clusterLandings.ts:735 |
| `/property/tax-calculator` | `/property/:id` | src/content/landings/clusterLandings.ts:740 |
| `/experiences/private` | `/experiences/:id` | src/content/landings/clusterLandings.ts:785 |
| `/property/sell` | `/property/:id` | src/content/landings/clusterLandings.ts:846 |
| `/cluster/compliance` | `/cluster/:cluster` | src/content/landings/clusterLandings.ts:848 |
| `/cluster/compliance` | `/cluster/:cluster` | src/content/landings/clusterLandings.ts:850 |
| `/property/sell` | `/property/:id` | src/content/landings/clusterLandings.ts:858 |
| `/property/insights` | `/property/:id` | src/content/landings/personas/P10_OPERATORS.ts:29 |
| `/property/urgent` | `/property/:id` | src/content/landings/personas/P10_OPERATORS.ts:30 |
| `/property/urgent` | `/property/:id` | src/content/landings/personas/P10_OPERATORS.ts:46 |
| `/knowledge/pillars/fet-process` | `/knowledge/pillars/:slug` | src/content/landings/personas/P11_MN_INVESTORS.ts:28 |
| `/knowledge/pillars/fet-process` | `/knowledge/pillars/:slug` | src/content/landings/personas/P11_MN_INVESTORS.ts:45 |
| `/pets/import` | `/pets/:id` | src/content/landings/personas/P13_PET_OWNERS.ts:25 |
| `/pets/vets` | `/pets/:id` | src/content/landings/personas/P13_PET_OWNERS.ts:27 |
| `/pets/care` | `/pets/:id` | src/content/landings/personas/P13_PET_OWNERS.ts:28 |
| `/pets/import` | `/pets/:id` | src/content/landings/personas/P13_PET_OWNERS.ts:45 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P16_ATHLETES.ts:27 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P17_HALAL.ts:28 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P18_LGBTQ.ts:28 |
| `/cluster/health` | `/cluster/:cluster` | src/content/landings/personas/P18_LGBTQ.ts:29 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P18_LGBTQ.ts:43 |
| `/cluster/health` | `/cluster/:cluster` | src/content/landings/personas/P19_ACCESSIBILITY.ts:30 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P24_CREATIVES.ts:25 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P25_STUDENTS.ts:24 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P25_STUDENTS.ts:25 |
| `/cluster/lifestyle` | `/cluster/:cluster` | src/content/landings/personas/P3_EU_GUESTS.ts:31 |
| `/property/mortgage` | `/property/:id` | src/content/landings/personas/P5_SNOWBIRDS.ts:65 |
| `/knowledge/pillars/leasehold-vs-freehold` | `/knowledge/pillars/:slug` | src/content/landings/personas/P6_RU_EXPATS.ts:56 |
| `/knowledge/pillars/foreign-quota` | `/knowledge/pillars/:slug` | src/content/landings/personas/P6_RU_EXPATS.ts:62 |

## Remaining blocker

Consumer-local Library materialization previously failed at Windows metadata/xattr preservation. No screenshot pixels were fabricated. Live entity verification is not completed in this source-only tranche; remaining links need approved catalogue/entity evidence and intent-specific decisions before repair or suppression. No blanket redirects, speculative service routes, schema changes or authority grants were added.
