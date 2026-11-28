# Homepage data refresh and sign-in recommendation — 2026-11-24

Repository: pavel949/myuno. Production checked: https://www.myuno.app/.
This supersedes the October snapshot for the observations below. It does not certify booking or sign-in transactions.

## Current published homepage
The current page has rental homes, new developments, experiences, DB-backed service-category navigation and area guides. The old twelve-project grid is no longer the current composition. The first rental preview currently shows six Layantara units; location guides use labelled illustrations. Service categories are navigation, not proof of a provider offering.

## Read-only data observations
Observed through the database of Lovable project dcc2b024-7627-4ad9-a915-a3df3dd839f0:
- 62 public property catalogue rows match recorded rental intent.
- The 48-candidate homepage pool includes 39 Layantara units and 9 other units; alternatives already exist in this pool.
- public_service_catalog contains 33 active approved service rows. All have NULL provider in that public projection; all 14 referenced base providers have approval_status=pending. These rows must not be called 33 bookable services or published by bypassing provider admission.
- Chalong Bay Gardens has an Unsplash cover and no source_url. This is a review concern, not sufficient evidence to declare the project fictitious or alter its price/publication.
- AuthValuePanel's headline service count counts navigable catalogue leaves. It is not a count of published provider offerings.

No provider approvals, catalogue prices, property facts or publication flags were changed during this review.

## Implemented on this branch
selectHomeShowcase distributes eligible existing homes across explicit project_id/complex_id groups before repeating units from a group. Unlinked homes stay independent. It preserves eligibility, duplicate removal and tariff ordering within groups, and returns only the supplied public candidates. Single-project catalogues still fill the preview. No popularity claim, availability inference or invented records are introduced.

Three Vitest regression cases added:
1. A resort cannot fill the preview before other eligible projects are represented.
2. Matching project/complex IDs share a group; unlinked homes do not collapse together.
3. Small single-project pools and zero limits remain valid.

Four isolated selector scenarios passed using the actual selector with stubbed tariff/image helpers. This is not a full Vitest, TypeScript or production-browser verification; refer to PR checks for those outcomes.

## Sign-in page shown by the user
Observed from the supplied screenshot and current Auth.tsx/AuthValuePanel/GoogleSignInButton:
- The large left marketing panel and six coloured navigation chips distract from signing in and make the form secondary.
- The account panel is too tall for its short task; use a form width of roughly 400–440 px, moderate padding and a 28–32 px heading.
- The screenshot shows an unlabelled Google loading state. Source sets loading after a click and has no timeout/recovery for a successful OAuth call that fails to navigate. The screenshot alone does not prove the root cause.
- Large theme controls and repeated reassurance badges consume space without helping the sign-in decision.

### Recommended composition
Header: myUNO logo, back to catalogue, one language selector and a compact theme control.
Main: one centred sign-in card; on wide screens an optional quiet image panel can carry a single sentence, without category chips or counts. Mobile starts directly with the form.

Suggested Russian copy:
- Heading: «Войти в myUNO».
- Supporting text: «Ваши бронирования, заявки и сообщения — в одном аккаунте».
- Google control: «Продолжить с Google» when available; visible progress label during redirect.
- Divider: «или по email».
- Fields: «Email», «Пароль»; visible show-password action and «Забыли пароль?».
- Primary action: «Войти».
- Secondary action: «Нет аккаунта? Создать аккаунт».
- Public return: «Вернуться к каталогу».
- Footer: actual links to privacy and terms, without unverified numerical or security claims.

Use existing design tokens, Lucide icons, one accent and conventional field outlines. Keep the authentication backend, safe return paths and role admission unchanged. Provide a finite OAuth recovery state and keep password/email errors near the relevant fields. Do not change login into mandatory telephone onboarding.

### Verification before implementing sign-in changes
375/390/430 px and desktop, RU/EN/TH, password-manager autofill, Enter submit, focus order, wrong password, network timeout, password reset, OAuth cancel/retry, and return to the intended authorized route. This recommendation is not an implemented sign-in redesign.
