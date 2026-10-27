# Public audience introductions: local tranche

Base main: `046663d895ccdc4beedacaa436e6e7044938895b`. Local branch: `codex/premium-audience-surfaces-20261027`. No push, PR, merge or deployment. Property37dd479 and services2ccaa8a branches are preserved independently; no integration or joint validation is implied.

## Inventory and scope

| Route | Previous finding | This tranche |
| --- | --- | --- |
| `/for-owners` | Locally duplicated pricing ($25/property and199–399/mo), fixed70/30 and referral promises without a verified current public offer | Shared warm introduction, two management/self-management paths, owner workspace link, referral/profile and canonical contacts. No tariff/model change |
| `/for-developers` | Static free/48-hour/qualified-demand promises, repeated CTAs and separate marketing chrome | Shared public shell and restrained next steps; existing application, portal, company and project destinations |
| `/for/agent` | Unregistered `/agent/join`, `/agent/dashboard`, `/agent/resources`; static commission/payout/listing counts | Existing partner application/status and public property catalogue. No agent role, dashboard or commission model introduced |
| `/partners` | Static partner/order/rating/uplift figures and a long repeated card stack | Shared introduction; original direct vendor onboarding remains the primary path, partner application/status and audience links remain explicit |
| `/for-business` | Already has a trilingual canonical request form | Shared typography, actual reduced-motion behavior and concurrent-submit UI guard; writer/payload unchanged |

`AudienceLanding` is a public presentation component. Its links are not role definitions or access decisions. All guards, portal data, onboarding, tariffs and agreements remain owned by their existing routes and contracts. No images, testimonials, prices, inventory or commercial outcomes are fabricated.

Not migrated here: management-company/local-service-provider landings, the owner management inquiry page, vendor onboarding/applicant forms, persona directory, protected owner/developer/vendor workspaces, operational/PMS/admin pages. Existing destinations are linked, not certified as redesigned or commercially accepted. This is not all433 canonical routes.

## Dependencies and boundaries

- Uses public widths/type/spacing/motion tokens already on main046663d8, plus one scoped stylesheet. No dependency on unpublished37dd479 or2ccaa8a.
- Keeps real management, self-management, owner portal, developer application/projects and vendor onboarding paths. Owner contact uses `/contact` instead of copying an isolated WhatsApp number.
- Removing unsupported public price/commission/volume/timing copy does not change pricing, commissions, agreements or data. Downstream terms are not redefined by this page.
- Existing B2B `lead_magnet_submissions` writer and payload are unchanged. A local in-flight ref rejects concurrent submit events and resets on completion/error. This is UI duplicate suppression, not server idempotency or new commercial authority.
- No DB/schema/RLS/RBAC/auth/billing/credential changes and no real applications submitted.

## Verification

-31 tests/6 files PASS: actual page locale/navigation rendering; owner paths; unchanged legacy marketing frames outside this tranche; existing applicant form receipt/error behavior; isolated B2B pending/repeated-submit/error/retry and empty-contact validation.
- Typecheck PASS. Full lint0 errors/2457 warnings; changed-file lint0 errors/0 warnings. Production build7117 modules,1m53s PASS. Design audit4094 findings,0 new/structural,187 resolved baseline entries; baseline unchanged.
- Actual local Chromium rendered five pages at320/390/430/768/1440/1920, plus actual RU/TH document locales at390/1440:50 render checks, no horizontal page overflow. Final10 full-page captures at1440/390 were viewed; shared cards use one semantic title link and44px targets.
- Separate guest-state pass: native owner anchor, owner/developer/vendor auth redirects retaining destination, agent application form entry, partner-status auth redirect, Back/Forward and actual reduced-motion `scrollIntoView({behavior:'auto'})`. No business writes. Keyboard focus outline is present in the final capture pass.
- The initial combined QA script completed renders/redirects but selected an unrelated first section for the B2B CTA; the selector was scoped to the hero. One subsequent Back/Forward step raced SPA rendering; waiting for the actual returned page resolved the QA race. App auth guards were not changed.
- Landing content is static public copy, with no fabricated loading/error/empty records. Real pending/error/empty form cases are isolated tests with mocked writers. Guest redirects are browser evidence; protected workspace contents and authenticated processes are not accepted by this tranche.

Evidence remains local: `/workspace/myuno-ui-evidence/audience-surfaces-20261027`, `audience-surfaces-final-20261027`, `audience-states-20261027`; scripts/logs under `/tmp`. No failed Library transfer repeated. Localhost is not a public preview. No original image-fidelity or live-production acceptance claim.
