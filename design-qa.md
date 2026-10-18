# Cinematic public homepage — design QA

final result: passed

## Visual target and evidence

- Selected source: `docs/ux/cinematic-home/design-reference.jpg` (1003 × 1568 image mock).
- Browser implementation: `docs/ux/cinematic-home/desktop-1003.jpg` (1003 × 2017, cropped only to the application iframe from the cloud-browser screenshot).
- Full desktop viewport: `docs/ux/cinematic-home/desktop-1348.jpg` (1348 × 926 browser viewport screenshot).
- Guest, Russian, light public surface, empty search. All images compared at 501px width without changing aspect ratio; the added legal footer accounts for part of the extra height.
- Real browser viewport/layout inspection at desktop and iframe widths 375/390/430, with 15px scrollbar reducing the inner CSS viewport where content exceeded iframe height. No horizontal document overflow in inspected mobile states.
- Source and implementation were composed into a side-by-side comparison; the headline/search region and journey labels were also inspected at full screenshot resolution.

## Findings and iteration history

1. P2: initial headline weight/scale and journey icons were too small relative to the selected mock. Increased desktop headline to 600 weight and a responsive 16vw scale (206px maximum); explicitly sized journey icons to 33px. Later comparison confirms the dominant two-line headline and readable task hierarchy.
2. P2: native date fields were squeezed at the intermediate desktop width. Search now wraps at the tablet breakpoint, retaining full date controls; the wide desktop keeps one row and mobile uses stacked fields.
3. P2: initial section headings and collection photos were undersized. Increased heading scale and photo aspect height, reduced the inter-section gap; re-captured and compared.
4. Functional blocker: native date input events did not update React state in the browser. Changed date handlers to onInput; verified arrival 10 December and departure 17 December in the destination URL and rendered catalogue.
5. Existing destination issue: the catalogue search bar did not initialize its visible controls from parsed URL state. Added optional initialParams and supplied it from PropertySearchPage; verified visible Layan / 10 Dec / 17 Dec / 7 nights after reload.
6. Existing HTTP preview crash: tracking used secure-context-only crypto.randomUUID. Added cryptographic getRandomValues fallback for this analytics identifier; no authorization behavior changed. Catalogue now opens normally in preview.
7. React 18 warned on fetchPriority; replaced it with eager loading of the hero image.
8. Removed the small redundant location caption below the hero lead to improve separation.

## Required fidelity surfaces

- Typography: Source Serif 4 editorial display and canonical body font; huge two-line Russian headline. Natural mobile wrapping, no clipped headings in inspected states.
- Spacing/layout: cinematic full-width image, overlapping search, four journeys, three editorial discovery links and closing section. Responsive search deliberately wraps before native controls become cramped.
- Colors: existing cream/navy/orange language, high-contrast white hero text and navy CTAs. Public styles scoped to .cinematic-home, preserving operational workspace tokens.
- Assets: existing repository photography/illustrations reused as destination/category artwork. These are not represented as specific available properties. Source mock photography replaced intentionally with existing project assets, not screenshot fragments or CSS artwork.
- Copy: exact approved “Пхукет. Вы дома.”, “Какие у вас планы?”; RU/EN/TH co-located localization through existing pickLang utility. No fabricated tariffs, ratings, property counts or service guarantees.

## Primary interactions checked

- Rental and purchase modes; purchase hides rental dates/guests and omits them from handoff.
- Live district options loaded (22 options); selected district preserved in catalogue.
- Native date inputs, checkout minimum, complete date range, guests and search URL.
- Mobile menu opens using keyboard activation and exposes navigation/owner/business links.
- Language menu and translated RU/EN/TH headlines.
- Contact sheet opens; no request submitted.
- SOS page opens publicly; no calls or messages made.
- Motion pause affordance and CSS prefers-reduced-motion rule reviewed.
- Browser console inspected: fixed page-related React warning and preview crash. Browser-extension metadata errors are external to the application.

## Limits and follow-up

- Main booking/payment flows, inventory correctness and downstream service readiness are outside this presentation change. No production business records were written for QA. The analytics fallback has three isolated security regression checks: cryptographic UUID v4 generation, existing-session reuse and no anonymous tracking writes.
- The filtered catalogue displayed an empty result; no claim of available stock is made.
- Hero is a gently animated still, not video. Replace with an approved real resort film in a separate content change if desired.
- Managed-project cards, verified team statistics/reviews and public-function content remain separate future content work; none were invented for this page.
- A dedicated on-device Safari/Android check remains useful; iframe responsive checks do not emulate every mobile browser behavior.

## Acceptance checklist

- [x] Source and browser implementation opened and compared.
- [x] Initial P2 layout/scale issues corrected and recaptured.
- [x] Primary navigation/search/contact/help inspected without business writes.
- [x] No unresolved P0/P1/P2 issues in the homepage scope.
