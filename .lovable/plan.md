

## План: Fix TS errors + Phase 2 (Capital Flywheel)

### A) Fix build errors (5 min)
`pageRegistry.ts` не экспортирует новые Investment-страницы. Добавить lazy-exports:
```ts
export const InvestmentHubLanding = lazy(() => import('@/pages/invest/InvestmentHubLanding'));
export const InvestmentRealEstateZone = lazy(() => import('@/pages/invest/InvestmentRealEstateZone'));
export const InvestmentBusinessZone = lazy(() => import('@/pages/invest/InvestmentBusinessZone'));
export const InvestmentKnowledgeZone = lazy(() => import('@/pages/invest/InvestmentKnowledgeZone'));
export const InvestmentServicesZone = lazy(() => import('@/pages/invest/InvestmentServicesZone'));
export const InvestmentOpsConsole = lazy(() => import('@/pages/invest/InvestmentOpsConsole'));
```

---

### B) Phase 2: Capital Flywheel (объединение Phase 2 + запросов из прошлого сообщения)

**Концепция (из прошлого сообщения юзера):**
- Investment Hub связан с Property Hub и Developer Hub
- Девелоперы могут привлекать капитал на проекты + продавать остатки
- Бизнес-собственники и идеологи могут "Pitch your project"
- Блок "Invest in Thailand" (макроэкономика, индустрии, why Thailand)
- Проекты **анонимизированы** в публичной выдаче → монетизация через intro fee
- Все заявки → CRM с классификацией + финансовый объём + вероятность реализации

---

### Data Model

**1. `business_listings`** — действующий бизнес/проекты на продажу/привлечение
```sql
- id, slug, owner_user_id (NOT exposed)
- listing_type: 'business_for_sale' | 'developer_raise' | 'developer_inventory' | 'startup_pitch' | 'operating_partner_wanted'
- asset_class: enum (restaurant, hotel, retail, marine, import_export, manufacturing, medical, education, tech, franchise, other)
- title_ru/en, teaser_ru/en (anonymized public copy)
- full_description_ru/en (gated — viewable after intro request approved)
- ask_amount, currency, equity_offered_pct, min_ticket
- monthly_revenue, ebitda, asset_value (financial sizing)
- location_district (район, не точный адрес для анонимности)
- staff_count, lease_remaining_months, license_status
- reason_for_sale, use_of_funds (for raises)
- is_anonymized: boolean (default true)
- visibility: 'draft' | 'pending_review' | 'published' | 'archived'
- success_probability: int 0-100 (admin-set after review)
- expected_close_date, deal_stage
- created_at, updated_at, published_at
```
RLS: public SELECT teaser fields where `visibility='published'`; full row only owner+admin.

**2. `investment_articles`** — Knowledge base + "Invest in Thailand"
```sql
- id, slug, category ('overview' | 'industry_brief' | 'how_to' | 'legal' | 'tax' | 'case_study' | 'macro')
- asset_class (nullable)
- title_ru/en, body_ru/en (markdown), excerpt_ru/en
- cover_image_url, author_name, read_time_min
- avg_ticket_thb, typical_roi_pct, risks_summary (для industry_brief)
- is_published, view_count, published_at
```
RLS: public read где published; admin write.

**3. `capital_intro_requests`** — единая воронка заявок (объединяет существующий `intro_requests` + новые типы)
```sql
- id, user_id (nullable for guests), guest_email, guest_phone, guest_name
- request_type: 'intro_to_listing' | 'pitch_submission' | 'capital_advisory' | 'represent_interests' | 'industry_consultation'
- listing_id (FK business_listings, nullable)
- project_id (FK investment_projects, nullable)
- asset_class, capital_range_thb (enum: '<5M', '5-20M', '20-100M', '100M+')
- timeline ('now', '1-3m', '3-6m', '6-12m')
- background, message
- estimated_deal_size_thb (admin-filled, для pipeline value)
- success_probability_pct (admin 0-100)
- crm_contact_id, crm_deal_id (FK after CRM sync)
- status: 'new' | 'qualified' | 'in_intro' | 'closed_won' | 'closed_lost'
- source_route, utm_*
- created_at
```
RLS: insert public (incl. guests), select own + admin.

**Trigger:** on insert → create/update `crm_contacts` + `crm_deals` with:
- pipeline = 'capital_advisory'
- expected_value = estimated_deal_size_thb * 0.05 (5% intro fee assumption)
- probability = success_probability_pct
- source = `capital_intro:${request_type}`

---

### UI/Routes

**New routes:**
- `/invest/business/:slug` — anonymized listing detail (teaser + "Request intro" CTA)
- `/invest/pitch` — "Pitch your project" wizard (devs/owners/founders submit)
- `/invest/thailand` — "Invest in Thailand" landing (macro, industries, why now)
- `/invest/knowledge/:slug` — article reader

**Updated:**
- `InvestmentHubLanding` → добавить:
  - Блок "Invest in Thailand" (3 карточки: macro brief, industries grid, success cases)
  - Блок "Pitch your project" CTA для девелоперов/собственников
  - Cross-link в Property Hub: "Browse new developments" / "Property Investment"
  - Cross-link из Developer Portal в `/invest/pitch?type=developer_raise`
- `InvestmentBusinessZone` → выводить `business_listings` с анонимизированными карточками
- Property `/newbuilds/dashboard` (Developer Portal) → добавить "Raise capital for project" + "Sell remaining inventory" CTA → `/invest/pitch`
- `RaiseFunding` → расширить с 3 типами на 5: `developer_raise`, `business_for_sale`, `startup_pitch`, `operating_partner`, `inventory_sale`

**Components:**
- `AnonymizedListingCard` — показывает asset_class, district, ticket range, teaser, blurred details, "Request intro" button
- `PitchYourProjectWizard` (4 шага: type → financials → use of funds → contact)
- `InvestInThailandHero` + `IndustryBriefGrid`
- `CapitalIntroForm` — единая форма с auto-routing в CRM по `request_type`

---

### CRM Integration

Создать **новый pipeline** `capital_advisory` в CRM:
- stages: `new` → `qualified` → `dd_in_progress` → `intro_made` → `negotiation` → `closed_won` / `closed_lost`
- expected_value = `estimated_deal_size_thb * 0.05`
- probability = `success_probability_pct`
- contact source tagging: `capital_intro:business_for_sale`, `capital_intro:developer_raise`, etc.

**DB trigger** `sync_capital_request_to_crm()`:
- on `capital_intro_requests` insert → upsert `crm_contacts` (by email/phone) → create `crm_deals` linked
- pipeline volume aggregations available via existing CRM dashboard

---

### Phase 2 Deliverables (this PR)

1. ✅ Fix TS build errors (pageRegistry exports)
2. ✅ Migrations: `business_listings`, `investment_articles`, `capital_intro_requests` + RLS + CRM sync trigger
3. ✅ `/invest/pitch` wizard (5 listing types)
4. ✅ `/invest/business/:slug` anonymized detail page
5. ✅ `/invest/thailand` landing
6. ✅ `AnonymizedListingCard` + wire into `InvestmentBusinessZone`
7. ✅ `CapitalIntroForm` → CRM pipeline
8. ✅ Cross-links Property Hub ↔ Investment Hub ↔ Developer Portal
9. ✅ Admin moderation: `business_listings.visibility` + `success_probability` controls в admin
10. ✅ Update `INVESTMENT_CATEGORIES` icons/grouping if needed

**Phasing inside this PR:** start with #1 (TS fix) + #2 (migrations) → then UI screens → then CRM trigger.

**Out of scope for Phase 2** (will go to Phase 3+):
- Knowledge article CMS (только schema + minimal reader)
- Discovery quiz
- Ops Console redesign
- Financial KPI dashboard для admin (deal pipeline value)

---

### Why this addresses prior request
- ✅ Связь Property/Developer/Invest hubs — cross-CTA + same `business_listings` для developer raises
- ✅ Девелоперы привлекают капитал + продают остатки — `developer_raise` + `inventory_sale` types
- ✅ Pitch your project — `/invest/pitch` универсальный wizard
- ✅ Invest in Thailand — `/invest/thailand` + `investment_articles` macro
- ✅ Анонимизация — `is_anonymized` + RLS на full_description, teaser fields публичны
- ✅ Заявки в CRM — `capital_intro_requests` + sync trigger → `crm_deals`
- ✅ Финансовый объём + вероятность — `estimated_deal_size_thb` + `success_probability_pct` поля

