# myUNO Onboarding and Authorization Test

**Date:** 14 November 2026  
**Scope:** five public roles, desktop and mobile emulation, anonymous onboarding entry, CTA routing, auth shell, redirect preservation, horizontal overflow, and primary touch targets.

## Result

The current source passed **10/10 combinations**:

| Role | Desktop | Mobile | Auth redirect |
|---|---:|---:|---|
| Guest/customer | Pass | Pass | `/discover` |
| Property owner | Pass | Pass | `/owner/management-landing` |
| Management company | Pass | Pass | `/mc/onboarding` |
| Local service provider | Pass | Pass | `/vendor/onboarding` |
| Developer | Pass | Pass | `/developer-portal/onboarding` |

## Tested behavior

For every role and device combination the test verified:

- public landing page returned HTTP 200;
- the role-specific CTA existed and was actionable;
- intermediate role routes were reachable where applicable;
- the authorization page rendered a usable auth shell;
- redirect context survived the auth transition;
- no horizontal document overflow was detected;
- the primary route did not lose the user’s intended destination.

### Role-specific paths

- **Guest:** homepage → `/discover` → `/auth?redirect=/discover`.
- **Owner:** `/for-owners` → `/owner/management-landing` → `/auth?redirect=/owner/management-landing`.
- **Management company:** `/for-management-companies` → `/auth?redirect=/mc/onboarding`.
- **Service provider:** `/for-local-services` → `/vendor/join` → `/auth?redirect=/vendor/onboarding`.
- **Developer:** `/for-developers` → `/developer-portal/apply` → `/auth?redirect=/developer-portal/onboarding`.

## Production versus current source

The live `myuno.app` smoke run was also performed. It exposed that the production domain was still serving an older deployment at the time of testing:

- the live homepage guest CTA still pointed to `/search` instead of the corrected `/discover` route;
- the live pages showed duplicate skip links in the rendered markup;
- the latest role-navigation commit had a Vercel deployment in `QUEUED` state.

Therefore, the 10/10 result applies to the current source/local preview. Production must be retested after deployment `4eb85f0` becomes `READY` and is aliased to `myuno.app`.

## Authentication limitation

No credentials were submitted and no account was created. The test intentionally stops at the auth shell and verifies return-path preservation. A second authenticated acceptance pass is still required for each role to verify:

- account creation/login success;
- role admission and guard behavior;
- onboarding draft persistence;
- first protected screen after redirect;
- logout and re-entry.

## Follow-up priority

1. Wait for the Vercel deployment for commit `4eb85f0` to become ready.
2. Repeat this matrix against `https://myuno.app` and confirm the live bundle contains the new role directory and partner menu.
3. Run credentialed acceptance tests using dedicated test accounts for owner, MC, provider, and developer roles.
4. Specifically test developer reload/Stripe-return persistence and MC/provider onboarding mutations, which cannot be certified anonymously.
