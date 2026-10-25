# Browser authoring and media firebreak — 2026-10-25

Source-only review. No production storage upload, policy change or real listing mutation was performed.

## Browser retry and actor contract

Managed create callers use the existing `CompanyAccessLifetime` and verified, frozen session-token client. Property list/read/save/creation-scope callers use the same operation binding. An actor/company render invalidates old operations; response guards prevent late old-context form adoption. Independent owner/provider paths retain their prior rights and are not converted into employee content authorship.

The browser keeps one session-scoped initial-create UUID per actor/company/actual authorized Space/domain together with SHA256 of the normalized initial payload. It stores no listing content. Repeated initial requests keep the same key; changed initial content cannot silently become a second creation after an ambiguous response. A checked resolve-by-key reader can identify the existing creator's safe draft and offer explicit reopening. A checked null result permits correcting the initial payload using the **same persisted UUID**, never a replacement key: the original HTTP request could still arrive later. The server advisory lock, unique creator/key index and committed-input fingerprint decide which payload won and reject a different committed payload. The original browser fingerprint is retained, so the next retry resolves the winning row after a conflict. Null does not erase uncertainty. Confirmed IDs are retained until an explicit new-form/reset action. Browser storage is not authority; server actor/scope/key checks remain mandatory.

This bounds same-tab reload/retry. A closed browser session, manually cleared storage, another device or an explicitly new intent can carry another key. No cross-device natural-duplicate detection is claimed.

## Media acceptance boundary

`PhotosStep` writes public listing image URLs into canonical property content. Its existing visible warning states that uploaded links are public even for drafts and excludes documents, agreements and access codes. The first image remains the cover; removing a gallery URL does not delete storage bytes. `GalleryMode` now rejects delayed compression/fetch/upload results after an actor-generation change; the new-property Photos step remounts on actor/company change. These checks protect browser dispatch/result continuity, not server storage revocation.

Existing source policy evidence:

- `supabase/migrations/20260110082249_677946a1-21f5-4b40-895d-76cfeaeffa62.sql`: vendor-uploads UPDATE and DELETE use only `(storage.foldername(name))[1] = auth.uid()::text`; public reads are bucket-wide.
- `supabase/migrations/20260424161200_03f0de8c-13a3-4dda-9533-4cd40c158a88.sql`: property-videos uses the analogous original uploader path prefix for UPDATE/DELETE and public read.

Therefore a still-authenticated original uploader can potentially alter/delete previously reviewed media bytes after company membership or content permission changes. Remote image URLs also have externally controlled bytes. Freezing property content in SQL does not freeze the reviewed assets. No immutable-media or post-publication custody guarantee is claimed by this tranche.

The bounded first operational rollout should use existing owner/protected-admin custody for public media, with employees limited to their authorized tasks. Extending staff upload authority or claiming reviewed immutable publication is **NO-GO** until a separate storage design is approved and tested. Existing authorized owner/admin upload rights are preserved; this document is not a storage grant.

The smallest later custody design is: unreviewed uploader-owned draft objects; publication-controlled copy/version into a protected immutable namespace; canonical content references only the reviewed version; staff revocation prevents further draft writes; only a checked publication action can replace a public version. Reuse canonical properties/complexes and existing buckets where feasible. Do not add another physical-property catalogue. Storage RLS/grants, byte custody transition and retention/cleanup each require explicit review and production action-time approval. This is a proposal, not implemented behavior.

Operational acceptance must separately prove one real authorized upload, persisted canonical URL, draft reopen, public projection, failed upload/error retry, actor/company switch, revoked membership, and post-review modification/deletion denial for the intended custody model. Current synthetic browser tests and stored test URLs cannot substitute for that proof.

## Executed local browser evidence

The network-denying Chromium fixtures completed without external data calls or runtime errors:

- `complex-authoring-ui.mjs`: 12 EN/RU/TH × 375/390/430/1280 scenarios, actual authoring form, save/reopen/submit/admin-review UI and modal geometry. Writes are synthetic in-memory fixture operations.
- `property-editor-ui.mjs`: eight EN/RU × 375/390/430/1280 editor scenarios; zero mutation/data calls and zero blocked network requests. This checks editor layout/navigation, not real storage/backend persistence.
- `mc-task-command-ui.mjs`: 16 EN/RU × 375/1280 × confirmed/conflict/unknown/legacy scenarios using actual `TaskDetailSheet`, `useOperationalTasks` and checked client gateway. Explicit true metadata dispatches only the checked RPC; unknown activation metadata dispatches neither writer; verified false preserves the existing legacy path. Confirmed completion closes after returned server-shaped evidence; conflict keeps the editor open and preserves pending result. The RPC response itself is synthetic, not production proof.

Artifacts are in `/tmp/browser/complex-authoring-isolated`, `/tmp/browser/property-editor-isolated` and `/tmp/browser/mc-task-command-isolated`; each contains `results.json` and synthetic screenshots. Browser fixtures deny all network beyond the exact local compiled assets. The final refined authoring/helper/media focused run passed 31 cases across four suites; the affected property mutation/recovery pair separately passed 13. Root owns the final consolidated typecheck/build and deployment decision.
