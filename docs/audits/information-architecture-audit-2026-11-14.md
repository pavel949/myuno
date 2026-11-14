# myUNO Information Architecture and Role Coverage Audit

**Date:** 14 November 2026  
**Scope:** public homepage, top navigation, mobile menu, bottom navigation, footer, public role landing pages, and route continuity.

## Executive conclusion

The public entry architecture now exposes every primary commercial audience from the homepage and the shared public navigation:

- guest/customer;
- property owner;
- management company;
- local service provider;
- real-estate developer.

Admin is intentionally not promoted in the public marketing shell. It is an internal operating role and should remain reachable only through authenticated admin routes. Authenticated vendor, owner, management-company, developer, and admin workspaces retain their role-specific shells after sign-in.

## Role coverage matrix

| Audience | Homepage | Desktop top menu | Mobile menu | Footer | Canonical destination |
|---|---:|---:|---:|---:|---|
| Guest/customer | Yes | Yes, through discovery/search | Yes | Yes, through help/discovery shell | `/discover`, `/property/search`, `/discover/services` |
| Property owner | Yes | Yes, partner menu and owner shortcut | Yes | Yes | `/for-owners` |
| Management company | Yes | Yes, partner menu | Yes | Yes | `/for-management-companies` |
| Local service provider | Yes | Yes, partner menu | Yes | Yes | `/for-local-services` |
| Developer / real-estate project owner | Yes | Yes, partner menu | Yes | Yes | `/for-developers` |
| Business / commercial partner | Yes, through partner/footer paths | Yes, business top-nav item | Yes | Yes | `/for-business` |
| Admin / operations | No public promotion by design | No | No | No | `/admin` after authentication |

## Changes made

### Homepage

The homepage now contains a five-card audience directory under the hero:

1. I need a home or service.
2. I own property.
3. I manage a portfolio.
4. I am a developer.
5. I provide local services.

Each card links to a real canonical public route and includes localized Russian, English, and Thai copy. The footer also includes management companies, local service providers, developers, owners, and business.

### Desktop header

The public header remains task-first rather than becoming an overloaded role list. A new accessible `For partners` menu exposes owners, management companies, service providers, and developers in one predictable location. The existing primary navigation continues to represent consumer tasks such as discovery, homes, services, and account access.

### Mobile menu

The mobile sheet keeps the consumer destinations first, then adds a clearly labelled `For partners` section with the same four role destinations. This avoids forcing partner users to scan the homepage or footer after opening the menu.

### Bottom navigation

The mobile bottom bar remains task-oriented for guests. It should not be overloaded with five business personas. The Apps drawer and authenticated role-specific bars remain the correct locations for deeper product surfaces after sign-in.

## Recommended information architecture

The public shell should remain organized around two layers:

1. **What are you trying to do?** — discover, find a home, find a service, plan a stay, manage an account.
2. **What is your relationship to myUNO?** — owner, management company, service provider, developer, business partner.

These layers should not be mixed into a single bottom bar. Guests need fast task completion; partners need clear acquisition routes and then a role-specific workspace after authentication.

## Remaining product gaps

The route structure is now discoverable, but route discoverability is not the same as operational readiness. The following gaps remain from the role audit:

- service discovery currently has limited or no published provider inventory in production;
- developer onboarding needs durable save/resume across reload and payment return;
- developer and other partner pages need route-specific server-visible SEO metadata;
- public MC pricing must remain aligned with in-product billing;
- provider payout, currency, booking-transition, and ownership-scope logic require backend certification;
- admin support/inquiry queues should converge on one canonical ticket workflow;
- `/services` and `/discover/services` should have a documented canonical relationship.

## Verification

- TypeScript: passed.
- Focused homepage/navigation suite: **6 test files, 23 tests passed**.
- Production build: passed after design-token correction.
- Diff hygiene: passed `git diff --check`.

## Release decision

The public information architecture is now strong enough for role discovery and conversion routing. It is not, by itself, a certification that every role workflow is commercially ready. Marketing traffic should still be staged until the provider, developer, owner-finance, and management-company trust gaps above are closed or explicitly disclosed.
