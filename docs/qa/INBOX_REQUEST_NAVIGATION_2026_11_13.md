# Exact Inbox request navigation — 2026-11-13

## Scope and source identity

Starting HEAD: `1466dca3c9640134abec43eb92d77517ad9d604e`.
Observed implementation HEAD before this report: `0d26a018aee826f337273a703681b4acec2d1d7b` (workspace commits are managed automatically).

Confirmed defect: all five `fetchInbox` mappings discarded the selected record ID. Listing applications went to catalogue entities; property inquiries went to properties, a different identity domain. The other three destinations had no URL-driven request selection and capped their lists.

## Fix

- Use the existing `/admin/inbox` route with `source=<canonical source>&request=<record UUID>`.
- Open a read-only request sheet; select the exact canonical table row by ID independently of list status, pagination or age.
- Preserve source, status, search and page in the URL across selection, closing, reload and browser history.
- Fixed table and display-field allowlists; existing AdminGuard and RLS unchanged. Additional existing `useIsAdmin` admission before detail reads. Cache keyed by actor/source/request; unavailable authority never renders cached details.
- Invalid selection rejected before detail network access; missing/unreadable record does not fall back to the first item, project, property or public catalogue. Errors retain Retry.
- Opening has no mutations, automatic status changes, function calls or notifications. Specialized processing screens remain unchanged; the new sheet displays the request, not an added workflow engine.

## Scenario matrix

| UI source | Read | Result | Evidence |
|---|---|---|---|
| Partners | `partner_applications`, explicit fields, `eq(id)`, `maybeSingle` | Exact selected application | PASS unit/browser |
| Listings | `listing_applications`, same exact-ID contract | Application, not created catalogue entity | PASS unit/browser |
| Consultations | `consultation_requests`, same exact-ID contract | Exact inquiry/notes | PASS unit/browser |
| Newbuilds | `nb_leads`, same exact-ID contract | Exact lead, not project | PASS unit/browser |
| Property | `property_inquiries`, same exact-ID contract | Exact inquiry/message, not property editor | PASS unit/browser |
| Reload, Close, Back | URL selection and queue context | Restored record and filters, all five sources | PASS browser |
| Missing record | Synthetic null response | Not found or unavailable | PASS unit/browser |
| Non-admin / revoked actor | Existing admission hook | No detail read; old actor content removed | PASS unit/browser |
| Read failure → Retry | Synthetic error then success/null | Error, then re-read | PASS unit/browser |
| Invalid source/ID | Input validation | No detail request | PASS unit/browser |
| Mobile 375 × 812 | Actual Sheet | No detail overflow | PASS browser |
| Hosted real records and deployed RLS | Not accessed | Not live E2E | NOT VERIFIED |

## Commands and outcomes

```text
bun run test src/lib/adminInboxRequest.test.ts src/components/admin/InboxRequestDetail.test.tsx src/pages/admin/AdminInbox.test.tsx src/lib/adminSourcePaging.test.ts src/hooks/__tests__/useIsAdmin.actor.test.tsx
```

5 files, **62/62 PASS**: 12 exact-ID/link tests, 9 detail/admission tests, 3 existing Inbox tests, 29 existing source-isolation tests, 9 existing actor-bound admission tests. Initial run found an outdated mock missing the new source validator; corrected the partial mock, then all passed. No production client calls from tests.

```text
python3 /tmp/browser/inbox/check_inbox.py
```

**10/10 isolated browser scenarios PASS**: five source selection/reload/close/back flows, missing, denied, error/retry, invalid, mobile. Actual AdminInbox/Sheet/reader loaded from the running preview; auth/admin and the data client replaced by synthetic fixture modules. All non-local network denied; the stub client exposes reads only. **0 runtime errors**, 0 external requests attempted in the final run. Scripts/screenshots/results are temporary under `/tmp/browser/inbox/`; this is not hosted live E2E. Browser fixture launch issues were corrected before the successful run.

Harness signal: latest automatic build **OK** at 05:18:34 UTC before report completion. No manual build/typecheck run.

## Changed files

- `src/lib/adminInbox.ts`
- `src/pages/admin/AdminInbox.tsx`
- `src/components/admin/InboxRequestDetail.tsx`
- `src/lib/adminInboxRequest.test.ts`
- `src/components/admin/InboxRequestDetail.test.tsx`
- `src/pages/admin/AdminInbox.test.tsx`
- `AGENTS.md`
- `roadmap.md`
- This report.

No business-data changes, notifications, migrations, edge deployments, Auth/invitation changes or publication. Other roadmap gates remain outside this request.