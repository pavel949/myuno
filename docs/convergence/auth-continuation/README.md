# Auth continuation checkpoint — source candidate

This candidate builds on frozen MC pilot head `5309146a07ac0eab235cfa9fa12061f48d50615d`.
It grants no role, membership, property assignment or backend permission.

- Established staff with verified MC membership navigates to the existing `/mc/tasks` registration under MCGuard. Standalone platform staff navigates to `/profile`; an explicit safe return path is preserved and its destination guard remains authoritative.
- AuthSheet freezes each consumer intent. Server `getUser`, the successful sign-in actor and the current matching session must agree before an intent is consumed once. Closing, replacing an intent or departing an admitted actor invalidates it. No-session signup displays email confirmation and requires subsequent login; it cannot continue an inquiry or purchase.
- Full Auth invokes signup integrity only with a returned same-user session. The modal also checks the server actor and rejects obsolete responses. It no longer disappears behind the authenticated-user loading screen while verification is open.
- Confirmation callbacks return to `/auth`. A sessionStorage marker contains only the pending signup actor UUID, never a password, phone, token or consumer callback. The Auth page resumes verification only for that same authenticated actor; another actor discards the marker. A different browser/tab without the marker signs in normally and cannot recover an old callback.
- External sign-out or account switches clear query/admin/view-as caches. Same-actor token refresh preserves caches.

## Activation gates

Production Auth password minimum is **UNKNOWN**: repository config does not declare it and available tools expose no Auth settings reader. Signup's existing minimum-eight rule is retained. Signin accepts a nonempty existing password and delegates validity to Supabase; it does not create or weaken passwords. Full-page/reset signup rule convergence requires the actual backend configuration.

Before deploying, verify that the configured Auth redirect allowlist accepts the existing application origin with `/auth`. This source change does not modify that setting. OAuth's existing redirect contract is unchanged. Confirm signup/email callback behavior using an explicitly approved test identity; no real signup, email, OTP, transfer-confirm URL or production mutation was executed for this checkpoint.

Verification uses synthetic transport/session fixtures: actual InquiryForm + EmailStep + AuthSheetProvider; actual Auth page + integrity modal; actual MC child route registration + MCGuard; AuthProvider lifecycle. These tests do not establish production acceptance or replace downstream request/task authorization.
