# Design Bible v4 · Round 4A — HQ admin, system states, notifications

Source: Claude Design project "myUNO Design Bible", file `myUNO Round 4A HQ & States.dc.html` (handoff 2026-11-25).
Visual layer: Design Bible v4 tokens adopted app-wide (see `DESIGN.md` header). Other rounds: `design-bible-v4-screen-map.md`.

Design route `/hq/*` is **not** used: CLAUDE.md hard rule 1 forbids new top-level routes, so HQ screens live under the existing `/admin/*` shell (`AdminRouteLayout`, navy operator rail).

| Id | Design screen | Design route | Repo route | Files | Status |
|---|---|---|---|---|---|
| H1 | ClearView review editor | `/hq/clearview/:slug` | `/admin/clearview` (queue) · `/admin/clearview/:reportId` (editor) | `src/pages/admin/AdminClearViewQueue.tsx`, `src/pages/admin/AdminClearViewReview.tsx`, `src/components/admin/hq/clearview/*`, `src/lib/clearview/reviewModel.ts`, `src/hooks/useClearViewReview.ts` | Implemented |
| H2 | Finance · payouts & reconciliation | `/hq/finance` | `/admin/finance` → tab "Payouts & reconciliation" (default) | `src/components/admin/finance/PayoutRunPanel.tsx`, `src/hooks/useHqPayoutRun.ts` | Implemented (read + approve; see gaps) |
| H3 | Content manager | `/hq/content` | `/admin/content` | `src/pages/admin/AdminContent.tsx`, `src/lib/content/contentInventory.ts`, `src/lib/content/copyCheck.ts`, `src/hooks/useContentInventory.ts` | Implemented (EN/RU; ZH n/a) |
| H4 | People & access | `/hq/people` | `/admin/users` → tab "Access matrix" | `src/components/admin/hq/AccessMatrix.tsx`, `src/lib/access/hqAccessPolicy.ts` | Partial (matrix read-only; people table = existing Users tab) |
| S1 | System states (8) | component library | — | `src/components/page/SystemState.tsx` (+ used by all H screens), `src/pages/NotFound.tsx` (404 tile) | Implemented |
| N1 | Notifications · in-app / Telegram / email | — | `/notifications` | `src/components/notifications/NotificationInbox.tsx`, `src/lib/notifications/groupNotifications.ts` | Partial (in-app grouping done) |

## Shared primitives added

- **Two-person rule** — `supabase/migrations/20261125120000_hq_dual_approvals.sql`: table `hq_dual_approvals` (RLS read for admin/finance, no direct writes), RPCs `hq_can_approve`, `hq_record_approval` (audited in `admin_audit_logs`), `hq_publish_clearview_report` (requires two distinct admin sign-offs given **after the report's last edit**). Client: `src/hooks/useDualApproval.ts`.
- **Workflow tones** — `src/components/admin/hq/WorkflowStatus.tsx` (done · active · waiting · blocked · neutral).
- **Copy check** — `src/lib/content/copyCheck.ts` (tone-of-voice §5.4 + semantic-core synonyms + unsourced numbers). Used by H1 public finding and H3.
- **Kill switch** — `feature_flag:hq_round4a` (ON by default; `{"enabled": false}` hides H1/H3 pages).

## Decisions (where the prototype was adapted)

1. **ClearView model stays canon V3.** The prototype shows "Legal gates 10/10" and 8 domains with different names; the repo canon (06-clearview-methodology, `methodology.ts`) has 8 weighted categories and no gate concept. The editor uses the canon categories; P·S·D / mitigation / confidence / evidence items, public finding and member detail are stored per category inside `due_diligence_reports.analysis` (no schema change). Total = Σ(score×10×weight) + Σ overrides, as the generator computes it.
2. **Approval ≠ money movement (H2).** "Approve 56 payouts" records a two-person sign-off on the month's run (`payout_run:YYYY-MM`). Provider transfers still go through `admin_process_payout` one by one; owner payouts are approved by their management company. Exceptions (missing bank details, failed transfer, open reconciliation alerts) are held out of the approvable total.
3. **H4 matrix is a policy reference**, enforced server-side by RLS and `hq_can_approve`; a unit test keeps `APPROVAL_ROLES` and the SQL function in lockstep.

## Gaps (need a decision or backend work)

- **H2 server enforcement:** `admin_process_payout` does not yet check `hq_dual_approvals` for runs above ฿1M. Wiring it changes a live money RPC — needs Pavel's sign-off.
- **H2 "Held until check-in" KPI:** no reliable source column; replaced by an Exceptions KPI.
- **H3 ZH language & area guides:** no ZH content or area-guide table exists; investment articles have no admin editor.
- **H4 scope & sign-in method columns:** `profiles`/`user_roles` store no per-user scope (market/property) or auth method; role editing stays in the existing Users tab.
- **N1 Telegram user channel and per-topic channel preferences:** Telegram is admin-only today; `notification_preferences` has 3 booleans, not topic × channel. Needs bot account linking + schema.
- **N1 email template:** existing transactional templates (`supabase/functions/_shared/transactional-email-templates`) not yet restyled to the single-column v4 layout.
- **Migration application:** commit only; apply through Lovable Cloud to `kakkwibljrjsawxgnupk` (CLAUDE.md §4).
