# MyUNO visual acceptance, 18 October 2026

Scope: MyUNO (`pavel949/myuno`). This is an incremental visual review, not a certificate for all routes or MyUNO Final.

## Evidence actually viewed

- Connected-system run [39132908790, attempt 2](https://github.com/pavel949/myuno/actions/runs/39132908790), artifact 12138548611, head e19c08f. These are real components with isolated synthetic data, not production screenshots. The fixtures omit the application shell and deny external font requests, so font fallback and missing global navigation in these images are not proof of a live-site defect.
- Visually inspected PNGs: property-browse `ru-375-rent-list`, `ru-1280-rent-list`; bookings-list `ru-375-list`; today `ru-375-populated`; calendar `ru-375-portfolio`.
- Live cloud Chrome after login: `/services` and `/` remained on the full-page Loading myUNO screen for minutes. Cause not established. Do not substitute fixture success for authenticated acceptance.

## Findings and minimal correction

| Surface | Visible finding | Correction / acceptance | State |
|---|---|---|---|
| Property browse, 375 px | Two narrow columns squeeze the property name and facts; content touches the left viewport edge while search has a gutter. | One column below 640 px, matching 16 px container gutters; two/three/four columns at larger widths. Loading placeholders use the same geometry. | Implemented, awaiting new browser images |
| Public listing card | District is visually stronger than property name; key facts and price are 11–12 px on phones. | Property name is a 16 px sans-serif primary heading/link, district secondary, facts 14 px and allowed two lines, price 16 px. Cover uses 4:3 on phones to avoid an over-tall single card. | Implemented, awaiting new browser images |
| Public listing card | Clickable card has no explicit keyboard destination in its title. | Name links to the existing canonical property route; card selection behavior elsewhere remains unchanged. | Implemented, acceptance pending |
| PMS Today, 375 px | Long request context and property name repeat, occupying much of the first screen. | Keep task title + one object context; move repeated description/details to task expansion. Preserve priority, status and assigned context. | Finding only; requires real source/value comparison before removal |
| Bookings, 375 px | Metrics plus six filters consume much of the first screen; long email/name compete with status/dates. | Prioritize status, guest, dates and object; put full contact detail in booking detail. Consider one status selector on narrow phones with active label always visible. | Design proposal; not implemented |
| Portfolio calendar, 375 px | Large fixed object column leaves only a few visible days; names and booking labels are clipped. | Preserve canonical calendar and horizontal movement; introduce compact object column/clear scrolling cue and accessible full names. Keep single-object mode prominent. | Design proposal; not implemented |

## Rules for the remaining page-by-page pass

1. Inspect both mobile and desktop pixels, light and dark, RU and EN; verify actual font loading before changing typography tokens.
2. Every page has one obvious primary action and consistent global navigation; local actions do not recreate the whole menu.
3. Preserve functional and permission differences between guests, employees, managers, owners, providers and admins.
4. Long Russian names and actions must remain understandable. Test wrapping, truncation disclosure, 44 px touch targets, visible focus and horizontal overflow.
5. Preserve filters and browser back navigation, loading/error/empty states and canonical domain writers.
6. Evidence status is separate: source changed; tests passed; visually accepted; published; live workflow accepted. Never infer the last three from CI alone.

## Live follow-up and regression fixes, 14:20–14:25 UTC

- Authenticated homepage loaded after publication, but a visible, empty `Coachmarks` dialog left a full-screen dimming backdrop. DOM confirmed an overlay with no tooltip content. Source only handled a missing FINAL target, leaving missing first/intermediate targets blocking the page.
- Fix: tie each measurement to its target, remeasure when activated, skip absent targets, render/lock scrolling only with a measured target, provide Escape dismissal and dialog naming. Fixed overlay positioning uses viewport coordinates; tooltip height stays within the viewport.
- Regression experiment: original source fails all four new missing-target/Escape cases; corrected source passes all seven coachmark tests, including the three existing cases.
- User-reported language mix found exactly in `OwnerManagementLanding` RU title/section/SEO and neighboring owner entry surfaces. Russian management labels and check-in terminology translated; English labels, prices, commissions and destination routes preserved. Two focused locale tests pass. This is a bounded owner-route fix, not proof every platform translation is finished.
- Lovable publication dialog confirmed “Your website was updated”; public version.json reports buildTime 2026-10-18T14:17:17.816Z. Initial browser inspection retained old card presentation. A native browser hard reload at 14:25–14:26 UTC then visibly showed actual listing titles and translated highlights (Пешком до пляжа, Бассейн, Кондиционер), confirming those PR99 changes on production. This is not acceptance of every role or workflow.
