# QA simulation report — auto-generated

**Score:** 50/50 (100%)  | **Target:** ≥ 45/50 (90%)

## Per-role
- **tourist**: 10/10
- **resident**: 10/10
- **investor**: 8/8
- **owner**: 8/8
- **developer**: 4/4
- **vendor**: 10/10

## Failure breakdown
- no situation in DB: 0
- orphan situation: 0
- non-SSOT cluster: 0
- 0 providers: 0

## Per-SSOT-cluster (live DB)
- **arrive**: 22 providers, 17 categories
- **live**: 24 providers, 39 categories
- **manage**: 1 providers, 5 categories
- **invest**: 1 providers, 9 categories
- **legal**: 19 providers, 11 categories
- **build**: 125 providers, 5 categories

## Matrix
| # | Role | Lang | Situation | DB | Clusters | Providers | Cats | Status |
|---|---|---|---|---|---|---|---|---|
| P01 | tourist | en | `planning` | ✓ | arrive, live, invest | 47 | 65 | ✅ |
| P02 | tourist | th | `pre_trip_planning` | ✓ | arrive | 22 | 17 | ✅ |
| P03 | tourist | ru | `arrival` | ✓ | arrive | 22 | 17 | ✅ |
| P04 | tourist | en | `transit` | ✓ | arrive | 22 | 17 | ✅ |
| P05 | tourist | th | `tourist` | ✓ | arrive | 22 | 17 | ✅ |
| P06 | tourist | ru | `leisure` | ✓ | live | 24 | 39 | ✅ |
| P07 | tourist | en | `nightlife` | ✓ | live | 24 | 39 | ✅ |
| P08 | tourist | th | `shopping` | ✓ | live | 24 | 39 | ✅ |
| P09 | tourist | ru | `food` | ✓ | live | 24 | 39 | ✅ |
| P10 | tourist | en | `pre_trip_planning` | ✓ | arrive | 22 | 17 | ✅ |
| P11 | resident | th | `living` | ✓ | live | 24 | 39 | ✅ |
| P12 | resident | ru | `family` | ✓ | live | 24 | 39 | ✅ |
| P13 | resident | en | `resident` | ✓ | live | 24 | 39 | ✅ |
| P14 | resident | th | `settling` | ✓ | legal | 19 | 11 | ✅ |
| P15 | resident | ru | `first_time` | ✓ | arrive | 22 | 17 | ✅ |
| P16 | resident | en | `digital_nomad` | ✓ | live, legal | 43 | 50 | ✅ |
| P17 | resident | th | `pets` | ✓ | live | 24 | 39 | ✅ |
| P18 | resident | ru | `pet_owner` | ✓ | live | 24 | 39 | ✅ |
| P19 | resident | en | `sports` | ✓ | live | 24 | 39 | ✅ |
| P20 | resident | th | `retirement_living` | ✓ | live, legal | 43 | 50 | ✅ |
| P21 | investor | ru | `investing` | ✓ | invest | 1 | 9 | ✅ |
| P22 | investor | en | `investor` | ✓ | invest | 1 | 9 | ✅ |
| P23 | investor | th | `property` | ✓ | invest, manage | 2 | 14 | ✅ |
| P24 | investor | ru | `business` | ✓ | build, legal, invest, manage | 146 | 30 | ✅ |
| P25 | investor | en | `investing` | ✓ | invest | 1 | 9 | ✅ |
| P26 | investor | th | `investor` | ✓ | invest | 1 | 9 | ✅ |
| P27 | investor | ru | `property` | ✓ | invest, manage | 2 | 14 | ✅ |
| P28 | investor | en | `business` | ✓ | build, legal, invest, manage | 146 | 30 | ✅ |
| P29 | owner | th | `property_owner` | ✓ | manage | 1 | 5 | ✅ |
| P30 | owner | ru | `management_company` | ✓ | manage | 1 | 5 | ✅ |
| P31 | owner | en | `managing` | ✓ | manage | 1 | 5 | ✅ |
| P32 | owner | th | `property` | ✓ | invest, manage | 2 | 14 | ✅ |
| P33 | owner | ru | `property_owner` | ✓ | manage | 1 | 5 | ✅ |
| P34 | owner | en | `management_company` | ✓ | manage | 1 | 5 | ✅ |
| P35 | owner | th | `managing` | ✓ | manage | 1 | 5 | ✅ |
| P36 | owner | ru | `property` | ✓ | invest, manage | 2 | 14 | ✅ |
| P37 | developer | en | `developer` | ✓ | build | 125 | 5 | ✅ |
| P38 | developer | th | `developer` | ✓ | build | 125 | 5 | ✅ |
| P39 | developer | ru | `developer` | ✓ | build | 125 | 5 | ✅ |
| P40 | developer | en | `developer` | ✓ | build | 125 | 5 | ✅ |
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

