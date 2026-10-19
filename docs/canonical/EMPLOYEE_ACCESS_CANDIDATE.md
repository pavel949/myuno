# Employee invitation and scoped access candidate

Status: SOURCE CANDIDATE, not deployed or production-verified. Base: `dec344de5` (19 October 2026).

## Contract

- Supabase Auth owns identity. `management_company_members.user_id` is the verified account relationship. `staff_members` remains an HR directory; its primary key is not an Auth ID. No names, emails or matching UUIDs are used to invent that link.
- Company director/admin or an explicitly verified platform admin may invite a company employee. The caller-bound `actor_is_operating_company_overseer` check must succeed before a service-role client is created. Generic `uno_team`, client role fields and user metadata confer no authority.
- The employee endpoint allows `staff`, `manager`, and `accountant` membership roles. Invitation forms default to `staff`. The manager option is explicitly operational: legacy manager authority can exceed module switches, so empty switches do not prove no access. Privileged promotion is a separate administrative action.
- New accounts receive Supabase's secure invitation link to `/auth/setup-password`. No generated password is created, emailed, logged or returned. Only a new account's display name is supplied to Auth. Existing account profiles and metadata are untouched.
- Existing confirmed accounts can be added by their canonical Auth ID and keep normal sign-in. They do not receive a password reset or a new invitation email. Auth lookup paginates; an incomplete lookup fails closed.
- Existing active membership, role, module rights and Space assignments are preserved. An inactive membership, unconfirmed existing account, or orphaned module grants blocks automatic addition and requires review. A duplicate/racing membership insert never becomes an upsert.
- A new company membership gets no global `staff`/`uno_team`/`owner` role, module defaults or Space assignment. Company membership is not proof that private property work is ready.
- The company account panel reads existing memberships, optional profile labels by verified Auth ID, current module grants and Operating Spaces. It never uses HR IDs for permissions or activity.
- Explicit property view/edit, tariff (`pricing`) edit and booking (`bookings`) edit permissions reuse `team_member_permissions`. No finance permission is implied. Unrelated modules and existing sub/export flags remain unchanged. Privileged company roles are not changed through this panel.
- Space assignment uses `operating_space_members.company_member_id`, a verified same-company member and an active same-company Space. Actor-overseer authorization and final table RLS are required. Empty Spaces never means all Spaces. Disabling an existing assignment is explicit.
- Company invitation and new module/Space grants require `operating_spaces_enforced=true`; unknown/false or an unavailable table fails closed. The panel disables invitation and access controls without that prerequisite. The mutation writer still permits explicit revocation without enabling scope. No code here toggles enforcement. This flag alone is not evidence that policies and the Space manifest passed their separate approved cutover. Independent owner/provider workflows are unchanged. The creation/editing/publication workflow has its own checked-writer activation and verification gate.
- Each access operation captures a UI actor/company generation and the existing verified Auth token in memory. A non-persistent, fixed-token request client cannot borrow a later shared-client session. Account/company changes, sign-out and component unmount invalidate the generation and abort outstanding requests. Guards run after awaited reads and at the actual HTTP dispatch; old UI results are suppressed. No second identity record or stored credential is created.
- Module changes carry one explicit intent, not a stale pair of checkbox values: removing Edit touches only Edit, removing View clears View and Edit, and granting Edit explicitly grants View. Concurrent revocation cannot be silently reversed by an unrelated checkbox removal. Existing sub/export rights remain untouched.

## Completion and recovery

Auth email delivery and membership insertion are separate operations. The endpoint returns distinct delivery and membership states. A sent email followed by failed membership provisioning is a non-success response with `invite_email_sent: true`. A transport failure around Auth is unknown delivery, never invented failure or success. The UI reads non-2xx response bodies and retains partial-completion messages.

Cancellation cannot roll back a request that already reached the server. On a context switch, suppress late results and review the original account/company through an approved path before retrying; a cancelled UI operation is not proof that no email or write occurred.

Do not automatically retry unknown delivery, delete an Auth account, regenerate/reset a password, reactivate a member or replay default permissions. Review Auth and membership state through an approved administrative path. An employee with an unconfirmed existing invite must finish that original link before an administrator retries the membership operation. No durable invitation ledger or second identity table is introduced.

The platform `admin-invite-user` handler also distinguishes role/link failures after email delivery. It verifies the granted role row and requested operator link; an existing operator link is never overwritten. A failed audit insert is disclosed with `audit_recorded: false`.

## Activation prerequisites

Both `TEAM_MEMBER_INVITES_ENABLED=true` (Edge) and `VITE_TEAM_MEMBER_ACCESS_ENABLED=true` (frontend build) are intentionally absent by default. Source publication or a function deploy alone is not approval to enable them.

Before controlled activation, verify:

1. Current deployed actor-bound company-overseer helper excludes generic employment and accepts only the explicit company or platform administration relationship.
2. Current RLS/grants for memberships, `team_member_permissions`, `operating_spaces`, and `operating_space_members`, including restrictive Space policies and same-company foreign keys. Platform admin requires the companion candidate's explicit overseer permission policy; the original `is_mc_admin` policy alone does not cover a non-member platform admin.
3. Auth SMTP, invite template and redirect allowlist for `https://myuno.app/auth/setup-password`; invitation expiry/recovery behavior; actual actor roles and assigned Spaces. No email or account was created during source verification.
4. The target company has completed its approved scope/security cutover, with `operating_spaces_enforced=true`, verified restrictive policies and the approved Space manifest. This candidate never enables that flag. Explicit recipients and membership/Space/module grants are approved. Never infer all-company access, default module grants or the production Space manifest.
5. Checked property authoring/review/publication candidate is independently reviewed and activated in the correct order. Do not claim the whole employee journey works from a green unit suite.
6. Production read-only evidence, approved isolated/canary acceptance, remote full typecheck/build and targeted browser checks. Full typecheck/build were deliberately not run locally due the shared memory constraint.

## Verification scope

Synthetic-only tests cover denied/failed authorization before privileged use, activation-off behavior, role escalation rejection, pagination, existing/unconfirmed/inactive accounts, preserved rights, partial delivery/provisioning, explicit Space/module changes using canonical IDs, zero-row failures, EN/RU/TH controls and duplicate submissions. Deferred tests cover identity/company/unmount invalidation during RPC, member, company, Space and permission reads; actual request headers remain actor-bound; onboarding does not continue its queued invites or show late UI results after invalidation. Tests forbid external fetch; SDK dispatch tests use only synthetic in-memory fetch responses. Existing HR editing/assignment-unavailability tests remain applicable.

No Supabase SQL, live invitation, account creation, membership/permission assignment, Edge deploy, repository push or production browser mutation is part of this candidate.

## Security-preserving rollback

Turn both activation flags off and keep the access panel disabled. Retain server authorization and truthful partial-failure handling. Do not restore generated-password invitations, HR/Auth UUID aliasing, blanket default grants or implicit global roles. Preserve legitimate existing memberships and permissions; any revocation or identity cleanup requires a separately approved, verified action.

## Executed local checks (19 October 2026)

- Initial candidate: 76 synthetic tests passed across seven focused files. Async-context follow-up: 109 synthetic tests passed across ten focused files, including deferred lifecycle and actual SDK dispatch regressions.
- New invitation/access source and tests pass focused ESLint with no warnings. Existing edited StaffPage/MCOnboarding retain eight pre-existing `any`/accessibility warnings and no lint errors; both admin callers lint clean.
- Initial 16 and follow-up 12 changed TypeScript files parsed/transpiled with zero syntax diagnostics; this is not a semantic typecheck. `git diff --check` passed.
- No full local typecheck/build, production data query, deployed-policy test, real SMTP delivery, live browser acceptance, or production mutation was run.
- Official API references checked: [inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail), [listUsers](https://supabase.com/docs/reference/javascript/auth-admin-listusers), and the [current changelog](https://supabase.com/changelog). The follow-up also checked the installed SDK’s `accessToken` client mode and `fetchWithAuth` final dispatch path; synthetic tests exercise the real SDK with a stubbed fetch.
