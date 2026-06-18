# QA simulation report — auto-generated

**Score:** 33/50 (66%)  | **Target:** ≥ 45/50 (90%)

## Per-role
- **tourist**: 6/10
- **resident**: 5/10
- **investor**: 6/8
- **owner**: 6/8
- **developer**: 0/4
- **vendor**: 10/10

## Failure breakdown
- no situation in DB: 12
- orphan situation: 0
- non-SSOT cluster: 0
- 0 providers: 5

## Per-SSOT-cluster (live DB)
- **arrive**: 22 providers, 17 categories
- **live**: 24 providers, 39 categories
- **manage**: 1 providers, 5 categories
- **invest**: 1 providers, 9 categories
- **legal**: 0 providers, 11 categories
- **build**: 0 providers, 5 categories

## Matrix
| # | Role | Lang | Situation | DB | Clusters | Providers | Cats | Status |
|---|---|---|---|---|---|---|---|---|
| P01 | tourist | en | `planning` | — | — | 0 | 0 | ❌ no situation in DB |
| P02 | tourist | th | `pre_trip_planning` | — | — | 0 | 0 | ❌ no situation in DB |
| P03 | tourist | ru | `arrival` | ✓ | arrive | 22 | 17 | ✅ |
| P04 | tourist | en | `transit` | ✓ | arrive | 22 | 17 | ✅ |
| P05 | tourist | th | `tourist` | ✓ | arrive | 22 | 17 | ✅ |
| P06 | tourist | ru | `leisure` | ✓ | live | 24 | 39 | ✅ |
| P07 | tourist | en | `nightlife` | ✓ | live | 24 | 39 | ✅ |
| P08 | tourist | th | `shopping` | — | — | 0 | 0 | ❌ no situation in DB |
| P09 | tourist | ru | `food` | ✓ | live | 24 | 39 | ✅ |
| P10 | tourist | en | `pre_trip_planning` | — | — | 0 | 0 | ❌ no situation in DB |
| P11 | resident | th | `living` | ✓ | live | 24 | 39 | ✅ |
| P12 | resident | ru | `family` | ✓ | live | 24 | 39 | ✅ |
| P13 | resident | en | `resident` | ✓ | live | 24 | 39 | ✅ |
| P14 | resident | th | `settling` | ✓ | legal | 0 | 11 | ⚠️ 0 providers |
| P15 | resident | ru | `first_time` | ✓ | arrive | 22 | 17 | ✅ |
| P16 | resident | en | `digital_nomad` | — | — | 0 | 0 | ❌ no situation in DB |
| P17 | resident | th | `pets` | — | — | 0 | 0 | ❌ no situation in DB |
| P18 | resident | ru | `pet_owner` | ✓ | live | 24 | 39 | ✅ |
| P19 | resident | en | `sports` | — | — | 0 | 0 | ❌ no situation in DB |
| P20 | resident | th | `retirement_living` | — | — | 0 | 0 | ❌ no situation in DB |
| P21 | investor | ru | `investing` | ✓ | invest | 1 | 9 | ✅ |
| P22 | investor | en | `investor` | ✓ | invest | 1 | 9 | ✅ |
| P23 | investor | th | `property` | — | — | 0 | 0 | ❌ no situation in DB |
| P24 | investor | ru | `business` | ✓ | build, legal, invest, manage | 2 | 30 | ✅ |
| P25 | investor | en | `investing` | ✓ | invest | 1 | 9 | ✅ |
| P26 | investor | th | `investor` | ✓ | invest | 1 | 9 | ✅ |
| P27 | investor | ru | `property` | — | — | 0 | 0 | ❌ no situation in DB |
| P28 | investor | en | `business` | ✓ | build, legal, invest, manage | 2 | 30 | ✅ |
| P29 | owner | th | `property_owner` | ✓ | manage | 1 | 5 | ✅ |
| P30 | owner | ru | `management_company` | ✓ | manage | 1 | 5 | ✅ |
| P31 | owner | en | `managing` | ✓ | manage | 1 | 5 | ✅ |
| P32 | owner | th | `property` | — | — | 0 | 0 | ❌ no situation in DB |
| P33 | owner | ru | `property_owner` | ✓ | manage | 1 | 5 | ✅ |
| P34 | owner | en | `management_company` | ✓ | manage | 1 | 5 | ✅ |
| P35 | owner | th | `managing` | ✓ | manage | 1 | 5 | ✅ |
| P36 | owner | ru | `property` | — | — | 0 | 0 | ❌ no situation in DB |
| P37 | developer | en | `developer` | ✓ | build | 0 | 5 | ⚠️ 0 providers |
| P38 | developer | th | `developer` | ✓ | build | 0 | 5 | ⚠️ 0 providers |
| P39 | developer | ru | `developer` | ✓ | build | 0 | 5 | ⚠️ 0 providers |
| P40 | developer | en | `developer` | ✓ | build | 0 | 5 | ⚠️ 0 providers |
| P41 | vendor | th | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P42 | vendor | ru | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P43 | vendor | en | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P44 | vendor | th | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P45 | vendor | ru | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P46 | vendor | en | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P47 | vendor | th | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P48 | vendor | ru | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P49 | vendor | en | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |
| P50 | vendor | th | `vendor_onboarding` | ✓ | manage | 1 | 5 | ✅ |

