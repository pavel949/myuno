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
