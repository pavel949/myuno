# Life OS catalogue mapping review

Read-only production evidence from 27 November 2026. Repository `pavel949/myuno`, source base `3c0d3b175`, Lovable Cloud database `kakkwibljrjsawxgnupk`. The code in this PR is for review.

## What exists

- 34 of 38 situations are active. There are 24 active scenarios and 82 active steps under active parents. 11 active situations have no rows in the situation-to-catalogue map.
- Catalogue has 1,530 raw situation-level links across 19 entity types. All 34 active situations have a recorded Thai title. Scenario and task relations carry English and Russian titles.
- The canonical hierarchy uses `life_situations`, `life_scenarios` and `life_tasks`. Situation-level `catalog_life_map` stores an entity, role scope, weight and rules. The inspected rules have `catalog_slug`, `note`, `priority_type`, `source` and `tag` keys. The current resolver remains situation-level.
- `public_service_catalog` returned zero public service rows. Its `id` matched zero `service` rows in `catalog_life_map`. Other verticals can have different read and publication rules. No task-level offer or booking mode was inferred.
- The April migration `20260426043522_979c8704` removed `task_entity_map` and its task resolver. Read-only inspection found neither that relation nor `life_task_categories` in production. A task type like `service` describes the step. An offering’s approved transaction mode is recorded and enforced by its own vertical.

## Existing active paths

Category IDs in this table are candidates. Their existence and active state were confirmed in `categories`. Each candidate still needs verified reachable supply and approval for the exact step. The current step action is the existing contextual team request.

| Situation | Scenario | Step | Candidate category IDs | Verified task offering / mode |
| --- | --- | --- | --- | --- |
| arrival | arrival.departure | arrival.departure.airport_transfer | `transfer` (63832d16-8b29-4775-818e-da6301b2b0bb) | UNKNOWN |
| arrival | arrival.departure | arrival.departure.fast_track | UNKNOWN | UNKNOWN |
| arrival | arrival.departure | arrival.departure.checkout_cleaning | UNKNOWN | UNKNOWN |
| arrival | arrival.departure | arrival.departure.close_documents | UNKNOWN | UNKNOWN |
| arrival | arrival.first_day | arrival.first_day.airport_transfer | `transfer` (63832d16-8b29-4775-818e-da6301b2b0bb) | UNKNOWN |
| arrival | arrival.first_day | arrival.first_day.airport_service | UNKNOWN | UNKNOWN |
| arrival | arrival.first_day | arrival.first_day.sim_card | UNKNOWN | UNKNOWN |
| arrival | arrival.first_day | arrival.first_day.first_meal | UNKNOWN | UNKNOWN |
| arrival | arrival.first_day | arrival.first_day.cash_exchange | UNKNOWN | UNKNOWN |
| arrival | arrival.first_day | arrival.first_day.basic_supplies | UNKNOWN | UNKNOWN |
| arrival | arrival.pre_trip | arrival.pre_trip.book_transfer | `transfer` (63832d16-8b29-4775-818e-da6301b2b0bb) | UNKNOWN |
| arrival | arrival.pre_trip | arrival.pre_trip.find_accommodation | UNKNOWN | UNKNOWN |
| arrival | arrival.pre_trip | arrival.pre_trip.rent_vehicle | UNKNOWN | UNKNOWN |
| arrival | arrival.pre_trip | arrival.pre_trip.check_insurance | UNKNOWN | UNKNOWN |
| arrival | arrival.pre_trip | arrival.pre_trip.plan_activities | UNKNOWN | UNKNOWN |
| business | business.company_setup | business.setup.registration | UNKNOWN | UNKNOWN |
| business | business.company_setup | business.setup.legal | UNKNOWN | UNKNOWN |
| business | business.company_setup | business.setup.accounting | UNKNOWN | UNKNOWN |
| business | business.networking | business.networking.events | UNKNOWN | UNKNOWN |
| business | business.networking | business.networking.meetups | UNKNOWN | UNKNOWN |
| business | business.remote_work | business.remote.coworking | UNKNOWN | UNKNOWN |
| business | business.remote_work | business.remote.internet | UNKNOWN | UNKNOWN |
| community | — | — | UNKNOWN | No published scenario |
| departure | — | — | UNKNOWN | No published scenario |
| developer | — | — | UNKNOWN | No published scenario |
| digital_nomad | — | — | UNKNOWN | No published scenario |
| emergency | — | — | UNKNOWN | No published scenario |
| family | family.activities | family.activities.excursion | `cat-family-kids` (c90f71e0-67b5-4df9-83a8-d0f82d035858) | UNKNOWN |
| family | family.activities | family.activities.water | `cat-family-kids` (c90f71e0-67b5-4df9-83a8-d0f82d035858) | UNKNOWN |
| family | family.activities | family.activities.yacht | `cat-family-kids` (c90f71e0-67b5-4df9-83a8-d0f82d035858) | UNKNOWN |
| family | family.childcare | family.childcare.school | `school-finder` (6feb9f51-b9f1-4e87-88d5-e1aba78f8591)<br>`education-expat` (6b2e9e18-49fc-478e-b744-f4e8741394aa) | UNKNOWN |
| family | family.childcare | family.childcare.babysitter | `babysitter` (30c0ca87-6148-453a-bb98-ce0df0db5e96) | UNKNOWN |
| family | family.childcare | family.childcare.tutor | `education-expat` (6b2e9e18-49fc-478e-b744-f4e8741394aa) | UNKNOWN |
| family | family.pets | family.pets.vet | UNKNOWN | UNKNOWN |
| family | family.pets | family.pets.boarding | UNKNOWN | UNKNOWN |
| first_time | — | — | UNKNOWN | No published scenario |
| food | — | — | UNKNOWN | No published scenario |
| health | health.checkup | health.checkup.clinic | `cat-health-wellness` (2e9251f1-2843-4581-be91-b0ed78af9290) | UNKNOWN |
| health | health.checkup | health.checkup.dentist | UNKNOWN | UNKNOWN |
| health | health.emergency | health.emergency.hospital | UNKNOWN | UNKNOWN |
| health | health.emergency | health.emergency.pharmacy | UNKNOWN | UNKNOWN |
| health | health.emergency | health.emergency.insurance_check | UNKNOWN | UNKNOWN |
| health | health.emergency | health.emergency.ambulance | UNKNOWN | UNKNOWN |
| health | health.wellness | health.wellness.gym | UNKNOWN | UNKNOWN |
| health | health.wellness | health.wellness.spa | UNKNOWN | UNKNOWN |
| investing | — | — | UNKNOWN | No published scenario |
| investor | — | — | UNKNOWN | No published scenario |
| leisure | leisure.celebration | leisure.celebration.venue | `event` (f39a1fc6-8f6c-4997-9d70-722afba6a64e) | UNKNOWN |
| leisure | leisure.celebration | leisure.celebration.flowers | `flowers` (646ded07-f0b7-4759-97ac-c380ccce6e13) | UNKNOWN |
| leisure | leisure.celebration | leisure.celebration.catering | `event` (f39a1fc6-8f6c-4997-9d70-722afba6a64e) | UNKNOWN |
| leisure | leisure.celebration | leisure.celebration.event_planner | `cat-wedding-events` (3acf6e3a-8e89-4c08-a26c-1ae8b83cd7b8)<br>`event` (f39a1fc6-8f6c-4997-9d70-722afba6a64e) | UNKNOWN |
| leisure | leisure.nightlife | leisure.nightlife.restaurant | UNKNOWN | UNKNOWN |
| leisure | leisure.nightlife | leisure.nightlife.event | UNKNOWN | UNKNOWN |
| leisure | leisure.vacation | leisure.vacation.tour | UNKNOWN | UNKNOWN |
| leisure | leisure.vacation | leisure.vacation.yacht | UNKNOWN | UNKNOWN |
| leisure | leisure.vacation | leisure.vacation.water_sport | UNKNOWN | UNKNOWN |
| leisure | leisure.vacation | leisure.vacation.experience | UNKNOWN | UNKNOWN |
| living | living.daily_routine | living.daily.cleaning | UNKNOWN | UNKNOWN |
| living | living.daily_routine | living.daily.gym | UNKNOWN | UNKNOWN |
| living | living.daily_routine | living.daily.salon | UNKNOWN | UNKNOWN |
| living | living.daily_routine | living.daily.restaurant | UNKNOWN | UNKNOWN |
| living | living.daily_routine | living.daily.repair | UNKNOWN | UNKNOWN |
| living | living.retirement | living.retirement.healthcare | UNKNOWN | UNKNOWN |
| living | living.retirement | living.retirement.community | UNKNOWN | UNKNOWN |
| living | living.retirement | living.retirement.comfort | UNKNOWN | UNKNOWN |
| living | living.settling_in | living.settling_in.find_home | UNKNOWN | UNKNOWN |
| living | living.settling_in | living.settling_in.setup_utilities | UNKNOWN | UNKNOWN |
| living | living.settling_in | living.settling_in.find_school | `school-finder` (6feb9f51-b9f1-4e87-88d5-e1aba78f8591)<br>`education-expat` (6b2e9e18-49fc-478e-b744-f4e8741394aa) | UNKNOWN |
| living | living.settling_in | living.settling_in.open_bank | UNKNOWN | UNKNOWN |
| management_company | — | — | UNKNOWN | No published scenario |
| managing | — | — | UNKNOWN | No published scenario |
| nightlife | — | — | UNKNOWN | No published scenario |
| pet_owner | — | — | UNKNOWN | No published scenario |
| pets | — | — | UNKNOWN | No published scenario |
| planning | — | — | UNKNOWN | No published scenario |
| pre_trip_planning | — | — | UNKNOWN | No published scenario |
| property | property.management | property.management.maintenance | UNKNOWN | UNKNOWN |
| property | property.management | property.management.rental_mgmt | UNKNOWN | UNKNOWN |
| property | property.management | property.management.inspection | UNKNOWN | UNKNOWN |
| property | property.management | property.management.taxes | UNKNOWN | UNKNOWN |
| property | property.management | property.management.deposits | UNKNOWN | UNKNOWN |
| property | property.management | property.management.meters | UNKNOWN | UNKNOWN |
| property | property.management | property.management.cleaning | UNKNOWN | UNKNOWN |
| property | property.management | property.management.checkin_checkout | UNKNOWN | UNKNOWN |
| property | property.purchase | property.purchase.search | UNKNOWN | UNKNOWN |
| property | property.purchase | property.purchase.due_diligence | UNKNOWN | UNKNOWN |
| property | property.purchase | property.purchase.financing | UNKNOWN | UNKNOWN |
| property | property.rental | property.rental.search | UNKNOWN | UNKNOWN |
| property | property.rental | property.rental.viewing | UNKNOWN | UNKNOWN |
| property | property.rental | property.rental.contract | UNKNOWN | UNKNOWN |
| property_owner | — | — | UNKNOWN | No published scenario |
| relocation | relocation.banking | relocation.banking.open_account | UNKNOWN | UNKNOWN |
| relocation | relocation.banking | relocation.banking.transfer | UNKNOWN | UNKNOWN |
| relocation | relocation.documents | relocation.documents.insurance | UNKNOWN | UNKNOWN |
| relocation | relocation.documents | relocation.documents.translation | UNKNOWN | UNKNOWN |
| relocation | relocation.documents | relocation.documents.notary | UNKNOWN | UNKNOWN |
| relocation | relocation.visa | relocation.visa.apply | UNKNOWN | UNKNOWN |
| relocation | relocation.visa | relocation.visa.extend | UNKNOWN | UNKNOWN |
| relocation | relocation.visa | relocation.visa.work_permit | UNKNOWN | UNKNOWN |
| resident | — | — | UNKNOWN | No published scenario |
| retirement_living | — | — | UNKNOWN | No published scenario |
| settling | — | — | UNKNOWN | No published scenario |
| shopping | — | — | UNKNOWN | No published scenario |
| sports | — | — | UNKNOWN | No published scenario |
| tourist | — | — | UNKNOWN | No published scenario |
| transit | — | — | UNKNOWN | No published scenario |
| vendor_onboarding | — | — | UNKNOWN | No published scenario |
| visa_renewal | — | — | UNKNOWN | No published scenario |

## Event and children coverage for review

| Need | Proposed scenario under the current situation | Proposed steps | Active category candidates | Verified task offering / mode |
| --- | --- | --- | --- | --- |
| Birthday | leisure.birthday | Venue, decorations, planning | `event` (f39a1fc6-8f6c-4997-9d70-722afba6a64e)<br>`flowers` (646ded07-f0b7-4759-97ac-c380ccce6e13) | UNKNOWN |
| Wedding | leisure.wedding | Venue, planner, flowers | `wedding` (8e9de6a4-7499-4287-ad11-9baf6a75e3a9)<br>`cat-wedding-events` (3acf6e3a-8e89-4c08-a26c-1ae8b83cd7b8)<br>`flowers` (646ded07-f0b7-4759-97ac-c380ccce6e13) | UNKNOWN |
| Family celebration | leisure.family_celebration | Venue, catering, family arrangements | `event` (f39a1fc6-8f6c-4997-9d70-722afba6a64e)<br>`cat-family-kids` (c90f71e0-67b5-4df9-83a8-d0f82d035858) | UNKNOWN |
| Children’s activities | family.activities | Existing excursion, water and yacht steps | `cat-family-kids` (c90f71e0-67b5-4df9-83a8-d0f82d035858)<br>`kids` (ba745d20-7266-485f-a7e9-91f56f00ec0f) | UNKNOWN |
| Children’s health | family.child_health | Find appropriate child healthcare, contact the clinic | `cat-health-wellness` (2e9251f1-2843-4581-be91-b0ed78af9290) | UNKNOWN |
| Education and clubs | family.education_clubs | School search, tutoring, clubs | `school-finder` (6feb9f51-b9f1-4e87-88d5-e1aba78f8591)<br>`education-expat` (6b2e9e18-49fc-478e-b744-f4e8741394aa)<br>`cat-family-kids` (c90f71e0-67b5-4df9-83a8-d0f82d035858) | UNKNOWN |

Existing `/discover/:code/:scenario` URLs, including `leisure.celebration`, remain in place. Each proposed code is additive. Duplicate prevention should match `(scenario, task code)` and `(task, approved category or offering)` using stable IDs. Situations with role relevance keep their current public hierarchy and role filters.

## Activation gate

Approve the specific category/offering and action for each step. The current situation map lacks the step identity and enforcement needed for an exact task relationship. Approve the narrowly scoped relationship, reader and writer together before changing data. The future reader must verify public eligibility and retain the destination’s REQUEST, BOOK or BOOK+PAY behavior. The existing contextual team request remains the fallback. Emergency and info steps need their existing appropriate route, independent of commerce.

Admin verification in this PR uses synthetic sessions. A browser acceptance run with a genuinely authorized admin is still required before activation. No taxonomy, business data or live access rules were changed.
