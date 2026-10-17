# E2.9 — Catalog and notification security

Date: 2026-10-17. **PARTIAL implementation; full tranche NO-GO.** No E3 or Order Mutation Audit started.
Baseline implementation: `990de18f0e948f83e07b91e102e1b43a81246d63`; documentation: `4ea65f7e940797d3280004f5eb14cd6ff5cc39eb`.

## Applied and deployed manifest

- Forward migration: `drizzle/migrations/0032_catalog_notification_private_boundaries.sql`. Exact pre-apply copy: `e2_9/catalog-notification.sql`; byte equality checked after application. SHA-256 `73a71313bb9736f5cf7e41befad577bee250217576467409952ebe4cd0d92d33`.
- Security-preserving executable rollback: `docs/hardening/rollback/e2_9_catalog_notifications.sql`; revoke new projection/function access without restoring any known public/employment bypass. Exercised in isolated PostgreSQL only.
- New views: `public_provider_catalog`, `public_service_catalog`, `public_salon_catalog`. No table creation or business-row DML.
- New function: `actor_can_notify_property_submission(uuid)`, bound to `auth.uid()`, pending/nondeleted property owner or protected admin; authenticated/service execution only.
- Deployed edge: `notify-admin-property-submission`, source SHA-256 `b843988cb51df06094f0530cdabe15c89fb6261a9b1b89151bf02497417b5c28`. Deployment succeeded; no live invocation or delivery attempted. Deployment bundle parity independently unverified.
- `mcp` generated source was updated from public service-tool source by the harness; no explicit MCP deployment requested/performed in this turn. Hosted parity is not proven.

### Exact policy changes (27)

`providers`: Anyone can view active providers (false).

`services`: Anyone can view approved services or own content (real provider owner only; independent admin/own ALL policies retained).

`salons`: Salons are viewable by everyone (false); Anyone can view approved salons or own content (real provider owner); Providers can manage own salons (resolve providers.user_id, never provider_id=auth.uid); Admins can view all salons; Admins can update salons (protected admin only).

`listings`: listings_admin_full. `property_complexes`: Admins manage all complexes. `company_storefronts`: Admins can manage all storefronts. `vendor_locations`: Admins can update vendor_locations; Admins have full access to vendor locations. Each global branch now protected admin only; independent parent/company/org/owner policies untouched.

`cleaning_services`, `education_providers`, `events`, `gyms`, `water_activities`: Admins can view all <table>; Admins can update <table> (10 policies); only employment branch removed.

`thai_businesses`: thai_businesses_select/update/delete. `thai_business_services`: thai_services_select/write. Existing owner/public relationships retained; global branch admin only. Shared content helper itself unchanged.

## Field / projection contract

Owner-executed, `security_barrier=true`, finite read-only projections are deliberate: invoker views over private base RLS cannot provide public discovery. No public INSERT/UPDATE/DELETE grants. The entire new view column list is in the exact migration, not generated from `SELECT *`.

- Provider marketing: id/name/descriptions/images/website/category/address/geolocation/rating/languages/coverage/booking capability/verification. No owner user_id, commission, earnings, payouts, Stripe fields, source/import ownership metadata, or arbitrary i18n. Compatibility phone/email slots are **always SQL NULL**, never actual provider contacts. Eligibility active + approved, independent of actor.
- Service marketing: id/provider/category/location/name/descriptions/public price/currency/duration/images/tags/languages/availability/booking fields. No commission, rejection/reviewer/import fields or arbitrary i18n. Active + approved services remain 33; LEFT safe-provider enrichment prevents accidental deletion of approved service discovery when provider approval is absent. Safe provider/category JSON is constructed from named fields. Marketplace retains its former inner-like semantics by excluding NULL safe provider enrichment.
- Salon marketing: active + approved only; name/descriptions/images/address/geolocation/public price/amenities/services/languages/website/hours/rating. No rejection/reviewer/creator metadata; phone/email NULL. `working_hours` remains the existing public schedule contract; its free-form JSON schema is not a formally validated deep allowlist and is a residual review item.
- Base providers/services/salons private reads remain real provider ownership or existing protected admin, not company membership or generic employment. No new company/provider/support grants. Existing private admin/provider finance code stays on base tables. Public detail explicitly does not load contracts, products or bookings.

### Runtime files

`src/hooks/useExploreLayers.ts`, `useHomeServices.ts`, `useServiceBookingCatalogue.ts`, `useServices.ts`, `useServiceMarketplace.ts`, `useCleaningServices.ts`, `useSalons.ts`, `usePrefetch.ts`, `useBrowseByType.ts`, `useProviderDetails.ts`, `usePropertyCare.ts`; `src/pages/MapView.tsx`, `src/pages/events/EventDetail.tsx`, `src/pages/services/ServiceProviderDetail.tsx`; `src/components/yachts/YachtOperatorCard.tsx`; `src/lib/mcp/tools/list-services.ts`; `supabase/functions/notify-admin-property-submission/index.ts`; generated `supabase/functions/mcp/index.ts` and database types. Architecture rules recorded in root `AGENTS.md`.

No `service_orders` schema, request writer, pricing/availability trigger, money RPC, runtime scope resolver or enforcement changed.

## Notification recipient contract (implemented path only)

`notify-admin-property-submission` accepts **only** `{property_id: UUID}`. Invalid/anonymous authentication and extra caller-supplied recipient/title/owner-contact fields fail before service client creation. Actor-bound RPC precedes service access. Persisted pending status/nondeletion and owner relationship are rechecked; nonowner must pass protected admin check. Content uses persisted property title, omits owner name/email/phone. Recipients are resolved from protected `user_roles.role=admin`, intersected with a fresh admin-role query and deduplicated profile emails. No uno_team branch, arbitrary address, name/email allowlist, fallback recipient or implicit company-member recipient. Missing/failed recipient authority fails closed. No internal-secret ingress added because this endpoint has no proven scheduler caller.

Tests execute the actual entrypoint through mocked SDK/email boundaries, not real notifications. A removed admin is excluded by the second role read; atomic delivery-versus-role-revocation across the outbound boundary is not claimed.

## Tests and verification

- New exact PostgreSQL fixture/tests: `src/lib/__tests__/fixtures/catalog-notifications-base.sql`, `src/lib/__tests__/catalogNotifications.postgres.test.ts`: **29/29**. Pre-change live-expression exploit fixtures prove public provider settlement fields, service commission, salon private review/pending rows and unpublished employment listing reads; post-change denies, own/admin allowances, active-org owner, rollback and object gate tested.
- Public detail hook: `src/hooks/useProviderDetails.public.test.ts`: **1/1**; forbidden private relation stub, safe provider/service readback, no contracts/bookings.
- Retained service tests: `src/hooks/useServiceBookingCatalogue.test.ts` **7**, `src/lib/services/serviceBookingModel.test.ts` **8**, `src/pages/services/ServiceBooking.test.tsx` **8**. Focused total **53/53**.
- E1–E2.8/regressions: operatingSpaces.postgres **72**, unoTeam.postgres **28**, publicPropertyCatalog.postgres **6**, propertyInventory.postgres **15**, propertyInventory **16**, operationalScope **17**, edge operating-space-security **12**: **166/166**.
- Actual-entrypoint synthetic edge harness: `scripts/qa/catalog-notification-handlers.mjs` **15/15**; retained `scripts/qa/uno-team-handlers.mjs` **45/45**, `scripts/qa/operating-security-handlers.mjs` **10/10**. External network forbidden. **No real email/message/export/payment call.**
- Automatic preview build: latest checked entry 2026-10-17T06:07:56Z **build OK**; later fresh log rechecked before final report.
- Browser read-only public API checks through existing app client: property/provider/service/salon catalogs **23/26/33/1**, none of the targeted private columns; anonymous providers/services/salons base id reads **0/0/0**. GET/HEAD/OPTIONS only, all mutations blocked. Public provider page rendered persisted **Blue Tree Phuket**, screenshot reviewed at 1280×1800. Its empty service list is real; synthetic hook tests verify populated provider/service flow. Authenticated production flow and real outbound delivery intentionally not run; synthetic role tests are not described as hosted authenticated verification.

### Production read-only evidence

Before (05:57:19 UTC) and after (06:08:09.502802 UTC): 2 companies; enforcement **0**; spaces/assignments/members **0/0/0**; property catalog **23**; properties **33**, property_bookings **82**, orders **416**, ledger_entries **136**, CRM contacts **384**, company members **4**. After public catalogs: providers **26**, services **33**, salons **1**; invalid public properties **0**.

No business DML, seed/assignment statement or enforcement change exists in applied SQL or called tooling. Equal aggregate counts corroborate no row-count changes; **they do not prove absence of concurrent value-only production updates**. No before/after full private data export was taken.

## Remaining blocker dispositions / BUSINESS AUTHORIZATION decisions

| ID | Proven evidence and boundary | Disposition |
|---|---|---|
| E29-01 | `property_projects` active-public and listed-public SELECT + grants include `commission_pct`, juristic banking/contact fields; `useNewbuildProjects` maps commission into public rows. Source inventory found shared editor/public hook and arbitrary offplan_catalog JSON. | **OPEN PROVEN leak**. Must split public/editor reads and deep-allowlist catalog JSON, migrate all fallback/picker consumers, then revoke public base branches. Do not guess JSON/private pricing semantics or break developer editor. |
| E29-02 | `property_complexes` active-public base SELECT exposes juristic contacts/CAM/security fields; generic employment branch narrowed but public field leakage remains. | **OPEN PROVEN field path**, needs tested catalog projection/owner picker migration; commercial CAM/security publicity is a business field decision, not new authority. |
| E29-03 | `listings` approved/active public base grants include moderation/contact/arbitrary attributes; bank and other vertical hooks read `*`; multiple invoker convenience views expose same columns. | **OPEN PROVEN field path**. Unpublished employment path closed; public JSON whitelist requires explicit nested marketing schemas, all vertical/search/map siblings migrated before base cutover. No wholesale attributes/i18n exposed by a new projection. |
| E29-04 | `salon_services` unconditional public SELECT independent of parent publication; 261 live rows. `experience_media`/`experience_pricing` unconditional child reads. | Parent/child publication contract and legitimate provider access remain unresolved; no policy guessed. Separate finite child-catalog regression required. |
| E29-05 | `execute-booking-message-rules` ordinary authenticated caller supplies any immediate_order_id, then service reads stored guest email without actor/object check. Real caller `usePropertyBookings` needs authorized PMS path. | **OPEN PROVEN source authorization defect**, not tested/deployed parity. Reuse real booking module/action+property duty gate and trusted stored guest relationship; do not grant mere company membership. Scheduler secret must remain separate. No mutation audit performed. |
| E29-06 | `execute-crm-workflow` lacks ingress actor check; body company/entity IDs, recipient lookup by entity alone; invokes send-crm-email with internal secret. Frontend fireCrmWorkflowTrigger is actual caller. | **OPEN PROVEN source privileged ingress/company-binding defect**; not patched without isolated company/entity/action tests and explicit automation-execution capability. Existing crm view/AI permission is not workflow mutation authority. No broad RBAC redesign. |
| E29-07 | `notify-lead-whatsapp` body leadId before service reads PII, configured admin phone recipient; guest caller receives lead ID from submit_consultation_request, no immutable actor proof/token. | **OPEN PROVEN source ingress issue** with BUSINESS AUTHORIZATION delivery bridge gap. Cannot grant guest arbitrary lead read or silently remove guest lead delivery. Recommend trusted server-side post-submit dispatch, no new guest permission. |
| E29-08 | `notify-manual-payment-request` manager contacts from metadata; exploit depends on permitted metadata writers. `send-property-report` arbitrary recipients are existing explicit product contract; secret path owner-bound. | **UNKNOWN**, no invented escalation or expansion. Writer-authority review remains separate; no Order Mutation Audit started. |
| E29-09 | 64 active providers but only 26 approved; 33 approved services attached to active providers, none approved-provider-linked. | No data backfill/autoapproval. Service discovery retains 33 via LEFT enrichment; provider directory deliberately excludes unpublished approval state. Whether legacy provider approval should be restored is an explicit moderation/business decision, never automatic seed. |
| E29-10 | RO-11 backup/export and RO-12 support granular entitlements, RO-13 inactive/module CRM summary; original helpers and source-only absent convert_lead_to_deal. | E2.8 blockers remain; no support grants, no helper-wide content rewrite, no deployment of latent RPC. |

## Gate / recommendation

**Full E2.9 closure and Order Mutation Audit: NO-GO. E3: NO-GO.** The three base catalogs and one notification path are corrected, not the complete requested catalog/notification census.

**Recommended next step:** a finite continuation for E29-01–03 (public projects/complexes/listings deep field contracts + mixed editor split), then E29-05–07 object-bound dispatch gates using existing legitimate permissions or trusted server submission relationships. Resolve only the named business contracts; do not implement broad support architecture, enable spaces or start Order Mutation Audit.

## Commit evidence

Observed implementation HEAD after checked changes: `404d6fee33b7d4f03f2527ca56ed95b6c773fc40`. The harness manages commits; this is an observed checkpoint, not a fabricated final commit. Report/remaining edits may be committed afterward; final observed HEAD is recorded in `e2_9/verification.json`.

## Continuation — all 14 original blockers, 2026-10-17 06:39 UTC request

The complete original RO-01–RO-14 matrix is preserved and reconciled in [e2_9/blockers-14.csv](e2_9/blockers-14.csv), including original evidence, legitimate authority, current status and exact remaining blocker. No original UNKNOWN is silently promoted to fixed. Fixed reviewed boundaries: RO-03/04/06/08/10; partial RO-01/02/05/14; blocked RO-07/09/11/12/13. A partial classification is not complete closure.

### Additional proven notification gate

`execute-booking-message-rules/index.ts` now delegates ingress to local `access.ts` before creating any service client. Internal-secret scheduler remains separate. Ordinary authenticated dispatch requires a confirmed/nondeleted property `orders` row readable through actor RLS; every stored `order_items(item_type=property).resource_id` must resolve through actor RLS to its actual property/company and pass existing `actor_can_operate_property(..., 'bookings', 'edit')`. Protected platform admin retains confirmed-object access. Arbitrary body recipients rejected by strict UUID-only schema. No new RPC/grants, no second RBAC.

`customer_user_id` alone is **not** send authority: manual PMS creation puts the operator there while recipient is a separate guest. Customer/owner resend without existing property booking-edit duty is an explicit blocked contract, not inferred permission. Legacy company operators work only through existing RBAC/property duty; generic uno_team does not. Missing property/company relationship fails closed. Current `usePropertyBookings` writes `item_type='property'`; live item_type distribution includes 93 property items. Missing/ambiguous historical item relationships are denied rather than inferred from metadata; no writer changes or Order Mutation Audit. Scheduler batch semantics are not redesigned.

Synthetic actual-entrypoint harness `scripts/qa/booking-message-access.mjs`: **21/21**, including anonymous/invalid token, arbitrary foreign/employee/member IDs, invalid/extra fields, missing/pending object, property operator/admin pass to a no-rules stub boundary, unavailable permission and internal scheduler. No outbound call or business write. Handler no-rules response CORS binding fixed because the real isolated allowed path exposed an out-of-scope variable; all responses retain request CORS. Rollback instruction: `docs/hardening/rollback/e2_9_booking_messages.md`, retain gate or disable interactive dispatch, never restore arbitrary-ID service access. Deployment status recorded below after review.

### Additional business-authorization blockers

CRM workflow execution is **not** implied by CRM view/edit or active membership: current workflow/action policies do not establish execution authority, activity entity handling differs, and historical trigger uses an anon-key HTTP credential. `execute-crm-workflow` remains blocked pending finite actor/company/entity/action and internal-trigger contract; no false reuse of AI/CRM-read capability. Guest lead dispatch still lacks trustworthy actor/submission relationship; no guest PII/read permission granted. These are explicit E29-06/07 blockers.

Continuation regression run: **149/149** (29 catalog + 1 public detail + 7 booking catalog + 72 spaces + 28 uno-team + 12 edge). Earlier focused **53/53**, prior **166/166** remain separate executed suites, not added as unique test counts. Property notification **15/15**, additional booking handler **21/21**; production sends/writes zero. Latest automatic build checked **build OK**.

Recommendation: resolve explicit public JSON/developer-editor compatibility and CRM/guest dispatch authority; do not start E3 or Order Mutation Audit.

Additional handler deployment succeeded: `execute-booking-message-rules`, submitted source SHA-256 `55c81f11ee907cd902472bed8be66aa58aa1cabcfe544e0f184f81d3a0cd0cfb`. **21/21** synthetic cases passed before deployment; no hosted invocation, actual email, export or business write. Existing private helpers are the E2.8 rebindings in 0028 of 0023 actor_can_operate_property and protected actor_has_platform_admin, not newly invented permissions. Multi-item foreign/hidden/missing relationship denials exercised; synthetic SDK tests do not establish hosted authenticated RLS readback.

Fresh read-only production snapshot 2026-10-17T06:43:19.749477Z: enforcement/spaces/assignments/members **0/0/0/0**; public catalogs **23/26/33/1**; properties/bookings/orders/ledger/contacts/company members **33/82/416/136/384/4**, unchanged counts. No new migration in this continuation; 0032 remains sole E2.9 database change. Full closure still NO-GO for the named field/automation/support contracts, not silently deferred as completed.
