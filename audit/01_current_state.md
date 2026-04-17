# Audit 01 — Current State of myUNO App Inventory

> Generated: 2026-04-16 | Source of truth: `src/lib/appRegistry.ts`
>
> ⚠️ **Source files referenced in the audit brief do not exist in this repo:**
> `MYUNO_app_matrix.md`, `byUNO_master_matrix.html`, `byUNO_OS_2026.html`,
> `byUNO_tech_blueprint.html`, `NT_BUSINESS_OS_v2.html` — none found under
> `C:\Users\pavel\OneDrive\Apps\myUNO\`. Canonical source used: `src/lib/appRegistry.ts`.

---

## Registry Summary

| Metric | Count |
|--------|-------|
| Total entries in APP_REGISTRY | **55** |
| Services sub-category filters (same route + query param) | 8 |
| MC sub-module entries | 4 |
| **Distinct product entries** | **43** |
| B2B / operator-only entries (personaTags: real_estate_developer / property_owner only) | 7 |
| **Consumer-facing apps** | **~36** |

> ⚠️ **Count discrepancy**: The "36 apps" figure is accurate only for consumer-facing apps.
> Total registry is 55. Any tooling or dashboard that reads `Object.keys(APP_REGISTRY).length`
> will see 55, not 36.

---

## Full Registry — 43 Distinct Products

### Group: `home` — Home & Living

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `property` | Real Estate | Недвижимость | /property | active | ✅ | Core vertical |
| `cleaning` | Home Cleaning | Клининг | /cleaning | active | ✅ | |
| `babysitter` | Childcare | Присмотр за детьми | /babysitter | active | ✅ | |
| `pets` | Pet Care | Уход за питомцами | /pets | active | ✅ | verticalId: `pet_service` (mismatch with ID `pets`) |
| `flowers` | Flower Delivery | Доставка цветов | /flowers | active | ✅ | |

### Group: `transport` — Transport

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `transfer` | Airport & City Transfers | Трансферы | /transfers | active | ✅ | |
| `vehicle` | Car & Bike Rental | Аренда авто и мото | /transport | active | ✅ | Route `/transport` doesn't match ID `vehicle` |
| `fast-track` | Fast Track | Фаст-трек | /transport/fast-track | active | ✅ | ⚠️ Hyphen in ID; jargon term; no personaTags |
| `sim` | SIM Cards | SIM-карты | /sim | active | ❌ | ⚠️ Too abbreviated; clusterIds: ['arrive'] but groupId: 'transport' |
| `exchange` | Exchange Rates | Курсы валют | /exchange | active | ❌ | groupId: 'transport' — mismatch (it's finance, not transport) |

### Group: `leisure` — Leisure & Activities

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `restaurant` | Restaurants | Рестораны | /restaurants | active | ✅ | |
| `experience` | Experiences | Впечатления | /experiences | active | ✅ | ⚠️ Too generic; overlaps with `water_activity`, `event` |
| `yacht` | Yacht Charter | Яхт-чартер | /yachts | active | ✅ | Route `/yachts` vs ID `yacht` (minor) |
| `water_activity` | Water Sports | Водный спорт | /experiences?type=activity | active | ✅ | ⚠️ **Underscore in ID** (only entry with `_` — breaks consistency); filter sub of `experience` |
| `event` | Events | События | /events | active | ✅ | |
| `fitness` | Fitness & Gyms | Фитнес и залы | /fitness | active | ✅ | |
| `market` | Market | Маркет | /market | active | ❌ | ⚠️ "Market" is too vague (marketplace? supermarket?); groupId: 'leisure' — debatable |

### Group: `wellness` — Health & Wellness

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `beauty` | Beauty & Wellness | Красота и велнес | /beauty | active | ✅ | ⚠️ "Wellness" appears in both group and app name |
| `medical` | Medical | Медицина | /medical | active | ✅ | |
| `pharmacy` | Pharmacy | Аптеки | /pharmacy | active | ❌ | RU plural "Аптеки" vs singular ID/EN |
| `veterinary` | Veterinary | Ветеринары | /veterinary | active | ❌ | No verticalId |
| `insurance` | Insurance | Страхование | /insurance | active | ❌ | |

### Group: `admin_docs` — Documents & Finance

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `legal` | Legal Services | Юридические услуги | /legal | active | ✅ | |
| `education` | Education & Courses | Образование | /education | active | ✅ | |
| `banking` | Banking & Finance | Банки и финансы | /banking | active | ❌ | |
| `visa` | Visa & Immigration | Визы и иммиграция | /visa | active | ❌ | No verticalId |
| `relocate` | Relocation | Переезд | /relocate | active | ❌ | clusterIds: [] — not in any Navigator cluster |
| `tax` | Taxes | Налоги | /tax | active | ❌ | personaTags: [] — no personas defined |
| `contract-ai` | ContractAI | ContractAI | /contract-analysis | active | ❌ | ⚠️ **Hyphen in ID**; EN=RU (not bilingual); personaTags: []; route path doesn't match ID |
| `knowledge` | Knowledge Hub | База знаний | /knowledge | active | ❌ | ⚠️ Too generic; clusterIds: [] |

### Group: `maintenance` — Home Maintenance

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `services` | Home Services | Услуги для дома | /services | active | ✅ | Parent entry for all sub-filters below |

> **Sub-filter entries (8) — same route with `?category=X` param, not standalone apps:**
> `services-laundry`, `services-plumbing`, `services-electrical`, `services-ac`,
> `services-gardening`, `services-pest`, `services-handyman`, `services-locksmith`

### Group: `help` — Help

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `vip-concierge` | Concierge | Консьерж | /vip-concierge | active | ❌ | ⚠️ **Hyphen in ID**; "VIP" in ID but label just says "Concierge"; personaTags: [] |
| `sos` | Emergency Help | Экстренная помощь | /sos | active | ❌ | |

### Group: `invest` — Invest

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `offplan` | New Developments | Новостройки | /property/offplan | active | ❌ | ⚠️ ID `offplan` is industry jargon; label "New Developments" is fine |
| `resale` | Resale | Вторичка | /property/resale | active | ❌ | personaTags: [] |
| `developers` | Developers | Застройщики | /developers | active | ❌ | ⚠️ "Developers" = software devs to English speakers; personaTags: [real_estate_developer] — B2B |
| `invest-hub` | ROI & invest hub | ROI / инвестиции | /invest | active | ❌ | ⚠️ **Hyphen in ID**; "hub" suffix; lowercase inconsistency "ROI & invest hub" |

### Group: `manage` — Property Management

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `mc` | MC Dashboard | Кабинет MC | /mc | active | ❌ | ⚠️ "MC" = Management Company (internal jargon); sub-modules below |

> **MC sub-module entries (4) — sections of the MC Dashboard, not standalone apps:**
> `mc-calendar`, `mc-finance`, `mc-reports` (pro), `mc-crm` (pro)

### Group: `build` — For Developers (B2B)

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `developer-portal` | Portal | Портал | /developer-portal | active | ❌ | ⚠️ **Hyphen in ID**; label "Portal" is too generic |
| `for-developers` | Developer program | Застройщикам | /for-developers | active | ❌ | ⚠️ **Hyphen in ID**; "for-developers" in ID + route; Застройщикам = real estate developers, not software |
| `newbuilds` | Newbuilds showcase | Витрина новостроек | /newbuilds | active | ❌ | ⚠️ "Newbuilds" is UK English jargon |
| `consultation` | Advisory | Консультация | /consultation | active | ❌ | Label "Advisory" doesn't match ID `consultation`; RU "Консультация" is more accurate |

### Group: `lifestyle` — Lifestyle

| ID | Display Name (EN) | Display Name (RU) | Route | Status | Bookable | Notes |
|----|-------------------|-------------------|-------|--------|----------|-------|
| `school-finder` | School Finder | Поиск школы | /school-finder | active | ❌ | ⚠️ Hyphen in ID (route `/school-finder` is fine); clusterIds: ['family'] |

---

## Naming Issues Summary

| Issue | Affected IDs |
|-------|-------------|
| Hyphen in ID (breaks JS property access without quotes) | `fast-track`, `contract-ai`, `vip-concierge`, `invest-hub`, `developer-portal`, `for-developers`, `school-finder`, `mc-calendar`, `mc-finance`, `mc-reports`, `mc-crm`, all `services-*` (9) |
| Underscore in ID (inconsistent with kebab-case entries) | `water_activity` |
| ID is industry/internal jargon | `fast-track`, `offplan`, `mc`, `newbuilds` |
| Display name doesn't match ID semantics | `vehicle` (Car & Bike Rental), `contract-ai` (same RU/EN), `consultation` (Advisory ≠ consultation), `developer-portal` (Portal is too generic) |
| personaTags: [] — invisible to persona-based routing | `fast-track`, `tax`, `contract-ai`, `vip-concierge`, `resale`, `exchange`, `sos` |
| clusterIds: [] — not in any Navigator journey | `relocate`, `knowledge`, `vip-concierge`, `sos` |
| groupId mismatch | `exchange` in 'transport' (should be finance/admin); `water_activity` as standalone (is a filter sub) |
