# myuno readiness checkpoint — 22 October 2026

Scope: pavel949/myuno (React/Vite), myuno.app/www.myuno.app. The independently
maintained myUNO-final application is outside this assessment.

## Evidence boundary

Current main read: 0e4ce1f09d2b28632851bc422887b6010905106f. PRs155,156,158,128
are merged since the previous fb4b944 checkpoint. Lovable core project
`dcc2b024-7627-4ad9-a915-a3df3dd839f0` independently reports latest source0e4ce1f,
ready, published=true. That does not identify the exact currently published SHA.
Direct public browsing of both domains fails in this executor with
ERR_TUNNEL_CONNECTION_FAILED; no live rendering or deployed-version acceptance
is claimed.

## Provisional production-readiness assessment

Scores are an engineering assessment of demonstrated readiness, not a percentage
of passed tests. Missing transaction/deployment evidence caps these scores.

| Area | Score /5 | Remaining evidence |
| --- | --- | --- |
| Guest booking |2| Full isolated request/reservation/payment/confirmation lifecycle |
| PMS |2| Critical writer/operational contracts125/129 and installed-state acceptance |
| Services |2| Whole request/commercial/capacity/settlement lifecycle, not fixtures alone |
| Roles/security |3| Installed-policy/object-authorization evidence beyond source tests |
| UX |3| Fresh complete journeys beyond the public homepage and selected forms |
| Reliability |3| Current connected run and exact merged-main acceptance |
| Release operations |2| Exact public deployed version and verified release path |

## Current mobile homepage fix

PR159 head67cc974e7b7e331ebc5f8af588ea016649441e31 keeps one compact header row,
moves mobile preferences into its menu, retains named motion controls/reduced
motion, removes obsolete preference dropdown z50 overrides, and rebalances the
hero while retaining unified search/area discovery. Independent source/pixel
review GO is scoped to this change. A gallery arrow's lower edge touches the
floating assistant in one390px frame; its center is unobscured and a native tap
successfully scrolls the rail. This is a nonblocking visual follow-up, not proof
that every floating/content interaction has been audited.

Local:34 targeted tests, types, scoped lint, build PASS. Browser:30cases across
320/360/390/430/1440 plus12 across768/1920, RU/EN/TH xnormal/reduced motion PASS.
Actual Landing/header/switchers/assistant render with synthetic read-only catalog
and context adapters. The language adapter does not establish actual locale
provider propagation/persistence. Short390x568 with200% hero text can scroll the
full search card above navigation; actual assistant clearance>=12px, canonical16.

Exact-head verify run39864026830 PASS:3949/3949 tests in291 files,322.90s,
0 lint errors/2486 warnings. Connected run39864026848 is still in progress at
this checkpoint. CodeRabbit's success status is a skipped automatic review,
not substantive approval. ECC security evidence comment passed; app Checks-write
permission remains unavailable and was not changed. Legacy e2e.yml is manual-only
and seeds a backend; it was not dispatched.

## Preserved unfinished work

Auth WIP remains in its original worktree at basef782951: duplicate submission/
late-completion guards, truthful value-panel copy, Thai recovery/label association
and mobile form visibility. Last recorded isolated results52tests/27browser cases
PASS; subsequent type/build completion was interrupted and is NOT certified.
No auth source was committed, copied into the homepage branch, or published.

Receipt branchf91a8939ae20a75c49ba927f202383d7b0f6ff20 is preserved. Its historical
full suite remains RED4009PASS/17FAIL; earlier focused/browser successes do not
replace that record or prove compatibility with current main. Company-loading
candidate9b68b3d4c2f473049e97cead0fa7644eaf222062 is separate; current full typecheck
PASS, build/fresh browser checks pending. None of these candidates is in PR159.

Gated contracts125/129/157, PR8 unidentified server rejection, PR51 unrecovered
repeated-denial causes and Supabase project permission denial remain separate;
no migrations, roles, secrets, real bookings/payments/accounts or contract
activation were attempted. Docker availability alone does not supply a verified
replayable local schema/seed/bootstrap for full-stack transaction acceptance.

## Merged-main verification capability

Safe verify.yml/connected-system-check.yml support pull_request and manual
workflow_dispatch, not ordinary main pushes. Available connected tools expose no
dispatch action; local gh auth status reports invalid GH_TOKEN. Do not substitute
the unsafe legacy e2e manual workflow or extract/change credentials. The existing authorized workflow connector supplies the dispatch route for the
two safe exact-main runs after the green merge; CLI credentials stay unchanged.
