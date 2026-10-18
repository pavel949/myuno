# Design QA — public holiday/housing journeys

Visual target: the approved cinematic homepage (`../cinematic-home/design-reference.jpg`) and the user's uploaded legacy Trip Planner screenshot. The latter exposed the discontinuity after clicking holiday/rental, not a layout to reproduce.

Implemented surfaces: homepage, shared consumer navigation, housing/goal entry, property search/browse shell, holiday planner. Shared theme/token/button fixes also propagate to other routes; specialized workspaces were not individually audited.

## Browser evidence

- `journey-final-light.png` / `journey-final-dark.png`: same desktop viewport, route, language and form state. Identical structure with theme-controlled surfaces, foregrounds and actions.
- `holiday-mobile-light.png`: 390px iframe, including mobile task navigation. 375/390/430px frames also inspected; inner viewports 360/375/415 due 15px scrollbars, no document overflow.
- Russian and English homepage checked. Managed property-type options observed: condo, apartment, villa, townhouse, house, penthouse, studio, bungalow.
- Browser handoff: villa → Layan → 10–15 February 2027 → 4 guests showed “Вилла · Лаян / 10 фев. – 15 фев. · 4 гост.” on results. No booking or business record created.
- Fixed navigation regression verified: bottom menu originally at y=1007–1067 in an 820px iframe; after removing persistent PageTransition will-change it occupies y=760–820, exactly the viewport bottom.

## Assessment

PASS for the scoped shared-system and public entry changes: navigation labels are consistent, public search preserves criteria, both themes share hierarchy, mobile menu remains visible, personal checklist is explicitly distinguished from booking state. The old explanatory hero box no longer delays the main task. Redundant goal tabs and investment prompts were removed from the rental path.

LIMIT: this is not page-by-page acceptance of the entire application or authenticated business workflows. Legacy browse/search filter contracts and role-specific flag variants remain intentionally compatible; see README. No production data writes, availability guarantees, payments or provider claims were verified by this task.

Validation: TypeScript strict check passed; 84 focused tests passed (76 navigation, 4 registered-goal-link, 4 rental/purchase/type/date handoff tests). Production build passed, including advanced-filter and contrast refinements. A memory-limited retry (`node --max-old-space-size=4096 node_modules/vite/bin/vite.js build`) succeeded after the standard 8GB-heap command exceeded the container memory limit. The only subsequent UI change replaces the result search label “Пляж” with “Район” / “Area”. Core text/CTA token contrast was measured in both themes; light orange action surface was darkened because its previous white text contrast was only 3.81:1.

Final browser reset check: selected villa became “Тип Любой”; URL became `/property/search?mode=rent&tenancy=short`. No business record was written.
