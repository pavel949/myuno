# Platform social links

## Reviewable change

Admin → System Settings → Social networks (`/admin/settings?tab=social`) edits the platform's YouTube, Instagram, LinkedIn and Facebook profile URLs. Saved nonempty links appear in both CompactFooter layouts. Empty values hide icons; existing Telegram and WhatsApp contact links remain.

Use the existing `system_settings` authority and actor-bound `readAdminSystemSettings`/`saveAdminSystemSettings` helpers. A single `org_social_links` JSON object holds exactly the four profile values. No defaults, social accounts, private keys or business records are seeded. Existing admin admission and write policies remain unchanged. Writes require exact row acknowledgement and persisted readback; failed reads never become empty editable defaults. Uncertain writes require reload, and late responses cannot acknowledge a different actor's save.

Public reads select only `key,value` for this exact key. Validate HTTPS, allowed platform hosts and profile paths; reject credentials, lookalike domains, unsupported protocols and ports, and strip tracking parameters/fragments. Facebook `profile.php` retains its required numeric `id` parameter. Bad stored URLs are not rendered. Public metadata uses the existing QueryClient; verified saves invalidate its key.

## Access change and activation gate

`drizzle/migrations/0039_public_org_social_links.sql` adds only a SELECT policy for anon/authenticated on `key = 'org_social_links'`. It does not widen settings writes or other setting reads. Current production settings policies were inspected read-only before implementation; no existing social setting or new policy was applied during development.

Review is required by the review stop in PROJECT.md and its §20 governance and AGENTS.md for an RLS change. Frontend merge/publication and policy activation must follow that review. No production test social profiles should be inserted. After approval, verify the exact public policy and existing admin policies, and verify guest SELECT without a broad private settings request. The owner supplies actual profile URLs through the UI.

Restrictive rollback: `docs/hardening/rollback/2026-11-18-public-social-links.sql` drops only the new public-read policy, preserving configured values/admin access; revert the frontend as needed.

## Evidence

59 targeted tests passed: URL validation/normalization, actual settings read/write acknowledgement and account changes, public reader, both footer layouts, and isolated socket-only PostgreSQL tests as anon/nonadmin/admin, including restrictive rollback. Actual component browser checks passed at RU375/390/430, EN1440 and TH390 with synthetic settings transport, save/readback/footer update and clearing a profile; all network access stays local. TypeScript, lint, design audit and production build are checked before review; hosted checks verify the final integrated head. Synthetic writes are not live admin acceptance.
