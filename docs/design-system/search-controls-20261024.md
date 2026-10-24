# Property search controls

Depends on draft PR172 at `f271a32426acde8e8ee08c8c5df1d0adf3f39cdc`. This batch changes search presentation/navigation only, without booking writers, prices, server filter matching, authentication or schema changes.

- Sort is validated and serialized in the URL. Recommended removes the optional key. Existing query parameters, bookmark hash and opaque navigation state are preserved; reload and history recover the selection.
- Sorting does not reset the unapplied search editor. Only `sort` is excluded from its hydration key; the shared query/data cache key and actual criteria/history/reset hydration remain intact. Submission uses the latest selected sort.
- Price buttons expose pressed state and descriptions derived from the existing THB nightly/sale bands. Long-stay price-band suppression and all thresholds remain unchanged.
- Broad `cats=pool` is labelled Pool in both search editors. The owner feature definition and structured shared-pool criterion keep their existing meaning. Broad categories, exact amenities, highlights, view and pool type are not silently merged.
- The date popover keeps its title/actions visible while one bounded calendar body scrolls. The observed 1180×757 panel initially clipped actions, although they were reachable by scrolling. The change preserves selection/disabled-date callbacks and civil dates.

Verification uses actual Router, page, search editor, UniversalFilter/taxonomy hook and calendar with synthetic readers and denied external transport. It covers parameter/hash/state preservation, native reload/Back/Forward, staged query/guest/date drafts followed by sorting/submission, invalid/default sort, reset, price state, optional location, keyboard/Escape/outside click, and month-boundary dates under a different browser timezone. Inspected fresh 320/375/390/430 and 1180×757 screenshots retain actual component-imported CSS. Fonts remain fallback; the full App header and production data were not tested.

Prior local head `5aa60495c` passed 89 focused tests and project types. The later one-line opaque-state preservation has its own failing-before/passing-after Router regression and a fresh ten-case browser matrix. Root and CI perform final-head validation; earlier results are not substituted for it.

Limits: sorting still orders loaded results client-side, not the whole server catalogue. Duplicate broad/strict filter hierarchy remains a separate UX task; their distinct matching semantics and legacy URLs are preserved. No real request, booking or payment was submitted. This is not a claim that every filter or platform journey is complete.
