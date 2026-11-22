# Production visual and deploy audit · 22 November 2026

Scope: **pavel949/myuno** only. The correct public host is
[`www.myuno.app`](https://www.myuno.app/); the bare domain and Lovable
publish alias redirect there. No work was done in `myUNO-final`.

## Confirmed publication mismatch

A cache-busted read of `https://www.myuno.app/version.json` returned:
- `commit: 8097b639c096c9890d39b7ace372426afe575162`
- `buildTime: 2026-11-21T07:40:07.353Z`
- `version: 3.55.5`
- `branch: master` is *build metadata*, **not** a currently available GitHub
  branch. GitHub currently exposes `main`.
- At inspection, `main` was 12 commits ahead of that production commit,
  including home visual refinements and mobile fixes. Lovable editor reported
  `899c4f7f4c73a5ab7dd887c871514cd5cdc77327` before this PR.

The Lovable project showing `ready` or `published: true` does **not**
establish that the **public domain** has the new version.

After every production publish run:
```bash
node scripts/qa/check-live-commit.mjs "$(git rev-parse HEAD)"
```
Do not declare a production release complete unless the printed
`verified` field is `true`. The script uses a cache-busted HTTPS fetch.

## Real-browser guest visual sweep

Using a fresh, unauthenticated browser session on `www.myuno.app`,
visited these routes at **390 × 844** and **1440 × 900**:
- `/`
- `/property/rent`
- `/discover/buy`
- `/property/search?mode=rent` (buy mode on desktop)
- `/property/offplan`
- `/experiences`
- `/services`
- `/transport/airport-transfer`
- `/transport/fast-track`
- `/yachts`
- `/flowers`
- `/area/laguna`
- `/for-owners`

All 13 responded HTTP 200 and did not show a document-wide horizontal overflow.
No fatal browser `pageerror` was recorded in the short hydration window.
Fast Track and Yachts render asynchronously: check them after hydration rather
than mistaking initial empty headings for a permanent failure.

Direct visible homepage link clicks to rent, buy and services landed correctly.
The experience catalogue was opened by URL; an initial click selector chose a
hidden desktop link on mobile, so it must not count as an app defect.

**Real visual issue:** the global 48px assistant at about (311,715) in the 390px
mobile viewport sat over the lower area of rental search and Fast Track
primary-action surfaces. Public browsing/navigation must not obstruct booking
and enquiry buttons.

This patch gives primary actions an explicit `data-chat-occlusion-target`
marker; `UnifiedChatFAB` suppresses its launcher *only while the marked action
is visible on a phone*, and shows it again when the user scrolls away.
It covers real homepage/rental search, shared airport booking summary,
vehicle booking and flower bouquet sticky conversion surfaces. The chat drawer
itself is not removed.

## Scope limitations and release acceptance

This is not a certification of all myUNO screens. Authenticated user roles,
payments, CRM submission, live booking, destructive operator actions, and
transactional webhooks were **not** exercised. No production forms or charges
were submitted.

The companion Playwright test
`e2e/tests/navigation/public-visual-cta.spec.ts` checks responsive overflow
and conversion CTA clearance on the currently built code. It must run in CI
or an approved staging environment before being called verified.

For visual acceptance, capture 320/390/768/1440px screenshots of the **exact
release commit** and verify hierarchy, typography, sticky controls, cards,
images, navigation and error/loading states. Do not replace actual images
with fabricated inventory or hide unknown errors.
