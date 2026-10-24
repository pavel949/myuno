# Rates: isolated acceptance — 2026-10-24

## Story and contract

An authorized synthetic operator reads dated prices, edits an inclusive period,
saves via the existing price-only SQL function, sees the persisted value in the
canonical calendar, and obtains a quote from the existing unit/category server
engines using the same database rows.

Unit and category prices remain separate canonical sources:
`property_availability.price_override` and
`property_stay_restrictions.price_override`. Category nightly overrides are
before rate-plan adjustments/discounts. No new price, availability, booking,
financial, identity or permission authority is introduced.

Category context is URL state (`property`, `category`, `date`). The canonical
calendar route composes the existing category price editor when a category is
selected; it does not pretend the parent property's unit booking actions are
category inventory actions. An explicit link opens the property booking calendar.
Changing the property removes a category from the previous property, including
from the safe back destination. An unavailable category stays unavailable and
cannot silently become a unit write.

## Confirmed failures and fixes

1. A competing edit changed 2100 to 2300. SQL correctly rejected the stale
   2200 write and did not append audit, but the old visible calendar still showed
   2100 because only the selection snapshot was refetched. The failed-save path
   now refreshes the independent selection and viewport queries together. The
   operator sees 2300 before explicitly retrying 2200.
2. Saving category A then opening the calendar dropped `category`, displaying
   the parent-unit context. The selected category now survives both navigation
   directions. The category editor is shared with `/mc/calendar`; unit booking
   actions and the unit tasks sidebar remain on the property calendar view.

No SQL function, applied migration or permission policy is changed by this patch.

## Evidence and limits

Reproduce with [the local acceptance harness](../../scripts/qa/pricing-acceptance/README.md).
The harness uses Chromium, a loopback HTTP adapter, fresh local PostgreSQL,
existing SQL migration functions, actual UI components and the canonical
`property-quote.ts` / `hotel-quote.ts` implementations. It stops at a failure.

Passing isolated scenarios:

1. Latest-starting overlapping seasons: unit 5500; category +10% plan 9350.
2. Unit read/edit/SQL save/calendar/HTTP quote: 2100 on November 10–11;
   November 12 retains seasonal 2000; three-night quote 6200; forged total denied.
3. Stale overlapping unit save: atomic denial, fresh visible price, explicit retry.
4. HTTP 503 before save: no write/audit; explicit retry succeeds.
5. Category read/edit/SQL save/canonical calendar/return/HTTP quote: 3100 on
   November 10–11; +10% plan and inherited November 12 produce 10120. Unit and
   sibling category prices are unchanged; sibling category's quote remains 3600.
6. Stale category snapshot: winning 3300 preserved; stale 3400 rejected.
7. Existing booking ID, block status, minimum stay and category closure flags
   survive price edits. Arrival closure and stop-sell still reject category quotes.
8. December 31–January 1 and leap-day February 28–March 1: inclusive selection,
   half-open SQL endpoints, exact 1700.25 native price, no extra checkout date row.
9. Invalid price/range/wrong-parent category: no accepted write.
10. Foreign fixture actor: SQL read/write denial; UI fails closed.
11. Anonymous role, missing fixture identity, denied fixture Operating Space,
    wrong currency and overlong period: denial without new audit/write.
12. RU/EN at 375/390/430/1440 in UTC, Bangkok and New York: 24 canonical category
    calendar layouts, preserved civil date, no overflow, runtime errors or external
    browser requests.

Separate unit/navigation/quote suite: 84 tests in 8 files. One earlier 5-second
month-navigation test timed out under parallel build/compiler load; rerunning
with the CI-style `--maxWorkers=2` and locked dependencies passed without raising
its timeout. No dependency or lockfile changes are part of this patch.

Initial general build/typecheck used the October 21 node_modules from another
checkout and failed on missing new Vercel telemetry packages and an obsolete
react-day-picker API. That is not a green check. The checkout was subsequently
installed using its own current lockfile before final checks.

Authoritative run artifacts contain app/SQL/quote source SHA-256 fingerprints,
requests and synthetic DB state. Screenshots are isolated fixtures with project
CSS/fallback fonts; they are not live operator screenshots or a pixel-perfect
Airbnb comparison. Auth/private/Operating Space helpers and catalogue metadata
are fixture contracts; real production helpers, JWT/PostgREST sessions, complete
checkout/holds/payments and live tenant-role acceptance remain UNTESTED.

Final locked-dependency checks: application build PASS (7118 transformed modules,
PWA generated; synthetic loopback configuration and outbound network guard).
Targeted lint: zero errors, eight existing label/any/autofocus warnings. Node
syntax checks for all three acceptance modules and `git diff --check` PASS.
Generated version/MCP outputs from the isolated build were restored and are not
part of the patch. Final `npm run typecheck` PASS with the locked dependencies. Six new regression
tests cover conflict refresh, category restoration/denial, canonical category
view, property switching and its back destination.

## Release reconciliation (read-only observations)

Production repo: https://github.com/pavel949/myuno (Vite).
Base inspected: `37de22d344274c0075e47f0717637bb40c6e5c1b` (PR #165).

Original pricing PRs:
- https://github.com/pavel949/myuno/pull/152 →
  `77d8cafd495a6c37ef2604938980abf61decffe6`.
- https://github.com/pavel949/myuno/pull/153 →
  `1385144198d10758aa9d3f8a9eaa882a4fca3a5e`.

Historical October 21 production: Vercel deployment
`dpl_7UmWNSvSHUPYBbSPHuj7XZvxm5fS`, READY,
https://myuno-bi3e7ghl6-pavel949s-projects.vercel.app at SHA `1385144…` above.

October 24 initial domain observation:
https://myuno.app → Vercel project `prj_W24et3iEBnd3QvWjd0S9hkiGMaYA`
(`myuno`, account `team_yhQPVQRquxdAw8pzvG4Lvfe1`) → production READY
`dpl_8yB2Ma2zhx87QU6izAALcGctQjxW`, full SHA
`37de22d344274c0075e47f0717637bb40c6e5c1b`,
https://myuno-7hf6884zr-pavel949s-projects.vercel.app.
Inspector: https://vercel.com/pavel949s-projects/myuno/8yB2Ma2zhx87QU6izAALcGctQjxW.

Production public Supabase URL: https://kakkwibljrjsawxgnupk.supabase.co.
Authorized Lovable project: `dcc2b024-7627-4ad9-a915-a3df3dd839f0`,
https://lovable.dev/projects/dcc2b024-7627-4ad9-a915-a3df3dd839f0.
Read-only checks found migrations `20261021062539` / `20261021063811`
registered and both price RPCs present with pinned paths, private/scope guards,
anon execute false and authenticated execute true. No production business data
was read for QA and no production writes were performed in this acceptance pass.

`pavel949/myUNO-final` is separate: Next.js Vercel project
`prj_GonhJLt1m9T060dxDBnSZtuiiWYj` (`my-uno-final`), not the current domain target.
https://github.com/pavel949/myUNO-final/pull/330 is now merged at
`a572326ce5d14b324253dc3850145508a5b0e02b`, head
`53ce962030a53bbadd07919c9376fbade47fda11`. At inspection its three CI jobs
were green and the Vercel deployment check pending. Those results are not evidence
for this app's release or database.

## Delivery / remaining gate

This is a local isolated branch/patch for review. It is not pushed: a push/PR may
automatically create deployments, which this acceptance request prohibited.
Concurrent PR #165/#166 branches are untouched. Source/build evidence is not a
claim that these two new fixes are already on myuno.app.

Remaining: review the patch, authorize the normal release separately, then perform
role-appropriate operator-session/live visual acceptance without using production
business writes as QA. Do not replay migrations or alter domain/permission settings.
Rollback of this patch is frontend-only; retain the existing SQL/audit history.
