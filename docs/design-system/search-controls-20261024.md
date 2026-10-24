# Property search controls

Depends on draft PR172 at `4017dc4b0cf2439b56d7ee6fa5cd46b6dd04d689`. This batch changes search presentation/navigation only, without booking writers, prices, server filter matching, authentication or schema changes.

- Sort is validated and serialized in the URL. Recommended removes the optional key. Existing query parameters, bookmark hash and opaque navigation state are preserved; reload and history recover the selection.
- Sorting does not reset the unapplied search editor. Only `sort` is excluded from its hydration key; the shared query/data cache key and actual criteria/history/reset hydration remain intact. Submission uses the latest selected sort.
- Price buttons expose pressed state and descriptions derived from the existing THB nightly/sale bands. Long-stay price-band suppression and all thresholds remain unchanged.
- Broad `cats=pool` is labelled Pool in both search editors. The owner feature definition and structured shared-pool criterion keep their existing meaning. Broad categories, exact amenities, highlights, view and pool type are not silently merged.
- Primary budget and broad preferences stay visible. Exact listing fields use an opt-in disclosure with active counts and ALL/ANY explanations. Saved strict values expand on opening; unknown options, keys and unsupported price levels remain individually removable. Other UniversalFilter consumers retain their flat layout.
- The date popover keeps its title/actions visible while one bounded calendar body scrolls. The observed 1180×757 panel initially clipped actions, although they were reachable by scrolling. The change preserves selection/disabled-date callbacks and civil dates.

Verification uses actual Router, page, search editor, UniversalFilter/taxonomy hook and calendar with synthetic readers and denied external transport. It covers parameter/hash/state preservation, native reload/Back/Forward, staged query/guest/date drafts followed by sorting/submission, invalid/default sort, reset, price state, optional location, keyboard/Escape/outside click, and month-boundary dates under a different browser timezone. Inspected fresh 320/375/390/430 and 1180×757 screenshots retain actual component-imported CSS. Fonts remain fallback; the full App header and production data were not tested.

Prior local head `5aa60495c` passed 89 focused tests and project types. The later one-line opaque-state preservation has its own failing-before/passing-after Router regression and a fresh ten-case browser matrix. Root and CI perform final-head validation; earlier results are not substituted for it.

Limits: sorting still orders loaded results client-side, not the whole server catalogue. Broad and strict matching semantics and legacy URLs are preserved; this presentation does not invent equivalence between distinct server fields. No real request, booking or payment was submitted. This is not a claim that every filter or platform journey is complete.

Final local validation on the frozen application source: 111 tests in seven files, project types and production build passed; design prebuild guard reports no new or structural findings. Fresh Chromium ran ten EN/RU cases at 320/375/390/430/1180 pixels plus two long malformed-value cases at 320/390. Representative current screenshots were inspected. Unknown scalar and malformed array budgets remain removable without interpreting them as real bands. Full exact-head CI remains required after the final metadata/test-only commit.
