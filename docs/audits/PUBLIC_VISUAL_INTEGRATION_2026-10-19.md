# Integrated public visual tranche — 21 distinct templates

Date:2026-10-19. Base:5b82c3a809914185ca4bcac7de5fd3187c244c5f. Branch:fix/public-visual-normalization-review. This branch is separate from frozen PR130 and has not been pushed or deployed.

Integrated visual source commits:a508d4830 (original18bdb8ba8) and f60142fb6 (original54559ff0a). Root-authorized follow-up:a1223964f (originalbaf62b139), a narrowly scoped request-copy correction. Availability follow-up4dd48a7c is not an ancestor and is excluded.

## Coverage rules

21 unique route templates, not21 accepted deployments. Route aliases, desktop/mobile variants, multiple property/project records and privacy/terms policy pages are not double-counted. Empty developers and unavailable market are the actual evidenced states; populated versions are not claimed. Inquiry screenshot covers its no-date guard, not a completed inquiry form. All URLs below use https://www.myuno.app. Paths are local QA evidence, not user-facing links. Every listed before artifact exists. No after screenshot has been generated or claimed.

|#|Route|Distinct template|Before artifact|Source change|After QA|
|---|---|---|---|---|---|
|1|/trip-planner|Trip planner|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/trip-desktop-top.png|Remove nested search border and bottom margin|Pending|
|2|/for-owners|Owner landing|/workspace/shared/myuno-info-visual-evidence/owners.png|Display-family titles; legible20px section hierarchy|Pending|
|3|/for-business|Business landing|/tmp/myuno-navigation-business.png|Plain hero; consistent display title; three-column desktop service grid|Pending|
|4|/about|About|/workspace/shared/myuno-info-visual-evidence/about.png|Single gutter and bounded5xl reading surface|Pending|
|5|/contact|Contacts|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/contact.png|Bounded5xl surface; wrapping departments and44px contact links|Pending|
|6|/faq|FAQ|/workspace/shared/myuno-info-visual-evidence/faq.png|Bounded4xl; readable sans questions; compact desktop CTA|Pending|
|7|/support|Support|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/support-desktop.png|Neutral cards; bounded4xl; responsive action widths|Pending|
|8|/sos|Emergency directory|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/sos-mobile.png|Two mobile emergency columns; readable labels; unchanged phone actions|Pending|
|9|/partners|Partners|/workspace/shared/myuno-info-visual-evidence/partners.png|Neutral large panels; bounded5xl|Pending|
|10|/privacy (also /terms)|Policy reading template|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/privacy-desktop.png|Single gutter; bounded4xl; all legal text unchanged|Pending|
|11|/services (also /discover/services)|Services catalog|/workspace/shared/myuno-visual-services.png|Compact icon panels, wrapping terms, consistent section rhythm|Pending|
|12|/transport|Transport catalog|/workspace/shared/myuno-visual-transport.png|Ivory hero, neutral search card; remove decorative gradient|Pending|
|13|/experiences|Experiences catalog|/workspace/shared/myuno-visual-experiences.png|One card below420px; responsive2/3-column grid|Pending|
|14|/market|Market unavailable state|/workspace/shared/myuno-market-mobile.png|Bounded neutral panel; existing alternatives retained|Pending|
|15|/property/offplan|Project catalog|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/offplan-desktop.png|Neutral intro; shared title scale; responsive project grid|Pending|
|16|/property/offplan/78fbe5f4-258e-48b7-863b-2f3ff7d6e346|Project detail|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/avadina-mobile.png|Shared title and section rhythm; actual gallery unchanged|Pending|
|17|/property/developers|Developer catalog empty state|/workspace/shared/myuno-visual-property-developers.png|Neutral intro and responsive action; empty state retained|Pending|
|18|/property/search?mode=rent|Residential search|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/search-mobile.png|Compact mobile type/area pair and consistent section spacing|Pending|
|19|/property/24f7d4f7-f6b5-4c26-908b-b67b825a7c16?mode=rent|Residential detail|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/unit-mobile.png|Responsive title and content rhythm; actual photos unchanged|Pending|
|20|/services/order/ac_cleaning|Service request|/workspace/shared/myuno-visual-service-request.png|Bounded form, normal-flow heading, neutral summary, field heights|Pending|
|21|/property/24f7d4f7-f6b5-4c26-908b-b67b825a7c16/inquiry|Property inquiry boundary|/workspace/shared/myuno-lovable-preflight-20261019/ux-public-1528/inquiry-mobile.png|Bounded form and normal-flow heading; captured no-dates guard only|Pending|

## Integrated verification

-124 unique tests passed across11 focused files: serviceRequestCopy6 plus publicInformationVisual12, Support.requestCopy4, ForBusinessPage4, TripPlanner1, public-commerce14, ServiceRoutes16, PropertyDetailIntent15, ClearViewReport.public10, PropertySearchRoutes30, MarketAvailabilityGate12.
- ESLint:zero errors,20 existing warnings in affected files. git diff --check passed.
- TypeScript AST comparison against baseline preserved all non-style string literals and JSX text across23 visual-only TSX files at b2f594a83; the explicitly authorized copy exception below was added afterward. Imports and styling attributes(className/contentClassName/style) excluded. Manual review confirms CSS import additions, wrapper/layout changes and transport secondary heading h1→h2 only; no handler/data/query/payment/permission changes. Duplicate nested service-form styling marker was removed before integration.
- No shared/global theme CSS edited. New public-commerce.css is opt-in and uses existing font/color tokens. No catalogue photos, prices or legal statements rewritten. The request response-deadline exception below is explicit.

## Remaining publication gate

Run allowed CI/preview, then capture real post-change desktop/mobile screenshots and review RU/EN/TH wrapping, controls, empty/loading/error states. No local browser/socket, full build, SQL, production mutations, secret changes, remote push or deployment performed for this tranche. Do not mark21 surfaces visually accepted until those checks pass. Source-only CSS contract tests are not geometry verification.

## Existing factual issues outside this visual patch

Policy/payment language discrepancies, owner/partner marketing statistics, offplan source prices, live catalogue completeness require separate substantive review. Preserving these strings does not verify their truth. See per-tranche audits for before-image findings and limitations.

## Authorized copy exception

Root authorized removal of the unsupported unconditional30-minute response promise, observed on the live service request form. Request form and success note now state that price,time and provider require confirmation after submission, with RU/EN/TH copy and English fallback. This is an explicit exception to visual-only string preservation, not a new service guarantee. No submission/auth/payment/persistence behavior changed. The success note is not counted as a22nd visually covered template; no success was created or screenshot fabricated. Six focused copy tests plus16 route tests pass; scoped lint has zero errors/warnings.

## Independent source review

Read-only review through a1223964f found no blocking functional regression. The reviewer checked public-only CSS scope, retained internal PageContainer gutters, mobile grid specificity, min-width safeguards, 44px request controls and text-only confirmation copy. The nonblocking duplicated font-display token in the business heading was removed. This source review does not replace pending post-change screenshots.
