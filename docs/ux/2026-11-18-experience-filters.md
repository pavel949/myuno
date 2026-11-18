# Experience discovery filters

Experience discovery retains the shared compact marketplace entry and existing bilingual title search. URL parameters `minPrice`, `maxPrice`, and `duration` now narrow the returned public catalogue using recorded attributes. Type/category/search readers and booking authority are unchanged.

Price bounds are inclusive and explicitly THB, per the unit shown in each listing, not a booking total. Other currencies and unknown prices are excluded only when a price bound is selected. Duration partitions are up to 120 minutes, over 120 through 360, and over 360; missing/nonpositive durations are excluded only under a duration filter. Malformed ranges are validation failures, never an unfiltered fallback.

Selected conditions appear as removable chips. Clearing one preserves all other URL context; clearing all removes only known catalogue parameters. Inputs update the existing URL with replacement to avoid adding a browser-history entry for every digit. Native category/type selection, detail return, history and mixed-currency sorting safeguards remain in place. Date/guest availability is intentionally not inferred from descriptive duration.

Verification uses synthetic catalogue rows only. Pure predicate tests cover currency/unknown prices, zero/fractional bounds, malformed input and duration boundaries; route tests cover combined filters and chip removal. The actual sheet browser matrix covers all three languages at 375/390/430/1440 pixels. No business records or bookings are written.

Rollback: revert the frontend change; the additional URL keys carry no persisted commercial state. No database or schema changes.
