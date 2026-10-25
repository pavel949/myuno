# Provider read cohort — queued draft checkpoint

Separate from frozen PR186; normally merged186head36ee1a789 so original source commits remain recoverable. This branch is not deployed and has no live/private operator acceptance.

The public page and existing hook use identity/visibility-tagged snapshots, late-response suppression, explicit read/service errors, current provider booking selection and same-ID refresh retention. Original query projections and writer handlers remain unchanged.

Additional source review found that a retained old refetch callback could start an obsolete identity/private read after navigation. Three targeted regressions reproduced the gap (3 failed,13 passed). A committed-cohort guard now rejects old callbacks before reads or generation changes, and invalidates their downstream completions. Latest focused hook/page/identity suite:33 tests passed. Integrated browser28 cases passed before this final callback guard; no final-guard browser/build/CI claim.

Work paused at the user's new Layantara E2E priority. Further integration, exact-head CI and full visual acceptance are pending. No production backend, business-data, role, financial or credential mutations. Existing tests use synthetic reads/cart/booking boundaries. Do not describe the full service process or platform DS audit as complete.
